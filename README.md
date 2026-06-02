# Robot Mobile Manipulator Query System

A comprehensive web application for searching and comparing mobile manipulators, mobile bases, and manipulator arms using natural language queries or advanced filters.

## Features

- **Hybrid Search System**
  - Natural language search powered by OpenAI GPT-4
  - Advanced filter-based search with multiple criteria
  - Real-time results with type-specific specifications

- **Robot Comparison**
  - Select multiple robots for side-by-side comparison
  - View detailed specifications across all criteria
  - Export comparison results

- **Admin Dashboard**
  - Add, edit, and delete robots
  - CSV/Excel bulk upload functionality
  - User management with role-based access control

- **Extensible Database Schema**
  - Type-specific fields (mobile manipulator, mobile base, manipulator arm)
  - Support for dynamic criteria addition
  - Website links for each robot

## Tech Stack

- **Frontend:** React 19, TailwindCSS 4, Wouter, shadcn/ui
- **Backend:** Express 4, tRPC 11, Node.js
- **Database:** MySQL (via Drizzle ORM)
- **Authentication:** NextAuth v5
- **AI:** OpenAI GPT-4o-mini for natural language processing

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and pnpm
- MySQL database
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/godheinstein/Robot_Mobile_Manipulator_Query_System.git
   cd Robot_Mobile_Manipulator_Query_System
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example file
   cp DEPLOYMENT_ENV.md .env
   
   # Edit .env with your actual values:
   DATABASE_URL="mysql://user:password@localhost:3306/robots"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   OPENAI_API_KEY="sk-proj-your-key-here"
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="secure-password"
   ```

4. Push database schema:
   ```bash
   pnpm db:push
   ```

5. Seed sample data (optional):
   ```bash
   npx tsx seed-robots.mjs
   ```

6. Start development server:
   ```bash
   pnpm dev
   ```

7. Open http://localhost:3000

## Deployment

This application can be deployed on multiple platforms. Choose the one that fits your needs:

### Option 1: Railway (Recommended - All-in-One)

Railway provides the simplest deployment with built-in MySQL database.

**Pros:**
- Automatic deployments from GitHub
- Built-in MySQL database
- Simple environment variable management
- $5/month hobby plan

**Guide:** See [DEPLOY_RAILWAY.md](./DEPLOY_RAILWAY.md)

### Option 2: Vercel (Frontend) + Railway (Backend)

Split deployment for better performance and scaling.

**Pros:**
- Vercel's edge network for frontend
- Separate scaling for frontend/backend
- Free frontend hosting on Vercel

**Guide:** See [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)

### Option 3: Render

Alternative all-in-one platform with free tier.

**Pros:**
- Free tier available
- Similar to Railway
- Good for testing

**Guide:** See [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)

### Option 4: Self-Hosted (VPS)

Deploy on your own server for maximum control.

**Pros:**
- Full control
- No platform fees
- Custom configuration

**Guide:** See [DEPLOY_SELF_HOSTED.md](./DEPLOY_SELF_HOSTED.md)

## Environment Variables

All required environment variables are documented in [DEPLOYMENT_ENV.md](./DEPLOYMENT_ENV.md).

Key variables:
- `DATABASE_URL` - MySQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `OPENAI_API_KEY` - For natural language search
- `ADMIN_EMAIL` - First admin user email

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable UI components
│   │   ├── lib/           # tRPC client setup
│   │   └── hooks/         # Custom React hooks
│   └── public/            # Static assets
├── server/                # Backend Express + tRPC
│   ├── _core/             # Core server infrastructure
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database query helpers
│   ├── auth.ts            # NextAuth configuration
│   └── auth.config.ts     # Auth providers setup
├── drizzle/               # Database schema & migrations
│   └── schema.ts          # Database table definitions
├── shared/                # Shared types & constants
└── seed-robots.mjs        # Sample data seeder
```

## Database Schema

### Users Table
- Authentication and user management
- Role-based access (admin/user)
- Email/password or OAuth support

### Robots Table
- Comprehensive robot specifications
- Type-specific fields (mobile manipulator, mobile base, manipulator arm)
- Extensible schema for custom criteria

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed schema documentation.

## API Documentation

The application uses tRPC for type-safe API calls. Main endpoints:

### Public Endpoints
- `robots.list` - Get all robots
- `robots.search` - Filter-based search
- `robots.naturalLanguageQuery` - AI-powered search
- `robots.getById` - Get single robot details

### Protected Endpoints (Admin only)
- `robots.create` - Add new robot
- `robots.update` - Update robot details
- `robots.delete` - Remove robot
- `robots.bulkUpload` - CSV/Excel import

## Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:
- Authentication flow
- Robot CRUD operations
- Natural language query processing
- Bulk upload functionality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation:** See deployment guides in this repository
- **Issues:** Open an issue on GitHub
- **Email:** Contact repository owner

## Roadmap

- [ ] Robot image uploads and gallery
- [ ] PDF export for comparison results
- [ ] Advanced search with range sliders
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Public API for third-party integrations

## Acknowledgments

- Built with [tRPC](https://trpc.io/) for type-safe APIs
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Natural language processing by [OpenAI](https://openai.com/)
- Database ORM by [Drizzle](https://orm.drizzle.team/)

---

**Made with ❤️ for the robotics community**
