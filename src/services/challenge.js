import { doc, setDoc, getDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Generate a short unique ID for challenges
function generateChallengeId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Create a new challenge after completing a round
 * @param {Object} assets - The left and right assets used
 * @param {number} creatorScore - Creator's score
 * @param {string} creatorSubmission - Creator's answer
 * @param {Object} creatorProfile - Creator's profile (name, avatar)
 * @returns {string} Challenge ID for sharing
 */
export async function createChallenge(assets, creatorScore, creatorSubmission, creatorProfile) {
    if (!db) {
        console.warn("Firebase not available, challenge not saved to cloud");
        return null;
    }

    const challengeId = generateChallengeId();

    try {
        const challengeRef = doc(db, 'challenges', challengeId);
        await setDoc(challengeRef, {
            assets: {
                left: { id: assets.left.id, label: assets.left.label, url: assets.left.url },
                right: { id: assets.right.id, label: assets.right.label, url: assets.right.url }
            },
            creator: {
                name: creatorProfile?.name || 'Anonymous',
                avatar: creatorProfile?.avatar || '👤',
                score: creatorScore,
                submission: creatorSubmission
            },
            challenger: null, // Will be filled when someone accepts
            createdAt: serverTimestamp(),
            status: 'pending' // pending, completed
        });

        return challengeId;
    } catch (e) {
        console.error("Error creating challenge:", e);
        return null;
    }
}

/**
 * Retrieve a challenge by ID
 * @param {string} challengeId 
 * @returns {Object|null} Challenge data or null
 */
export async function getChallenge(challengeId) {
    if (!db || !challengeId) return null;

    try {
        const challengeRef = doc(db, 'challenges', challengeId);
        const snapshot = await getDoc(challengeRef);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() };
        }
        return null;
    } catch (e) {
        console.error("Error fetching challenge:", e);
        return null;
    }
}

/**
 * Submit challenger's result to complete the challenge
 * @param {string} challengeId 
 * @param {number} score 
 * @param {string} submission 
 * @param {Object} challengerProfile 
 */
export async function submitChallengerResult(challengeId, score, submission, challengerProfile) {
    if (!db || !challengeId) return false;

    try {
        const challengeRef = doc(db, 'challenges', challengeId);
        await updateDoc(challengeRef, {
            challenger: {
                name: challengerProfile?.name || 'Challenger',
                avatar: challengerProfile?.avatar || '👤',
                score: score,
                submission: submission
            },
            status: 'completed',
            completedAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error("Error submitting challenge result:", e);
        return false;
    }
}

/**
 * Generate a shareable challenge URL
 * @param {string} challengeId 
 * @returns {string} Full URL with challenge parameter
 */
export function getChallengeUrl(challengeId) {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?challenge=${challengeId}`;
}
