# 🎯 Venn with Friends - Manual Testing Guide

## 🚀 Quick Start

Your development server is running at: **http://localhost:5173/giant-schrodinger/**

Open this URL in your browser to begin testing.

---

## 📸 How to Take Screenshots

### Windows:
- **Full screen**: Press `Win + Shift + S` or use Snipping Tool
- **Browser**: F12 > Right-click page > "Capture screenshot" (full page option)

### Chrome DevTools Full Page Screenshot:
1. Press F12
2. Press Ctrl+Shift+P (Command palette)
3. Type "screenshot"
4. Select "Capture full size screenshot"

Save all screenshots to: `screenshots/` folder in your project

---

## 🧪 Testing Sequence

### Phase 1: Initial Load (5 minutes)

1. **Open the app**: http://localhost:5173/giant-schrodinger/
   
2. **First impressions**:
   - Does the page load quickly?
   - Is the design appealing?
   - Do you see "VENN with Friends" title?
   - Are there clear action buttons?

3. **Open Developer Console** (F12):
   - Click "Console" tab
   - Look for red error messages
   - Document any errors you see

4. **Take Screenshot**: Landing page (full page)

5. **Check Network Tab**:
   - F12 > Network tab
   - Reload page (Ctrl+R)
   - Look for failed requests (red)
   - Check total load time at bottom

**Checklist**:
- [ ] Page loads without errors
- [ ] Title "VENN with Friends" visible
- [ ] Console has no errors
- [ ] All images/assets load (Network tab)
- [ ] Design looks polished

---

### Phase 2: Solo Game - Basic Flow (10 minutes)

1. **Start a Solo Game**:
   - Click "Play Solo" or similar button
   - Game should start immediately

2. **Observe the Round Screen**:
   - Do you see TWO concept images?
   - Are they different concepts?
   - Is there a text input field?
   - Can you type in the input?

3. **Fill in a Response**:
   - Type something creative like: "both make you smile"
   - Does the submit button activate?
   - Click Submit

4. **Watch for Scoring**:
   - Does a loading indicator appear?
   - How long does scoring take?
   - Does a score appear?
   - Is the score reasonable (0-100)?

5. **Check the Venn Diagram**:
   - Does a Venn diagram appear?
   - Are the two circles visible?
   - Is your answer in the middle (intersection)?
   - Do the circles have labels?

6. **Review Results**:
   - Can you see breakdown (wit, logic, originality, clarity)?
   - Is there feedback text?
   - Are scores between 0-100?

7. **Take Screenshots**:
   - Round screen with concepts
   - Venn diagram with your answer
   - Results/scoring screen

8. **Play Another Round**:
   - Click "Play Again" or similar
   - Does a new round start?
   - Are the concepts different?

**Checklist**:
- [ ] Game starts successfully
- [ ] Two concept images appear
- [ ] Input field works
- [ ] Submit button responds
- [ ] Scoring completes (mock or AI)
- [ ] Venn diagram displays correctly
- [ ] Results show score breakdown
- [ ] Can play multiple rounds
- [ ] No console errors during gameplay

---

### Phase 3: Multiplayer Features (15 minutes)

#### Test Room Creation:

1. **Look for Multiplayer Option**:
   - On main screen, look for "Create Room" or "Multiplayer"
   - Click it

2. **Room Setup**:
   - Does a room code appear?
   - Can you choose an avatar?
   - Can you enter your name?
   - Is there a "Copy Room Code" button?

3. **Lobby Screen**:
   - Do you see yourself in the player list?
   - Is your avatar visible?
   - Is there a "Start Game" button?
   - Can you leave the room?

4. **Take Screenshot**: Room lobby

#### Test Mock Multiplayer:

If you're testing alone and Supabase is not set up, the app should use mock players.

1. **Start the Game** (as host)
2. **Observe**:
   - Do mock players appear?
   - Does everyone play simultaneously?
   - Do you see other players' statuses?

3. **Play a Round**:
   - Submit your answer
   - Watch for other players' submissions
   - Check if scoring happens for all

4. **Results Screen**:
   - Are all players' answers shown?
   - Is there a leaderboard?
   - Are scores ranked?

5. **Take Screenshots**:
   - Multiplayer round in progress
   - Results with multiple players

#### Test Room Joining (if you have another device):

1. **Open app on second device/browser**
2. **Click "Join Room"**
3. **Enter room code from first device**
4. **Check**:
   - Do both devices show both players?
   - Real-time sync working?
   - Can both players play?

