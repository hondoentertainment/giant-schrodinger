import { loadJSON, saveJSON } from '../lib/storage';
import { suppressProgressDirty } from '../lib/progressEvents';

export const GALLERY_SYNC_LIMIT = 50;

const KEYS = {
    profile: 'vwf_user',
    stats: 'vwf_stats',
    gallery: 'venn_collisions',
    ranked: 'vwf_ranked',
    coins: 'vwf_coins',
    owned: 'vwf_shop_owned',
    equipped: 'vwf_shop_equipped',
    battlePass: 'vwf_battle_pass',
    tournaments: 'vwf_tournaments',
    achievements: 'vwf_achievements',
    daily: 'vwf_daily',
    grantsApplied: 'vwf_stripe_grants_applied',
};

function read(key, fallback) {
    return loadJSON(key, fallback);
}

function write(key, value) {
    if (value == null) {
        localStorage.removeItem(key);
        return;
    }
    saveJSON(key, value);
}

function slimString(value) {
    if (typeof value !== 'string') return value;
    if (value.startsWith('data:') || value.length > 4000) return undefined;
    return value;
}

export function slimGallery(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.slice(0, GALLERY_SYNC_LIMIT).map((entry) => {
        if (!entry || typeof entry !== 'object') return entry;
        const next = { ...entry };
        if (slimString(next.imageUrl) === undefined) delete next.imageUrl;
        if (slimString(next.fallbackImageUrl) === undefined) delete next.fallbackImageUrl;
        return next;
    });
}

export function emptySnapshot() {
    return {
        profile: null,
        stats: null,
        gallery: [],
        ranked: null,
        shop: {
            coins: { balance: 0, transactions: [] },
            owned: [],
            equipped: {},
            battlePass: null,
            appliedStripeGrantIds: [],
        },
        tournaments: [],
        achievements: null,
        daily: null,
        stripeEntitlements: { battlePass: false, grants: [] },
    };
}

export function collectLocalProgress() {
    const coins = read(KEYS.coins, { balance: 0, transactions: [] });
    return {
        profile: read(KEYS.profile, null),
        stats: read(KEYS.stats, null),
        gallery: slimGallery(read(KEYS.gallery, [])),
        ranked: read(KEYS.ranked, null),
        shop: {
            coins,
            owned: read(KEYS.owned, []),
            equipped: read(KEYS.equipped, {}),
            battlePass: read(KEYS.battlePass, null),
            appliedStripeGrantIds: read(KEYS.grantsApplied, []),
        },
        tournaments: read(KEYS.tournaments, []),
        achievements: read(KEYS.achievements, null),
        daily: read(KEYS.daily, null),
        stripeEntitlements: { battlePass: false, grants: [] },
    };
}

export function applyLocalProgress(snapshot) {
    const next = snapshot || emptySnapshot();
    suppressProgressDirty(() => {
        write(KEYS.profile, next.profile);
        write(KEYS.stats, next.stats);
        write(KEYS.gallery, Array.isArray(next.gallery) ? next.gallery : []);
        write(KEYS.ranked, next.ranked);
        write(KEYS.coins, next.shop?.coins || { balance: 0, transactions: [] });
        write(KEYS.owned, next.shop?.owned || []);
        write(KEYS.equipped, next.shop?.equipped || {});
        write(KEYS.battlePass, next.shop?.battlePass || null);
        write(KEYS.grantsApplied, next.shop?.appliedStripeGrantIds || []);
        write(KEYS.tournaments, Array.isArray(next.tournaments) ? next.tournaments : []);
        write(KEYS.achievements, next.achievements);
        write(KEYS.daily, next.daily);
    });
}

function hasProfile(profile) {
    return Boolean(profile?.name && String(profile.name).trim());
}

function hasStats(stats) {
    if (!stats) return false;
    return (Number(stats.totalRounds) || 0) > 0 || (Number(stats.currentStreak) || 0) > 0;
}

