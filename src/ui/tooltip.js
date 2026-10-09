/**
 * Tooltip único y reutilizable. El contenido se genera con una función para
 * poder refrescarlo mientras está abierto (costes, tiempo restante…).
 */

let tip = null;
let current = null; // { el, fn, side }
let timer = null;

function ensure() {
  if (tip) return tip;
  tip = document.createElement('div');
  tip.className = 'tooltip';
  tip.setAttribute('role', 'tooltip');
  document.body.appendChild(tip);
  return tip;
}

export function bindTip(el, fn, side = 'auto') {
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    showTip(el, fn, side);
  });
  el.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    hideTip();
  });
  el.addEventListener('focus', () => showTip(el, fn, side));
  el.addEventListener('blur', hideTip);
}

export function showTip(el, fn, side = 'auto') {
  ensure();
  current = { el, fn, side };
  render();
  tip.classList.add('is-open');
  clearInterval(timer);
  timer = setInterval(() => {
    if (!current || !document.body.contains(current.el)) return hideTip();
    render();
  }, 250);
}

export function hideTip() {
  current = null;
  clearInterval(timer);
  tip?.classList.remove('is-open');
}

export function isTipFor(el) {
  return current?.el === el;
}

function render() {
  const html = current.fn();
  if (!html) return hideTip();
  if (tip.innerHTML !== html) tip.innerHTML = html;
  position();
}

function position() {
  const r = current.el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const gap = 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let x;
  let y;
  const side = current.side === 'auto'
    ? (r.left > vw / 2 ? 'left' : 'right')
    : current.side;

  if (side === 'left' && r.left - t.width - gap > 8) {
    x = r.left - t.width - gap;
    y = r.top + r.height / 2 - t.height / 2;
  } else if (side === 'right' && r.right + t.width + gap < vw - 8) {
    x = r.right + gap;
    y = r.top + r.height / 2 - t.height / 2;
  } else {
    x = r.left + r.width / 2 - t.width / 2;
    y = r.top - t.height - gap;
    if (y < 8) y = r.bottom + gap;
  }
  x = Math.max(8, Math.min(vw - t.width - 8, x));
  y = Math.max(8, Math.min(vh - t.height - 8, y));
  tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
}

document.addEventListener('pointerdown', (e) => {
  if (current && !current.el.contains(e.target)) hideTip();
}, true);
