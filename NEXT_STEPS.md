# Recommended Next Steps for Venn with Friends

## Priority 1: Deploy to Production

The app is fully built and tested but not yet live. These steps will get it deployed:

1. **Enable GitHub Pages** in the repository settings
   - Go to Settings > Pages > Source: select "GitHub Actions"
   - The existing `.github/workflows/deploy.yml` handles CI, tests, and deployment automatically

2. **Verify the deployment**
   - Monitor the Actions tab for build/deploy completion
   - Test the live site at `https://hondoentertainment.github.io/giant-schrodinger`

3. **Run Lighthouse audit** on the deployed site
   - Target scores: Performance 85+, Accessibility 95+, Best Practices 95+, SEO 90+

---

## Priority 2: Enable Backend Services

The app gracefully degrades without these, but enabling them unlocks the full experience:

### Supabase (Real-time Multiplayer & Persistence)
- Create a Supabase project and apply the schema from documentation
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
- This enables: persistent rooms, real-time sync, stored judgements, shared submissions

### Google Gemini API (AI Scoring & Fusion Images)
- Obtain a Gemini API key from Google AI Studio
- Set `VITE_GEMINI_API_KEY` environment variable
- This enables: real AI scoring (wit/logic/originality/clarity), AI-generated fusion images

---

## Priority 3: Improve Code Quality & Reliability

### Add TypeScript
- The codebase is pure JavaScript with no type annotations
- Migrating to TypeScript would catch bugs at compile time and improve IDE support
- Start with `tsconfig.json`, rename files incrementally (`.jsx` -> `.tsx`), and add types to services first

### Increase Test Coverage
- Current: 9 unit test files covering services and utilities
- Missing coverage for:
  - `GameContext.jsx` — core game state logic (rounds, scoring, sessions)
  - `RoomContext.jsx` — multiplayer room state management
  - `App.jsx` — navigation/routing between game phases
  - `Round.jsx` and `VennDiagram.jsx` — core gameplay components
  - `Reveal.jsx` — results display and scoring breakdown
- Add integration tests for the full solo game flow (lobby -> round -> reveal -> summary)

### Add Pre-commit Hooks
- Use `husky` + `lint-staged` to enforce linting and formatting before commits
- Prevents broken code from entering the repository

---

## Priority 4: Feature Enhancements

### Leaderboard & Persistence
- Add a global leaderboard showing top scores across all players
- Persist player profiles and stats beyond localStorage (use Supabase)
- Add authentication (Supabase Auth) so players can track progress across devices

### Improved Multiplayer
- Add a lobby browser to discover public rooms
- Support spectator mode for watching games in progress
- Add chat functionality during multiplayer rounds
- Implement tournament/bracket mode for competitive play

### Content & Variety
- Add more concept themes beyond the current curated set
- Let players create and share custom theme packs
- Add difficulty levels that affect concept pairing complexity
- Implement a "concept of the day" community challenge

### Progressive Web App (PWA)
- Add a service worker and manifest for offline support
- Enable "Add to Home Screen" on mobile devices
- Cache static assets for faster subsequent loads

### Accessibility Improvements
- Audit all interactive elements for keyboard navigation
- Add ARIA labels to dynamic content (score reveals, animations)
- Ensure all color combinations meet WCAG AA contrast ratios
- Add screen reader announcements for game state changes

---

## Priority 5: DevOps & Monitoring

### Error Monitoring
- Integrate Sentry or a similar service for production error tracking
- The `ErrorBoundary` component already catches React errors — wire it to a reporting service

### Analytics
- Add basic usage analytics (game starts, completions, sharing rates)
- Track which themes and concepts are most popular
- Monitor multiplayer room creation and player counts

### Performance Monitoring
- Add Web Vitals tracking (LCP, FID, CLS)
- Set up alerts for performance regressions after deployments

### Custom Domain
- Configure a custom domain for a more professional URL
- Set up HTTPS via GitHub Pages or Cloudflare

---

## Quick Wins (Low Effort, High Impact)

| Enhancement | Effort | Impact |
|-------------|--------|--------|
| Add `<meta>` Open Graph tags for rich link previews | 1 hour | High — better social sharing |
| Add favicon and app icons | 30 min | Medium — polished appearance |
| Add loading skeletons for async content | 2 hours | Medium — perceived performance |
| Add keyboard shortcuts (Enter to submit, Esc to close modals) | 1 hour | Medium — power user UX |
| Add sound effects for score reveals and milestones | 2 hours | High — game feel |
