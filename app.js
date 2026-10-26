import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { db } from './firebase.js';
import { mostrarToast, urlHttpsSegura, nomeDaLoja, linkDeBuscador, obterInfoDoacoes } from './ui.js';

// ─── Configuração do evento ────────────────────────────────────────────────────
// Edite aqui para personalizar o evento. Campos vazios não aparecem.
const EVENTO = {
  titulo: 'Chá de Bebê da Ayla',
  subtitulo: 'Escolha um presente e reserve com seu nome.',
  data: '',    // ex: '15 de março de 2025'
  local: '',   // ex: 'Salão de Festas do Condomínio'
  mensagem: '', // ex: 'Sua presença é o nosso maior presente!'
};

// ─── Atualiza title da página ─────────────────────────────────────────────────
document.title = EVENTO.titulo + ' — Lista de Presentes';

// ─── Referências do DOM ───────────────────────────────────────────────────────
const headerEl          = document.getElementById('site-header');
const listaEl           = document.getElementById('lista');
const progressoWrapper  = document.getElementById('progresso-wrapper');
const progressoLabel    = document.getElementById('progresso-label');
const progressoPct      = document.getElementById('progresso-pct');
const progressoBarra    = document.getElementById('progresso-barra');
const controlesEl       = document.getElementById('controles');
const toggleDisponiveis = document.getElementById('toggle-disponiveis');

const dialogReserva     = document.getElementById('dialog-reserva');
const dialogTitulo      = document.getElementById('dialog-reserva-titulo');
const dialogReservaInfo = document.getElementById('reserva-info');
const reservaCampoQtd   = document.getElementById('reserva-campo-qtd');
const inputReservaQtd   = document.getElementById('reserva-quantidade');
const reservaQtdAjuda   = document.getElementById('reserva-qtd-ajuda');
const inputReservaNome  = document.getElementById('reserva-nome');
const erroReserva       = document.getElementById('reserva-erro');
const btnReservaCancelar  = document.getElementById('reserva-cancelar');
const btnReservaConfirmar = document.getElementById('reserva-confirmar');

