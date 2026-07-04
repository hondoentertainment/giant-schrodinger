import React from 'react';
import { GameScreenShell } from '../../components/GameScreenShell';
import { Shield } from 'lucide-react';

export function PrivacyPolicy({ onBack }) {
    return (
        <GameScreenShell onBack={onBack} title="Privacy Policy" icon={Shield} backLabel="Back">
            <div className="space-y-4 text-sm text-white/75 leading-relaxed">
                <p><strong className="text-white">Last updated:</strong> July 4, 2026</p>
                <p>
                    Venn with Friends stores gameplay progress locally in your browser (profile, gallery,
                    achievements, and settings). When you enable Supabase-backed features, shared rounds,
                    judgements, multiplayer rooms, and content reports may be stored in our database.
                </p>
                <p>
                    Optional telemetry (Sentry, PostHog) and analytics events help us monitor crashes and
                    product usage. You can inspect local telemetry via <code className="text-white/90">window.__VWF_TELEMETRY__</code>.
                </p>
                <p>
                    AI scoring may send your submission text and prompt labels to Google Gemini through our
                    server-side edge function when configured. Media lookups may call Pexels and Giphy through
                    Supabase edge functions.
                </p>
                <p>
                    Custom uploads are stored in Supabase Storage when backend services are enabled. Do not upload
                    content you do not have rights to share.
                </p>
                <p>
                    Contact: support@hondoentertainment.com for deletion requests related to hosted data.
                </p>
            </div>
        </GameScreenShell>
    );
}

export function TermsOfUse({ onBack }) {
    return (
        <GameScreenShell onBack={onBack} title="Terms of Use" icon={Shield} backLabel="Back">
            <div className="space-y-4 text-sm text-white/75 leading-relaxed">
                <p><strong className="text-white">Last updated:</strong> July 4, 2026</p>
                <p>
                    By using Venn with Friends you agree to play respectfully and not submit illegal, harassing,
                    or infringing content. User submissions remain your responsibility.
                </p>
                <p>
                    Ranked, shop, and tournament modes may run in local preview until cloud sync is enabled.
                    Scores and purchases in preview mode are device-local only.
                </p>
                <p>
                    We may rate-limit or remove content reported through the in-app report flow. Abuse of AI,
                    media, or multiplayer systems may result in access restrictions on hosted services.
                </p>
                <p>
                    The game is provided as-is without warranties. Service availability depends on third-party
                    providers including Vercel, Supabase, Google Gemini, Pexels, Giphy, and YouTube embeds.
                </p>
            </div>
        </GameScreenShell>
    );
}
