const CHAINS_KEY = 'vwf_chains';
const GROUPS_KEY = 'vwf_weekly_groups';
const MAILBOX_KEY = 'vwf_mailbox';

const MAILBOX_EXPIRY_DAYS = 7;

function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

function getWeekKey() {
    const now = new Date();
    const year = now.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const week = Math.ceil(((now - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
}

// ============================================================
// Internal storage helpers
// ============================================================

function loadChains() {
    try {
        const stored = localStorage.getItem(CHAINS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load chains:', error);
        return [];
    }
}

function saveChains(chains) {
    try {
        localStorage.setItem(CHAINS_KEY, JSON.stringify(chains));
        return true;
    } catch (error) {
        console.warn('Failed to save chains:', error);
        return false;
    }
}

function loadGroups() {
    try {
        const stored = localStorage.getItem(GROUPS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load groups:', error);
        return [];
    }
}

function saveGroups(groups) {
    try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
        return true;
    } catch (error) {
        console.warn('Failed to save groups:', error);
        return false;
    }
}

function loadMailbox() {
    try {
        const stored = localStorage.getItem(MAILBOX_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Failed to load mailbox:', error);
        return [];
    }
}

function saveMailbox(mailbox) {
    try {
        localStorage.setItem(MAILBOX_KEY, JSON.stringify(mailbox));
        return true;
    } catch (error) {
        console.warn('Failed to save mailbox:', error);
        return false;
    }
}

// ============================================================
// Challenge Chains — circular A→B→C→A
// ============================================================

/**
 * Creates a circular challenge chain where each player challenges the next.
 * The last player loops back to the first (A→B→C→A).
 * @param {string[]} players - Array of player names (minimum 2)
 * @param {number} promptCount - Number of prompts each player must answer
 * @returns {Object|null} The created chain object, or null on failure
 */
export function createChallengeChain(players, promptCount) {
    try {
        if (!players || players.length < 2) {
            console.warn('Challenge chain requires at least 2 players');
            return null;
        }

        const prompts = [];
        for (let i = 0; i < promptCount; i++) {
            prompts.push({ left: null, right: null });
        }

        const scores = {};
        players.forEach(player => {
            scores[player] = [];
        });

        const chain = {
            id: generateId(),
            players,
            promptCount,
            prompts,
            scores,
            status: 'active',
            createdAt: new Date().toISOString(),
        };

        const chains = loadChains();
        chains.unshift(chain);
        saveChains(chains);

        return chain;
    } catch (error) {
        console.warn('Failed to create challenge chain:', error);
        return null;
    }
}

/**
 * Returns all challenge chains.
 * @returns {Array} Array of chain objects
 */
export function getChallengeChains() {
    return loadChains();
}

/**
 * Records a score for a player in a chain.
 * Automatically marks the chain as completed when all players have submitted
 * all their scores.
 * @param {string} chainId - The chain ID
 * @param {string} playerName - The player submitting
 * @param {number} score - The score to record
 * @returns {Object|null} The updated chain, or null on failure
 */
export function submitChainScore(chainId, playerName, score) {
    try {
        const chains = loadChains();
        const index = chains.findIndex(c => c.id === chainId);
        if (index === -1) return null;

        const chain = chains[index];
        if (!chain.scores[playerName]) {
            chain.scores[playerName] = [];
        }

        chain.scores[playerName].push(score);

        // Check if all players have submitted all scores
        const allDone = chain.players.every(
            p => (chain.scores[p] || []).length >= chain.promptCount
        );
        if (allDone) {
            chain.status = 'completed';
        }

        chains[index] = chain;
        saveChains(chains);

        return chain;
    } catch (error) {
        console.warn('Failed to submit chain score:', error);
        return null;
    }
}

/**
 * Returns chain status and standings sorted by total score descending.
 * @param {string} chainId - The chain ID
 * @returns {Object|null} { chain, standings: [{ player, totalScore, scores }] }
 */
export function getChainResults(chainId) {
    try {
        const chains = loadChains();
        const chain = chains.find(c => c.id === chainId);
        if (!chain) return null;

        const standings = chain.players
            .map(player => {
                const playerScores = chain.scores[player] || [];
                const totalScore = playerScores.reduce((sum, s) => sum + s, 0);
                return { player, totalScore, scores: playerScores };
            })
            .sort((a, b) => b.totalScore - a.totalScore);

        return { chain, standings };
    } catch (error) {
        console.warn('Failed to get chain results:', error);
        return null;
    }
}

// ============================================================
// Weekly Group Challenges
// ============================================================

/**
 * Creates a weekly group challenge.
 * @param {Object} params
 * @param {string} params.name - Group display name
 * @param {string[]} params.members - Array of member names
 * @returns {Object|null} The created group object, or null on failure
 */
export function createWeeklyGroup({ name, members }) {
    try {
        if (!name || !members || members.length === 0) {
            console.warn('Weekly group requires a name and at least one member');
            return null;
        }

        const scores = {};
        members.forEach(member => {
            scores[member] = [];
        });

        const group = {
            id: generateId(),
            name,
            members,
            weekKey: getWeekKey(),
            prompts: [],
            scores,
            createdAt: new Date().toISOString(),
        };

        const groups = loadGroups();
        groups.unshift(group);
        saveGroups(groups);

        return group;
    } catch (error) {
        console.warn('Failed to create weekly group:', error);
        return null;
    }
}

/**
 * Returns all weekly groups.
 * @returns {Array} Array of group objects
 */
export function getWeeklyGroups() {
    return loadGroups();
}

/**
 * Records a score for a player in a group challenge.
 * @param {string} groupId - The group ID
 * @param {string} playerName - The player submitting
 * @param {number} promptIndex - Index of the prompt being answered
 * @param {number} score - The score to record
 * @returns {Object|null} The updated group, or null on failure
 */
export function submitGroupScore(groupId, playerName, promptIndex, score) {
    try {
        const groups = loadGroups();
        const index = groups.findIndex(g => g.id === groupId);
        if (index === -1) return null;

        const group = groups[index];
        if (!group.scores[playerName]) {
            group.scores[playerName] = [];
        }

        group.scores[playerName].push({
            promptIndex,
            score,
            timestamp: new Date().toISOString(),
        });

        groups[index] = group;
        saveGroups(groups);

        return group;
    } catch (error) {
        console.warn('Failed to submit group score:', error);
        return null;
    }
}

/**
 * Returns standings for a group in the current week, sorted by total score descending.
 * Only includes score entries matching the current week key.
 * @param {string} groupId - The group ID
 * @returns {Object|null} { group, standings: [{ player, totalScore, entries }] }
 */
export function getGroupStandings(groupId) {
    try {
        const groups = loadGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return null;

        const currentWeek = getWeekKey();
        const isCurrentWeek = group.weekKey === currentWeek;

        const standings = group.members
            .map(player => {
                const entries = group.scores[player] || [];
                // If the group is for the current week, include all entries;
                // otherwise the group is historical and we still show all entries.
                const totalScore = entries.reduce((sum, e) => sum + e.score, 0);
                return { player, totalScore, entries };
            })
            .sort((a, b) => b.totalScore - a.totalScore);

        return { group, standings, isCurrentWeek };
    } catch (error) {
        console.warn('Failed to get group standings:', error);
        return null;
    }
}

// ============================================================
// Mailbox — pending challenges awaiting response
// ============================================================

/**
 * Returns all mailbox items.
 * @returns {Array} Array of mailbox item objects
 */
export function getMailbox() {
    return loadMailbox();
}

/**
 * Adds an incoming challenge to the mailbox.
 * @param {Object} challenge - { fromPlayer, challenge: { left, right, submission, score } }
 * @returns {Object|null} The created mailbox item, or null on failure
 */
export function addToMailbox(challenge) {
    try {
        const item = {
            id: generateId(),
            fromPlayer: challenge.fromPlayer,
            challenge: challenge.challenge,
            receivedAt: new Date().toISOString(),
            status: 'pending',
            myScore: null,
        };

        const mailbox = loadMailbox();
        mailbox.unshift(item);
        saveMailbox(mailbox);

        return item;
    } catch (error) {
        console.warn('Failed to add to mailbox:', error);
        return null;
    }
}

/**
 * Marks a mailbox item as completed with the player's score.
 * @param {string} itemId - The mailbox item ID
 * @param {number} score - The player's score for this challenge
 * @returns {Object|null} The updated mailbox item, or null on failure
 */
export function resolveMailboxItem(itemId, score) {
    try {
        const mailbox = loadMailbox();
        const index = mailbox.findIndex(m => m.id === itemId);
        if (index === -1) return null;

        mailbox[index] = {
            ...mailbox[index],
            status: 'completed',
            myScore: score,
        };

        saveMailbox(mailbox);
        return mailbox[index];
    } catch (error) {
        console.warn('Failed to resolve mailbox item:', error);
        return null;
    }
}

/**
 * Removes all mailbox items older than 7 days.
 * @returns {number} The number of items removed
 */
export function clearExpiredMailbox() {
    try {
        const mailbox = loadMailbox();
        const cutoff = Date.now() - MAILBOX_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const filtered = mailbox.filter(item => new Date(item.receivedAt).getTime() > cutoff);
        const removed = mailbox.length - filtered.length;

        saveMailbox(filtered);
        return removed;
    } catch (error) {
        console.warn('Failed to clear expired mailbox items:', error);
        return 0;
    }
}
