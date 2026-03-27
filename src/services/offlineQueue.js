import { loadJSON, saveJSON } from '../lib/storage';

const STORAGE_KEY = 'vwf_offline_queue';

/**
 * Adds a failed submission to the offline queue for later retry.
 * @param {{ submission: string, assets: Object, mediaType: string }} entry
 */
export function addToOfflineQueue(entry) {
  const queue = loadJSON(STORAGE_KEY, []);
  queue.push({
    ...entry,
    queuedAt: new Date().toISOString(),
  });
  saveJSON(STORAGE_KEY, queue);
}

/**
 * Returns all queued entries.
 * @returns {Array}
 */
export function getOfflineQueue() {
  return loadJSON(STORAGE_KEY, []);
}

/**
 * Clears the offline queue.
 */
export function clearOfflineQueue() {
  saveJSON(STORAGE_KEY, []);
}

/**
 * Removes a single entry from the queue by index.
 * @param {number} index
 */
export function removeFromOfflineQueue(index) {
  const queue = loadJSON(STORAGE_KEY, []);
  if (index >= 0 && index < queue.length) {
    queue.splice(index, 1);
    saveJSON(STORAGE_KEY, queue);
  }
}

/**
 * Returns the number of queued entries.
 * @returns {number}
 */
export function getQueueCount() {
  return getOfflineQueue().length;
}

/**
 * Processes the offline queue by retrying each entry with the provided scoring function.
 * @param {Function} scoreFn - The scoring function to retry with.
 */
export async function processOfflineQueue(scoreFn) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;
  const remaining = [];
  for (const entry of queue) {
    try {
      await scoreFn(entry.submission, entry.assets?.left, entry.assets?.right, entry.mediaType);
    } catch {
      remaining.push(entry);
    }
  }
  saveJSON(STORAGE_KEY, remaining);
}
