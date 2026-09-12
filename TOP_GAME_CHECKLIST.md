# Top-game checklist

Engineering vs owner-held work for the soft-launch “feels like a top game” bar. No Phase 9 accounts, no Stripe, no fake cloud Labs.

## Engineering — done in this sprint

| Item | Where |
|---|---|
| Capacitor iOS shell (`com.hondoentertainment.vennwithfriends`) | `capacitor.config.json`, `npm run ios:sync` |
| Safe-area, status bar, keyboard, external-link policy | `src/lib/nativeShell.js`, existing `env(safe-area-inset-*)` CSS |
| 1024 icon + splash kit | `store/ios/` (`npm run ios:assets`) |
| Store listing + owner archive steps | `store/STORE_LISTING.md`, `store/OWNER_STEPS.md` |
| Public privacy / terms | `/privacy.html`, `/terms.html`, in-app footer |
| Haptics on Lock it in + score reveal (Vibration API + Capacitor) | `src/lib/haptics.js` |
| Obvious mute | Header + round speaker control (`MuteToggle`) |
| First-session celebration timing + A2HS tip | `SessionSummary`, `PWAInstallBanner` |
| Today's pair as cold-start hero | Create Profile, lobby, friends panel, daily-complete card |
| Labs stay buried + labeled device-only | Lobby Experimental Labs |
| PWA manifest + apple-touch + iOS Home Screen tip | `scripts/generate-manifest.mjs`, `index.html` |
| Friend-judge / daily OG paths unchanged | `og-tags`, `createJudgeShareLinks`, `og-image.png` |
| Waiting-room Start clarity | `RoomLobby` |
| Docs + roadmap truth | `ROADMAP.md`, `README.md`, `MOBILE_DEPLOYMENT.md` |

## Engineering — already on main (do not regress)

- Redesign v2 (#13), mobile alignment (#14), ease-of-use (#16), wrap/share/gallery (#17)
- Hosted rooms, friend judge, personal gallery, daily ritual, launch gate

## Owner-held (not blocked on code)

| Item | Why it is owner-held |
|---|---|
| **PostHog** (`VITE_POSTHOG_KEY` on Vercel) | Product analytics sink; code already calls `trackEvent` |
| **Sentry** (`VITE_SENTRY_DSN`, optional upload token) | Crash reporting; `reportAppError` already bridges |
| **Pexels / Giphy** edge secrets | Richer stock/meme lookup; curated fallbacks ship without keys |
| **Apple Developer Program + signing** | Certificates, Team, TestFlight — [store/OWNER_STEPS.md](store/OWNER_STEPS.md) |
| **App Store screenshots + review** | Capture on a real device; listing draft is ready |
| **5–10 playtesters** | TestFlight or the live web URL; watch first-session → share → room |
| **Digital Asset Links fingerprint** | Needed only if you ship a Play TWA |

Do not invent or commit API keys. Soft launch is valid without PostHog/Sentry/Pexels/Giphy.

## Explicitly out of scope

- Phase 9 cloud accounts
- Stripe / IAP
- Public community gallery or Party Mode UI
- SwiftUI rewrite
- Advertising Labs as real cloud features
