# Mobile Deployment — Venn with Friends

> **Status (September 2026):** Capacitor iOS shell is **in-repo**. Web remains the production game on [Vercel](https://giant-schrodinger.vercel.app/). Xcode archive, signing, and TestFlight are **owner-held** — see [store/OWNER_STEPS.md](store/OWNER_STEPS.md). CI never uses Apple credentials.

## What is real today

| Piece | Status |
|---|---|
| PWA (manifest, icons, service worker, Add to Home Screen tip) | Shipped on web |
| Public privacy / terms | `https://giant-schrodinger.vercel.app/privacy.html` and `terms.html` |
| Capacitor config (`appId` `com.hondoentertainment.vennwithfriends`, `webDir` `dist`) | [capacitor.config.json](capacitor.config.json) |
| iOS platform + `npm run ios:sync` | In-repo; sync on a Mac |
| Safe-area / status bar / keyboard / external-link policy | Web CSS + `src/lib/nativeShell.js` |
| Icon + splash kit | [store/ios/](store/ios/) |
| Store listing copy | [store/STORE_LISTING.md](store/STORE_LISTING.md) |
| Android TWA / Play | Still PWABuilder (below); not a native project in this repo |
| TestFlight / App Store submit | Owner-only |

## iOS: Capacitor (current)

Requires Node 22 and, for archive, a Mac with Xcode and CocoaPods.

```bash
npm ci
npm run ios:assets    # regenerate store/ios PNGs if the brand mark changes
npm run ios:sync      # vite build && npx cap sync ios
npx cap open ios      # Mac only
```

First-time Mac clone if `ios/` is missing or stale:

```bash
npx cap add ios
npm run ios:sync
```

`ios:sync` copies `dist/` into the Xcode web dir. It does not require an Apple ID. Do not add a `cap sync` hook to the Vercel `build` script.

WKWebView policy (already wired):

- Status bar dark on `#07070a`, overlays webview; CSS uses `env(safe-area-inset-*)`
- Keyboard resize mode `body` so the phrase field stays visible
- Splash uses `#0a0118` and hides from JS after boot
- http(s) hosts outside Vercel / Supabase open in the system browser
- Haptics use Vibration API on web and `@capacitor/haptics` in the native shell

## Android: PWABuilder (Trusted Web Activity)

Still the Android path. Native Android is not in this repo.

1. Visit https://www.pwabuilder.com
2. Enter `https://giant-schrodinger.vercel.app/`
3. Package for stores → Android
4. Package name: `com.hondoentertainment.vennwithfriends`
5. App name: Venn with Friends · Launcher: Venn
6. Host: `giant-schrodinger.vercel.app` · Start URL: `/`
7. Theme `#07070a` · Background `#0a0118`

### Digital Asset Links

Add `/.well-known/assetlinks.json` on Vercel after you have a signing cert fingerprint:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.hondoentertainment.vennwithfriends",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

## Store listing

Use [store/STORE_LISTING.md](store/STORE_LISTING.md). Do not advertise daily global leaderboards, IAP, or Labs modes.

## Privacy

Required for both stores. Live URLs:

- https://giant-schrodinger.vercel.app/privacy.html
- https://giant-schrodinger.vercel.app/terms.html

In-app footer still opens the same copy.

## Testing checklist

### Web / PWA
- [ ] First launch shows today's pair as the hero
- [ ] Audio mute is the speaker control next to Edit profile
- [ ] After the first session, a dismissible Add to Home Screen tip may appear (Chrome install prompt or iOS Share instructions)
- [ ] Friend-judge and daily share previews still resolve (`og-tags` + `og-image.png`)

### iOS (TestFlight — owner)
- [ ] App loads on first launch
- [ ] Safe area insets respected
- [ ] Keyboard does not obscure the phrase field
- [ ] Status bar styling is dark
- [ ] Haptics on Lock it in and score reveal
- [ ] External links leave the webview

### Store compliance
- [ ] Privacy and terms URLs load without the JS app
- [ ] Screenshots match current UI (not Labs)
- [ ] Review notes say no login / no IAP
