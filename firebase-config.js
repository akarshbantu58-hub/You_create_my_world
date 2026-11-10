// Firebase Web App configuration for You Create My World.
// This is client-side configuration. Never add service-account private keys here.
export const firebaseConfig = {
  apiKey: "AIzaSyBQ2CrJnZm0tAj6kfy202HZlOGVqtRU4cE",
  authDomain: "youcreatemyworld-d2a99.firebaseapp.com",
  projectId: "youcreatemyworld-d2a99",
  storageBucket: "youcreatemyworld-d2a99.firebasestorage.app",
  messagingSenderId: "898727282683",
  appId: "1:898727282683:web:ecf2a928864a923eb2ed5e",
  measurementId: "G-FF69X2JNB2"
};

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);
