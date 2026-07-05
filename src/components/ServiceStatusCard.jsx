import React from 'react';
import { CheckCircle2, AlertTriangle, Sparkles, DatabaseZap } from 'lucide-react';
import { getRuntimeStatus } from '../lib/runtimeConfig';

function StatusPill({ ok, label, detail }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
                {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertTriangle className="h-4 w-4 text-amber-400" />}
                <span>{label}</span>
            </div>
            <div className="mt-1 text-xs text-white/50">{detail}</div>
        </div>
    );
}

export function ServiceStatusCard({ className = '' }) {
    const status = getRuntimeStatus();
    const needsBackendSetup = !status.backendEnabled;

    return (
        <div className={`rounded-2xl border border-white/10 bg-black/20 p-4 text-left ${className}`.trim()}>
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
                <DatabaseZap className="h-4 w-4" />
                Runtime Status
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                <StatusPill
                    ok={status.geminiEnabled}
                    label="AI services"
                    detail={status.geminiEnabled ? 'Gemini configured: live scoring and generated fusion images enabled.' : 'Gemini missing: mock scoring and curated fusion images will be used.'}
                />
                <StatusPill
                    ok={status.backendEnabled}
                    label="Realtime backend"
                    detail={status.backendEnabled ? 'Supabase configured: multiplayer rooms and persistent judging available.' : 'Supabase missing: solo mode works, but multiplayer and durable judging are limited.'}
                />
            </div>
            {needsBackendSetup && (
                <div className="mt-3 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                    Launch gate: apply <code className="text-amber-50">supabase/schema.sql</code>, set{' '}
                    <code className="text-amber-50">VITE_SUPABASE_*</code> on Vercel, deploy edge functions.
                    See <code className="text-amber-50">SETUP_BACKEND.md</code> or run{' '}
                    <code className="text-amber-50">npm run setup:backend</code>.
                </div>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-white/45">
                <Sparkles className="h-3.5 w-3.5" />
                Best production experience: configure both Gemini and Supabase secrets.
            </div>
        </div>
    );
}
