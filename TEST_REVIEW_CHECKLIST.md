# Venn with Friends - Comprehensive Testing Checklist

## Testing URLs

- **Local Development**: http://localhost:5173/giant-schrodinger/
- **GitHub Pages (after deployment)**: https://hondoentertainment.github.io/giant-schrodinger

## Automated Test Coverage

The project has **179 tests across 21 files** (16 unit/integration + 5 Playwright E2E). Run them before manual testing:

```bash
npm run test              # 179 unit/integration tests
npm run test:e2e:desktop  # 5 Playwright E2E specs
```

---

## Test Categories

### 1. Initial Load & Landing Page

#### Visual Check
- [ ] Page loads without errors
- [ ] Logo and branding appear correctly
- [ ] All images load properly
- [ ] Layout is visually appealing
- [ ] Fonts render correctly
- [ ] Colors and styling match design intent

#### Console Check
- [ ] No JavaScript errors in console (F12)
- [ ] No 404 errors for assets
- [ ] No CORS errors
- [ ] Check for any warning messages

#### Performance
- [ ] Page loads in under 3 seconds
- [ ] Images are optimized
- [ ] CSS/JS bundles are minified
- [ ] Check Lighthouse score (aim for 90+)

**Screenshot Location**: `screenshots/01-landing-page.png`

---

### 2. Solo Game Mode

#### Starting a Game
- [ ] "Start Solo Game" button is visible and styled
- [ ] Button responds to click/tap
- [ ] Game initializes without delay
- [ ] Transition to game screen is smooth

#### Gameplay Flow
- [ ] Two random concept images appear
- [ ] Images load correctly and are visible
- [ ] Images are different/varied each round
- [ ] Input field appears for player response
- [ ] Input field accepts text input
- [ ] Character limit (if any) works correctly
- [ ] Submit button is enabled when text entered
- [ ] Submit button disabled when empty

#### Venn Diagram Display
- [ ] Venn diagram renders correctly
- [ ] Left circle shows first concept
- [ ] Right circle shows second concept
- [ ] Intersection area is visible
- [ ] Player's answer appears in intersection
- [ ] Animation/transitions are smooth
- [ ] Responsive on different screen sizes

#### AI Scoring (with VITE_GEMINI_API_KEY)
- [ ] Submission triggers AI scoring
- [ ] Loading indicator appears during scoring
- [ ] Score appears after processing
- [ ] Score breakdown shows (wit, logic, originality, clarity)
- [ ] Score is reasonable (0-100 scale)
- [ ] Feedback text is relevant and helpful

#### Mock Scoring (without API key)
- [ ] Mock scores appear immediately
- [ ] Mock scores are varied/realistic
- [ ] Mock feedback is displayed
- [ ] No errors in console

#### Results Display
- [ ] Score displays prominently
- [ ] Detailed breakdown visible
- [ ] Feedback text is readable
- [ ] "Play Again" button works
- [ ] "Share" button appears (if implemented)

**Screenshot Locations**:
- `screenshots/02-solo-game-start.png`
- `screenshots/03-venn-diagram.png`
- `screenshots/04-scoring-results.png`

---

### 3. Multiplayer Features

#### Room Creation (requires Supabase)
- [ ] "Create Room" button visible
- [ ] Room code generates automatically
- [ ] Room code displays clearly
- [ ] Room code is copyable
- [ ] Host can customize room settings
- [ ] Avatar selection works
- [ ] Name input works

#### Joining Room
- [ ] "Join Room" button visible
- [ ] Input for room code appears
- [ ] Invalid room code shows error
- [ ] Valid room code connects successfully
- [ ] Avatar selection for joiners
- [ ] Name input for joiners
- [ ] Real-time player list updates

#### Lobby Screen
- [ ] All players appear in lobby
- [ ] Avatars display correctly
- [ ] Names display correctly
- [ ] Player count is accurate
- [ ] "Start Game" button (host only)
- [ ] "Leave Room" button works

#### Multiplayer Gameplay
- [ ] All players see same concepts
- [ ] Timer synchronizes across players
- [ ] Submissions work for all players
- [ ] Real-time updates of player status
- [ ] Results show all player submissions
- [ ] Scoring happens for all players
- [ ] Leaderboard updates correctly

#### Mock Multiplayer (without Supabase)
- [ ] Mock multiplayer mode available
- [ ] Mock players appear
- [ ] Game flow works end-to-end
- [ ] No console errors

