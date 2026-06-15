const admin = require('firebase-admin');
require('dotenv').config();

// To fully securely connect the Admin SDK, you need a Service Account Key
// Download it from Firebase Console -> Project Settings -> Service Accounts
// and save it as 'serviceAccountKey.json' in the server directory, or set env vars.

// Initialize Firebase Admin using Environment Variables
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newline characters so the private key is valid
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    console.log("Firebase Admin initialized via Environment Variables");
  } else {
    console.warn("WARNING: Missing FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY in environment.");
    console.log("Attempting default initialization...");
    admin.initializeApp();
    console.log("Firebase Admin initialized with default credentials");
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error.message);
}

const db = admin.firestore ? admin.firestore() : null;
const auth = admin.auth ? admin.auth() : null;

module.exports = { admin, db, auth };
