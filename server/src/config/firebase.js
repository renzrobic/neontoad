const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
require('dotenv').config();

let db = null;
let auth = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    const app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newline characters so the private key is valid
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase Admin initialized via Environment Variables");
  } else {
    console.warn("WARNING: Missing FIREBASE_PROJECT_ID or FIREBASE_PRIVATE_KEY in environment.");
    console.log("Attempting default initialization...");
    const app = initializeApp();
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("Firebase Admin initialized with default credentials");
  }
} catch (error) {
  console.error("Firebase Admin initialization failed:", error.message);
}

// We export FieldValue here so other routes can use it directly
module.exports = { db, auth, FieldValue };
