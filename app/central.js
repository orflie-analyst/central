import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-init.js";
import { requireAuth, renderTopbar } from "./auth.js";
import { clear, el, formatDate } from "./dom.js";

// Sistemas internos da Orflie — adicionar um item aqui sempre que um novo sistema
// for publicado, pra ele aparecer como card na Central.
const SISTEMAS = [
  {
    nome: "Sistema de Ordem de Serviço",
    desc: "Abra e acompanhe chamados internos (TI, Comercial).",
    url: "https://orflie-analyst.github.io/serviceorder/",
    cor: "#f5821f",
  },
  {
    nome: "Fluxograma Organizacional",
    desc: "Quadro de atribuição de operadores às contas de clientes.",
    url: "https://orflie-analyst.github.io/fluxograma-organizacional/",
    cor: "#3b82f6",
  },
  {
    nome: "Updates",
    desc: "Registre a cópia do update enviado ao cliente no final do dia.",
    url: "https://orflie-analyst.github.io/updates/",
    cor: "#2f8f5b",
  },
];

requireAuth((user, perfil) => {
  renderTopbar("central.html", perfil);
  renderSistemas();
  carregarAvisos(user, perfil);
});

function renderSistemas() {
  const grid = document.getElementById("sistemas-grid");
  clear(grid);
  for (const s of SISTEMAS) {
    grid.appendChild(
      el("a", { class: "sistema-card", href: s.url, style: `--sistema-cor: ${s.cor};` }, [
        el("div", { class: "nome" }, s.nome),
        el("div", { class: "desc" }, s.desc),
      ])
    );
  }
}

function carregarAvisos(user, perfil) {
  const lista = document.getElementById("lista-avisos");
  const q = query(collection(db, "avisos"), orderBy("criadoEm", "desc"));

  onSnapshot(q, (snap) => {
    clear(lista);
    if (snap.empty) {
      lista.appendChild(el("li", { class: "aviso-vazio" }, "Nenhum aviso no momento."));
      return;
    }
    snap.forEach((docSnap) => {
      const a = docSnap.data();
      const item = el("li", { class: "aviso-item" }, [
        el("div", { class: "titulo" }, a.titulo),
        el("div", { class: "texto" }, a.texto),
        el("div", { class: "meta" }, `${a.autorNome} · ${formatDate(a.criadoEm)}`),
      ]);
      if (perfil.isAdmin) {
        item.appendChild(
          el(
            "button",
            { class: "btn-remover-aviso", type: "button", title: "Excluir aviso", onclick: () => excluirAviso(docSnap.id) },
            "×"
          )
        );
      }
      lista.appendChild(item);
    });
  });

  if (!perfil.isAdmin) return;

  const cardNovo = document.getElementById("card-novo-aviso");
  cardNovo.classList.remove("hidden");

  const form = document.getElementById("form-aviso");
  const erro = document.getElementById("erro-aviso");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.classList.add("hidden");
    const titulo = document.getElementById("aviso-titulo").value.trim();
    const texto = document.getElementById("aviso-texto").value.trim();
    if (!titulo || !texto) return;
    try {
      await addDoc(collection(db, "avisos"), {
        titulo,
        texto,
        autorId: user.uid,
        autorNome: perfil.nome || user.email,
        criadoEm: serverTimestamp(),
      });
      form.reset();
    } catch (err) {
      erro.textContent = "Não foi possível publicar o aviso.";
      erro.classList.remove("hidden");
    }
  });
}

async function excluirAviso(id) {
  if (!window.confirm("Excluir este aviso?")) return;
  await deleteDoc(doc(db, "avisos", id));
}
