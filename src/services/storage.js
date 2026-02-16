// Storage service for managing game collisions/history
const STORAGE_KEY = 'venn_collisions';

/**
 * Retrieves all saved collisions from local storage
 * @returns {Array} Array of collision objects
 */
export function getCollisions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to retrieve collisions:', error);
    return [];
  }
}

/**
 * Saves a new collision to local storage
 * @param {Object} collision - The collision data to save
 * @returns {Object} The saved collision with generated ID
 */
export function saveCollision(collision) {
  try {
    const collisions = getCollisions();
    const collisionWithId = {
      ...collision,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    collisions.unshift(collisionWithId); // Add to beginning (newest first)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collisions));
    
    return collisionWithId;
  } catch (error) {
    console.warn('Failed to save collision:', error);
    return { ...collision, id: Date.now().toString(), timestamp: new Date().toISOString() };
  }
}

/**
 * Deletes a collision by ID
 * @param {string} id - The collision ID to delete
 * @returns {boolean} Success status
 */
export function deleteCollision(id) {
  try {
    const collisions = getCollisions();
    const filtered = collisions.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.warn('Failed to delete collision:', error);
    return false;
  }
}

/**
 * Clears all collisions
 * @returns {boolean} Success status
 */
export function clearCollisions() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.warn('Failed to clear collisions:', error);
    return false;
  }
}

/**
 * Gets collision statistics
 * @returns {Object} Statistics object
 */
export function getCollisionStats() {
  const collisions = getCollisions();
  
  if (collisions.length === 0) {
    return {
      total: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalRounds: 0,
      byTheme: {}
    };
  }
  
  const scores = collisions.map(c => c.score || 0).filter(s => s > 0);
  const themes = collisions.reduce((acc, c) => {
    const theme = c.themeId || 'default';
    acc[theme] = (acc[theme] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: collisions.length,
    averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
    totalRounds: collisions.reduce((acc, c) => acc + (c.totalRounds || 1), 0),
    byTheme: themes
  };
}