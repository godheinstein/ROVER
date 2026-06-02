# Environment Variables Configuration

This document lists all required environment variables for deploying the Robot Query System independently.

## Required Environment Variables

### Database Configuration

```bash
DATABASE_URL="mysql://user:password@host:port/database"
```

**Description:** MySQL/MariaDB connection string for the database.

**Where to get it:**
- **PlanetScale:** Create a database at planetscale.com, get connection string from dashboard
- **Railway:** Add MySQL plugin, copy DATABASE_URL from variables
- **Render:** Create PostgreSQL database (requires changing from MySQL to PostgreSQL in code)

---

### NextAuth Configuration

```bash
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

**NEXTAUTH_SECRET:** Generate with `openssl rand -base64 32` or use any random 32+ character string.

**NEXTAUTH_URL:** Your deployed application URL (e.g., `https://robot-query.railway.app`)

---

### OpenAI API Configuration

```bash
OPENAI_API_KEY="sk-proj-..."
```

**Description:** OpenAI API key for natural language search functionality.

**Where to get it:** 
1. Go to platform.openai.com
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new secret key

**Cost:** Pay-as-you-go, typically $0.002 per query (using GPT-4o-mini)

**Alternative:** If you want to avoid costs, you can disable natural language search and use only filter-based search.

---

### AWS S3 Configuration (Optional)

```bash
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"
```

**Description:** Required only if you want to enable file uploads (robot images, documents).

**Where to get it:**
1. Create AWS account at aws.amazon.com
2. Create an S3 bucket
3. Create IAM user with S3 access
4. Generate access keys

**Alternative:** Use Cloudflare R2 (S3-compatible, free tier available) or disable file uploads.

---

### Application Configuration

```bash
NODE_ENV="production"
PORT="3000"
```

**NODE_ENV:** Set to "production" for deployed environments.

**PORT:** Server port (usually auto-set by hosting platforms).

---

### Admin User Configuration

```bash
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password-here"
ADMIN_NAME="Admin User"
```

**Description:** Creates the first admin user on initial deployment.

**Important:** Change the password immediately after first login!

---

## Platform-Specific Setup

### Railway

1. Create new project
2. Add MySQL plugin
3. Add environment variables in Variables tab
4. Deploy from GitHub repository

### Vercel (Frontend) + Railway (Backend)

**Vercel (Frontend):**
```bash
VITE_API_URL="https://your-backend.railway.app"
```

**Railway (Backend):**
- All backend environment variables listed above

### Render

1. Create Web Service for backend
2. Create PostgreSQL database
3. Add environment variables in Environment tab
4. Note: Requires changing from MySQL to PostgreSQL in code

---

## Security Notes

1. **Never commit .env files** to version control
2. **Use strong passwords** for NEXTAUTH_SECRET and ADMIN_PASSWORD
3. **Rotate API keys** regularly
4. **Use HTTPS** in production (NEXTAUTH_URL must be https://)
5. **Restrict S3 bucket permissions** to minimum required access

---

## Testing Locally

Create a `.env` file in the project root with all variables:

```bash
cp .env.example .env
# Edit .env with your actual values
pnpm install
pnpm db:push
pnpm dev
```

---

## Troubleshooting

**Database connection fails:**
- Check DATABASE_URL format
- Verify database is running and accessible
- Check firewall rules

**Authentication not working:**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Ensure cookies are enabled

**Natural language search fails:**
- Verify OPENAI_API_KEY is valid
- Check API key has sufficient credits
- Review OpenAI API usage dashboard

---

For detailed deployment guides, see:
- `DEPLOY_RAILWAY.md` - Railway deployment
- `DEPLOY_VERCEL.md` - Vercel + Railway deployment
- `DEPLOY_RENDER.md` - Render deployment