**Checklist**:
- [ ] Can create room
- [ ] Room code generates
- [ ] Avatar selection works
- [ ] Name input works
- [ ] Lobby shows players
- [ ] Can start game
- [ ] Mock multiplayer works (if no Supabase)
- [ ] Results show all players
- [ ] Leaderboard displays correctly

---

### Phase 4: Share & Judge Feature (10 minutes)

1. **Complete a Solo Round**
2. **Look for Share Button**:
   - After results, look for "Share" button
   - Click it

3. **Share Dialog**:
   - Does a share URL appear?
   - Does it look like: `#judge=...`?
   - Can you copy it?

4. **Test Judge Link**:
   - Copy the share URL
   - Open a new tab/incognito window
   - Paste the full URL (including #judge=...)
   - Press Enter

5. **Judge Interface**:
   - Does the judge interface load?
   - Can you see the submitted answer?
   - Is the Venn diagram visible?
   - Can you rate it?
   - Are there scoring sliders/inputs?

6. **Submit Judgement**:
   - Rate the submission
   - Click submit
   - Does it save?
   - Thank you message?

7. **Take Screenshots**:
   - Share dialog
   - Judge interface

**Checklist**:
- [ ] Share button appears after round
- [ ] Share URL generates
- [ ] Judge URL opens correctly
- [ ] Venn diagram shows in judge view
- [ ] Can rate submission
- [ ] Judgement submits successfully
- [ ] No console errors

---

### Phase 5: Gallery/History (5 minutes)

1. **Look for Gallery/History**:
   - Main menu or navigation
   - "View Past Rounds" or similar

2. **Gallery View**:
   - Do past rounds appear?
   - Are thumbnails visible?
   - Can you click to expand?
   - Are scores shown?

3. **Take Screenshot**: Gallery view

**Checklist**:
- [ ] Can access gallery
- [ ] Past submissions visible
- [ ] Scores display
- [ ] Can view details

---

### Phase 6: Responsive Design (15 minutes)

#### Test Mobile View (375px width):

1. **Press F12** > Click device toolbar icon (Ctrl+Shift+M)
2. **Select device**: iPhone SE or similar (375px)
3. **Navigate through app**:
   - Main screen
   - Start a game
   - Play a round
   - View results

4. **Check**:
   - [ ] All text readable?
   - [ ] Buttons large enough to tap?
   - [ ] No horizontal scroll?
   - [ ] Venn diagram fits screen?
   - [ ] Input fields usable?
   - [ ] Images scale properly?

5. **Take Screenshot**: Mobile view of key screens

#### Test Tablet (768px):

1. **Change device** to iPad or set width to 768px
2. **Navigate through app**
3. **Check layout** adapts appropriately

4. **Take Screenshot**: Tablet view

#### Test Desktop (1920px):

1. **Exit device mode** (or set to 1920px)
2. **Check**:
   - [ ] Content not too wide?
   - [ ] Well-centered?
   - [ ] Good use of space?

3. **Take Screenshot**: Desktop view

**Checklist**:
- [ ] Mobile (375px): Fully functional
- [ ] Tablet (768px): Good layout
- [ ] Desktop (1920px): Balanced design
- [ ] No layout breaks at any size
- [ ] Touch targets appropriate on mobile

---

### Phase 7: Performance Testing (10 minutes)

#### Lighthouse Audit:

1. **Open DevTools** (F12)
2. **Click "Lighthouse" tab** (may be under >>)
   - If not visible, click the ⚙️ icon and enable Lighthouse
3. **Select categories**:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
4. **Device**: Desktop
5. **Click "Analyze page load"**
6. **Wait for results** (1-2 minutes)

7. **Document scores**:
   - Performance: ___/100
   - Accessibility: ___/100
   - Best Practices: ___/100
   - SEO: ___/100

8. **Review opportunities**:
   - Note any major issues
   - Check image sizes
   - Check bundle sizes

9. **Take Screenshot**: Lighthouse results

#### Check Bundle Size:

In DevTools:
1. **Network tab**
2. **Reload page** (Ctrl+Shift+R - hard reload)
3. **Look at bottom**: Total KB transferred
4. **Document**: Total size: ___ KB

**Checklist**:
- [ ] Performance score above 80
- [ ] Accessibility score above 90
- [ ] No major console errors
- [ ] Total bundle under 500KB
- [ ] Images optimized

---

### Phase 8: Console Error Check (5 minutes)

1. **Clear console**: Right-click > Clear console
2. **Navigate through entire app**:
   - Main screen
   - Start game
   - Play round
   - View results
   - Try multiplayer
   - Try share/judge
   - View gallery

3. **Document ALL errors**:
   - Copy full error messages
   - Note when they occur
   - Take screenshot of console

4. **Check Network tab**:
   - Any 404 errors (red)?
   - Any CORS errors?
   - Any failed requests?

**Document in**: `TEST_RESULTS.md`

---

### Phase 9: Cross-Browser Testing (15 minutes)

#### Chrome:
- [ ] Full functionality
- [ ] Styling correct
- [ ] No errors

#### Firefox:
1. Open Firefox
2. Navigate to http://localhost:5173/giant-schrodinger/
3. Test core flow:
   - Start game
   - Play round
   - Check results
4. Check console for errors

- [ ] Full functionality
- [ ] Styling correct
- [ ] No errors

#### Edge:
1. Open Edge
2. Navigate to app
3. Test core flow

- [ ] Full functionality
- [ ] Styling correct
- [ ] No errors

---

## 📋 Final Report Template

Copy this template to `TEST_RESULTS.md`:

```markdown
# Venn with Friends - Test Results

**Date**: [Date]
**Tester**: [Your Name]
**Environment**: Local Development Server

---

## Overall Status

**Status**: 🟢 Working / 🟡 Partial / 🔴 Broken

**Summary**: [Brief description of overall functionality]

---

## Test Results by Feature

### ✅ Solo Game Mode
- Status: 🟢 Working / 🟡 Partial / 🔴 Broken
- Notes: [Any issues or observations]

### ✅ Multiplayer Mode
- Status: 🟢 Working / 🟡 Partial / 🔴 Broken
- Notes: [Any issues or observations]

### ✅ Share/Judge Feature
- Status: 🟢 Working / 🟡 Partial / 🔴 Broken
- Notes: [Any issues or observations]

### ✅ Gallery
- Status: 🟢 Working / 🟡 Partial / 🔴 Broken
- Notes: [Any issues or observations]

---

## Console Errors Found

```
[Paste any console errors here]
```

---

## Performance Metrics

- **Load Time**: ___ seconds
- **Lighthouse Performance**: ___/100
- **Lighthouse Accessibility**: ___/100
- **Lighthouse Best Practices**: ___/100
- **Lighthouse SEO**: ___/100
- **Total Bundle Size**: ___ KB

---

## Responsive Design

- **Mobile (375px)**: ✅ Pass / ❌ Fail
- **Tablet (768px)**: ✅ Pass / ❌ Fail
- **Desktop (1920px)**: ✅ Pass / ❌ Fail

**Issues**: [Any layout issues]

---

## Browser Compatibility

- **Chrome**: ✅ Pass / ❌ Fail
- **Firefox**: ✅ Pass / ❌ Fail
- **Edge**: ✅ Pass / ❌ Fail
- **Safari**: ✅ Pass / ❌ Fail (if tested)

---

## User Experience Rating

Rate 1-5 stars:

- **Visual Design**: ⭐⭐⭐⭐⭐
- **Usability**: ⭐⭐⭐⭐⭐
- **Performance**: ⭐⭐⭐⭐⭐
- **Fun Factor**: ⭐⭐⭐⭐⭐

---

## Issues Found

1. [Issue description]
2. [Issue description]
3. [Issue description]

---

## Recommendations

1. [Recommendation]
2. [Recommendation]
3. [Recommendation]

---

## Screenshots

- [x] Landing page
- [x] Solo game - round screen
- [x] Solo game - Venn diagram
- [x] Solo game - results
- [x] Multiplayer lobby
- [x] Multiplayer round
- [x] Share/Judge interface
- [x] Gallery view
- [x] Mobile view
- [x] Tablet view
- [x] Lighthouse results

All screenshots saved in: `screenshots/`

---

## Additional Notes

[Any other observations, bugs, or suggestions]
```

---

## 🎯 Quick Tips

- **Keep DevTools open** throughout testing
- **Document as you go** - don't wait until the end
- **Take lots of screenshots** - visual evidence is helpful
- **Test edge cases**: empty inputs, very long text, etc.
- **Clear cache between tests** (Ctrl+Shift+R)
- **Test on actual mobile device** if possible

---

## ⚡ Fast Track (15-minute version)

If you're short on time, test these critical paths:

1. **Load page** - check for errors (2 min)
2. **Play one solo round** - start to finish (3 min)
3. **Test mobile view** - resize and navigate (3 min)
4. **Run Lighthouse** - performance check (3 min)
5. **Check console** - look for errors (2 min)
6. **Document findings** - write quick summary (2 min)

---

## 📞 Questions?

If you encounter any issues or need clarification:
1. Check console errors first
2. Try clearing cache and reloading
3. Check if it's a configuration issue (.env)
4. Document the issue for fixing

---

Happy Testing! 🚀
