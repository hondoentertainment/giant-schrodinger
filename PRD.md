## Venn with Friends PRD

### 1. Product Summary

Venn with Friends is a creative party game where players are shown two media prompts and write one phrase that connects them. The current product already supports solo play, asynchronous friend judging, and realtime multiplayer with optional AI scoring.

The app's strongest differentiator is that it turns a simple prompt game into a replayable creative system:

- themed prompt pools
- image, video, and audio modes
- session modifiers and daily challenge structure
- AI scoring and fusion-image generation with graceful fallbacks
- persistent progression, unlocks, and gallery history

This PRD replaces the current doc gap between "what the app claims to be" and "what the code actually does."

### 2. Current State Review

#### What is implemented now

- Profile creation with avatar, theme, scoring mode, media mode, and optional custom image packs
- Solo sessions with 3, 5, or 7 rounds
- Session arcs with special round modifiers: Speed Round, Double or Nothing, Final Showdown
- Daily challenge flow
- AI judging via Gemini with mock fallback when no API key is present
- AI fusion image generation with curated fallback imagery
- Human/manual judging path in solo mode
- Shareable friend-judging links
- Gallery of saved creations with friend feedback
- Unlock progression tied to rounds played and streaks
- Realtime multiplayer rooms via Supabase
- Multiplayer reveal flows, round transitions, and final standings UI
- Automated tests plus production build support

#### What is working but environment-dependent

- AI judging and AI image generation require `VITE_GEMINI_API_KEY`
- Multiplayer and backend-persisted friend judging require Supabase credentials
- Without those keys, the app still works in a mostly complete solo/mock mode

#### Current strengths

- The core solo loop is already richer than a prototype
- The UI and interaction model feel productized, not just demo-level
- The app has solid fallback behavior when AI or backend services are unavailable
- There is already enough surface area for retention features: streaks, unlocks, gallery, daily challenge

#### Current product and engineering gaps

- README and testing docs need to stay aligned with the current shipped-vs-live-ready distinction
- Multiplayer authority now depends on the secure Supabase RPC path, so hosted verification matters more than local UI proof
- The product now has a clearer progression from first solo play into friend judging, gallery, achievements, daily completion, and weekly-event retention
- Deployment and operational docs are still ahead of actual live-product proof

#### Verification snapshot

- Local validation on March 14, 2026:
  - `npm run lint`: passes
  - `npm run test`: passes
  - `npm run test:e2e:desktop`: passes
  - `npm run build`: passes
- Remaining gap:
  - Hosted verification with real Supabase and optional Gemini secrets still needs to be completed end to end
  - Local code now includes reconnect resync, reveal-phase connection messaging, early friend-judge sharing, and expanded local e2e coverage, but those still need production rehearsal

### 3. Product Vision

Build Venn with Friends into a replayable social creativity game that is:

- instantly playable solo
- naturally shareable with friends
- reliable enough for live multiplayer sessions
- sticky enough to support daily return behavior

### 4. Users

#### Primary users

- Friends looking for a quick party-style creativity game
- Solo players who enjoy wordplay, absurd humor, and prompt games
- Small groups playing remotely over chat, text, or voice

#### Secondary users

- Creators who want funny shareable screenshots
- Streamers or hosts looking for lightweight audience-participation prompts

### 5. Product Goals

#### Goal 1: Make the solo loop excellent

A player should be able to open the app, create a profile, play multiple rounds, and feel rewarded even with no backend or API keys configured.

#### Goal 2: Make sharing a core growth loop

Every strong round should create a natural path to:

- share a result
- request judgement
- bring another person into a future session

#### Goal 3: Make multiplayer dependable

Realtime rooms should feel like a real product mode, not a promising experiment.

#### Goal 4: Turn replayability into retention

Daily challenge, unlocks, streaks, and gallery should lead to repeat sessions over weeks, not just one-time novelty.

### 6. Non-Goals for the Near Term

- Native mobile apps
- Large-scale public matchmaking
- User accounts with full cloud sync
- Complex moderation or UGC marketplaces
- Monetization systems before core retention and reliability are proven

### 7. Core Experience Requirements

#### Solo mode

- Players can complete a full session without external setup
- Prompt presentation is fast and visually clear
- Scoring is understandable whether AI or manual
- Results feel worth saving or sharing

#### Friend-judging mode

- Sharing a round is one action, not a workflow
- A friend can open the link and judge without onboarding friction
- Feedback should flow back into the original player's history where possible

#### Multiplayer mode

- Creating and joining a room should be fast and legible
- Everyone should see the same prompt set for a round
- Submission, reveal, scoring, and next-round transitions should stay synchronized
- Final standings should be trusted by all players

### 8. Next Steps Recommendation

#### Right now: next 2 weeks

- Deploy a live environment and complete the production rehearsal with real Supabase RPCs applied
- Verify manual-vote multiplayer live across two browsers, including join/rejoin during results and vote finalization
- Confirm telemetry capture for room creation, joins, vote finalization, and AI fallback events
- Document any hosted-only limitations that still appear during the live rehearsal

#### Near term: next 2 to 6 weeks

- Turn the hosted multiplayer rehearsal into a repeatable regression pass
- Improve room-state messaging and failure recovery for disconnects, late joins, and host exits
- Make gallery/history more useful as a replay and social-feedback surface
- Deploy a stable public environment and verify it end to end after each release candidate

#### Medium term: next 1 to 3 months

- Expand progression and daily challenge depth
- Introduce better personal stats and session history
- Add more themed content and prompt variety
- Strengthen shareability with better post-round assets and prompts

### 9. 10-Phase Feature Roadmap

#### Phase 1: Stabilization and Truthfulness

Goal: make the current app trustworthy.

Work:

