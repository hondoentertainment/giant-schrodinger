#!/usr/bin/env node
/**
 * Verify required Supabase RPCs are deployed and reachable.
 * Usage: node scripts/check-supabase-rpcs.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { loadEnvFiles } from './load-env.mjs';

loadEnvFiles();

const url = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

/** RPCs listed in PRODUCTION_REHEARSAL.md launch gate */
const REQUIRED_RPCS = [
    'create_room_session',
    'join_room_session',
    'create_shared_round',
    'get_shared_round_by_token',
    'submit_round_judgement',
    'cast_room_vote',
    'finalize_room_votes',
];

/**
 * Probes that should fail with a business/validation error when the RPC exists,
 * not with "function not found".
 */
const PROBES = {
    create_room_session: { p_host_name: '' },
    join_room_session: { p_code: '0000', p_player_name: '' },
    create_shared_round: {
        p_assets: {},
        p_submission: '',
    },
    get_shared_round_by_token: {
        p_public_token: 'invalid-token',
    },
    submit_round_judgement: {
        p_public_token: 'invalid-token',
        p_judge_name: '',
        p_score: 0,
        p_relevance: '',
        p_commentary: '',
    },
    cast_room_vote: {
        p_room_id: '00000000-0000-0000-0000-000000000000',
        p_round_number: 1,
        p_player_token: 'invalid',
        p_submission_id: '00000000-0000-0000-0000-000000000000',
    },
    finalize_room_votes: {
        p_room_id: '00000000-0000-0000-0000-000000000000',
        p_round_number: 1,
        p_host_token: 'invalid',
    },
};

function isMissingRpcError(error) {
    if (!error) return false;
    const msg = `${error.message || ''} ${error.details || ''}`.toLowerCase();
    if (error.code === 'PGRST202') return true;
    return msg.includes('could not find the function') || msg.includes('no matches were found in the schema cache');
}

async function probeRpc(supabase, name) {
    const args = PROBES[name] ?? {};
    const { error } = await supabase.rpc(name, args);
    if (!error) return { ok: true, detail: 'responded without error' };
    if (isMissingRpcError(error)) {
        return { ok: false, detail: error.message || String(error) };
    }
    return { ok: true, detail: error.message || 'validation error (RPC reachable)' };
}

async function main() {
    console.log('Supabase RPC health check\n');

    if (!url || !anonKey || url.includes('your-') || anonKey.includes('your-')) {
        console.log('○ Skipped — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
        process.exit(0);
    }

    const supabase = createClient(url, anonKey);
    let failures = 0;

    for (const name of REQUIRED_RPCS) {
        try {
            const result = await probeRpc(supabase, name);
            if (result.ok) {
                console.log(`✓ ${name} — ${result.detail}`);
            } else {
                console.log(`✗ ${name} — missing or not exposed (${result.detail})`);
                failures += 1;
            }
        } catch (err) {
            console.log(`✗ ${name} — request failed (${err.message})`);
            failures += 1;
        }
    }

    console.log(failures ? '\nApply supabase/schema.sql in the Supabase SQL editor, then retry.' : '\nAll required RPCs are reachable.');
    process.exit(failures ? 1 : 0);
}

main();
