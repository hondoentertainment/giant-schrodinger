---
description: Deploy the app to Vercel production
---
# Deploy to Production

// turbo-all

1. Build the production bundle:
```
npm run build
```

2. Deploy to Vercel:
```
npx vercel --prod
```

3. Verify the deployment by checking the output URL (typically https://giant-schrodinger.vercel.app)

## Notes
- Ensure all environment variables are configured in Vercel Dashboard (Settings > Environment Variables)
- Key variables: `VITE_GEMINI_API_KEY`, `VITE_FIREBASE_*`