- fix failing tests
- fix null-safe Gemini fallback behavior
- verify all main flows with and without external services
- document the true status of every major feature

Exit criteria:

- green automated suite
- green production build
- docs clearly separate mock-supported versus live-service features

#### Phase 2: Production Readiness

Goal: make the app launchable in a real hosted environment.

Work:

- complete deployment setup and live verification
- validate environment variable handling and empty-state UX
- harden error states for network, API, and backend failures
- add release checklist for shipping changes safely

Exit criteria:

- deployed environment is accessible
- core solo and share flows work on live site
- setup docs are accurate for a new contributor

#### Phase 3: Social Scoring Foundation

Goal: make non-AI judging a real system, not a loose concept.

Work:

- define product model for manual judge vs friend judge
- persist shared-round outcomes in a consistent backend model
- make judged results flow back into history and summaries
- clean up the split between local and backend judgement storage

Exit criteria:

- manual/friend scoring behavior is consistent and explainable
- judged rounds can be trusted as durable results

#### Phase 4: Multiplayer Authority

Goal: make multiplayer outcomes shared and deterministic.

Work:

- replace local-only multiplayer voting with synchronized backend voting
- ensure all clients converge on the same reveal and result state
- improve host actions, lock states, and late/join/leave behavior
- handle multiplayer edge cases around timing and reconnection

Exit criteria:

- multiplayer scoring is authoritative
- players in the same room see the same winners and standings

#### Phase 5: Share Loop Optimization

Goal: turn a fun round into a repeatable acquisition loop.

Work:

- improve share-for-judging prompts and timing
- add clearer invite CTAs after strong rounds and summaries
- improve copied-link messaging and success confirmation
- explore richer share cards or screenshot-friendly output

Exit criteria:

- sharing feels intentional and fast
- more completed rounds convert into invites or judgement requests

#### Phase 6: Gallery and Identity

Goal: make saved history feel like a personal creative archive.

Work:

- enrich gallery with better filters, highlights, and judged-round context
- improve profile progress surfaces: best scores, favorite themes, streak highlights
- add session recap improvements and personal milestones
- make notable creations easier to reshare

Exit criteria:

- returning users have meaningful history to browse
- profile progression feels more motivating than decorative

#### Phase 7: Retention Systems

Goal: create reasons to come back daily and weekly.

Work:

- expand daily challenge framing and rewards
- add clearer short-term and mid-term unlock goals
- introduce streak-recovery or streak-protection design if desired
- add weekly cadence features such as rotating featured themes or challenge sets

Exit criteria:

- daily challenge is a primary re-entry point
- progression loops support sustained repeat play

#### Phase 8: Content Expansion

Goal: increase novelty without changing the core mechanic.

Work:

- add more themes and higher-quality prompt pools
- deepen video and audio content quality where current coverage is thin
- add curated seasonal packs or special-event packs
- refine theme identity so each mode feels distinct, not just recolored

Exit criteria:

- repeat players encounter enough fresh material to avoid fatigue
- theme selection becomes a meaningful content choice

#### Phase 9: Accounts and Cloud Persistence

Goal: preserve player identity and progress across devices and sessions.

Work:

- optional account system or lightweight sign-in
- cloud sync for profile, unlocks, gallery, and stats
- account-aware sharing and room history
- migration path from local-only state

Exit criteria:

- users can keep progress across browsers/devices
- cloud persistence does not make onboarding heavy

#### Phase 10: Platform and Community Layer

Goal: evolve from a strong game into a durable product ecosystem.

Work:

- public or asynchronous challenges
- spectator or streamer-friendly room modes
- creator/community features for standout submissions
- analytics, moderation, and safety foundations for broader sharing

Exit criteria:

- community features expand reach without diluting the fast, lightweight core experience

### 10. Priority Feature Decisions

#### Must prioritize next

- Stabilization and test health
- Authoritative multiplayer scoring and voting
- Honest documentation of offline/mock versus live-service behavior

#### Should prioritize after that

- Better social feedback loops
- Better retention UX around streaks, unlocks, and daily challenge
- Stronger gallery and personal history

#### Deprioritize for now

- Net-new game modes unrelated to the core connection mechanic
- Monetization
- Heavy account infrastructure

### 11. Success Metrics

#### Activation

- player can create profile and complete first round
- player can complete first 3-round session

#### Engagement

- average rounds per session
- percent of players who view reveal and summary screens
- percent of players who use share-for-judging

#### Social

- room creation to room-start conversion
- invite/share rate per session
- percentage of shared links that receive at least one judgement

#### Retention

- daily challenge completion rate
- streak continuation rate
- percentage of returning players with more than one saved gallery entry

### 12. Recommended Immediate Backlog

1. Fix `scoreSubmission()` null-asset fallback behavior.
2. Update or replace the brittle `ErrorBoundary` test so test expectations match intended UX.
3. Define and implement backend-backed multiplayer voting/results for non-AI rooms.
4. Add a concise feature/status matrix to README.
5. Run a fresh end-to-end manual pass against a deployed environment.
6. Decide the canonical product distinction between AI judge, manual judge, and friend judge.

### 13. Open Questions

- Should "manual judge" and "friend judge" remain one concept, or become separate modes?
- Is multiplayer primarily competitive scoring, collaborative comedy, or both?
- Do we want users to trust AI as the main judge, or should AI stay as a fallback/optional mode?
- Is the long-term identity closer to a party game, a daily creativity app, or a shareable social prompt toy?

### 14. Product Recommendation

The highest-leverage path is not adding more modes. It is turning the existing feature set into a coherent product:

- stabilize what already exists
- make social scoring trustworthy
- sharpen retention loops already present in the app

There is already enough product here to justify a real launch candidate once reliability, documentation, and multiplayer truthfulness catch up.
