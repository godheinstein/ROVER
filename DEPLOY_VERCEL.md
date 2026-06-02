# Vercel + Railway Deployment Guide

This guide shows you how to deploy the Robot Query System with:
- **Frontend on Vercel** (edge network, fast global delivery)
- **Backend on Railway** (Node.js server + MySQL database)

This split deployment provides better performance and independent scaling.

## Prerequisites

- GitHub account with source code
- Vercel account (vercel.com)
- Railway account (railway.app)
- OpenAI API key

---

## Part 1: Deploy Backend on Railway

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will create a service

### Step 2: Add MySQL Database

1. Click "+ New" in your project
2. Select "Database" → "Add MySQL"
3. DATABASE_URL will be auto-configured

### Step 3: Configure Backend Environment Variables

Add these variables to your Railway service:

```bash
# NextAuth
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=https://your-frontend.vercel.app

# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-password
ADMIN_NAME=Admin User

# App
NODE_ENV=production
```

**Important:** Set `NEXTAUTH_URL` to your Vercel frontend URL (you'll get this in Part 2).

### Step 4: Configure Build Settings

**Build Command:**
```bash
pnpm install && pnpm db:push && pnpm build
```

**Start Command:**
```bash
pnpm start
```

### Step 5: Deploy Backend

Railway will automatically deploy. Note your backend URL (e.g., `robot-api.railway.app`).

---

## Part 2: Deploy Frontend on Vercel

### Step 1: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will detect it as a Vite project

### Step 2: Configure Build Settings

**Framework Preset:** Vite

**Build Command:**
```bash
pnpm build
```

**Output Directory:**
```
client/dist
```

**Install Command:**
```bash
pnpm install
```

### Step 3: Add Environment Variables

In Vercel project settings, add:

```bash
VITE_API_URL=https://your-backend.railway.app
```

Replace `your-backend.railway.app` with your actual Railway backend URL.

### Step 4: Deploy Frontend

Click "Deploy". Vercel will build and deploy your frontend.

Note your Vercel URL (e.g., `robot-query.vercel.app`).

---

## Part 3: Connect Frontend and Backend

### Step 1: Update Backend NEXTAUTH_URL

1. Go back to Railway
2. Update `NEXTAUTH_URL` to your Vercel URL:
   ```bash
   NEXTAUTH_URL=https://robot-query.vercel.app
   ```
3. Railway will redeploy automatically

### Step 2: Configure CORS (if needed)

If you encounter CORS errors, add this to your backend `server/_core/index.ts`:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://robot-query.vercel.app',
  credentials: true,
}));
```

Add `FRONTEND_URL` to Railway environment variables.

---

## Part 4: Custom Domains (Optional)

### Frontend Domain (Vercel)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain (e.g., `robots.yourdomain.com`)
3. Configure DNS records as shown by Vercel
4. Vercel will automatically provision SSL certificate

### Backend Domain (Railway)

1. In Railway service settings, go to "Domains"
2. Add custom domain (e.g., `api.yourdomain.com`)
3. Configure DNS CNAME to Railway's domain
4. Update `NEXTAUTH_URL` and `VITE_API_URL` accordingly

---

## Troubleshooting

### CORS Errors

**Symptom:** "Access-Control-Allow-Origin" errors in browser console

**Solution:**
1. Verify `FRONTEND_URL` is set correctly in Railway
2. Add CORS middleware in backend
3. Ensure credentials are included in requests

### Authentication Not Working

**Symptom:** Login fails or redirects incorrectly

**Solution:**
1. Verify `NEXTAUTH_URL` matches your Vercel frontend URL exactly
2. Check `NEXTAUTH_SECRET` is set
3. Ensure cookies are enabled and not blocked by browser

### API Calls Failing

**Symptom:** Frontend can't reach backend

**Solution:**
1. Verify `VITE_API_URL` in Vercel matches Railway backend URL
2. Check Railway service is running
3. Test backend directly: `curl https://your-backend.railway.app/api/health`

---

## Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. View real-time traffic and performance metrics
3. Set up alerts for errors

### Railway Logs

1. View logs in Railway dashboard
2. Monitor CPU and memory usage
3. Set up log drains for external monitoring

---

## Cost Estimation

**Vercel:**
- Hobby: Free for personal projects
- Pro: $20/month for teams

**Railway:**
- Hobby: $5/month for 500 hours
- Pro: $20/month unlimited

**OpenAI API:**
- ~$0.002 per natural language query

**Total:** ~$5-25/month depending on usage

---

## Scaling

### Frontend Scaling (Vercel)

- Automatic edge caching
- Global CDN distribution
- Serverless functions for API routes

### Backend Scaling (Railway)

- Vertical scaling: Upgrade Railway plan
- Horizontal scaling: Contact Railway support
- Database: Railway handles scaling automatically

---

## CI/CD Pipeline

Both platforms auto-deploy on git push:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

- Vercel: Deploys frontend automatically
- Railway: Deploys backend automatically

---

## Performance Optimization

### Frontend (Vercel)

1. **Enable Vercel Analytics:** Monitor Core Web Vitals
2. **Image Optimization:** Use Vercel Image Optimization
3. **Caching:** Configure cache headers for static assets

### Backend (Railway)

1. **Database Indexing:** Add indexes to frequently queried fields
2. **Connection Pooling:** Configure MySQL connection pool
3. **Caching:** Add Redis for query caching (optional)

---

## Security Checklist

- [ ] HTTPS enabled on both frontend and backend
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] CORS configured to allow only your frontend domain
- [ ] Database credentials secured (use Railway's DATABASE_URL)
- [ ] API keys stored in environment variables, not code
- [ ] Rate limiting enabled on API endpoints
- [ ] Input validation on all user inputs

---

## Backup Strategy

### Code Backup
- GitHub repository (version controlled)
- Vercel and Railway keep deployment history

### Database Backup
- Railway automatic daily backups
- Manual backups: Export via Railway dashboard
- Consider setting up automated backups to S3

---

## Next Steps

1. **Set up monitoring:** Add Sentry or LogRocket
2. **Configure CDN:** Use Cloudflare in front of Vercel
3. **Add caching:** Implement Redis on Railway
4. **Performance testing:** Use Lighthouse and WebPageTest
5. **Load testing:** Test backend with k6 or Artillery

---

## Support Resources

- **Vercel Docs:** vercel.com/docs
- **Railway Docs:** docs.railway.app
- **Community:** Discord servers for both platforms

---

**Congratulations!** Your Robot Query System is now deployed with optimal performance. 🚀
