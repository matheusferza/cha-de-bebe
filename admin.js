import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { auth, db } from './firebase.js';
import { mostrarToast, abrirConfirmacao, urlHttpsSegura, nomeDaLoja, linkDeBuscador, prepararImagem } from './ui.js';

// ─── Referências do DOM ───────────────────────────────────────────────────────
const loginSecao  = document.getElementById('login');
const painelSecao = document.getElementById('painel');
const formLogin   = document.getElementById('form-login');
const erroLogin   = document.getElementById('erro-login');
const btnSair     = document.getElementById('btn-sair');
const formPresente = document.getElementById('form-presente');
const listaAdmin  = document.getElementById('lista-admin');
const erroForm    = document.getElementById('erro-form');
const btnAdicionar = document.getElementById('btn-adicionar');
// Novos elementos (Melhoria 1 e 2)
const tituloFormPresente  = document.getElementById('titulo-form-presente');
const btnCancelarEdicao   = document.getElementById('btn-cancelar-edicao');
const avisoReserva        = document.getElementById('aviso-reserva');
const imagemArquivo       = document.getElementById('imagemArquivo');
const fotoPreviewArea     = document.getElementById('foto-preview-area');
const fotoPreviewImg      = document.getElementById('foto-preview-img');
const fotoPreviewTamanho  = document.getElementById('foto-preview-tamanho');
const btnRemoverFoto      = document.getElementById('btn-remover-foto');
const erroFoto            = document.getElementById('erro-foto');

// ─── Estado de edição e foto ──────────────────────────────────────────────────
let editandoId = null;            // id do documento em edição (null = modo adicionar)
let cardEditando = null;          // referência ao card-admin destacado
let estadoFoto = 'removida';      // 'mantida' | 'nova' | 'removida'
let fotoAtualDataUrl = null;      // string data URL da foto atual

const MENSAGENS_ERRO_FOTO = {
  tipo: 'Escolha um arquivo de imagem (JPG, PNG ou WebP).',
  'arquivo-grande': 'Esta imagem é grande demais (máximo 15 MB).',
  decodificar: 'Não foi possível abrir esta imagem. Tente outro arquivo (JPG, PNG ou WebP).',
  'imagem-grande': 'Não foi possível reduzir esta imagem o suficiente. Tente outra foto.',
};

function formatarTamanhoDataUrl(dataUrl) {
  if (!dataUrl) return '';
  const idx = dataUrl.indexOf(',');
  const b64Len = idx >= 0 ? dataUrl.length - idx - 1 : dataUrl.length;
  const bytes = (b64Len * 3) / 4;
  const kb = Math.round(bytes / 1024);
  return '≈ ' + kb + ' KB';
}

function exibirPreviewFoto(dataUrl) {
  if (!dataUrl) {
    fotoPreviewArea.hidden = true;
    fotoPreviewImg.removeAttribute('src');
    fotoPreviewTamanho.textContent = '';
    btnRemoverFoto.hidden = true;
    return;
  }
  fotoPreviewImg.src = dataUrl;
  fotoPreviewTamanho.textContent = formatarTamanhoDataUrl(dataUrl);
  fotoPreviewArea.hidden = false;
  btnRemoverFoto.hidden = false;
}

imagemArquivo.addEventListener('change', async (e) => {
  const arquivo = e.target.files && e.target.files[0];
  if (!arquivo) return; // cancelou janela de seleção, não mostra erro

  erroFoto.textContent = '';
  btnAdicionar.disabled = true;
  btnAdicionar.textContent = 'Processando foto...';

  try {
    const dataUrl = await prepararImagem(arquivo);
    fotoAtualDataUrl = dataUrl;
    estadoFoto = 'nova';
    exibirPreviewFoto(dataUrl);
  } catch (erro) {
    const chave = erro && erro.message;
    erroFoto.textContent = MENSAGENS_ERRO_FOTO[chave] || 'Não foi possível processar esta imagem.';
    imagemArquivo.value = '';
    if (estadoFoto !== 'mantida') {
      exibirPreviewFoto(null);
    }
  } finally {
    btnAdicionar.disabled = false;
    btnAdicionar.textContent = editandoId ? 'Salvar alterações' : 'Adicionar presente';
  }
});

btnRemoverFoto.addEventListener('click', () => {
  estadoFoto = 'removida';
  fotoAtualDataUrl = null;
  imagemArquivo.value = '';
  erroFoto.textContent = '';
  exibirPreviewFoto(null);
});