function hasGallery(gallery) {
    return Array.isArray(gallery) && gallery.length > 0;
}

function hasRanked(ranked) {
    if (!ranked) return false;
    return (Number(ranked.gamesPlayed) || 0) > 0 || (Number(ranked.wins) || 0) > 0 || (Number(ranked.losses) || 0) > 0;
}

function hasShop(shop) {
    if (!shop) return false;
    const balance = Number(shop.coins?.balance) || 0;
    const owned = Array.isArray(shop.owned) ? shop.owned.length : 0;
    const xp = Number(shop.battlePass?.xp) || 0;
    return balance > 0 || owned > 0 || xp > 0 || Boolean(shop.battlePass?.premium);
}

function hasList(value) {
    return Array.isArray(value) && value.length > 0;
}

function hasAchievements(value) {
    if (!value) return false;
    const unlocked = value.unlocked;
    return Boolean(unlocked && Object.keys(unlocked).length > 0);
}

function hasDaily(value) {
    return Boolean(value && (value.date || (Array.isArray(value.history) && value.history.length > 0)));
}

/**
 * Fold Stripe grant ids into shop state.
 * alreadyAppliedInShop: the coin balance already includes those grants (cloud row).
 */
export function reconcileShopWithGrants(shop, entitlements, { alreadyAppliedInShop = false } = {}) {
    const base = shop || {
        coins: { balance: 0, transactions: [] },
        owned: [],
        equipped: {},
        battlePass: null,
        appliedStripeGrantIds: [],
    };
    const applied = new Set(base.appliedStripeGrantIds || []);
    const grants = Array.isArray(entitlements?.grants) ? entitlements.grants : [];
    let balance = Number(base.coins?.balance) || 0;
    const transactions = Array.isArray(base.coins?.transactions) ? [...base.coins.transactions] : [];
    let premium = Boolean(base.battlePass?.premium);
    if (entitlements?.battlePass) premium = true;

    for (const grant of grants) {
        if (!grant?.id || applied.has(grant.id)) continue;
        if (!alreadyAppliedInShop && grant.kind === 'coins') {
            balance += Number(grant.coins) || 0;
            transactions.unshift({
                amount: grant.coins,
                reason: `stripe:${grant.sku || grant.id}`,
                timestamp: grant.at || new Date().toISOString(),
            });
        }
        if (grant.kind === 'battle_pass') premium = true;
        applied.add(grant.id);
    }

    let battlePass = base.battlePass;
    if (battlePass) {
        battlePass = { ...battlePass, premium: premium || Boolean(battlePass.premium) };
    } else if (premium) {
        battlePass = { season: 1, xp: 0, claimedFree: [], claimedPremium: [], premium: true };
    }

    return {
        coins: { balance, transactions: transactions.slice(0, 50) },
        owned: base.owned || [],
        equipped: base.equipped || {},
        battlePass,
        appliedStripeGrantIds: [...applied],
    };
}

function pickDomain(localValue, remoteValue, hasValue) {
    const remoteHas = hasValue(remoteValue);
    const localHas = hasValue(localValue);
    if (remoteHas) return { value: remoteValue, fromLocal: false, conflict: localHas };
    if (localHas) return { value: localValue, fromLocal: true, conflict: false };
    return { value: remoteValue ?? localValue ?? null, fromLocal: false, conflict: false };
}

/**
 * Sign-in merge.
 * Cloud wins when a domain exists on both sides.
 * Empty cloud domains keep local data and are uploaded.
 * stripeEntitlements always come from the server.
 */
