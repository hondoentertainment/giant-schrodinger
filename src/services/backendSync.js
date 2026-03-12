/**
 * Backend Sync Service
 *
 * Manages syncing localStorage-first data to Supabase when available.
 * Implements an offline-first pattern: writes to localStorage immediately,
 * then syncs to backend in the background.
 */

import { isBackendEnabled, supabase } from '../lib/supabase';
import { logError, ErrorCategory } from './errorMonitoring';

const SYNC_QUEUE_KEY = 'vwf_sync_queue';
const LAST_SYNC_KEY = 'vwf_last_sync';

/**
 * Add an operation to the sync queue.
 * @param {string} table - Supabase table name
 * @param {string} operation - 'upsert' | 'insert'
 * @param {Object} data - The row data
 */
export function queueSync(table, operation, data) {
    try {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        queue.push({
            table,
            operation,
            data,
            queuedAt: Date.now(),
        });
        // Keep queue bounded
        const trimmed = queue.slice(-200);
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(trimmed));
    } catch {
        // Storage full, skip queuing
    }
}

/**
 * Process the pending sync queue against Supabase.
 * @returns {Object} { synced: number, failed: number, remaining: number }
 */
export async function processSyncQueue() {
    if (!isBackendEnabled() || !supabase) {
        return { synced: 0, failed: 0, remaining: getSyncQueueLength() };
    }

    let queue;
    try {
        queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
    } catch {
        return { synced: 0, failed: 0, remaining: 0 };
    }

    if (queue.length === 0) return { synced: 0, failed: 0, remaining: 0 };

    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of queue) {
        try {
            let result;
            if (item.operation === 'upsert') {
                result = await supabase.from(item.table).upsert(item.data);
            } else {
                result = await supabase.from(item.table).insert(item.data);
            }

            if (result.error) {
                throw result.error;
            }
            synced++;
        } catch (err) {
            // Keep items that are less than 7 days old for retry
            const age = Date.now() - item.queuedAt;
            if (age < 7 * 24 * 60 * 60 * 1000) {
                remaining.push(item);
            }
            failed++;
        }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));

    return { synced, failed, remaining: remaining.length };
}

/**
 * Get the number of pending sync operations.
 * @returns {number}
 */
export function getSyncQueueLength() {
    try {
        const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
        return queue.length;
    } catch {
        return 0;
    }
}

/**
 * Get the timestamp of the last successful sync.
 * @returns {number|null} Unix timestamp or null
 */
export function getLastSyncTime() {
    try {
        const ts = localStorage.getItem(LAST_SYNC_KEY);
        return ts ? Number(ts) : null;
    } catch {
        return null;
    }
}

/**
 * Clear the sync queue (e.g., on logout).
 */
export function clearSyncQueue() {
    try {
        localStorage.removeItem(SYNC_QUEUE_KEY);
    } catch {
        // ignore
    }
}

/**
 * Sync player stats to the backend.
 * Queues the sync if backend is unavailable.
 * @param {string} playerName
 * @param {Object} stats - Player stats object
 */
export function syncPlayerStats(playerName, stats) {
    const data = {
        player_name: playerName,
        total_rounds: stats.totalRounds || 0,
        current_streak: stats.currentStreak || 0,
        max_streak: stats.maxStreak || 0,
        updated_at: new Date().toISOString(),
    };

    if (isBackendEnabled() && supabase) {
        supabase.from('player_stats').upsert(data, { onConflict: 'player_name' })
            .then(({ error }) => {
                if (error) {
                    queueSync('player_stats', 'upsert', data);
                }
            })
            .catch(() => {
                queueSync('player_stats', 'upsert', data);
            });
    } else {
        queueSync('player_stats', 'upsert', data);
    }
}

/**
 * Sync a leaderboard entry to the backend.
 * @param {Object} entry - { playerName, score, avatar, roundCount }
 */
export function syncLeaderboardEntry(entry) {
    const data = {
        player_name: entry.playerName,
        score: entry.score,
        avatar: entry.avatar,
        round_count: entry.roundCount,
        date_key: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
    };

    if (isBackendEnabled() && supabase) {
        supabase.from('leaderboard_entries').insert(data)
            .then(({ error }) => {
                if (error) {
                    queueSync('leaderboard_entries', 'insert', data);
                }
            })
            .catch(() => {
                queueSync('leaderboard_entries', 'insert', data);
            });
    } else {
        queueSync('leaderboard_entries', 'insert', data);
    }
}

/**
 * Sync analytics events to the backend.
 * @param {Array} events - Array of event objects
 */
export function syncAnalyticsEvents(events) {
    if (!events.length) return;

    const data = events.map(e => ({
        event_name: e.event,
        properties: e.properties,
        timestamp: new Date(e.timestamp).toISOString(),
    }));

    if (isBackendEnabled() && supabase) {
        supabase.from('analytics_events').insert(data)
            .then(({ error }) => {
                if (error) {
                    logError({
                        message: `Analytics sync failed: ${error.message}`,
                        category: ErrorCategory.NETWORK,
                    });
                }
            })
            .catch(() => {
                // Silent fail for analytics
            });
    }
}

/**
 * Auto-sync on page visibility change (when user returns to tab).
 */
export function initAutoSync() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isBackendEnabled()) {
            processSyncQueue().catch(() => {});
        }
    });

    // Also sync on page load if there's a queue
    if (getSyncQueueLength() > 0 && isBackendEnabled()) {
        setTimeout(() => processSyncQueue().catch(() => {}), 5000);
    }
}
