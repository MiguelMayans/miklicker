/**
 * Mini sistema de EventBus (pub/sub).
 * Permite que módulos se comuniquen sin imports circulares.
 * Escalable para cuando tengamos 20+ sistemas.
 */

const listeners = new Map();

/**
 * @param {string} event
 * @param {Function} callback
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
}

/**
 * @param {string} event
 * @param {Function} callback
 */
export function off(event, callback) {
  const set = listeners.get(event);
  if (set) {
    set.delete(callback);
  }
}

/**
 * @param {string} event
 * @param {*} payload
 */
export function emit(event, payload) {
  const set = listeners.get(event);
  if (set) {
    for (const callback of set) {
      try {
        callback(payload);
      } catch (err) {
        console.error(`EventBus error in "${event}":`, err);
      }
    }
  }
}

/**
 * Escuchar un evento una sola vez.
 * @param {string} event
 * @param {Function} callback
 */
export function once(event, callback) {
  const wrapper = (payload) => {
    off(event, wrapper);
    callback(payload);
  };
  on(event, wrapper);
}
