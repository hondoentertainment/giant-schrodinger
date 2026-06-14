# Fast Track Testing Checklist (15 min)

Run automated tests first, then use this checklist for a quick manual pass.

## Prerequisites

```bash
npm run test              # 179 unit/integration tests should pass
npm run test:e2e:desktop  # 5 Playwright E2E specs should pass
npm run build             # Production build should succeed (149 KB gzipped main)
```

## URLs

- **Local**: http://localhost:5173/giant-schrodinger/
- **Production**: https://hondoentertainment.github.io/giant-schrodinger

---

## 1. Load Page (~2 min)

- [ ] Open app URL
- [ ] "VENN with Friends" title visible
- [ ] No blank/white screen
- [ ] Progressive lobby shows simplified UI for new users
- [ ] F12 > Console tab: no red errors

---

## 2. Play One Solo Round (~3 min)

- [ ] Click "Play Solo"
- [ ] Two concept images appear
- [ ] Type a connection (e.g. "both make you smile")
- [ ] Submit works
- [ ] Venn diagram shows with your answer
- [ ] Score appears (1-10 scale)
- [ ] Score band label shows (Amazing / Great / Solid / Room to grow)
- [ ] Score coaching tip appears below score
- [ ] "Play Again" works

---

## 3. Quick Feature Spot-Check (~3 min)

- [ ] Ranked panel accessible (shows Elo and tier)
- [ ] Community gallery loads with tabs (Recent / Trending / Top Rated)
- [ ] Achievements panel shows progress bars
- [ ] Colorblind mode toggle available in settings

---

## 4. Mobile View (~2 min)

- [ ] F12 > Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select 375px (e.g. iPhone SE)
- [ ] Navigate: lobby > play round > results
- [ ] All text readable, no horizontal scroll
- [ ] Buttons tappable

---

## 5. Lighthouse (~3 min)

- [ ] F12 > Lighthouse tab
- [ ] Select Performance, Accessibility, Best Practices, SEO
- [ ] "Analyze page load"
- [ ] Performance >= 80
- [ ] Accessibility >= 90

---

## 6. Console Check (~2 min)

- [ ] Clear console
- [ ] Navigate: lobby > solo > round > results > play again
- [ ] No red errors
- [ ] Note any warnings

---

## Results

**Overall**: Pass / Minor issues / Fail

**Notes**:
