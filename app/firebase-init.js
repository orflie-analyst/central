import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDeuY3MbTX-kPfjWjTmvTmq8rg2cOPgDic",
  authDomain: "orflie-central.firebaseapp.com",
  projectId: "orflie-central",
  storageBucket: "orflie-central.firebasestorage.app",
  messagingSenderId: "214580495425",
  appId: "1:214580495425:web:ee96b7bc8eb4adca9db2c0",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Instância nomeada separada, usada só por admin.html para criar novos usuários
// (createUserWithEmailAndPassword) sem substituir a sessão do admin logado.
export function getAdminCreationApp() {
  const existing = getApps().find((a) => a.name === "admin-creation");
  if (existing) return existing;
  return initializeApp(firebaseConfig, "admin-creation");
}