// ─── Renderiza o hero ─────────────────────────────────────────────────────────
function renderizarHero() {
  // SVG decorativo (nuvens + estrelas + lua com a nova paleta)
  const svgDeco = `
    <svg aria-hidden="true" viewBox="0 0 800 180" xmlns="http://www.w3.org/2000/svg" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0.35">
      <!-- Nuvem 1 (rosa suave) -->
      <ellipse cx="80" cy="60" rx="55" ry="28" fill="#F5D2C7"/>
      <ellipse cx="115" cy="45" rx="38" ry="22" fill="#F5D2C7"/>
      <ellipse cx="45" cy="55" rx="30" ry="18" fill="#F5D2C7"/>
      <!-- Nuvem 2 (rosa laço) -->
      <ellipse cx="680" cy="80" rx="60" ry="30" fill="#ED7D7D"/>
      <ellipse cx="720" cy="62" rx="40" ry="22" fill="#ED7D7D"/>
      <ellipse cx="645" cy="75" rx="32" ry="20" fill="#ED7D7D"/>
      <!-- Lua (rosa laço) -->
      <path d="M740 20 A22 22 0 1 1 740 64 A14 14 0 1 0 740 20Z" fill="#ED7D7D"/>
      <!-- Estrelas (rosa coral e suave) -->
      <circle cx="200" cy="30" r="3" fill="#CB5054"/>
      <circle cx="350" cy="15" r="2" fill="#F5D2C7"/>
      <circle cx="500" cy="28" r="2.5" fill="#CB5054"/>
      <circle cx="160" cy="80" r="2" fill="#F5D2C7"/>
      <circle cx="590" cy="50" r="2" fill="#CB5054"/>
      <circle cx="420" cy="60" r="1.5" fill="#F5D2C7"/>
      <!-- Estrelas pequenas (sparks) -->
      <text x="285" y="45" font-size="16" fill="#ED7D7D" opacity="0.6">✦</text>
      <text x="460" y="22" font-size="12" fill="#F5D2C7" opacity="0.6">✦</text>
      <text x="630" y="35" font-size="10" fill="#CB5054" opacity="0.5">✦</text>
    </svg>`;

  // Onda divisora (termina na cor do fundo #FBE7DC)
  const svgOnda = `
    <svg viewBox="0 0 1440 54" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,32 C240,56 480,8 720,32 C960,56 1200,8 1440,32 L1440,54 L0,54Z" fill="#FBE7DC"/>
    </svg>`;

  const hero = document.createElement('div');
  hero.className = 'hero';

  const deco = document.createElement('div');
  deco.className = 'hero__deco';
  deco.innerHTML = svgDeco;  // SVG decorativo, sem dados do usuário

  const h1 = document.createElement('h1');
  h1.className = 'hero__titulo';
  h1.textContent = EVENTO.titulo;

  const sub = document.createElement('p');
  sub.className = 'hero__subtitulo';
  sub.textContent = EVENTO.subtitulo;

  hero.append(deco, h1, sub);

  // Chips de data e local (só se preenchidos)
  const chipsEl = document.createElement('div');
  chipsEl.className = 'hero__chips';
  let temChip = false;

  if (EVENTO.data) {
    const chip = document.createElement('span');
    chip.className = 'hero__chip';
    chip.textContent = '\uD83D\uDCC5 ' + EVENTO.data;
    chipsEl.appendChild(chip);
    temChip = true;
  }
  if (EVENTO.local) {
    const chip = document.createElement('span');
    chip.className = 'hero__chip';
    chip.textContent = '\uD83D\uDCCD ' + EVENTO.local;
    chipsEl.appendChild(chip);
    temChip = true;
  }
  if (EVENTO.mensagem) {
    const chip = document.createElement('span');
    chip.className = 'hero__chip';
    chip.textContent = '\uD83D\uDCAC ' + EVENTO.mensagem;
    chipsEl.appendChild(chip);
    temChip = true;
  }
  if (temChip) hero.appendChild(chipsEl);

  // Onda
  const onda = document.createElement('div');
  onda.className = 'hero__onda';
  onda.innerHTML = svgOnda;  // SVG estático, sem dados externos
  hero.appendChild(onda);

  headerEl.appendChild(hero);
}

renderizarHero();

// ─── Skeletons de carregamento ────────────────────────────────────────────────
function renderizarSkeletons(qtd = 6) {
  listaEl.innerHTML = '';
  for (let i = 0; i < qtd; i++) {
    const li = document.createElement('li');
    li.className = 'skeleton-card';
    li.setAttribute('aria-hidden', 'true');

    const img = document.createElement('div');
    img.className = 'skeleton skeleton-card__img';

    const corpo = document.createElement('div');
    corpo.className = 'skeleton-card__corpo';

    const t = document.createElement('div');
    t.className = 'skeleton skeleton-card__titulo';
    const d = document.createElement('div');
    d.className = 'skeleton skeleton-card__desc';
    const b = document.createElement('div');
    b.className = 'skeleton skeleton-card__btn';

    corpo.append(t, d, b);
    li.append(img, corpo);
    listaEl.appendChild(li);
  }
}

renderizarSkeletons();

// ─── Controle de estado ────────────────────────────────────────────────────────
let todosOsDocs   = [];
let primeiraVez   = true;
let idsRendizados = new Set(); // para controlar animação de entrada

// ─── Filtro e ordenação ───────────────────────────────────────────────────────
function docsFiltradosOrdenados() {
  let lista = [...todosOsDocs];

  if (toggleDisponiveis.checked) {
    lista = lista.filter((d) => !obterInfoDoacoes(d.data()).reservado);
  }

  // Disponíveis primeiro, depois reservados; ambos em ordem alfabética
  lista.sort((a, b) => {
    const rA = obterInfoDoacoes(a.data()).reservado;
    const rB = obterInfoDoacoes(b.data()).reservado;
    if (rA !== rB) return rA ? 1 : -1;
    return a.data().nome.localeCompare(b.data().nome, 'pt-BR');
  });

  return lista;
}

