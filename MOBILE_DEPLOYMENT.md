# Mobile Deployment Guide for Venn with Friends

## Android: PWABuilder (Trusted Web Activity)

### Steps

1. Visit https://www.pwabuilder.com
2. Enter the app URL: `https://hondoentertainment.github.io/giant-schrodinger/`
3. PWABuilder will analyze the PWA and generate a report
4. Click **Package for stores** > **Android**
5. Configure the TWA options:
   - Package name: `com.hondoentertainment.vennwithfriends`
   - App name: Venn with Friends
   - Launcher name: Venn
   - Version code: 1
   - Version name: 1.0.0
   - Host: `hondoentertainment.github.io`
   - Start URL: `/giant-schrodinger/`
   - Theme color: `#1a0533`
   - Background color: `#0a0118`
   - Navigation color: `#1a0533`
6. Download the generated APK/AAB
7. Sign the AAB with your upload key for Google Play

### Digital Asset Links

Add `/.well-known/assetlinks.json` to your hosting:

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

## iOS: Capacitor Setup

### Initial Setup

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Venn with Friends" com.hondoentertainment.vennwithfriends --web-dir dist
npm install @capacitor/ios
npx cap add ios
```

### Build and Deploy

```bash
npm run build
npx cap sync ios
npx cap open ios
```

This opens the project in Xcode where you can configure signing and submit to the App Store.

### Capacitor Configuration (`capacitor.config.ts`)

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hondoentertainment.vennwithfriends',
  appName: 'Venn with Friends',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
```

## Required Assets

### Icons

| Size     | Usage                        | Format |
|----------|------------------------------|--------|
| 192x192  | Android adaptive icon, PWA   | PNG    |
| 512x512  | Google Play, PWA splash      | PNG    |
| 1024x1024| App Store (iOS)              | PNG    |
| 48x48    | Android notification icon    | PNG    |
| 72x72    | Android launcher (mdpi)      | PNG    |
| 96x96    | Android launcher (hdpi)      | PNG    |
| 144x144  | Android launcher (xxhdpi)    | PNG    |
| 180x180  | iOS app icon                 | PNG    |

All icons must be square, without transparency for iOS.

### Splash Screens

| Device          | Size       |
|-----------------|------------|
| iPhone SE       | 640x1136   |
| iPhone 8        | 750x1334   |
| iPhone 8 Plus   | 1242x2208  |
| iPhone X/XS/11  | 1125x2436  |
| iPhone 14 Pro Max| 1290x2796 |
| iPad            | 1536x2048  |
| iPad Pro 12.9   | 2048x2732  |
| Android phone   | 1080x1920  |
| Android tablet  | 1200x1920  |

Use dark gradient background (`#1a0533` to `#0a0118`) with centered app logo.

## Store Listing Metadata

### Template

- **App Name**: Venn with Friends
- **Subtitle** (iOS, 30 chars): Creative word game with friends
- **Short Description** (Google Play, 80 chars): Connect two random concepts with one clever phrase. Score big with wit and logic.
- **Full Description**:
  > Venn with Friends is the ultimate creative word game. Each round, you are given two random concepts and must find the perfect phrase that connects them both. Get scored on wit, logic, originality, and clarity.
  >
  > Features:
  > - Solo and multiplayer modes
  > - Daily challenges with global leaderboards
  > - AI-powered scoring with detailed breakdowns
  > - Achievements and progression system
  > - Custom theme builder
  > - Tournament and async chain modes
  >
  > Challenge your friends and see who has the sharpest mind!

- **Category**: Games > Word
- **Keywords**: word game, creative, puzzle, friends, multiplayer, trivia, brain teaser
- **Content Rating**: Everyone / 4+

### Screenshots Needed

| Platform    | Count | Sizes                                      |
|-------------|-------|---------------------------------------------|
| iPhone 6.7" | 3-10  | 1290x2796                                   |
| iPhone 6.5" | 3-10  | 1284x2778 or 1242x2688                      |
| iPad 12.9"  | 3-10  | 2048x2732                                   |
| Android     | 2-8   | 1080x1920 (min 320px, max 3840px per side)  |

Recommended screenshot content:
1. Lobby / home screen
2. Active gameplay round
3. Score reveal with AI commentary
4. Leaderboard
5. Daily challenge
6. Multiplayer room

## Privacy Policy Requirements

A privacy policy is **required** for both App Store and Google Play. It must cover:

- What data is collected (username, scores, gameplay data)
- How data is stored (localStorage, Supabase)
- Third-party services used (Supabase, AI scoring API)
- Data retention and deletion policies
- Contact information for privacy inquiries
- COPPA compliance statement (if targeting children)
- GDPR compliance (for EU users)

Host the privacy policy at a public URL, e.g.:
`https://hondoentertainment.github.io/giant-schrodinger/privacy-policy.html`

## Testing Checklist

### General
- [ ] App loads correctly on first launch
- [ ] All game modes function (solo, multiplayer, daily challenge)
- [ ] Scoring and AI evaluation work correctly
- [ ] Audio plays and mute toggle works
- [ ] Haptic feedback works on supported devices

### Android (TWA)
- [ ] App installs from Google Play (or sideloaded AAB)
- [ ] No browser chrome visible (verified TWA)
- [ ] Digital Asset Links validated
- [ ] Back button navigation works correctly
- [ ] Push notifications work (if implemented)
- [ ] App survives process death and restores state

### iOS (Capacitor)
- [ ] App installs via TestFlight
- [ ] Safe area insets are respected (notch, home indicator)
- [ ] Keyboard does not obscure input fields
- [ ] Status bar styling is correct
- [ ] App handles background/foreground transitions
- [ ] No WebKit-specific rendering issues

### Performance
- [ ] Initial load time under 3 seconds on 4G
- [ ] Smooth animations (60fps) on mid-range devices
- [ ] Memory usage stays reasonable over extended play
- [ ] Offline mode works for cached content

### Store Compliance
- [ ] Privacy policy URL is accessible
- [ ] App metadata meets character limits
- [ ] Screenshots match current app UI
- [ ] Content rating questionnaire completed
- [ ] No use of restricted permissions without justification