**Screenshot Locations**:
- `screenshots/05-room-creation.png`
- `screenshots/06-lobby.png`
- `screenshots/07-multiplayer-game.png`
- `screenshots/08-multiplayer-results.png`

---

### 4. Share & Judge Functionality

#### Share Feature
- [ ] Share button appears after round
- [ ] Share URL generates correctly
- [ ] Share URL copies to clipboard
- [ ] Share URL is shareable via socials
- [ ] Share preview shows correct metadata

#### Judge Interface
- [ ] Judge URL opens judge interface
- [ ] Submission displays correctly
- [ ] Venn diagram shows in judge view
- [ ] Scoring interface is intuitive
- [ ] Judge can rate on multiple criteria
- [ ] Submit judgment button works
- [ ] Thank you message appears
- [ ] Judgment saves to database (if Supabase)

**Screenshot Locations**:
- `screenshots/09-share-dialog.png`
- `screenshots/10-judge-interface.png`

---

### 5. Gallery/History Features

#### Gallery View
- [ ] Gallery/history button visible
- [ ] Past submissions display
- [ ] Thumbnail images show
- [ ] Click to expand works
- [ ] Scores display for each
- [ ] Sorting/filtering works (if implemented)
- [ ] Pagination works (if many entries)

**Screenshot Locations**:
- `screenshots/11-gallery.png`

---

### 6. Ranked Mode & Competitive (Phase 3)

#### Ranked Panel
- [ ] Ranked mode accessible from lobby
- [ ] Elo rating displays correctly
- [ ] Tier badge matches rating range
- [ ] Win/loss record shown
- [ ] Elo changes after ranked match (with animation)
- [ ] Promotion/demotion animations trigger at tier boundaries

#### Spectator Mode
- [ ] Can join a room as spectator
- [ ] Spectators see live gameplay status
- [ ] Spectators cannot submit answers
- [ ] Spectator reactions (emoji) visible to players
- [ ] Spectator banners display for notable events
- [ ] Spectator count updates in real time

#### Community Gallery
- [ ] Gallery loads with Recent, Trending, Top Rated tabs
- [ ] Switching tabs loads correct content
- [ ] Voting (upvote/downvote) works
- [ ] Vote count updates optimistically
- [ ] Card click expands to detail view

#### Tournaments
- [ ] Tournament bracket displays correctly
- [ ] Can join an open tournament
- [ ] Match results advance the bracket
- [ ] Tournament leaderboard updates

---

### 7. Progression & Monetization (Phase 4-5)

#### Battle Pass
- [ ] Battle pass panel accessible from lobby or shop
- [ ] Tiers display with locked/unlocked status
- [ ] XP progress bar tracks across games
- [ ] Rewards unlock at correct thresholds

#### Weekly Events
- [ ] Event banner visible in lobby
- [ ] Event has theme, timer, and special rules
- [ ] Event leaderboard tracks separately
- [ ] Event ends when timer reaches zero

#### Achievement Progress
- [ ] Achievements panel shows categories
- [ ] Progress bars reflect partial completion
- [ ] Milestone popups appear when thresholds are crossed
- [ ] Completed achievements are visually distinct

#### Score Coaching
- [ ] Coaching feedback appears below score after rounds
- [ ] Tips are contextual to score breakdown
- [ ] Score bands (Amazing / Great / Solid / Room to grow) display

#### Story Sharing
- [ ] "Share Story" option available after rounds
- [ ] Generated image includes Venn diagram and score
- [ ] Image can be downloaded or shared

#### Theme Sharing
- [ ] Custom themes can be shared via URL or code
- [ ] Received theme applies correctly

---

### 8. Accessibility & Platform (Phase 4-5)

#### Colorblind Mode
- [ ] Toggle available in settings
- [ ] Venn diagram uses patterns (stripes, dots) when enabled
- [ ] Score bands use icons alongside colors
- [ ] Tier badges use distinct shapes

#### Progressive Lobby Disclosure
- [ ] New users see simplified lobby (Play Solo + basics)
- [ ] After a few games, multiplayer options appear
- [ ] After more games, ranked/tournaments/gallery appear
- [ ] Veteran users see all features

#### Disconnect Recovery
- [ ] Reconnect banner appears on disconnect
- [ ] Player rejoins room automatically on reconnect
- [ ] Other players see "Disconnected" status