toggleDisponiveis.addEventListener('change', () => desenhar(docsFiltradosOrdenados()));

// ─── Atualiza barra de progresso ─────────────────────────────────────────────
function atualizarProgresso(docs) {
  const total     = docs.length;
  const reservados = docs.filter((d) => obterInfoDoacoes(d.data()).reservado).length;
  const pct       = total > 0 ? Math.round((reservados / total) * 100) : 0;

  progressoLabel.textContent = `${reservados} de ${total} presente${total !== 1 ? 's' : ''} já escolhido${reservados !== 1 ? 's' : ''}`;
  progressoPct.textContent   = pct + '%';
  progressoBarra.value       = pct;
  progressoBarra.max         = 100;
  progressoBarra.setAttribute('aria-valuenow', pct);
  progressoBarra.setAttribute('aria-valuemax', 100);
}

// ─── Renderiza cartões ────────────────────────────────────────────────────────
function desenhar(docs) {
  listaEl.innerHTML = '';

  if (docs.length === 0) {
    // Lista vazia após filtro
    const msg = document.createElement('li');
    msg.className = 'lista-mensagem';
    msg.style.gridColumn = '1 / -1';

    const icone = document.createElement('div');
    icone.className = 'lista-mensagem__icone';
    icone.textContent = toggleDisponiveis.checked ? '✅' : '🎁';

    const titulo = document.createElement('p');
    titulo.className = 'lista-mensagem__titulo';
    titulo.textContent = toggleDisponiveis.checked
      ? 'Todos os presentes já foram escolhidos!'
      : 'Nenhum presente disponível no momento.';

    msg.append(icone, titulo);
    listaEl.appendChild(msg);
    return;
  }

  docs.forEach((d) => {
    const p = d.data();
    const info = obterInfoDoacoes(p);
    const reservado = info.reservado;
    const isNovo = !idsRendizados.has(d.id);

    const li = document.createElement('li');

    const card = document.createElement('article');
    card.className = 'card' + (reservado ? ' reservado' : '');
    if (isNovo && primeiraVez) card.classList.add('card--novo');

    // ── Área de mídia ──
    const midia = document.createElement('div');
    midia.className = 'card__midia';

    // Imagem opcional (prioridade: imagemData -> imagemUrl legado -> emoji 🎁)
    let imagemCarregada = false;
    const temImagemData =
      typeof p.imagemData === 'string' &&
      p.imagemData.startsWith('data:image/jpeg;base64,') &&
      p.imagemData.length <= 250000;

    if (temImagemData) {
      const img = document.createElement('img');
      img.src = p.imagemData;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 800;
      img.height = 600;
      img.className = 'card__imagem';
      midia.appendChild(img);
      imagemCarregada = true;
    } else if (p.imagemUrl && typeof p.imagemUrl === 'string') {
      const urlLegada = urlHttpsSegura(p.imagemUrl);
      if (urlLegada) {
        const img = document.createElement('img');
        img.src = urlLegada.href;
        img.alt = '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.width = 800;
        img.height = 600;
        img.referrerPolicy = 'no-referrer';
        img.className = 'card__imagem';
        img.addEventListener('error', () => {
          img.remove();
          if (!midia.querySelector('.card__emoji')) {
            const emoji = document.createElement('span');
            emoji.className = 'card__emoji';
            emoji.setAttribute('aria-hidden', 'true');
            emoji.textContent = '🎁';
            midia.appendChild(emoji);
          }
        });
        midia.appendChild(img);
        imagemCarregada = true;
      }
    }

    if (!imagemCarregada) {
      const emoji = document.createElement('span');
      emoji.className = 'card__emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = '🎁';
      midia.appendChild(emoji);
    }

    // Selo na mídia
    if (reservado) {
      const selo = document.createElement('div');
      selo.className = 'card__selo';
      selo.setAttribute('aria-label', 'Presente reservado');
      const check = document.createElement('span');
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      const texto = document.createElement('span');
      texto.textContent = info.quantidadeTotal > 1 ? 'Todos presenteados' : 'Presenteado';
      selo.append(check, texto);
      midia.appendChild(selo);
    } else if (info.quantidadeTotal > 1) {
      const seloQtd = document.createElement('div');
      seloQtd.className = 'card__selo card__selo--qtd';
      seloQtd.textContent = info.quantidadeDoada > 0 ? `Restam ${info.restante}` : `${info.quantidadeTotal}`;
      midia.appendChild(seloQtd);
    }

    // ── Corpo ──
    const corpo = document.createElement('div');
    corpo.className = 'card__corpo';

    const titulo = document.createElement('h3');
    titulo.textContent = p.nome;

    // Descrição: omitir se vazia ou igual ao nome
    const descTrimmed = (p.descricao || '').trim();
    if (descTrimmed && descTrimmed !== p.nome) {
      const desc = document.createElement('p');
      desc.className = 'card__desc';
      desc.textContent = descTrimmed;
      corpo.append(titulo, desc);
    } else {
      corpo.append(titulo);
    }

    // Progresso de quantidade (para itens com quantidade > 1)
    if (info.quantidadeTotal > 1) {
      const progQtd = document.createElement('div');
      progQtd.className = 'card__meta-qtd';

      const textoQtd = document.createElement('p');
      textoQtd.className = 'card__meta-qtd-texto';
      if (reservado) {
        textoQtd.textContent = '🎉 Todos presenteados!';
        textoQtd.classList.add('card__meta-qtd-texto--concluido');
      } else if (info.quantidadeDoada > 0) {
        textoQtd.textContent = `📦 ${info.quantidadeDoada}/${info.quantidadeTotal} presenteados · restam ${info.restante}`;
      } else {
        textoQtd.textContent = `📦 ${info.quantidadeTotal}`;
      }

      const trilho = document.createElement('div');
      trilho.className = 'card__meta-qtd-trilho';
      const barra = document.createElement('div');
      barra.className = 'card__meta-qtd-barra';
      const pctItem = Math.min(100, Math.round((info.quantidadeDoada / info.quantidadeTotal) * 100));
      barra.style.width = `${pctItem}%`;
      trilho.appendChild(barra);

      progQtd.append(textoQtd, trilho);
      corpo.appendChild(progQtd);
    }

    // Link "Ver sugestão" (só em cartões disponíveis com linkLoja válido que NÃO seja buscador)
    if (!reservado && p.linkLoja) {
      const urlLoja = urlHttpsSegura(p.linkLoja);
      if (urlLoja && !linkDeBuscador(urlLoja)) {
        const linkSugestao = document.createElement('a');
        linkSugestao.href = urlLoja.href;
        linkSugestao.target = '_blank';
        linkSugestao.rel = 'noopener noreferrer nofollow';
        linkSugestao.className = 'card__link-sugestao';
        const textoLink = document.createElement('span');
        textoLink.textContent = '↗ Ver sugestão no ' + nomeDaLoja(urlLoja);
        const srOnlyLink = document.createElement('span');
        srOnlyLink.className = 'sr-only';
        srOnlyLink.textContent = ' (abre em nova aba)';
        linkSugestao.append(textoLink, srOnlyLink);
        corpo.appendChild(linkSugestao);
      }
    }

    // Botão
    const botao = document.createElement('button');
    botao.className = 'btn card__btn';

    if (reservado) {
      botao.className += ' btn--reservado';
      botao.textContent = 'Indisponível';
      botao.disabled = true;
      botao.setAttribute('aria-label', 'Presente indisponível: ' + p.nome);
    } else {
      botao.className += ' btn--principal btn--bloco';
      botao.textContent = 'Eu vou presentear!';
      botao.setAttribute('aria-label', 'Presentear: ' + p.nome);
      botao.addEventListener('click', () => abrirDialogReserva(d.id, p.nome, info, botao));
    }

    corpo.appendChild(botao);
    card.append(midia, corpo);
    li.appendChild(card);
    listaEl.appendChild(li);

    idsRendizados.add(d.id);
  });
}

