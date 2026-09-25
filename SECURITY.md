# Security

This project writes to a cloud database, so it is worth being precise about what is protected and what is
not. Everything below is about **your** Firebase project — the repository only describes it.

## 1. This repository contains no keys

The dashboard reads its Firebase configuration from environment variables
(`.env.example` lists them; `.env.local` holds your values locally and is gitignored). Nothing sensitive
is committed, and `firebase-applet-config.json` — the file that used to hold the project's web
configuration — is gone from the code **and from the git history**.

If you fork or clone this project: keep it that way. Anything committed to a public repository stays in the
history forever, even if you delete the file in a later commit, and GitHub's secret scanning will flag it.

## 2. What happened with the old key (and what it proves)

An earlier version of this repository committed the Firebase web configuration, including the API key
`REDACTED_KEYC-…wharE4` (project `arduino-igloo`). GitHub's secret scanning flagged it as a **publicly leaked
Google API key**.

Two separate problems, and it is worth not confusing them:

| | Status |
| --- | --- |
| **A committed key** | Fixed. The file is gone from the code and from history, and the app no longer needs it. |
| **An unrestricted key** | Still yours to fix, in the Google console. See section 3. |

The key was not just readable: on 25 Sep 2026, a plain `curl` from a terminal — no login, no referrer, no
browser — **succeeded in writing** to the database with it:

```bash
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"fields":{"temp":{"doubleValue":99.9},"hum":{"doubleValue":10.0},"timestamp":{"integerValue":"0"}}}' \
  "https://firestore.googleapis.com/v1/projects/arduino-igloo/databases/(default)/documents/telemetry/latest?key=REDACTED_KEY..."
# -> HTTP 200
```

That is the whole risk in one line: anyone who finds the key can publish fake readings to your dashboard and
trigger your alert emails. The original values were restored afterwards.

## 3. Fix the key itself (Google console, five minutes, do it today)

The key is a *web* key: Firebase sends it to the browser by design, so it is not a password. What makes it
dangerous is being **unrestricted**, which allows scripted use from anywhere.

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click the key that starts with `AIza…` (project `arduino-igloo`).

Then pick one of these two paths:

**Path 1 — restrict it (keeps everything working).**

* *Application restrictions* → **Websites** → add your dashboard origin(s), e.g.
  `https://your-project.vercel.app/*` and `http://localhost:3000/*` for development.
* *API restrictions* → **Restrict key** → keep only **Cloud Firestore API**.
* Save.

> A referrer-restricted key is **rejected when there is no referrer**, so your local Node gateway (which is
> not a browser) will stop being able to write. If you use the gateway, create a **second key** in the same
> project for it (*Application restrictions*: none — *API restrictions*: Cloud Firestore API) and use that
> one in `server.js`. One key per component is the normal setup, not a workaround.
>
> Then verify from a terminal that the browser key is really blocked: the `curl` above (no referrer) must
> fail with `403`.

**Path 2 — rotate it (cleanest).**

1. Delete the old key (or "Regenerate" it) in the same screen.
2. Copy the new value into `.env.local` (local development) and into your Vercel project
   (Settings → Environment Variables), then redeploy.
3. Close the GitHub alert as **Revoked** — it is the honest resolution once the old key can no longer be
   used.

Either way, remember to update `.env.local` and Vercel if you change the key: they are the only two places
that hold it now.

## 4. The real protection: the Firestore rules

The key is not what protects your data — the rules are. Read [`firestore.rules`](firestore.rules): both
write paths are open.

| Path | Rule as written | What it means |
| --- | --- | --- |
| `telemetry/latest` | `allow write: if isValidTelemetry(request.resource.data)` | the rule only checks the *shape* of the data (that `temp`, `hum` and `timestamp` exist and are numbers in range). It does **not** ask *who* is writing. Anyone who knows the project id — which is public — can publish readings. |
| `mail/{mailId}` | `allow create: if true` | anyone can create a document in the collection that the *Trigger Email* extension watches. That is an open relay: an anonymous visitor can trigger outgoing email, burning your EmailJS/extension quota and using your project to send mail to addresses you never chose. |

Consequences in practice: the dashboard can be fed false temperature and humidity values, alarms can be
triggered (or silenced) by a stranger, and your email allowance can be spent by someone else. Public **read**
of `telemetry/latest` is intentional — your dashboard is public — so that part stays.

### Closing the rules (needs a small code change)

The gateway must prove it is the gateway. The clean way is Firebase Authentication:

1. In the Firebase console → **Authentication** → *Sign-in method* → enable **Email/Password**.
2. *Users* → **Add user** → create one for the gateway, e.g. `gateway@arduino-igloo.local` with a long random
   password. Copy its **UID**.
3. Give the gateway those credentials through environment variables (never in the repository), and sign in
   before the first write:

   ```js
   // gateway: sign in once, then Firestore writes carry request.auth
   import { initializeApp } from "firebase/app";
   import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);
   await signInWithEmailAndPassword(auth, process.env.GATEWAY_EMAIL, process.env.GATEWAY_PASSWORD);
   ```

   The web SDK on Node keeps that session in memory, and rules can then check `request.auth.uid`.

4. In the Firebase console → **Firestore Database** → **Rules**, paste this (replace `<GATEWAY_UID>` with
   the UID from step 2) and publish:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {

       function isValidTelemetry(data) {
         return data.keys().hasAll(['temp', 'hum', 'timestamp']) &&
                data.temp is number && data.hum is number && data.timestamp is number &&
                data.temp > -100 && data.temp < 250 &&
                data.hum >= 0 && data.hum <= 100;
       }

       match /telemetry/latest {
         allow read: if true;                              // the public dashboard
         allow write: if request.auth != null
                      && request.auth.uid == '<GATEWAY_UID>'
                      && isValidTelemetry(request.resource.data);
       }

       match /mail/{mailId} {
         allow create: if request.auth != null;            // signed-in callers only
         allow read, update, delete: if false;
       }
     }
   }
   ```

   This keeps every feature working (the dashboard reads, the gateway writes, alerts still send) while
   removing both anonymous paths. **Apply the rules and the gateway sign-in in the same session** — rules
   first, then the code — or the gateway will be refused until it signs in.

5. Verify: with the new rules live, repeat the `curl` write from section 2 without signing in. It must fail
   with `403 PERMISSION_DENIED`. That is the confirmation that the hole is closed.

## 5. Checklist

- [ ] Key restricted to your dashboard domains **or** rotated (section 3).
- [ ] `.env.local` and Vercel updated if the key changed.
- [ ] Firestore rules closed and gateway signing in (section 4).
- [ ] GitHub secret scanning alert closed with the resolution that matches what you did.
- [ ] Push protection enabled on the repository, so a future mistake is blocked before it is pushed.

## Reporting

Found something else? Open an issue — this file is the place for it.
