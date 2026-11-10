// Copy your Firebase Web App config from Firebase Console into this file.
// These values identify your Firebase project; never put service-account private keys here.
export const firebaseConfig = {
  apiKey: "PASTE_FIREBASE_WEB_API_KEY",
  authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
  projectId: "PASTE_PROJECT_ID",
  appId: "PASTE_FIREBASE_APP_ID"
};

export const firebaseConfigured =
  firebaseConfig.apiKey !== "PASTE_FIREBASE_WEB_API_KEY" &&
  firebaseConfig.projectId !== "PASTE_PROJECT_ID" &&
  firebaseConfig.appId !== "PASTE_FIREBASE_APP_ID";