// ─── Dialog de reserva ────────────────────────────────────────────────────────
let idPresente        = null;
let infoAtualPresente = null;
let botaoOrigem       = null;

function abrirDialogReserva(id, nomePresente, info, btnOrigem) {
  idPresente        = id;
  infoAtualPresente = info;
  botaoOrigem       = btnOrigem;

  dialogTitulo.textContent  = 'Presentear: ' + nomePresente;
  inputReservaNome.value    = '';
  erroReserva.textContent   = '';
  btnReservaConfirmar.disabled = false;
  btnReservaCancelar.disabled  = false;
  btnReservaConfirmar.textContent = 'Confirmar reserva';

  if (info && info.quantidadeTotal > 1) {
    dialogReservaInfo.hidden = false;
    dialogReservaInfo.textContent = `📦 Meta: ${info.quantidadeTotal} (${info.quantidadeDoada} presenteados · restam ${info.restante})`;

    reservaCampoQtd.hidden = false;
    inputReservaQtd.min = '1';
    inputReservaQtd.max = String(info.restante);
    inputReservaQtd.value = '1';
    reservaQtdAjuda.textContent = `Você pode escolher de 1 a ${info.restante}.`;
  } else {
    dialogReservaInfo.hidden = true;
    dialogReservaInfo.textContent = '';
    reservaCampoQtd.hidden = true;
    inputReservaQtd.value = '1';
    reservaQtdAjuda.textContent = '';
  }

  dialogReserva.showModal();
  inputReservaNome.focus();
}

