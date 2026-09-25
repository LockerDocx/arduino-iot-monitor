import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

/**
 * Firebase web configuration, read from environment variables.
 *
 * Nothing is hard-coded here on purpose: this repository is public, and anything
 * committed to it stays in the git history forever, even if the file is deleted
 * later. Keeping the configuration in environment variables means the code can be
 * shared safely and every deployment uses its own Firebase project.
 *
 * - Local development: copy `.env.example` to `.env.local` and fill it in.
 * - Deployed dashboard: set the same variables in your hosting provider
 *   (Vercel -> Project -> Settings -> Environment Variables).
 *
 * Next.js inlines `NEXT_PUBLIC_*` variables at build time, which is what a
 * browser-side dashboard needs. The values are not secrets: what protects the data
 * are the Firestore security rules (see SECURITY.md).
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

const missingVariables = Object.entries(firebaseConfig)
  .filter(([, value]) => value === '')
  .map(([name]) => name);

/** True when every required environment variable is present. */
export const hasFirebaseConfig = missingVariables.length === 0;

// Warn once in the browser (never during the build) instead of failing silently
// with an empty dashboard.
if (typeof window !== 'undefined' && !hasFirebaseConfig) {
  console.error(
    `[firebase] Missing configuration: ${missingVariables.join(', ')}. ` +
      'Copy .env.example to .env.local and fill in the values from your Firebase project ' +
      '(Project settings -> Your apps), or set them in your hosting provider.'
  );
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
