# Venn with Friends - Expected Behaviors & Feature Status

## Environment Configuration

**Current Setup**: No API keys configured (.env is empty)

### What Works WITHOUT API Keys:
✅ Solo game mode (uses mock scoring)
✅ Basic gameplay flow
✅ Venn diagram visualization
✅ Mock scoring with random but realistic scores
✅ Mock multiplayer with simulated players
✅ UI/UX and visual design
✅ Responsive layouts
✅ Gallery/history features

### What Requires API Keys:

#### With Supabase (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY):
- Real multiplayer rooms with other players
- Room codes that work across devices
- Share links saved to database
- Friend judgements persisted
- Real-time synchronization

#### With Gemini (VITE_GEMINI_API_KEY):
- AI-powered scoring (instead of mock scores)
- Detailed feedback on submissions
- AI-generated fusion images
- More sophisticated evaluation

---

## Feature-by-Feature Expected Behavior

### 1. Landing Page / Lobby

#### What You Should See:
- Large "VENN with Friends" title
- Gradient text effect on "VENN"
- Clean, modern dark theme with purple/pink accents
- Clear call-to-action buttons:
  - "Play Solo" or similar
  - "Create Room" / "Join Room" for multiplayer
  - "View Gallery" (if implemented)

#### Expected Behavior:
- Page loads in under 2 seconds
- No console errors
- All fonts and styles load correctly
- Buttons respond to hover (desktop)
- Responsive on all screen sizes

#### Potential Issues to Look For:
- ❌ Missing images
- ❌ Broken CSS (unstyled content)
- ❌ Console errors about missing modules
- ❌ Layout breaks on mobile

---

### 2. Solo Game - Round Screen

#### What You Should See:
- Two concept images side-by-side (or stacked on mobile)
- Images are different concepts (e.g., "Pizza" and "Rainbow")
- Text input field below or between images
- Placeholder text like "Connect these concepts..."
- Submit button (may be disabled until you type)
- Clean, focused layout

#### Expected Behavior:
1. **Images Load**: Both concepts appear quickly
2. **Images Are Varied**: Each round has different concepts
3. **Input Works**: Can type freely in text field
4. **Character Limit**: May have max length (check for counter)
5. **Submit Activates**: Button enables when text entered
6. **Submit Triggers**: Clicking submit moves to scoring/results

#### Potential Issues:
- ❌ Images fail to load (broken image icons)
- ❌ Same concepts appear every time
- ❌ Input doesn't accept text
- ❌ Submit button doesn't respond
- ❌ Layout breaks on mobile

---

### 3. Venn Diagram Display

#### What You Should See:
- Two overlapping circles (Venn diagram)
- Left circle labeled with first concept
- Right circle labeled with second concept
- Center intersection area highlighted
- Your answer text in the intersection
- Smooth animations (circles growing, text fading in)
- Color-coded circles (different colors for each concept)

#### Expected Behavior:
1. **Diagram Renders**: Circles appear correctly
2. **Labels Clear**: Concept names are readable
3. **Answer Centered**: Your text fits in intersection
4. **Responsive**: Diagram scales on mobile
5. **Animations Smooth**: No jank or flickering

#### Potential Issues:
- ❌ Circles overlap incorrectly
- ❌ Text overflows intersection area
- ❌ Labels missing or cut off
- ❌ Diagram too small on mobile
- ❌ Colors too similar (hard to distinguish)

---

### 4. Scoring & Results (Mock Mode)

#### What You Should See:
- Overall score (0-100)
- Score breakdown by category:
  - **Wit**: How clever/funny (0-100)
  - **Logic**: How well concepts connect (0-100)
  - **Originality**: How creative/unique (0-100)
  - **Clarity**: How clear/understandable (0-100)
- Text feedback (mock message)
- "Play Again" button
- "Share" button (optional)

#### Expected Behavior (Mock Scoring):
1. **Instant Results**: Appears immediately (no API delay)
2. **Varied Scores**: Each round has different scores
3. **Realistic Range**: Scores typically 50-90
4. **Feedback Generic**: Mock messages like "Great connection!"
5. **Play Again Works**: Starts new round with new concepts

#### Expected Behavior (AI Scoring with API):
1. **Loading Indicator**: Shows "AI is judging..." for 2-5 seconds
2. **Detailed Feedback**: Specific comments on your answer
3. **Fair Scores**: Relevant to submission quality
4. **Varied Responses**: Different feedback each time

#### Potential Issues:
- ❌ Scores always identical
- ❌ Scores out of range (negative, >100)
- ❌ No feedback text
- ❌ Play Again doesn't work
- ❌ Long delay with no loading indicator