function fecharDialogReserva() {
  dialogReserva.close();
  if (botaoOrigem) botaoOrigem.focus();
  botaoOrigem       = null;
  idPresente        = null;
  infoAtualPresente = null;
}

btnReservaCancelar.addEventListener('click', () => fecharDialogReserva());

// Fechar ao clicar fora (backdrop)
dialogReserva.addEventListener('click', (e) => {
  if (e.target === dialogReserva) fecharDialogReserva();
});

// Fechar com ESC (nativo do <dialog>, mas devolvemos o foco)
dialogReserva.addEventListener('cancel', () => {
  if (botaoOrigem) botaoOrigem.focus();
  botaoOrigem       = null;
  idPresente        = null;
  infoAtualPresente = null;
});

btnReservaConfirmar.addEventListener('click', async () => {
  const nomeNormalizado = inputReservaNome.value.trim();

  // Validação do nome
  if (nomeNormalizado.length < 2) {
    erroReserva.textContent = 'Por favor, informe um nome com ao menos 2 caracteres.';
    inputReservaNome.focus();
    return;
  }
  if (nomeNormalizado.length > 60) {
    erroReserva.textContent = 'O nome deve ter no máximo 60 caracteres.';
    inputReservaNome.focus();
    return;
  }

  // Validação da quantidade
  let qtdDoar = 1;
  if (infoAtualPresente && infoAtualPresente.quantidadeTotal > 1) {
    qtdDoar = parseInt(inputReservaQtd.value, 10);
    if (isNaN(qtdDoar) || qtdDoar < 1) {
      erroReserva.textContent = 'Informe uma quantidade válida (mínimo 1).';
      inputReservaQtd.focus();
      return;
    }
    if (qtdDoar > infoAtualPresente.restante) {
      erroReserva.textContent = `A quantidade não pode ser maior que o restante disponível (${infoAtualPresente.restante}).`;
      inputReservaQtd.focus();
      return;
    }
  }

  erroReserva.textContent = '';
  btnReservaConfirmar.disabled = true;
  btnReservaCancelar.disabled  = true;
  btnReservaConfirmar.textContent = 'Reservando...';

  const ref = doc(db, 'presentes', idPresente);

  try {
    const resultado = await runTransaction(db, async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists()) return { ok: false, motivo: 'inexistente' };

      const infoNoBanco = obterInfoDoacoes(snap.data());

      if (infoNoBanco.restante <= 0) {
        return { ok: false, motivo: 'esgotado' };
      }
      if (qtdDoar > infoNoBanco.restante) {
        return { ok: false, motivo: 'insuficiente', restante: infoNoBanco.restante };
      }

      const novaDoacao = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 7),
        nome: nomeNormalizado,
        quantidade: qtdDoar,
        data: new Date().toISOString(),
      };

      const novasDoacoes = [...infoNoBanco.doacoes, novaDoacao];
      const novaQtdDoada = infoNoBanco.quantidadeDoada + qtdDoar;
      const estaReservado = novaQtdDoada >= infoNoBanco.quantidadeTotal;

      t.update(ref, {
        doacoes: novasDoacoes,
        reservadoPor: estaReservado ? (novasDoacoes.length === 1 ? nomeNormalizado : 'Múltiplos') : null,
        reservadoEm: serverTimestamp(),
      });

      return { ok: true, qtd: qtdDoar, estaReservado };
    });

    fecharDialogReserva();

    if (resultado.ok) {
      const msgQtd = resultado.qtd > 1 ? `${resultado.qtd} presenteados` : 'Presente reservado';
      mostrarToast(`${msgQtd}! Obrigado, ${nomeNormalizado} 🩷`, 'sucesso');
    } else if (resultado.motivo === 'esgotado') {
      mostrarToast('Ops, esse presente acabou de ser totalmente reservado!', 'erro');
    } else if (resultado.motivo === 'insuficiente') {
      mostrarToast(`Ops, só restam ${resultado.restante} disponíveis!`, 'erro');
    } else {
      mostrarToast('Ops, não foi possível concluir a reserva.', 'erro');
    }
  } catch (_erro) {
    fecharDialogReserva();
    mostrarToast('Não foi possível reservar. Tente novamente em instantes.', 'erro');
  }
});

