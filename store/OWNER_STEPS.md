# Owner-held steps — iOS TestFlight & App Store

Engineering shipped the Capacitor shell, store asset kit, listing copy, and public privacy/terms pages. **Apple signing, certificates, and store submission stay with the owner.** This repo never needs an Apple ID, `.p8`, or provisioning profile in CI.

## Once

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year) on the Hondo Entertainment team.
2. In App Store Connect, create the app:
   - Name: Venn with Friends
   - Bundle ID: `com.hondoentertainment.vennwithfriends`
   - SKU: `venn-with-friends`
3. Create an App Store Connect API key **only if you later want CI uploads**. Do not commit it. Default path is still a local Xcode archive.

## Each TestFlight build (Mac with Xcode)

```bash
git pull
npm ci
npm run ios:sync
npx cap open ios
```

In Xcode:

1. Select the **App** target → Signing & Capabilities → your Team.
2. Confirm bundle ID `com.hondoentertainment.vennwithfriends`.
3. If App Icon is empty, drop `store/ios/AppIcon-1024.png` into `Assets.xcassets/AppIcon.appiconset`.
4. Product → Archive → Distribute App → App Store Connect → Upload.
5. Wait for processing, then add the build to a TestFlight group.

`ios:sync` is `vite build` (same `dist/` as Vercel) then `npx cap sync ios`. It copies the web build into the Xcode project. It does **not** sign.

## TestFlight checklist

- [ ] First launch splash + status bar on notched phones
- [ ] Safe area: Lock it in sits above the home indicator
- [ ] Keyboard does not cover the phrase field
- [ ] Mute toggle in the lobby header works
- [ ] Lock it in / score reveal haptic on a physical iPhone
- [ ] External links (YouTube, mailto) leave the webview via Safari / Browser
- [ ] Privacy and Terms URLs open in Safari and match `public/privacy.html` / `public/terms.html`
- [ ] No Apple credentials in GitHub Actions

## App Review

Use [STORE_LISTING.md](STORE_LISTING.md). Demo account: none. Reviewer plays as a guest profile.

## What engineering will not do

- Put `ASC_API_KEY`, certificates, or profiles in GitHub secrets for this sprint
- Run `xcodebuild` on Linux CI
- Claim ranked / shop / IAP as shipping features
- Rewrite the game in SwiftUI
