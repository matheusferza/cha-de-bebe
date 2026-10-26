/**
 * ui.js — helpers de UI compartilhados entre index.html e admin.html
 * Módulo ES, sem dependências externas.
 */

// ─── Formatador de moeda ──────────────────────────────────────────────────────
export const formatarMoeda = (valor) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(valor) || 0,
  );

// ─── Região de toasts ─────────────────────────────────────────────────────────
let toastRegiao = null;

function garantirRegiao() {
  if (toastRegiao) return toastRegiao;
  toastRegiao = document.createElement('div');
  toastRegiao.id = 'toast-regiao';
  toastRegiao.setAttribute('aria-live', 'polite');
  toastRegiao.setAttribute('aria-atomic', 'false');
  document.body.appendChild(toastRegiao);
  return toastRegiao;
}

/**
 * Exibe um toast de notificação.
 * @param {string} mensagem  Texto da mensagem.
 * @param {'sucesso'|'erro'|'info'} tipo  Tipo visual.
 * @param {number} duracaoMs  Duração antes de sumir (padrao 4000 ms).
 */
export function mostrarToast(mensagem, tipo = 'info', duracaoMs = 4000) {
  const regiao = garantirRegiao();

  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute('role', 'status');

  const texto = document.createElement('span');
  texto.textContent = mensagem;

  const fechar = document.createElement('button');
  fechar.className = 'toast__fechar';
  fechar.setAttribute('aria-label', 'Fechar notificacao');
  fechar.textContent = '\u00d7';
  fechar.addEventListener('click', () => remover(toast));

  toast.append(texto, fechar);
  regiao.appendChild(toast);

  // Forca reflow para a animacao de entrada funcionar
  toast.getBoundingClientRect();
  toast.classList.add('toast--visivel');

  const timer = setTimeout(() => remover(toast), duracaoMs);

  function remover(el) {
    clearTimeout(timer);
    el.classList.remove('toast--visivel');
    el.classList.add('toast--saindo');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }
}

// ─── Dialog de confirmacao generico ──────────────────────────────────────────
/**
 * Abre um <dialog> de confirmacao e retorna uma Promise<boolean>.
 * @param {{ titulo: string, corpo: string, labelConfirmar?: string, classeBotao?: string }} opcoes
 */
export function abrirConfirmacao({ titulo, corpo, labelConfirmar = 'Confirmar', classeBotao = 'btn--perigo' }) {
  return new Promise((resolve) => {
    const anterior = document.getElementById('dialog-confirmacao');
    if (anterior) anterior.remove();

    const dialog = document.createElement('dialog');
    dialog.id = 'dialog-confirmacao';
    dialog.className = 'dialog-confirm';

    const h2 = document.createElement('h2');
    h2.className = 'dialog-confirm__titulo';
    h2.textContent = titulo;

    const p = document.createElement('p');
    p.className = 'dialog-confirm__corpo';
    p.textContent = corpo;

    const acoes = document.createElement('div');
    acoes.className = 'dialog-confirm__acoes';

    const btnCancelar = document.createElement('button');
    btnCancelar.className = 'btn btn--secundario';
    btnCancelar.textContent = 'Cancelar';

    const btnConfirmar = document.createElement('button');
    btnConfirmar.className = `btn ${classeBotao}`;
    btnConfirmar.textContent = labelConfirmar;

    acoes.append(btnCancelar, btnConfirmar);
    dialog.append(h2, p, acoes);
    document.body.appendChild(dialog);

    dialog.showModal();
    btnCancelar.focus();

    function fechar(resultado) {
      dialog.close();
      dialog.remove();
      resolve(resultado);
    }

    btnCancelar.addEventListener('click', () => fechar(false));
    btnConfirmar.addEventListener('click', () => fechar(true));

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) fechar(false);
    });

    dialog.addEventListener('cancel', () => fechar(false));
  });
}

// ─── Validação de URL segura ──────────────────────────────────────────────────
/**
 * Retorna um objeto URL se o texto for uma URL válida com protocolo https:
 * Rejeita javascript:, data:, http: e qualquer coisa inválida.
 * @param {string} texto
 * @returns {URL|null}
 */
export function urlHttpsSegura(texto) {
  if (!texto || typeof texto !== 'string') return null;
  const t = texto.trim();
  if (!t) return null;
  try {
    const url = new URL(t);
    if (url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

// ─── Nome amigável da loja ────────────────────────────────────────────────────
/**
 * Recebe um objeto URL e devolve um nome de loja amigável.
 * @param {URL} url
 * @returns {string}
 */
export function nomeDaLoja(url) {
  const h = url.hostname.toLowerCase();
  if (h.includes('mercadolivre') || h.includes('mercadolibre') || h === 'meli.la') return 'Mercado Livre';
  if (h.includes('amazon')) return 'Amazon';
  if (h.includes('shopee')) return 'Shopee';
  if (h.includes('magazineluiza') || h.includes('magalu')) return 'Magalu';
  if (h.includes('americanas')) return 'Americanas';
  if (h.includes('casasbahia')) return 'Casas Bahia';
  if (h.includes('kabum')) return 'KaBuM!';
  return h.replace(/^www\./, '');
}
