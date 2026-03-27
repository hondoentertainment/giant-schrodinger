const QUEUE_KEY = 'venn_offline_queue';

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch { return []; }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToOfflineQueue(submission) {
  const queue = getOfflineQueue();
  queue.push({
    ...submission,
    id: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    queuedAt: Date.now(),
  });
  saveQueue(queue);
  return queue.length;
}

export function removeFromQueue(id) {
  const queue = getOfflineQueue().filter(s => s.id !== id);
  saveQueue(queue);
}

export function clearOfflineQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function getQueueCount() {
  return getOfflineQueue().length;
}

// Process queue when online
export async function processOfflineQueue(scoreFunction) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return [];

  const results = [];
  for (const item of queue) {
    try {
      const result = await scoreFunction(item.submission, item.assets?.left, item.assets?.right, item.mediaType);
      results.push({ ...item, result, success: true });
      removeFromQueue(item.id);
    } catch {
      results.push({ ...item, success: false });
    }
  }
  return results;
}
