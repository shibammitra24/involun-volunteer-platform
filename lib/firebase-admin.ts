import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });


const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) 
    : null;

if (!admin.apps.length) {
    try {
        if (serviceAccount) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                projectId: serviceAccount.project_id || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        } else {
            admin.initializeApp({
                projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            });
        }
        console.log("Firebase Admin initialized successfully for project:", 
            admin.app().options.projectId);
    } catch (error) {
        console.error("Firebase Admin initialization error", error);
    }
}

export const db = admin.firestore();
export { admin };