// ─── Helpers de modo de edição ────────────────────────────────────────────────
function entrarModoEdicao(id, dados) {
  editandoId = id;
  tituloFormPresente.textContent = 'Editar presente';
  btnAdicionar.textContent = 'Salvar alterações';
  btnCancelarEdicao.hidden = false;

  // Preenche os campos
  document.getElementById('nome').value      = dados.nome || '';
  document.getElementById('descricao').value = dados.descricao || '';
  document.getElementById('linkLoja').value  = dados.linkLoja || '';

  // Aviso se reservado
  if (dados.reservadoPor) {
    avisoReserva.textContent = 'Este presente está reservado por ' + dados.reservadoPor + '. Editar não remove a reserva.';
    avisoReserva.hidden = false;
  } else {
    avisoReserva.hidden = true;
    avisoReserva.textContent = '';
  }

  // Foto atual
  imagemArquivo.value = '';
  erroFoto.textContent = '';
  if (dados.imagemData) {
    fotoAtualDataUrl = dados.imagemData;
    estadoFoto = 'mantida';
    exibirPreviewFoto(dados.imagemData);
  } else {
    fotoAtualDataUrl = null;
    estadoFoto = 'removida';
    exibirPreviewFoto(null);
  }

  erroForm.textContent = '';

  // Destaca card na lista
  if (cardEditando) cardEditando.classList.remove('card-admin--editando');
  cardEditando = document.querySelector(`.card-admin[data-id="${id}"]`);
  if (cardEditando) cardEditando.classList.add('card-admin--editando');

  // Scroll suave até o formulário, respeitando prefers-reduced-motion
  const prefReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  formPresente.scrollIntoView({ behavior: prefReducido ? 'auto' : 'smooth', block: 'start' });
  document.getElementById('nome').focus();
}

function sairModoEdicao() {
  editandoId = null;
  tituloFormPresente.textContent = 'Adicionar presente';
  btnAdicionar.textContent = 'Adicionar presente';
  btnCancelarEdicao.hidden = true;
  avisoReserva.hidden = true;
  avisoReserva.textContent = '';
  erroForm.textContent = '';
  formPresente.reset();
  imagemArquivo.value = '';
  erroFoto.textContent = '';
  fotoAtualDataUrl = null;
  estadoFoto = 'removida';
  exibirPreviewFoto(null);

  if (cardEditando) {
    cardEditando.classList.remove('card-admin--editando');
    cardEditando = null;
  }
}

btnCancelarEdicao.addEventListener('click', () => sairModoEdicao());

// ─── Login ────────────────────────────────────────────────────────────────────
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroLogin.textContent = '';

  const email = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const btnEntrar = document.getElementById('btn-entrar');

  btnEntrar.disabled = true;
  btnEntrar.textContent = 'Entrando...';

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (_erro) {
    erroLogin.textContent = 'E-mail ou senha incorretos.';
    btnEntrar.disabled = false;
    btnEntrar.textContent = 'Entrar';
  }
});

// ─── Sair ─────────────────────────────────────────────────────────────────────
btnSair.addEventListener('click', async () => {
  sairModoEdicao();
  btnSair.disabled = true;
  try {
    await signOut(auth);
  } catch (_erro) {
    mostrarToast('Não foi possível sair. Tente novamente.', 'erro');
    btnSair.disabled = false;
  }
});

// ─── Autenticação: alterna login/painel ──────────────────────────────────────
const ADMIN_UID = 'Nt3YWImMicTFRk7VEkT44vPqw3H2';
let pararEscuta = null;

onAuthStateChanged(auth, (user) => {
  if (pararEscuta) {
    pararEscuta();
    pararEscuta = null;
  }

  if (user && user.uid === ADMIN_UID) {
    loginSecao.hidden = true;
    painelSecao.hidden = false;
    pararEscuta = escutarLista();
  } else {
    sairModoEdicao();
    loginSecao.hidden = false;
    painelSecao.hidden = true;
    listaAdmin.innerHTML = '';

    // Reabilita botão de login caso tenha voltado ao login
    const btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
      btnEntrar.disabled = false;
      btnEntrar.textContent = 'Entrar';
    }
    btnSair.disabled = false;

    if (user) {
      erroLogin.textContent = 'Esta conta não tem acesso ao painel.';
      signOut(auth);
    }
  }
});

