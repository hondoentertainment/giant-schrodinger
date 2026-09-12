# iOS store icon + splash kit

Generated from the in-repo Venn brand (overlapping circles + crosshair on `#1a0533` → `#0a0118`).
Re-run with `npm run ios:assets`. All PNGs are opaque RGB (App Store rule).

| File | Size | Use |
|------|------|-----|
| AppIcon-1024.png | 1024×1024 | App Store / marketing icon |
| icon-180.png | 180×180 | iPhone @3x |
| icon-167.png | 167×167 | iPad Pro |
| icon-152.png | 152×152 | iPad @2x |
| icon-120.png | 120×120 | iPhone @2x |
| splash-2732.png | 2732×2732 | Universal Capacitor splash source |
| splash-1290x2796.png | 1290×2796 | iPhone 6.7" |
| splash-1242x2688.png | 1242×2688 | iPhone 6.5" |
| splash-1170x2532.png | 1170×2532 | iPhone 6.1" |
| splash-2048x2732.png | 2048×2732 | iPad 12.9" |

Drop `AppIcon-1024.png` into `ios/App/App/Assets.xcassets/AppIcon.appiconset/` after `npx cap add ios` if Xcode's empty slot is still placeholder.
