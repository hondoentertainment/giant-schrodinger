const STORAGE_KEY = 'vwf_collisions';

export function saveCollision(collision) {
    const existing = getCollisions();
    const newCollision = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...collision
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newCollision, ...existing]));
    return newCollision;
}

export function getCollisions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}
