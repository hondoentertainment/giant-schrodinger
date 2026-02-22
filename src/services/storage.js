import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, updateDoc, arrayUnion, increment, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

const STORAGE_KEY = 'vwf_collisions';
const HIGH_SCORES_KEY = 'vwf_high_scores';
const BEST_STREAK_KEY = 'vwf_best_streak';

// --- Authentication ---

export async function signInUser() {
    if (!auth) return null;
    try {
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (e) {
        console.error("Auth error:", e);
        return null;
    }
}

export function getCurrentUserId() {
    return auth?.currentUser?.uid;
}

// --- User Profile Sync ---

export async function syncUserProfile(profile) {
    // Always save local
    localStorage.setItem('vwf_user', JSON.stringify(profile));

    // Sync to Cloud
    const uid = getCurrentUserId();
    if (db && uid && profile) {
        try {
            const userRef = doc(db, 'users', uid);
            await setDoc(userRef, {
                name: profile.name,
                avatar: profile.avatar,
                gradient: profile.gradient,
                lastActive: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.error("Sync profile error:", e);
        }
    }
}

// --- Data Saving ---

export async function saveCollision(collision) {
    const existing = getCollisions();
    const newCollision = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...collision
    };

    // 1. Save Local
    localStorage.setItem(STORAGE_KEY, JSON.stringify([newCollision, ...existing]));

    // 2. Save to High Scores (Local)
    saveHighScore({
        score: collision.score,
        submission: collision.submission,
        timestamp: new Date().toISOString()
    });

    // 3. Sync to Cloud
    const uid = getCurrentUserId();
    if (db && uid) {
        try {
            const userRef = doc(db, 'users', uid);

            // Update total games count
            await updateDoc(userRef, {
                'stats.totalGames': increment(1)
            });

            // Save collision to history subcollection
            // (Optional: Might be too much write volume, keeping it simple for now)

            // If high score, update stats
            if (collision.score > (getHighScores()[0]?.score || 0)) {
                await updateDoc(userRef, {
                    'stats.bestScore': collision.score
                });
            }

        } catch (e) {
            // Passive failure is fine
            console.warn("Cloud save failed:", e);
        }
    }

    return newCollision;
}

export function getCollisions() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function getHighScores() {
    const stored = localStorage.getItem(HIGH_SCORES_KEY);
    return stored ? JSON.parse(stored) : [];
}

export function saveHighScore(entry) {
    const scores = getHighScores();
    scores.push(entry);

    // Sort by score descending, keep top 5
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, 5);

    localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(topScores));
    return topScores;
}

export function getBestStreak() {
    return parseInt(localStorage.getItem(BEST_STREAK_KEY) || '0', 10);
}

export async function saveBestStreak(streak) {
    const current = getBestStreak();

    // 1. Save Local
    if (streak > current) {
        localStorage.setItem(BEST_STREAK_KEY, streak.toString());

        // 2. Sync Cloud
        const uid = getCurrentUserId();
        if (db && uid) {
            try {
                const userRef = doc(db, 'users', uid);
                await updateDoc(userRef, {
                    'stats.bestStreak': streak // Only updates if we send it
                });
            } catch (e) {
                console.warn("Cloud streak sync failed");
            }
        }
        return true;
    }
    return false;
}

// --- Daily Challenge ---

export async function submitDailyScore(dateId, score, submission) {
    const uid = getCurrentUserId();
    if (!db || !uid) return;

    try {
        const leaderboardRef = doc(db, `daily_leaderboard/${dateId}/entries/${uid}`);
        const userProfile = JSON.parse(localStorage.getItem('vwf_user') || '{}');

        await setDoc(leaderboardRef, {
            userId: uid,
            userName: userProfile.name || 'Anonymous',
            userAvatar: userProfile.avatar || '👤',
            score: score,
            submission: submission,
            timestamp: new Date().toISOString()
        });
    } catch (e) {
        console.error("Daily submit error:", e);
    }
}

export async function getDailyLeaderboard(dateId) {
    if (!db) return [];
    try {
        const leaderboardRef = collection(db, `daily_leaderboard/${dateId}/entries`);
        const q = query(leaderboardRef, orderBy('score', 'desc'), limit(10));

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Leaderboard fetch error:", e);
        return [];
    }
}
