# ⚡ Fast Track Testing Checklist (15 min)

Use this checklist for a quick manual pass. Check each item as you go.

## URLs

- **Local**: http://localhost:5173/giant-schrodinger/
- **Production**: https://hondoentertainment.github.io/giant-schrodinger

---

## 1. Load Page (~2 min)

- [ ] Open app URL
- [ ] "VENN with Friends" title visible
- [ ] No blank/white screen
- [ ] Onboarding modal appears (first visit) — dismiss with "Got it, let's play!"
- [ ] F12 → Console tab: no red errors

---

## 2. Play One Solo Round (~3 min)

- [ ] Click "Play Solo"
- [ ] Two concept images appear
- [ ] Type a connection (e.g. "both make you smile")
- [ ] Submit works
- [ ] Venn diagram shows with your answer
- [ ] Score appears (1–10 scale)
- [ ] Score band label shows (Amazing / Great / Solid / Room to grow)
- [ ] First-time milestone popup may appear — dismiss "Awesome!"
- [ ] "Play Again" works

---

## 3. Mobile View (~3 min)

- [ ] F12 → Toggle device toolbar (Ctrl+Shift+M)
- [ ] Select 375px (e.g. iPhone SE)
- [ ] Navigate: lobby → play round → results
- [ ] All text readable
- [ ] No horizontal scroll
- [ ] Buttons tappable

---

## 4. Lighthouse (~3 min)

- [ ] F12 → Lighthouse tab
- [ ] Select Performance, Accessibility, Best Practices, SEO
- [ ] "Analyze page load"
- [ ] Performance ≥ 80
- [ ] Accessibility ≥ 90

---

## 5. Console Check (~2 min)

- [ ] Clear console
- [ ] Navigate: lobby → solo → round → results → play again
- [ ] No red errors
- [ ] Note any warnings

---

## Results

**Overall**: ✅ Pass / 🟡 Minor issues / ❌ Fail

**Notes**:
