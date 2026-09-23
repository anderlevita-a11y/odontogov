import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

/**
 * Configuração do Firebase Web SDK v10+
 * As variáveis podem ser definidas no .env (para deploy na Netlify ou Vercel)
 * ou usar os valores seguros de fallback para desenvolvimento local.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyForPreviewEnvironments12345",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "odontogov-municipal.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "odontogov-municipal",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "odontogov-municipal.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "109876543210",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:109876543210:web:abcdef1234567890",
};

// Inicialização Singleton do Firebase App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Instâncias dos serviços Firebase v10+
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, firebaseConfig };
