# Security

This project writes to a cloud database, so it is worth being precise about what is protected and what is
not. Everything below is about **your** Firebase project — the repository only describes it.

## What is fine, and needs no action

`firebase-applet-config.json` contains your Firebase **web** configuration, including the `apiKey`. That key
is **not a secret**: every Firebase web app ships it inside its JavaScript bundle, and Google documents it as
an identifier rather than a credential. Nothing has to be rotated. What protects your data is (a) the
security rules and (b) the restrictions on that key — both below.

## What is not fine

Read [`firestore.rules`](firestore.rules): both write paths are open.

| Path | Rule as written | What it means |
| --- | --- | --- |
| `telemetry/latest` | `allow write: if isValidTelemetry(request.resource.data)` | the rule only checks the *shape* of the data (that `temp`, `hum` and `timestamp` exist and are numbers in range). It does **not** ask *who* is writing. Anyone who knows the project id — which is public — can publish readings. |
| `mail/{mailId}` | `allow create: if true` | anyone can create a document in the collection that the *Trigger Email* extension watches. That is an open relay: an anonymous visitor can trigger outgoing email, burning your EmailJS/extension quota and using your project to send mail to addresses you never chose. |

Consequences in practice: the dashboard can be fed false temperature and humidity values, alarms can be
triggered (or silenced) by a stranger, and your email allowance can be spent by someone else. Public read of
`telemetry/latest` is intentional — your dashboard is public — so that part stays.

## Fix A — restrict the key (console only, no code changes, do this today)

This blocks scripted abuse immediately, because a client with no `Referer` header is rejected.

1. Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).
2. Click the browser key that starts with `AIza…` (the one in `firebase-applet-config.json`).
3. **Application restrictions** → *Websites* → add your deployed origin, e.g.
   `https://your-project.vercel.app/*` (and `http://localhost:3000/*` while you develop).
4. **API restrictions** → *Restrict key* → keep only **Cloud Firestore API**.
5. Save. Then verify from a terminal that it is really blocked:

   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" \
     "https://firestore.googleapis.com/v1/projects/arduino-igloo/databases/(default)/documents/telemetry/latest"
   ```

   Before the change this returns `200`; afterwards it should return `403`. (Reading from a browser on your
   own domain keeps working — that request carries the referrer.)

## Fix B — close the rules (the real fix, needs a small code change)

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
   await signInWithEmailAndPassword(app.auth ?? getAuth(app), process.env.GATEWAY_EMAIL, process.env.GATEWAY_PASSWORD);
   ```

   The web SDK on Node keeps that session in memory, and rules can then check `request.auth.uid`.

4. In the Firebase console → **Firestore Database** → **Rules**, paste this (replace `<UID_DEL_GATEWAY>` with
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
                      && request.auth.uid == '<UID_DEL_GATEWAY>'
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

5. Verify: with the new rules live, run the same `curl` write from a terminal without signing in. It must
   fail with `403 PERMISSION_DENIED`.

## Reporting

Found something else? Open an issue — this file is the place for it.
