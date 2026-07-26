# Release Checklist

Use this before pushing a release candidate or merging a deployment-bound change.

## 1. Code health

- [ ] `npm run verify:release` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run test:e2e:desktop` passes
- [ ] `npm run build` passes
- [ ] New code paths have test coverage or an intentional gap is documented
- [ ] README and setup docs match current behavior
- [ ] PRD feature registry / ROADMAP updated if live-service requirements changed
- [ ] Local-preview modes still labeled (ranked / shop / tournaments)

## 2. Solo experience

- [ ] App loads into the lobby without console errors
- [ ] A full solo round can be played end to end
- [ ] First-session onboarding opens for a new profile and starts a guided first round
- [ ] Reveal works with AI configured
- [ ] Reveal also works without Gemini configured using fallback behavior
- [ ] Session summary works after multiple rounds
- [ ] Daily challenge completion is marked after a daily session

## 3. Sharing and judgement

- [ ] Share-for-judging link can be generated
- [ ] Manual-mode reveal can generate a friend-judging link before self-scoring
- [ ] Judging link opens successfully
- [ ] Judging page shows enough prompt/image context for a friend to score confidently
- [ ] Invalid or expired judging links fail gracefully
- [ ] Judgement appears in history where backend support exists

## 4. Multiplayer

- [ ] Room creation works with Supabase configured
- [ ] Second player can join with room code
- [ ] Round start, submission, reveal, and next-round transitions stay synchronized
- [ ] Manual-vote multiplayer produces the same winner in both browsers
- [ ] Disconnect/reconnect messaging appears during reveal, voting, and results
- [ ] Join/rejoin during reveal or results does not strand players in the lobby view
- [ ] Leaving the room does not trap users in a broken state
- [ ] Non-AI multiplayer scoring behavior is verified for the currently supported product model

## 5. Deployment readiness

- [ ] Required production secrets are configured
- [ ] `supabase/schema.sql` has been applied in the target Supabase project
- [ ] GitHub Pages or Vercel deployment target is confirmed
- [ ] Preview build has been smoke-tested locally
- [ ] Telemetry sink/monitoring path is confirmed
- [ ] Any known limitations are documented in PRD/README/release notes

## 6. Post-deploy verification

- [ ] Live site loads successfully
- [ ] Browser console is free of critical errors
- [ ] At least one live solo round has been completed
- [ ] At least one live share/judging flow has been verified
- [ ] At least one live multiplayer flow has been verified if Supabase-backed launch is intended
