# App Store listing — Venn with Friends

Copy-paste draft for App Store Connect. **Do not claim Labs modes, global leaderboards, or cloud accounts.** Screenshots must match the live web UI.

## Identity

| Field | Value |
|---|---|
| Name | Venn with Friends |
| Subtitle (30 chars) | Today's pair. One witty line. |
| Bundle ID | `com.hondoentertainment.vennwithfriends` |
| SKU | `venn-with-friends` |
| Category | Games → Word |
| Content rating | 4+ |
| Price | Free (no IAP in this build) |

## Promotional text (170)

Today's pair, one line, score the overlap. Play solo, share a Friend Judge link, or open a room. Same puzzle worldwide.

## Description

Venn with Friends is a creative word game. Each round you see two prompts and write one phrase that lives in the overlap. Score wit, logic, originality, and clarity — yourself, an optional AI judge, a friend with a share link, or a live room vote.

What's in this release:

- Today's pair — the same daily puzzle for everyone, with a 1.5× bonus
- Solo sessions and a personal gallery
- Friend Judge share links (and Open Graph previews when backend is configured)
- Play with Friends rooms when the host has a live server
- Optional Add to Home Screen / iOS wrapper of the same web game

What is **not** in this release (and must not appear in screenshots or copy):

- Cloud accounts or sign-in
- Stripe / in-app purchases
- Global ranked ladders, shops, or tournaments (those stay device-local Labs)

## Keywords (100 chars)

word game,party game,daily puzzle,friends,wit,venn,trivia,creative

## Support + legal URLs

| Field | URL |
|---|---|
| Marketing | https://giant-schrodinger.vercel.app/ |
| Privacy | https://giant-schrodinger.vercel.app/privacy.html |
| Terms | https://giant-schrodinger.vercel.app/terms.html |
| Support | mailto:support@hondoentertainment.com |

## Screenshots (owner captures on device)

Need 3–10 per size. Capture from TestFlight or Safari, not Labs screens.

1. Create Profile with today's pair showing
2. Round — two prompts + “Lock it in”
3. Reveal — score + fusion
4. Session summary / first-session wrap
5. Friends room waiting (code + Start the round)
6. Gallery of saved lines

Sizes: iPhone 6.7" (1290×2796), 6.5" (1242×2688), iPad 12.9" (2048×2732) if you ship iPad.

## Review notes (paste in App Review Information)

This build is a WKWebView of the production web game at https://giant-schrodinger.vercel.app/. No login is required. Create a profile with any short name, tap Play today's pair, write a phrase, tap Lock it in, then score or share. Multiplayer rooms need the hosted backend; solo and daily always work. There are no in-app purchases. Experimental Labs (ranked / shop / tournaments) are hidden device previews and are not part of the review path.