export function mergeProgress(localInput, remoteInput) {
    const local = localInput || emptySnapshot();
    const remote = remoteInput;

    if (!remote) {
        const blank = !hasProfile(local.profile)
            && !hasStats(local.stats)
            && !hasGallery(local.gallery)
            && !hasRanked(local.ranked)
            && !hasShop(local.shop)
            && !hasList(local.tournaments)
            && !hasAchievements(local.achievements)
            && !hasDaily(local.daily);
        return {
            snapshot: local,
            source: blank ? 'empty' : 'local-upload',
            shouldUpload: !blank,
        };
    }

    const profile = pickDomain(local.profile, remote.profile, hasProfile);
    const stats = pickDomain(local.stats, remote.stats, hasStats);
    const gallery = pickDomain(local.gallery, remote.gallery, hasGallery);
    const ranked = pickDomain(local.ranked, remote.ranked, hasRanked);
    const tournaments = pickDomain(local.tournaments, remote.tournaments, hasList);
    const achievements = pickDomain(local.achievements, remote.achievements, hasAchievements);
    const daily = pickDomain(local.daily, remote.daily, hasDaily);
    const shopPick = pickDomain(local.shop, remote.shop, hasShop);
    const entitlements = remote.stripeEntitlements || { battlePass: false, grants: [] };
    const shop = reconcileShopWithGrants(shopPick.value, entitlements, {
        alreadyAppliedInShop: !shopPick.fromLocal,
    });

    const uploadedLocal = [profile, stats, gallery, ranked, tournaments, achievements, daily, shopPick]
        .some((domain) => domain.fromLocal);
    const conflict = [profile, stats, gallery, ranked, tournaments, achievements, daily, shopPick]
        .some((domain) => domain.conflict);

    let source = 'empty';
    if (conflict) source = 'cloud';
    else if (uploadedLocal) source = 'local-upload';
    else if (remote) source = 'cloud';

    return {
        snapshot: {
            profile: profile.value,
            stats: stats.value,
            gallery: gallery.value || [],
            ranked: ranked.value,
            shop,
            tournaments: tournaments.value || [],
            achievements: achievements.value,
            daily: daily.value,
            stripeEntitlements: entitlements,
        },
        source,
        shouldUpload: uploadedLocal,
    };
}

/**
 * While a session is active, this device's snapshot is pushed.
 * Missing local profile name does not erase a cloud name.
 * Unseen Stripe grants are applied once onto the local coin balance.
 */
export function preparePush(localInput, remoteInput) {
    const local = localInput || emptySnapshot();
    const remote = remoteInput;
    const entitlements = remote?.stripeEntitlements || { battlePass: false, grants: [] };
    const profile = hasProfile(local.profile)
        ? local.profile
        : (remote?.profile || local.profile);
    const shop = reconcileShopWithGrants(local.shop, entitlements, { alreadyAppliedInShop: false });
    return {
        ...local,
        profile,
        shop,
        stripeEntitlements: entitlements,
    };
}

export function snapshotToRow(userId, snapshot) {
    const profile = snapshot?.profile || {};
    return {
        user_id: userId,
        display_name: profile.name || 'Player',
        avatar: profile.avatar || '🎯',
        profile,
        stats: snapshot?.stats || {},
        gallery: snapshot?.gallery || [],
        ranked: snapshot?.ranked || {},
        shop: snapshot?.shop || {},
        tournaments: snapshot?.tournaments || [],
        achievements: snapshot?.achievements || {},
        daily: snapshot?.daily || {},
    };
}

export function rowToSnapshot(row) {
    if (!row) return null;
    const profile = row.profile?.name
        ? row.profile
        : null;
    return {
        profile,
        stats: row.stats && Object.keys(row.stats || {}).length ? row.stats : null,
        gallery: Array.isArray(row.gallery) ? row.gallery : [],
        ranked: row.ranked && (row.ranked.gamesPlayed || row.ranked.wins || row.ranked.losses) ? row.ranked : null,
        shop: row.shop || {},
        tournaments: Array.isArray(row.tournaments) ? row.tournaments : [],
        achievements: row.achievements && Object.keys(row.achievements || {}).length ? row.achievements : null,
        daily: row.daily && Object.keys(row.daily || {}).length ? row.daily : null,
        stripeEntitlements: row.stripe_entitlements || { battlePass: false, grants: [] },
        updatedAt: row.updated_at || null,
    };
}