---

### 5. Multiplayer - Room Creation

#### What You Should See:
- Room code (e.g., "ABCD" or "1234")
- "Copy Room Code" button
- Avatar selection grid (multiple avatar options)
- Name input field
- Player list showing yourself
- "Start Game" button (host only)
- "Leave Room" button

#### Expected Behavior (Mock Mode - No Supabase):
1. **Room Code Generates**: Appears immediately
2. **Avatar Selection**: Can click different avatars
3. **Selected Avatar Highlights**: Visual feedback
4. **Name Input Works**: Can type custom name
5. **Mock Players May Appear**: 1-2 simulated players for testing
6. **Start Game Works**: Begins round even in mock mode

#### Expected Behavior (Real Mode - With Supabase):
1. **Room Code Saves**: Persists in database
2. **Other Players Can Join**: Code works on other devices
3. **Real-time Updates**: Player list updates instantly
4. **Host Controls**: Only host sees "Start Game"
5. **Leave Works**: Removes player from room

#### Potential Issues:
- ❌ Room code doesn't generate
- ❌ Avatar selection doesn't respond
- ❌ Name doesn't update
- ❌ Player list empty
- ❌ Start button missing or broken

---

### 6. Multiplayer - Game Round

#### What You Should See:
- Same concepts for all players
- Your input field
- Player status indicators (who's submitted)
- Timer (optional - may not be implemented)
- Submit button

#### Expected Behavior (Mock Mode):
1. **Concepts Load**: Same as solo mode
2. **Mock Players Auto-Submit**: Simulated after delay
3. **Status Updates**: Shows who finished
4. **Your Submission Works**: Same as solo

#### Expected Behavior (Real Mode):
1. **Synchronized Concepts**: All players see same images
2. **Real-time Status**: Live updates of submissions
3. **Timer Synced**: Countdown matches for all
4. **Submissions Private**: Can't see others' answers until results

#### Potential Issues:
- ❌ Different concepts for different players
- ❌ Status indicators don't update
- ❌ Timer desynchronized
- ❌ Can't submit

---

### 7. Multiplayer - Results & Leaderboard

#### What You Should See:
- All players' submissions
- Each player's score
- Leaderboard/ranking
- Winner highlighted
- "Next Round" or "Leave Room" buttons

#### Expected Behavior:
1. **All Answers Visible**: Can see everyone's submissions
2. **Scores Displayed**: Each player has score
3. **Ranked Order**: Highest to lowest
4. **Winner Clear**: Visual emphasis on #1
5. **Animations**: Smooth reveal of results

#### Potential Issues:
- ❌ Missing players
- ❌ Scores missing or identical
- ❌ Ranking incorrect
- ❌ Can't proceed to next round

---

### 8. Share & Judge Feature

#### Share Flow:

**What You Should See**:
- "Share" button after results
- Modal/dialog with shareable URL
- URL format: `#judge=base64encodeddata`
- "Copy Link" button
- Social share buttons (optional)

**Expected Behavior**:
1. **URL Generates**: Creates unique share link
2. **Copy Works**: Copies to clipboard
3. **Toast Notification**: "Link copied!" message
4. **URL Contains Data**: Encoded submission + concepts

#### Judge Flow:

**What You Should See** (when opening judge link):
- Special judge interface (not normal game UI)
- The submission being judged
- Venn diagram showing the answer
- Rating interface:
  - Sliders or number inputs for each category
  - Or simple 1-5 star rating
- Submit judgement button

**Expected Behavior**:
1. **Link Parses**: Decodes data from URL
2. **Submission Shows**: Displays original answer + concepts
3. **Venn Diagram**: Same as original player saw
4. **Rating Interface**: Can adjust scores/stars
5. **Submit Works**: Saves judgement (if Supabase) or shows thank you

#### Potential Issues:
- ❌ Share button missing
- ❌ URL doesn't generate
- ❌ Copy to clipboard fails
- ❌ Judge link doesn't open
- ❌ Judge interface shows error
- ❌ Can't decode submission data
- ❌ Submit judgement fails

---

### 9. Gallery / History

#### What You Should See:
- Grid or list of past submissions
- Thumbnails or cards for each round
- Score displayed on each
- Date/time (optional)
- Click to view details
- Filter/sort options (optional)

#### Expected Behavior:
1. **Past Rounds Appear**: All previous submissions
2. **Newest First**: Reverse chronological order
3. **Click to Expand**: Opens detail view
4. **Score Visible**: Shows overall or breakdown
5. **Responsive Grid**: Adapts to screen size

#### Expected Storage:
- **Without Supabase**: localStorage only (persists on same device)
- **With Supabase**: Database (persists across devices)

#### Potential Issues:
- ❌ Gallery empty even after playing
- ❌ Click doesn't work
- ❌ Scores missing
- ❌ Layout breaks
- ❌ Old submissions missing

---

### 10. Ranked System

#### Elo Rating:
- New players start at 1000 Elo
- Wins increase Elo; losses decrease it
- The magnitude of change depends on the opponent's rating (larger gain for beating a higher-rated player)
- Elo is clamped to a minimum of 0

#### Tiers:
- **Bronze**: 0-999
- **Silver**: 1000-1499
- **Gold**: 1500-1999
- **Platinum**: 2000-2499
- **Diamond**: 2500+
- Tier badge updates automatically when Elo crosses a threshold

#### Decay:
- Elo decays if the player has not played a ranked match for 14+ days
- Decay is gradual (small daily reduction) and stops at the floor of the current tier

#### Seasonal Reset:
- At the start of each season, Elo is soft-reset toward 1000 (compressed, not zeroed)
- Season rewards are granted based on peak tier achieved

#### Expected Behavior:
1. Ranked panel shows current Elo, tier badge, and win/loss record
2. After a ranked match, Elo changes are shown with an animation
3. Promotion and demotion between tiers trigger a celebration or warning
4. Leaderboard has a "Seasonal" tab showing current season rankings

---

### 11. Spectator Mode

#### Expected Behavior:
1. In a multiplayer room, non-players can join as spectators
2. Spectators see the concepts and a live status of who has submitted
3. Spectators cannot type or submit answers
4. During the reveal phase, spectators see all answers and scores
5. Spectators can send **reactions** (emoji reactions visible to all players)
6. Spectators see **banners** (e.g., "Player X scored 95!" highlight banners)
7. Spectator count is visible in the room UI

#### Potential Issues:
- Spectator reactions not appearing for players
- Spectator count not updating when someone joins/leaves
- Spectators able to submit (should be blocked)

---

### 12. Community Gallery

#### Tabs:
- **Recent**: Newest submissions from all players
- **Trending**: Submissions with the most votes in the last 24-48 hours
- **Top Rated**: Highest-scored submissions of all time

#### Voting:
- Players can upvote or downvote gallery submissions
- Each player gets one vote per submission
- Vote count is displayed on each card
- Trending algorithm weights recent votes more heavily

#### Expected Behavior:
1. Gallery loads with three tab buttons at the top
2. Switching tabs fetches and displays the appropriate list
3. Each card shows the Venn diagram, answer text, score, and vote count
4. Clicking a card expands it to full detail view
5. Voting updates the count immediately (optimistic update)

#### Without Supabase:
- Gallery shows locally stored submissions only
- Voting is client-side and does not persist across sessions

---

### 13. Progressive Lobby Disclosure

#### Expected Behavior:
1. **First visit**: Lobby shows only "Play Solo" and basic instructions
2. **After 1-2 games**: Multiplayer options appear
3. **After 5+ games**: Ranked, tournaments, daily challenge, and gallery become visible
4. **After 10+ games**: All features are disclosed (shop, battle pass, achievements panel)

#### Implementation:
- Play count is tracked in localStorage
- The lobby component reads the count and conditionally renders sections
- An onboarding tour (contextual tips) appears for first-time users

#### Potential Issues:
- Features never appearing (localStorage not incrementing)
- All features showing immediately (disclosure not gating)

---

### 14. Colorblind Mode

#### Expected Behavior:
1. Toggle is available in the settings panel
2. When enabled, the Venn diagram uses patterns (stripes, dots) in addition to colors
3. Score bands use icons alongside colors (checkmark, star, etc.)
4. Tier badges use distinct shapes per tier
5. All color-dependent UI elements have a secondary visual indicator

#### Potential Issues:
- Patterns not rendering on the Venn diagram
- Setting not persisting across sessions

---

### 15. Server-Side Scoring

#### Expected Behavior:
1. When `VITE_SUPABASE_URL` is configured, scoring requests go through the `score-submission` Edge Function
2. The Gemini API key is stored server-side (never exposed to the client)
3. The Edge Function validates the submission, calls Gemini, and returns the score
4. If the Edge Function is unavailable, the client falls back to client-side Gemini scoring (if `VITE_GEMINI_API_KEY` is set) or mock scoring

#### Without Supabase:
- Scoring is done client-side via the Gemini API directly
- If no Gemini key either, mock scoring is used

---

### 16. Disconnect Recovery

#### Expected Behavior:
1. If a player disconnects during a multiplayer round, their submission state is preserved
2. On reconnect (within 60 seconds), they rejoin the same room automatically
3. If the round ended while disconnected, they see the results on rejoin
4. A "Reconnecting..." banner appears during the disconnection
5. Other players see a "Disconnected" status next to the player's name

#### Without Supabase:
- Not applicable (mock multiplayer does not simulate disconnects)

---

### 17. Offline Queue (PWA)

#### Expected Behavior:
1. When the device is offline, the app still loads from the service worker cache
2. Solo rounds can be played offline with mock scoring
3. Submissions made offline are queued in localStorage
4. When connectivity returns, queued submissions are sent to the server
5. A banner indicates offline status: "You are offline -- scores will sync when connected"

---

## Visual Design Expectations

### Color Scheme:
- **Background**: Dark (near black) with subtle gradients
- **Accent Colors**: Purple, pink, blue (vibrant)
- **Text**: White/light gray for readability
- **Buttons**: Gradient backgrounds, rounded corners
- **Cards**: Slightly lighter than background, subtle borders

### Typography:
- **Headings**: Large, bold, display font
- **Body**: Clean, readable sans-serif
- **Gradients**: Text gradients on main title

### Animations:
- **Smooth Transitions**: Fade ins, slide ups
- **Hover Effects**: Subtle scale, glow
- **Loading States**: Spinners or pulsing effects
- **Results Reveal**: Animated score counting

### Responsive Behavior:
- **Mobile**: Single column, larger touch targets
- **Tablet**: Two columns where appropriate
- **Desktop**: Centered content, max-width containers

---

## 📊 Performance Expectations

### Load Times:
- **Initial Load**: Under 3 seconds
- **Game Start**: Instant
- **Image Loading**: Under 1 second per image
- **Mock Scoring**: Instant
- **AI Scoring**: 2-5 seconds

### Bundle Sizes:
- **Total JS**: Under 300KB (gzipped)
- **Total CSS**: Under 50KB (gzipped)
- **Per Image**: Under 100KB each

### Lighthouse Targets:
- **Performance**: 85+ (desktop), 70+ (mobile)
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

---

## 🐛 Common Issues & Solutions

### Issue: Images Not Loading
**Symptoms**: Broken image icons, 404 errors in console
**Likely Cause**: Missing assets or incorrect paths
**Solution**: Check `src/data/` for image URLs, ensure paths are correct

### Issue: "Cannot read property of undefined"
**Symptoms**: White screen, error in console
**Likely Cause**: Missing data or API response
**Solution**: Check if mock data is properly configured

### Issue: Styles Not Applied
**Symptoms**: Unstyled content, wrong colors
**Likely Cause**: Tailwind CSS not loading
**Solution**: Check build output, ensure postcss configured

### Issue: Multiplayer Doesn't Connect
**Symptoms**: Can't join room, no real-time updates
**Expected**: This is normal without Supabase credentials
**Solution**: Test mock multiplayer mode instead

### Issue: AI Scoring Doesn't Work
**Symptoms**: Instant results instead of AI feedback
**Expected**: This is normal without Gemini API key
**Solution**: Test with mock scoring, which should still work

---

## ✅ Testing Readiness Checklist

Before starting comprehensive testing:

- [x] Development server running (http://localhost:5173/giant-schrodinger/)
- [ ] Browser DevTools open (F12)
- [ ] Console tab visible
- [ ] Network tab ready
- [ ] Screenshots folder created
- [ ] Testing guide open (MANUAL_TESTING_GUIDE.md)
- [ ] Notepad ready for notes
- [ ] Good internet connection (for any external images)

---

## 🎯 Success Indicators

Your app is working correctly if:

✅ Page loads without errors
✅ Can start and complete a solo game round
✅ Venn diagram displays correctly
✅ Scoring works (even if mock)
✅ Can play multiple rounds
✅ Responsive on mobile
✅ No major console errors
✅ UI is polished and animations are smooth

---

## 📝 What to Document

For each test session, note:

1. **What feature you tested**
2. **Expected behavior** (from this document)
3. **Actual behavior** (what you observed)
4. **Pass/Fail status**
5. **Screenshots** (if relevant)
6. **Console errors** (if any)
7. **Suggestions for improvement**

---

## 🚀 Ready to Test!

You now have a complete understanding of:
- What each feature should do
- What you should see
- What might go wrong
- How to document findings

Open your browser to **http://localhost:5173/giant-schrodinger/** and start testing!

Follow the **MANUAL_TESTING_GUIDE.md** for step-by-step instructions.
