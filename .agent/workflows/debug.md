---
description: Debug and fix app loading issues
---
# Debug App Loading Issues

## Quick Diagnostics

1. Check if the build succeeds:
```
npm run build
```

2. Start local dev server to test:
```
cmd /c "npm run dev"
```

3. Test the production URL via HTTP:
   - Use `read_url_content` tool on https://giant-schrodinger.vercel.app
   - Verify HTML shell is served correctly

## Common Issues

### Build Fails
- Check `src/index.css` for invalid Tailwind classes in `@apply` rules
- Arbitrary values with special characters (like `rgba(...)`) should use standard CSS instead of @apply

### App Doesn't Render (blank page)
- Check browser console (F12 → Console) for JavaScript errors
- Common causes:
  - Missing CSS animation classes (used but not defined)
  - Import errors (file not found)
  - Runtime errors in context providers

### Firebase/Auth Issues
- Verify environment variables are set in `.env`:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - etc.
- Firebase is optional; app should degrade gracefully without it

## Fix and Redeploy
After fixing, use `/deploy` workflow to push changes to production.
