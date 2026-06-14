/**
 * Friends Service
 *
 * Manages a friends list using localStorage.
 * Stored under the 'vwf_friends' key as a JSON array.
 */

const STORAGE_KEY = 'vwf_friends';

/**
 * Reads the friends list from localStorage.
 * @returns {Array<{name: string, addedAt: number}>}
 */
function readFriends() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read friends list:', e);
    return [];
  }
}

/**
 * Writes the friends list to localStorage.
 * @param {Array} friends
 */
function writeFriends(friends) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(friends));
  } catch (e) {
    console.error('Failed to write friends list:', e);
  }
}

/**
 * Adds a friend by name. No-op if already a friend.
 * @param {string} name - The friend's display name.
 * @returns {boolean} True if added, false if already exists or failed.
 */
export function addFriend(name) {
  try {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (!trimmed) return false;

    const friends = readFriends();
    const exists = friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) return false;

    friends.push({ name: trimmed, addedAt: Date.now() });
    writeFriends(friends);
    return true;
  } catch (e) {
    console.error('Failed to add friend:', e);
    return false;
  }
}

/**
 * Removes a friend by name.
 * @param {string} name - The friend's display name.
 * @returns {boolean} True if removed, false if not found or failed.
 */
export function removeFriend(name) {
  try {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim().toLowerCase();

    const friends = readFriends();
    const filtered = friends.filter((f) => f.name.toLowerCase() !== trimmed);

    if (filtered.length === friends.length) return false;

    writeFriends(filtered);
    return true;
  } catch (e) {
    console.error('Failed to remove friend:', e);
    return false;
  }
}

/**
 * Gets all friends as an array of { name, addedAt } objects.
 * @returns {Array<{name: string, addedAt: number}>}
 */
export function getFriends() {
  try {
    return readFriends();
  } catch (e) {
    console.error('Failed to get friends:', e);
    return [];
  }
}

/**
 * Checks if someone is a friend.
 * @param {string} name - The name to check.
 * @returns {boolean}
 */
export function isFriend(name) {
  try {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim().toLowerCase();
    const friends = readFriends();
    return friends.some((f) => f.name.toLowerCase() === trimmed);
  } catch (e) {
    console.error('Failed to check friend status:', e);
    return false;
  }
}

/**
 * Returns mock activity data for friends.
 * Generates 3-5 recent activity entries using actual friend names.
 * @returns {Array<{friend: string, message: string, timestamp: number}>}
 */
export function getFriendActivity() {
  try {
    const friends = readFriends();
    if (friends.length === 0) return [];

    const activities = [
      (name) => `${name} scored 8/10`,
      (name) => `${name} scored 6/10`,
      (name) => `${name} scored 9/10`,
      (name) => `${name} completed a 5-round session`,
      (name) => `${name} scored 7/10`,
      (name) => `${name} hit a 3-day streak`,
      (name) => `${name} scored 10/10`,
      (name) => `${name} played the daily challenge`,
    ];

    const count = Math.min(friends.length * 2, Math.floor(Math.random() * 3) + 3); // 3-5 entries
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const result = [];

    for (let i = 0; i < count; i++) {
      const friend = friends[Math.floor(Math.random() * friends.length)];
      const activityTemplate = activities[Math.floor(Math.random() * activities.length)];
      const timestamp = now - Math.floor(Math.random() * oneDayMs);

      result.push({
        friend: friend.name,
        message: activityTemplate(friend.name),
        timestamp,
      });
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error('Failed to get friend activity:', e);
    return [];
  }
}
