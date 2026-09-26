import { supabase } from '../lib/supabase';
import {
    applyLocalProgress,
    collectLocalProgress,
    mergeProgress,
    preparePush,
    rowToSnapshot,
    snapshotToRow,
} from './progressSync';

export async function fetchPlayerProgress(userId) {
    const { data, error } = await supabase
        .from('player_progress')
        .select('user_id, display_name, avatar, profile, stats, gallery, ranked, shop, tournaments, achievements, daily, stripe_entitlements, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    return rowToSnapshot(data);
}

export async function savePlayerProgress(userId, snapshot) {
    const row = snapshotToRow(userId, snapshot);
    const { error } = await supabase
        .from('player_progress')
        .upsert(row, { onConflict: 'user_id' });
    if (error) throw error;

    const { error: userError } = await supabase.from('users').upsert({
        id: userId,
        display_name: row.display_name,
        avatar: row.avatar,
        last_seen_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (userError) {
        console.warn('Cloud profile row was not updated:', userError.message);
    }
}

export async function hydrateAccountProgress(userId) {
    const local = collectLocalProgress();
    const remote = await fetchPlayerProgress(userId);
    const decision = mergeProgress(local, remote);
    if (decision.shouldUpload) {
        await savePlayerProgress(userId, decision.snapshot);
    }
    applyLocalProgress(decision.snapshot);
    return decision;
}

export async function pushAccountProgress(userId) {
    const remote = await fetchPlayerProgress(userId);
    const local = collectLocalProgress();
    const snapshot = preparePush(local, remote);
    await savePlayerProgress(userId, snapshot);
    const applied = {
        ...snapshot,
        stripeEntitlements: remote?.stripeEntitlements || snapshot.stripeEntitlements,
    };
    // Edit Profile clears the local profile on purpose. Do not write it back mid-edit.
    if (!local.profile?.name) applied.profile = null;
    applyLocalProgress(applied);
    return applied;
}
