/**
 * Milestone popups — Neo-brutalist v2. Sombra offset grande.
 */

import gsap from 'gsap';

let container = null;
const queue = [];
let isShowing = false;

export function initMilestonePopup(parent) {
  container = document.createElement('div');
  container.className = 'fixed bottom-8 right-8 z-[300] flex flex-col gap-4 pointer-events-none';
  container.style.maxWidth = '360px';
  parent.appendChild(container);
}

export function showMilestonePopup(milestone) {
  queue.push(milestone);
  if (!isShowing) {
    processQueue();
  }
}

function processQueue() {
  if (queue.length === 0) {
    isShowing = false;
    return;
  }

  isShowing = true;
  const milestone = queue.shift();
  createPopup(milestone);
}

function createPopup(milestone) {
  if (!container) return;

  const popup = document.createElement('div');
  popup.className = 'pointer-events-auto p-6 border-[3px] bg-[#f7f5f0] block-interactive';
  popup.style.borderColor = '#0f0f0f';
  popup.style.borderLeft = '6px solid #06b6d4';
  popup.style.boxShadow = '6px 6px 0 0 #0f0f0f';

  const title = document.createElement('div');
  title.className = 'text-sm font-extrabold text-[#0f0f0f] uppercase tracking-wider';
  title.textContent = milestone.name;

  const desc = document.createElement('div');
  desc.className = 'text-sm text-[#3a3a35] mt-2';
  desc.textContent = milestone.description;

  const reward = document.createElement('div');
  reward.className = 'text-base font-extrabold text-[#06b6d4] mt-3';
  if (milestone.reward.amount > 0) {
    reward.textContent = `+${milestone.reward.amount} ⚡`;
  }

  popup.appendChild(title);
  popup.appendChild(desc);
  if (milestone.reward.amount > 0) popup.appendChild(reward);

  container.appendChild(popup);

  gsap.fromTo(popup,
    { x: 60, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
  );

  gsap.to(popup, {
    x: -30,
    opacity: 0,
    duration: 0.3,
    delay: 4,
    ease: 'power2.in',
    onComplete: () => {
      popup.remove();
      processQueue();
    },
  });

  popup.addEventListener('click', () => {
    gsap.killTweensOf(popup);
    gsap.to(popup, {
      x: -30, opacity: 0, duration: 0.2,
      onComplete: () => {
        popup.remove();
        processQueue();
      },
    });
  });
}