#### Offline Queue (PWA)
- [ ] App loads offline from service worker cache
- [ ] Solo rounds playable offline with mock scoring
- [ ] Offline submissions queue and sync when online
- [ ] Offline status banner appears

#### Keyboard & Focus
- [ ] Tab navigation reaches all interactive elements
- [ ] Focus indicators are visible
- [ ] Modals trap focus correctly
- [ ] Escape key closes modals

---

### 9. Responsive Design Testing

#### Mobile (375px - 428px)
- [ ] Layout adapts to mobile
- [ ] All text is readable
- [ ] Buttons are tappable (min 44px)
- [ ] Images scale appropriately
- [ ] Venn diagram fits screen
- [ ] Input fields are usable
- [ ] Navigation works
- [ ] No horizontal scroll

#### Tablet (768px - 1024px)
- [ ] Layout uses space effectively
- [ ] Touch targets are appropriate
- [ ] Images scale well
- [ ] Two-column layouts work
- [ ] Navigation is accessible

#### Desktop (1280px+)
- [ ] Layout is centered/balanced
- [ ] Max width prevents overstretch
- [ ] Hover states work
- [ ] Keyboard navigation works
- [ ] Cursor feedback appropriate

**Screenshot Locations**:
- `screenshots/12-mobile-view.png`
- `screenshots/13-tablet-view.png`
- `screenshots/14-desktop-view.png`

---

### 10. Browser Compatibility

#### Chrome/Edge (Chromium)
- [ ] Full functionality works
- [ ] Styling renders correctly
- [ ] Animations smooth

#### Firefox
- [ ] Full functionality works
- [ ] Styling renders correctly
- [ ] CSS Grid/Flexbox works

#### Safari (if available)
- [ ] Full functionality works
- [ ] Webkit-specific styles work
- [ ] Date/input polyfills needed?

---

### 11. Performance & Optimization

#### Lighthouse Scores
- [ ] Performance: ____/100
- [ ] Accessibility: ____/100
- [ ] Best Practices: ____/100
- [ ] SEO: ____/100

#### Load Times
- [ ] First Contentful Paint: ____ ms
- [ ] Time to Interactive: ____ ms
- [ ] Total Bundle Size: ____ KB
- [ ] Image optimization: Pass/Fail

#### Runtime Performance
- [ ] Smooth scrolling
- [ ] No jank during animations
- [ ] Quick response to interactions
- [ ] No memory leaks (check DevTools)

---

### 12. Console & Error Checking

#### JavaScript Console
```
Document errors found:
- [ ] Type errors
- [ ] Reference errors
- [ ] Network errors
- [ ] Uncaught promises
```

#### Network Tab
```
- [ ] All resources load (200 status)
- [ ] No 404 errors
- [ ] No CORS issues
- [ ] Reasonable payload sizes
```

---

### 13. User Experience Findings

#### Positive Aspects
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

#### Issues/Pain Points
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

#### Suggestions for Improvement
```
1. ___________________________________
2. ___________________________________
3. ___________________________________
```

---

## 🚀 Deployment Checklist

### GitHub Pages Setup
- [ ] Repository settings > Pages configured
- [ ] Source set to "gh-pages" branch
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enforced
- [ ] Build deployed successfully

### Environment Variables
- [ ] .env file NOT committed to git
- [ ] .env.example is up to date
- [ ] Production secrets configured in deployment
- [ ] API keys have appropriate restrictions

---

## 📊 Final Report Template

### Overall Status
**Status**: ⚪ Not Tested | 🟢 Working | 🟡 Partial | 🔴 Broken

**Main Issues Found**:
1. ___________________________________
2. ___________________________________
3. ___________________________________

### Console Errors
```
[List any console errors here]
```

### Performance Metrics
- Load Time: ____ seconds
- Lighthouse Performance: ____/100
- Bundle Size: ____ KB

### User Experience Rating
- Visual Design: ⭐⭐⭐⭐⭐
- Usability: ⭐⭐⭐⭐⭐
- Performance: ⭐⭐⭐⭐⭐
- Fun Factor: ⭐⭐⭐⭐⭐

### Recommendations
1. ___________________________________
2. ___________________________________
3. ___________________________________

---

## 🛠️ Testing Commands

```bash
# Start development server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Check bundle size
npm run build -- --mode analyze
```

---

## 📸 Screenshot Locations

Save all screenshots to: `screenshots/`

Naming convention: `##-descriptive-name.png`

---

## Notes & Additional Findings

```
[Add any additional observations, bugs, or suggestions here]
```
