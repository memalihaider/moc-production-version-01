import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: App;

if (!getApps().length) {
  // Use GOOGLE_APPLICATION_CREDENTIALS env var or service account JSON env var
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccount) {
    app = initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
  } else {
    // Falls back to Application Default Credentials (works in Firebase/GCP environments)
    app = initializeApp({
      projectId: "manofcave-v1",
    });
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
