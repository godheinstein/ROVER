# Railway Deployment Guide

This guide walks you through deploying the Robot Query System on Railway - an all-in-one platform that handles frontend, backend, and database.

## Prerequisites

- GitHub account with the source code repository
- Railway account (sign up at railway.app)
- OpenAI API key (from platform.openai.com)

---

## Step 1: Prepare Your Repository

1. Ensure all code is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. Verify these files exist in your repository:
   - `package.json`
   - `drizzle.config.ts`
   - `vite.config.ts`
   - All source code in `client/` and `server/`

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `Robot_Mobile_Manipulator_Query_System` repository
5. Railway will detect it as a Node.js project

---

## Step 3: Add MySQL Database

1. In your Railway project dashboard, click "+ New"
2. Select "Database" → "Add MySQL"
3. Railway will automatically create a MySQL database
4. The `DATABASE_URL` variable will be automatically added to your service

---

## Step 4: Configure Environment Variables

1. Click on your service (the one connected to GitHub)
2. Go to "Variables" tab
3. Add the following variables:

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# OpenAI API
OPENAI_API_KEY=sk-proj-your-key-here

# Admin User (first-time setup)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-secure-password
ADMIN_NAME=Admin User

# Application
NODE_ENV=production
```

**Important Notes:**
- `${{RAILWAY_PUBLIC_DOMAIN}}` is a Railway variable that auto-fills your domain
- Generate NEXTAUTH_SECRET locally: `openssl rand -base64 32`
- Get OPENAI_API_KEY from platform.openai.com

---

## Step 5: Configure Build Settings

1. In your service settings, go to "Settings" tab
2. Set the following:

**Build Command:**
```bash
pnpm install && pnpm db:push && pnpm build
```

**Start Command:**
```bash
pnpm start
```

**Root Directory:** Leave empty (uses repository root)

---

## Step 6: Add Start Script to package.json

Ensure your `package.json` has a start script:

```json
{
  "scripts": {
    "start": "NODE_ENV=production node server/_core/index.js",
    "build": "vite build",
    "dev": "NODE_ENV=development tsx watch server/_core/index.ts"
  }
}
```

---

## Step 7: Deploy

1. Railway will automatically deploy after you add environment variables
2. Monitor the deployment logs in the "Deployments" tab
3. Wait for the build to complete (usually 3-5 minutes)

---

## Step 8: Access Your Application

1. Once deployed, Railway provides a public URL (e.g., `robot-query-production.up.railway.app`)
2. Click the URL or find it in the "Settings" → "Domains" section
3. Your application should be live!

---

## Step 9: Create Admin Account

1. Navigate to your deployed URL
2. Go to `/register` (or use the registration page)
3. Register with the ADMIN_EMAIL you configured
4. The system will automatically grant admin role to this email

---

## Step 10: Custom Domain (Optional)

1. In Railway project, go to service "Settings"
2. Click "Domains" section
3. Click "Generate Domain" for a railway.app subdomain
4. Or click "Custom Domain" to add your own domain
5. Follow DNS configuration instructions

---

## Troubleshooting

### Build Fails

**Error:** "Cannot find module"
- Solution: Check `package.json` dependencies are correct
- Run `pnpm install` locally to verify

**Error:** "Database connection failed"
- Solution: Verify MySQL plugin is added and DATABASE_URL is set
- Check database is running in Railway dashboard

### Application Doesn't Start

**Error:** "Port already in use"
- Solution: Railway auto-assigns PORT variable, don't hardcode port numbers
- Use `process.env.PORT || 3000` in your server code

**Error:** "NEXTAUTH_URL not set"
- Solution: Ensure NEXTAUTH_URL is set to `${{RAILWAY_PUBLIC_DOMAIN}}`

### Authentication Issues

**Error:** "Invalid credentials"
- Solution: Check NEXTAUTH_SECRET is set correctly
- Verify admin user was created with correct email

**Error:** "Callback URL mismatch"
- Solution: Ensure NEXTAUTH_URL matches your actual domain (including https://)

---

## Monitoring & Logs

1. **View Logs:** Click "Deployments" → Select deployment → View logs
2. **Metrics:** Railway provides CPU, memory, and network metrics
3. **Alerts:** Set up alerts in project settings

---

## Updating Your Application

Railway automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Railway will detect the push and trigger a new deployment.

---

## Cost Estimation

Railway Pricing (as of 2024):
- **Hobby Plan:** $5/month for 500 hours of usage
- **Pro Plan:** $20/month for unlimited usage
- **Database:** Included in plan, no extra charge

**Additional Costs:**
- OpenAI API: ~$0.002 per natural language query
- Custom domain: Free (you pay domain registrar)

---

## Scaling

Railway automatically scales based on traffic:
- **Vertical Scaling:** Upgrade plan for more resources
- **Horizontal Scaling:** Contact Railway for multi-instance deployments

---

## Backup & Recovery

1. **Database Backups:**
   - Railway automatically backs up MySQL daily
   - Access backups in database service settings

2. **Code Backups:**
   - Your code is in GitHub (version controlled)
   - Railway keeps deployment history

---

## Next Steps

1. **Set up monitoring:** Add error tracking (Sentry, LogRocket)
2. **Configure CDN:** Use Cloudflare for static assets
3. **Add CI/CD:** Set up automated testing before deployment
4. **Security:** Enable 2FA on Railway account

---

## Support

- **Railway Docs:** docs.railway.app
- **Railway Discord:** Community support
- **GitHub Issues:** Report bugs in your repository

---

**Congratulations!** Your Robot Query System is now deployed on Railway. 🚀
