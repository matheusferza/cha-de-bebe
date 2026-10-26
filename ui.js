/**
 * ui.js — helpers de UI compartilhados entre index.html e admin.html
 * Módulo ES, sem dependências externas.
 */


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

// ─── Detecção de links de buscadores ──────────────────────────────────────────
/**
 * Verifica se um objeto URL é resultado de busca ou redirecionador de anúncios.
 * @param {URL} url
 * @returns {boolean}
 */
export function linkDeBuscador(url) {
  if (!url || typeof url !== 'object' || !url.hostname) return false;
  const host = url.hostname.toLowerCase();
  const path = (url.pathname || '/').toLowerCase();

  // Yahoo search
  if (host === 'search.yahoo.com' || host.endsWith('.search.yahoo.com')) {
    return true;
  }

  // Google (google.com, google.com.br, www.google.*)
  if (host === 'google.com' || host === 'google.com.br' || /(^|\.)google\.[a-z.]+$/i.test(host)) {
    if (
      path.startsWith('/search') ||
      path.startsWith('/url') ||
      path.startsWith('/aclk') ||
      path.startsWith('/imgres') ||
      path.startsWith('/shopping')
    ) {
      return true;
    }
  }

  // Bing
  if (host === 'bing.com' || host.endsWith('.bing.com')) {
    if (path.startsWith('/ck') || path.startsWith('/search') || path.startsWith('/images')) {
      return true;
    }
  }

  // DuckDuckGo
  if (host === 'duckduckgo.com' || host.endsWith('.duckduckgo.com')) {
    if (path.startsWith('/l/') || path.startsWith('/?') || path === '/') {
      return true;
    }
  }

  // Google Ads / DoubleClick
  if (
    host === 'googleadservices.com' ||
    host.endsWith('.googleadservices.com') ||
    host === 'doubleclick.net' ||
    host.endsWith('.doubleclick.net')
  ) {
    return true;
  }

  return false;
}

// ─── Processamento de foto de presente ────────────────────────────────────────
export const LIMITE_IMAGEM_CHARS = 200000;

/**
 * Prepara uma imagem enviada pelo usuário:
 * - Valida tipo de arquivo e tamanho máximo de 15 MB
 * - Decodifica com rotação EXIF respeitada (createImageBitmap ou fallback Image)
 * - Recorte central proporcional 4:3
 * - Redimensionamento para no máximo 800x600 sem ampliar
 * - Fundo branco em <canvas> (evita transparência preta em PNG)
 * - Compressão progressiva JPEG até caber em 200.000 caracteres
 * @param {File} arquivo
 * @returns {Promise<string>} data URL JPEG
 */
export async function prepararImagem(arquivo) {
  if (!arquivo || !arquivo.type || !arquivo.type.startsWith('image/')) {
    throw new Error('tipo');
  }
  if (arquivo.size > 15 * 1024 * 1024) {
    throw new Error('arquivo-grande');
  }

  let source = null;
  let isBitmap = false;
  let srcW = 0;
  let srcH = 0;

  // 1. Tenta decodificar com createImageBitmap respeitando EXIF
  if (typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
      isBitmap = true;
      srcW = source.width;
      srcH = source.height;
    } catch {
      source = null;
    }
  }

  // 2. Fallback com new Image() + URL.createObjectURL
  if (!source) {
    try {
      source = await new Promise((resolve, reject) => {
        const url = URL.createObjectURL(arquivo);
        const img = new Image();
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('decodificar'));
        };
        img.src = url;
      });
      srcW = source.naturalWidth || source.width;
      srcH = source.naturalHeight || source.height;
    } catch {
      throw new Error('decodificar');
    }
  }

  if (!srcW || !srcH) {
    if (isBitmap && source && typeof source.close === 'function') source.close();
    throw new Error('decodificar');
  }

  // 3. Recorte central 4:3
  const targetAspect = 4 / 3;
  const currentAspect = srcW / srcH;
  let cropW, cropH, cropX, cropY;

  if (currentAspect > targetAspect) {
    cropH = srcH;
    cropW = Math.round(srcH * targetAspect);
    cropX = Math.round((srcW - cropW) / 2);
    cropY = 0;
  } else {
    cropW = srcW;
    cropH = Math.round(srcW / targetAspect);
    cropX = 0;
    cropY = Math.round((srcH - cropH) / 2);
  }

  // 4. Redimensionamento para no máximo 800x600, sem ampliar
  let destW = cropW;
  let destH = cropH;
  if (destW > 800 || destH > 600) {
    const escala = Math.min(800 / destW, 600 / destH);
    destW = Math.round(destW * escala);
    destH = Math.round(destH * escala);
  }

  // 5. Desenho em Canvas com fundo branco e compressão JPEG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let reducoesRestantes = 5;
  let dataUrl = '';
  let sucesso = false;

  try {
    while (true) {
      canvas.width = destW;
      canvas.height = destH;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, destW, destH);
      ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, destW, destH);

      // Qualidade de 0.82 descendo de 0.08 em 0.08 até 0.50
      for (let q = 0.82; q >= 0.499; q -= 0.08) {
        dataUrl = canvas.toDataURL('image/jpeg', Number(q.toFixed(2)));
        if (dataUrl.length <= LIMITE_IMAGEM_CHARS) {
          sucesso = true;
          break;
        }
      }

      if (sucesso) {
        break;
      }

      // Reduz 15% na largura e altura (até 5 reduções adicionais)
      if (reducoesRestantes > 0) {
        reducoesRestantes--;
        destW = Math.round(destW * 0.85);
        destH = Math.round(destH * 0.85);
        if (destW < 10 || destH < 10) {
          break;
        }
      } else {
        break;
      }
    }
  } finally {
    if (isBitmap && source && typeof source.close === 'function') {
      source.close();
    }
  }

  if (!sucesso || !dataUrl || dataUrl.length > LIMITE_IMAGEM_CHARS) {
    throw new Error('imagem-grande');
  }

  return dataUrl;
}