// ─── Adicionar / Editar presente ─────────────────────────────────────────────
formPresente.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroForm.textContent = '';

  const nome         = document.getElementById('nome').value.trim();
  const descricao    = document.getElementById('descricao').value.trim();
  const linkLojaRaw  = document.getElementById('linkLoja').value.trim();

  // Validações comuns
  if (nome.length < 2 || nome.length > 80) {
    erroForm.textContent = 'O nome deve ter entre 2 e 80 caracteres.';
    document.getElementById('nome').focus();
    return;
  }
  let urlLoja = null;
  if (linkLojaRaw) {
    urlLoja = urlHttpsSegura(linkLojaRaw);
    if (!urlLoja) {
      erroForm.textContent = 'O link de sugestão deve ser um endereço https:// válido.';
      document.getElementById('linkLoja').focus();
      return;
    }
    if (linkDeBuscador(urlLoja)) {
      erroForm.textContent = 'Este parece ser um link de busca (Google, Yahoo, Bing...). Abra a página do produto na loja e copie o endereço da barra do navegador.';
      document.getElementById('linkLoja').focus();
      return;
    }
  }

  // ── MODO EDIÇÃO ──
  if (editandoId) {
    btnAdicionar.disabled = true;
    btnAdicionar.textContent = 'Salvando...';
    btnCancelarEdicao.disabled = true;

    // Monta payload — NUNCA inclui reservadoPor nem reservadoEm; preserva campos legados intactos
    const payload = { nome, descricao };
    payload.linkLoja = urlLoja ? urlLoja.href : deleteField();

    if (estadoFoto === 'nova') {
      payload.imagemData = fotoAtualDataUrl;
      payload.imagemUrl = deleteField();
    } else if (estadoFoto === 'removida') {
      payload.imagemData = deleteField();
      payload.imagemUrl = deleteField();
    }
    // 'mantida': NÃO toca em imagemData nem em imagemUrl

    try {
      await updateDoc(doc(db, 'presentes', editandoId), payload);
      mostrarToast('Presente atualizado!', 'sucesso');
      sairModoEdicao();
    } catch (_erro) {
      mostrarToast('Não foi possível salvar. Tente novamente.', 'erro');
    } finally {
      btnAdicionar.disabled = false;
      btnAdicionar.textContent = 'Salvar alterações';
      btnCancelarEdicao.disabled = false;
    }
    return;
  }

  // ── MODO ADICIONAR ──
  btnAdicionar.disabled = true;
  btnAdicionar.textContent = 'Adicionando...';

  const dados = {
    nome,
    descricao,
    reservadoPor: null,
    reservadoEm: null,
  };
  if (urlLoja) dados.linkLoja = urlLoja.href;
  if (estadoFoto === 'nova' && fotoAtualDataUrl) {
    dados.imagemData = fotoAtualDataUrl;
  }

  try {
    await addDoc(collection(db, 'presentes'), dados);
    formPresente.reset();
    sairModoEdicao();
    mostrarToast('Presente "' + nome + '" adicionado com sucesso!', 'sucesso');
  } catch (_erro) {
    mostrarToast('Não foi possível adicionar. Verifique se você está logado.', 'erro');
  } finally {
    btnAdicionar.disabled = false;
    btnAdicionar.textContent = 'Adicionar presente';
  }
});