// ─── onSnapshot ──────────────────────────────────────────────────────────────
const q = query(collection(db, 'presentes'), orderBy('nome'));

onSnapshot(
  q,
  (snapshot) => {
    todosOsDocs = snapshot.docs;

    if (snapshot.empty) {
      listaEl.innerHTML = '';
      const msg = document.createElement('li');
      msg.style.gridColumn = '1 / -1';
      msg.className = 'lista-mensagem';

      const icone = document.createElement('div');
      icone.className = 'lista-mensagem__icone';
      icone.textContent = '🎁';

      const titulo = document.createElement('p');
      titulo.className = 'lista-mensagem__titulo';
      titulo.textContent = 'Nenhum presente disponível no momento.';

      msg.append(icone, titulo);
      listaEl.appendChild(msg);

      progressoWrapper.hidden = true;
      controlesEl.hidden      = true;
      primeiraVez = false;
      return;
    }

    atualizarProgresso(todosOsDocs);
    progressoWrapper.hidden = false;
    controlesEl.hidden      = false;

    desenhar(docsFiltradosOrdenados());

    primeiraVez = false;
  },
  () => {
    // Erro de conexão
    listaEl.innerHTML = '';
    const msg = document.createElement('li');
    msg.style.gridColumn = '1 / -1';
    msg.className = 'lista-mensagem';

    const icone = document.createElement('div');
    icone.className = 'lista-mensagem__icone';
    icone.textContent = '⚠️';

    const titulo = document.createElement('p');
    titulo.className = 'lista-mensagem__titulo';
    titulo.textContent = 'Não foi possível carregar a lista.';

    const texto = document.createElement('p');
    texto.textContent = 'Verifique sua conexão e tente novamente.';
    texto.style.color = 'var(--c-texto-sec)';
    texto.style.marginBottom = 'var(--sp-md)';

    const btnTentar = document.createElement('button');
    btnTentar.className = 'btn btn--principal';
    btnTentar.textContent = 'Tentar novamente';
    btnTentar.addEventListener('click', () => location.reload());

    msg.append(icone, titulo, texto, btnTentar);
    listaEl.appendChild(msg);

    progressoWrapper.hidden = true;
    controlesEl.hidden      = true;
  },
);
