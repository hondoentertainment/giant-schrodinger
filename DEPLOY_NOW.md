# Deploy Venn with Friends to GitHub Pages

## Prerequisites

- Node.js 20+ installed
- All 179 tests passing (`npm run test`)
- Production build succeeding (`npm run build`)
- GitHub repository access

## Quick 3-Step Deployment

> **Estimated Time**: 10 minutes total

### Step 1: Push Your Changes (3 minutes)

The repository already includes the GitHub Actions deployment workflow at `.github/workflows/deploy.yml`. This workflow runs tests, builds, and deploys automatically.

```bash
git push origin main
```

### Step 2: Enable GitHub Pages (2 minutes)

1. Go to https://github.com/hondoentertainment/giant-schrodinger
2. Click **Settings**
3. Scroll to **Pages** (left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Click **Save**

### Step 3: Monitor Deployment (2-5 minutes)

1. Go to **Actions** tab at https://github.com/hondoentertainment/giant-schrodinger/actions
2. Watch the "Deploy to GitHub Pages" workflow
3. The workflow runs unit tests (179), E2E tests (5 specs), then builds and deploys
4. Wait for green checkmark

## Done

Visit: **https://hondoentertainment.github.io/giant-schrodinger**

---

## Optional: Add Production Environment Secrets

For real AI scoring and multiplayer, add secrets in GitHub:

1. Go to **Settings** > **Secrets and variables** > **Actions**
2. Add repository secrets:

| Secret | Description | Source |
|--------|-------------|--------|
| `VITE_GEMINI_API_KEY` | AI scoring | https://aistudio.google.com/apikey |
| `VITE_SUPABASE_URL` | Multiplayer and persistence | https://supabase.com |
| `VITE_SUPABASE_ANON_KEY` | Database access | Supabase project settings |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Shop payments | https://dashboard.stripe.com |
| `VITE_VAPID_PUBLIC_KEY` | Push notifications | Generate with `web-push` |
| `VITE_SENTRY_DSN` | Error monitoring | https://sentry.io |

The app works without any of these -- mock data is used for all optional services.

---

## Deploy Supabase Edge Functions

If using Supabase for multiplayer and server-side scoring:

```bash
supabase link --project-ref your-project-ref
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
supabase functions deploy score-submission
supabase functions deploy og-tags
supabase functions deploy discord-bot
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment details.
See [DISCORD_BOT.md](DISCORD_BOT.md) for Discord bot setup.
See [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) for app store preparation.

---

## Troubleshooting

### Site shows 404
- Verify GitHub Pages is enabled with Source set to "GitHub Actions"
- Check that the latest push triggered the workflow in the Actions tab

### Workflow shows red X
- Go to Actions tab, click the failed run, and read the error
- Common cause: test failure -- run `npm run test` locally to debug

### Page loads but features are broken
- Test locally first: `npm run build && npm run preview`
- Check browser console (F12) for errors
- Verify environment secrets are set if using real services

---

## Verification

After deployment:
1. Open https://hondoentertainment.github.io/giant-schrodinger
2. Press F12, check Console for errors
3. Click "Play Solo" and complete one round
4. Check mobile view (F12 > Toggle device toolbar)
5. Run Lighthouse audit from DevTools
