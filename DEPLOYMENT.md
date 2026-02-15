# Deploying Venn with Friends to GitHub Pages

## Quick Deploy (Recommended)

### Option 1: Using GitHub Actions (Automated)

1. **Create GitHub Actions workflow file**:

   Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node
           uses: actions/setup-node@v4
           with:
             node-version: '18'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           run: npm run build
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: ./dist

     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings > Pages
   - Source: "GitHub Actions"
   - Save

3. **Push to trigger deployment**:
   ```bash
   git add .
   git commit -m "Add GitHub Actions deployment"
   git push origin main
   ```

4. **Your site will be live at**: `https://hondoentertainment.github.io/giant-schrodinger`

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

## Next Steps

1. Choose deployment method (GitHub Actions recommended)
2. Set up environment variables if needed
3. Deploy
4. Test thoroughly using `TEST_REVIEW_CHECKLIST.md`
5. Share with friends! 🎉