// ─── Escuta da lista em tempo real ───────────────────────────────────────────
function escutarLista() {
  const q = query(collection(db, 'presentes'), orderBy('nome'));

  listaAdmin.innerHTML = '';
  const carregando = document.createElement('p');
  carregando.style.color = 'var(--c-texto-sec)';
  carregando.textContent = 'Carregando...';
  listaAdmin.appendChild(carregando);

  return onSnapshot(
    q,
    (snapshot) => {
      // Se o documento em edição sumiu (excluído em outra aba), sair do modo
      if (editandoId) {
        const ainda = snapshot.docs.find((d) => d.id === editandoId);
        if (!ainda) {
          sairModoEdicao();
          mostrarToast('O presente que estava sendo editado foi excluído.', 'info');
        }
      }

      listaAdmin.innerHTML = '';

      if (snapshot.empty) {
        const vazio = document.createElement('p');
        vazio.style.color = 'var(--c-texto-sec)';
        vazio.textContent = 'Nenhum presente cadastrado ainda.';
        listaAdmin.appendChild(vazio);
        return;
      }

      // Reconecta referência ao card em edição após re-render
      cardEditando = null;

      snapshot.docs.forEach((d) => {
        const p = d.data();

        const card = document.createElement('div');
        card.className = 'card-admin';
        card.dataset.id = d.id;
        if (d.id === editandoId) {
          card.classList.add('card-admin--editando');
          cardEditando = card;
        }

        // ── Informações ──
        const info = document.createElement('div');
        info.className = 'card-admin__info';

        const nome = document.createElement('p');
        nome.className = 'card-admin__nome';
        nome.textContent = p.nome;

        // Indicador textual de edição
        if (d.id === editandoId) {
          const tag = document.createElement('span');
          tag.className = 'card-admin__editando-tag';
          tag.textContent = ' — Editando';
          nome.appendChild(tag);
        }

        // Selo de situação
        const selo = document.createElement('span');
        if (p.reservadoPor) {
          selo.className = 'selo selo--reservado';
          const icone = document.createElement('span');
          icone.setAttribute('aria-hidden', 'true');
          icone.textContent = '●';
          const texto = document.createElement('span');
          texto.textContent = 'Reservado por ' + p.reservadoPor;
          selo.append(icone, texto);
        } else {
          selo.className = 'selo selo--disponivel';
          const icone = document.createElement('span');
          icone.setAttribute('aria-hidden', 'true');
          icone.textContent = '✓';
          const texto = document.createElement('span');
          texto.textContent = 'Disponível';
          selo.append(icone, texto);
        }

        // Link da loja ou selo de aviso se for link de busca
        const urlLojaObj = p.linkLoja ? urlHttpsSegura(p.linkLoja) : null;
        if (urlLojaObj) {
          if (linkDeBuscador(urlLojaObj)) {
            const avisoBusca = document.createElement('span');
            avisoBusca.className = 'selo selo--aviso-busca';
            avisoBusca.textContent = '⚠️ Link de busca: corrigir';
            info.append(nome, selo, avisoBusca);
          } else {
            const linkLoja = document.createElement('a');
            linkLoja.href = urlLojaObj.href;
            linkLoja.target = '_blank';
            linkLoja.rel = 'noopener noreferrer nofollow';
            linkLoja.className = 'card-admin__link-loja';
            const textoLink = document.createElement('span');
            textoLink.textContent = 'Abrir link ↗';
            const srOnly = document.createElement('span');
            srOnly.className = 'sr-only';
            srOnly.textContent = ' (abre em nova aba)';
            linkLoja.append(textoLink, srOnly);
            info.append(nome, selo, linkLoja);
          }
        } else {
          info.append(nome, selo);
        }

        // ── Ações ──
        const acoes = document.createElement('div');
        acoes.className = 'card-admin__acoes';

        // Botão Editar
        const btnEditar = document.createElement('button');
        btnEditar.className = 'secundario';
        btnEditar.textContent = 'Editar';
        btnEditar.setAttribute('aria-label', 'Editar ' + p.nome);
        btnEditar.addEventListener('click', () => entrarModoEdicao(d.id, p));
        acoes.appendChild(btnEditar);

        if (p.reservadoPor) {
          const btnLiberar = document.createElement('button');
          btnLiberar.className = 'secundario';
          btnLiberar.textContent = 'Liberar';
          btnLiberar.setAttribute('aria-label', 'Liberar reserva de ' + p.nome);
          btnLiberar.addEventListener('click', () => liberarReserva(d.id, p.nome, btnLiberar));
          acoes.appendChild(btnLiberar);
        }

        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'perigo';
        btnExcluir.textContent = 'Excluir';
        btnExcluir.setAttribute('aria-label', 'Excluir ' + p.nome);
        btnExcluir.addEventListener('click', () => excluirPresente(d.id, p.nome, btnExcluir));
        acoes.appendChild(btnExcluir);

        // Miniatura se tiver imagemData válida
        if (typeof p.imagemData === 'string' && p.imagemData.startsWith('data:image/jpeg;base64,')) {
          const mini = document.createElement('img');
          mini.src = p.imagemData;
          mini.alt = '';
          mini.className = 'card-admin__miniatura';
          card.append(mini, info, acoes);
        } else {
          card.append(info, acoes);
        }
        listaAdmin.appendChild(card);
      });
    },
    () => {
      listaAdmin.innerHTML = '';
      const erro = document.createElement('p');
      erro.style.color = 'var(--c-erro)';
      erro.textContent = 'Não foi possível carregar a lista.';
      listaAdmin.appendChild(erro);
    },
  );
}

// ─── Liberar reserva ──────────────────────────────────────────────────────────
async function liberarReserva(id, nome, btnOrigem) {
  btnOrigem.disabled = true;
  btnOrigem.textContent = 'Liberando...';

  try {
    await updateDoc(doc(db, 'presentes', id), {
      reservadoPor: null,
      reservadoEm: null,
    });
    mostrarToast('Reserva de "' + nome + '" liberada.', 'sucesso');
  } catch (_erro) {
    mostrarToast('Não foi possível liberar a reserva.', 'erro');
    btnOrigem.disabled = false;
    btnOrigem.textContent = 'Liberar';
  }
}

// ─── Excluir presente ─────────────────────────────────────────────────────────
async function excluirPresente(id, nome, btnOrigem) {
  const confirmado = await abrirConfirmacao({
    titulo: 'Excluir presente',
    corpo: 'Excluir "' + nome + '"? Esta ação não pode ser desfeita.',
    labelConfirmar: 'Excluir',
    classeBotao: 'btn--perigo',
  });

  if (!confirmado) return;

  btnOrigem.disabled = true;
  btnOrigem.textContent = 'Excluindo...';

  try {
    await deleteDoc(doc(db, 'presentes', id));
    mostrarToast('"' + nome + '" excluído com sucesso.', 'sucesso');
  } catch (_erro) {
    mostrarToast('Não foi possível excluir.', 'erro');
    btnOrigem.disabled = false;
    btnOrigem.textContent = 'Excluir';
  }
}
