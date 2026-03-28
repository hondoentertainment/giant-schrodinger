# Deploying Venn with Friends to GitHub Pages

## Quick Deploy (Recommended)

### Option 1: Using GitHub Actions (Automated)

The repository already includes two CI/CD workflows in `.github/workflows/`:

- **deploy.yml** -- Runs on every push to `main` and on manual dispatch. It installs dependencies, runs unit tests (179 tests), installs Playwright and runs E2E tests, builds the production bundle, and deploys to GitHub Pages.
- **lighthouse.yml** -- Runs on pull requests to `main`. It builds the app and runs Lighthouse CI against the thresholds in `lighthouse.config.js`.

To enable deployment:

1. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings > Pages
   - Source: "GitHub Actions"
   - Save

2. **Push to trigger deployment**:
   ```bash
   git push origin main
   ```

3. **Your site will be live at**: `https://hondoentertainment.github.io/giant-schrodinger`

---

### Option 2: Manual Deploy with gh-pages Package

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script to package.json**:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

---

### Option 3: PowerShell Deploy Script

Create `scripts/deploy.ps1`:

```powershell
#!/usr/bin/env pwsh

Write-Host "🚀 Deploying Venn with Friends to GitHub Pages..." -ForegroundColor Cyan

# Build the project
Write-Host "`n📦 Building production bundle..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Navigate to dist
Set-Location dist

# Initialize git in dist if not exists
if (-not (Test-Path .git)) {
    git init
    git branch -M gh-pages
}

# Add and commit
git add -A
git commit -m "Deploy to GitHub Pages"

# Force push to gh-pages branch
Write-Host "`n🚀 Pushing to GitHub Pages..." -ForegroundColor Yellow
git push -f git@github.com:HondoEntertainment/giant-schrodinger.git gh-pages

Write-Host "`n✅ Deployment complete!" -ForegroundColor Green
Write-Host "Your site should be live at: https://hondoentertainment.github.io/giant-schrodinger" -ForegroundColor Cyan

# Return to root
Set-Location ..
```

Run with:
```bash
./scripts/deploy.ps1
```

---

## Important Configuration

### ✅ Already Configured

Your `vite.config.js` is now correctly set with:

```javascript
export default defineConfig({
    plugins: [react()],
    base: '/giant-schrodinger/', // Required for GitHub Pages
})
```

### Environment Variables for Production

If you need environment variables in production:

1. **For GitHub Actions**: Add secrets in repository settings
   - Settings > Secrets and variables > Actions
   - Add: `VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, etc.

2. **Update workflow** to use secrets:
   ```yaml
   - name: Build
     env:
       VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
     run: npm run build
   ```

---

## Troubleshooting

### 404 on refresh
- This is normal for SPAs on GitHub Pages
- Solution: Use hash routing or configure 404.html redirect

### Assets not loading (404)
- Check `base` in `vite.config.js` matches repo name
- Should be `/giant-schrodinger/` for your repo

### Changes not appearing
- Clear browser cache (Ctrl+Shift+R)
- Wait 1-2 minutes for GitHub Pages to update
- Check Actions tab for deployment status

---

## Verifying Deployment

1. **Check build locally first**:
   ```bash
   npm run build
   npm run preview
   ```
   Visit: `http://localhost:4173/giant-schrodinger/`

2. **Check GitHub Actions**:
   - Go to Actions tab in GitHub
   - Ensure workflow completed successfully

3. **Visit your site**:
   - https://hondoentertainment.github.io/giant-schrodinger

4. **Check console for errors**:
   - F12 > Console
   - Look for 404s or CORS errors

---

## Supabase Backend Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **Anon Key** from Settings > API.

### 2. Run the Database Schema

1. Open the SQL Editor in your Supabase dashboard.
2. Paste the contents of `supabase/schema.sql` and run it.
3. This creates all tables (users, rounds, leaderboard, challenges, rooms, analytics_events) with Row Level Security policies and indexes.

### 3. Configure Environment Variables

Add these to your `.env` (local) or GitHub Actions secrets (production):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For Edge Functions (server-side scoring), set secrets via the Supabase CLI:

```bash
supabase secrets set GEMINI_API_KEY=your-gemini-api-key
```

### 4. Deploy Edge Functions

Install the Supabase CLI, then deploy all three functions:

```bash
# Link to your project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set GEMINI_API_KEY=your-gemini-api-key

# Deploy all Edge Functions
supabase functions deploy score-submission
supabase functions deploy og-tags
supabase functions deploy discord-bot
```

See [DISCORD_BOT.md](DISCORD_BOT.md) for Discord bot configuration details.

### 5. Enable Server-Side Scoring

The `score-submission` Edge Function runs Gemini scoring server-side so the API key is never exposed to the client. To enable it:

1. Deploy the function (see above).
2. Set the `GEMINI_API_KEY` secret on your Supabase project.
3. Update the client to call the Edge Function endpoint instead of the client-side Gemini API when `VITE_SUPABASE_URL` is configured.

### 6. Dynamic OG Tags

The `og-tags` Edge Function serves custom Open Graph meta tags for shared links. When a player shares a round or challenge, the link points to the Edge Function URL which returns HTML with the correct OG tags and then redirects to the app.

---

## Mobile Deployment

For deploying to iOS and Android app stores as a PWA wrapper, see [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md).

---

## Next Steps

1. Choose deployment method (GitHub Actions recommended)
2. Set up environment variables if needed
3. Deploy Edge Functions to Supabase (score-submission, og-tags, discord-bot)
4. Deploy
5. Test thoroughly using `TEST_REVIEW_CHECKLIST.md`
6. See [DISCORD_BOT.md](DISCORD_BOT.md) for Discord integration setup
7. See [MOBILE_DEPLOYMENT.md](MOBILE_DEPLOYMENT.md) for app store preparation
