import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { auth, db } from "./firebase-init.js";
import { el } from "./dom.js";

// Auto-cadastro (migração de login único — o projeto Firebase agora é compartilhado com
// ServiceOrder e Updates, então usa a mesma regra de domínio e o mesmo formato de doc).
export const DOMINIOS_PERMITIDOS = ["orflie.com", "orflie.com.br"];

function dominioPermitido(email) {
  const lower = email.toLowerCase();
  return DOMINIOS_PERMITIDOS.some((d) => lower.endsWith(`@${d}`));
}

export function login(email, senha) {
  return signInWithEmailAndPassword(auth, email, senha);
}

export function logout() {
  return signOut(auth);
}

// Mesmo formato de documento que o auto-cadastro do ServiceOrder grava (mesma coleção
// "usuarios", compartilhada) — inclui departamentosPrestador:[] mesmo sem uso aqui no
// Central, só pra não deixar o campo ausente nesse doc.
export async function signup(nome, email, senha) {
  if (!dominioPermitido(email)) {
    throw new Error(`Use um email @${DOMINIOS_PERMITIDOS.join(" ou @")}.`);
  }
  const cred = await createUserWithEmailAndPassword(auth, email, senha);
  await setDoc(doc(db, "usuarios", cred.user.uid), {
    nome,
    email,
    isAdmin: false,
    departamentosPrestador: [],
    ativo: true,
    criadoEm: serverTimestamp(),
  });
  return cred.user;
}

// Troca a própria senha do usuário logado. Exige a senha atual porque o Firebase
// só permite updatePassword logo após uma autenticação "recente" — reautentica
// primeiro pra funcionar mesmo com a sessão aberta há horas.
export async function trocarSenha(senhaAtual, novaSenha) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, senhaAtual);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, novaSenha);
}

// Chama callback(user, perfil) quando autenticado; redireciona pra index.html se não estiver.
// Contas só são criadas por um admin (sem auto-cadastro) — ver admin.html.
export function requireAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists() || snap.data().ativo === false) {
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }
    callback(user, snap.data());
  });
}

// Redireciona pra central.html se já estiver logado (usado em index.html).
export function redirectIfLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (snap.exists() && snap.data().ativo !== false) {
      window.location.href = "central.html";
    }
  });
}

export function renderTopbar(activePage, perfil) {
  const links = [{ href: "central.html", label: "Central" }];
  if (perfil.isAdmin) links.push({ href: "admin.html", label: "Administração" });
  links.push({ href: "conta.html", label: "Minha Conta" });

  const nav = el(
    "nav",
    {},
    links.map((l) =>
      el("a", { href: l.href, class: l.href === activePage ? "active" : "" }, l.label)
    )
  );
  nav.appendChild(el("span", { id: "usuario-nome" }, perfil.nome || ""));
  nav.appendChild(
    el("button", { class: "link-btn", type: "button", onclick: () => logout().then(() => (window.location.href = "index.html")) }, "Sair")
  );

  const brand = el("a", { href: "central.html", class: "brand" }, [
    el("img", { src: "assets/orflie-logo.png", alt: "Orflie" }),
    el("span", {}, "Central Orflie"),
  ]);

  const header = el("header", { class: "topbar" }, [brand, nav]);
  document.body.insertBefore(header, document.body.firstChild);
}
