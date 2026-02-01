# BooksSwap - Hostinger Deployment Guide

## Files to Copy

Copy these folders/files to your Hostinger VPS:

```
client/
server/
shared/
db/
package.json
package-lock.json
tsconfig.json
vite.config.ts
drizzle.config.ts
postcss.config.js
components.json
```

## Environment Variables Required

Create a `.env` file on Hostinger with:

```
DATABASE_URL=postgresql://username:password@localhost:5432/booksswap
JWT_SECRET=your-secure-random-string-here
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PRICE_ID=price_your_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=hello@booksswap.co.uk
```

## Installation Steps on Hostinger

1. SSH into your VPS
2. Install Node.js 20+
3. Install PostgreSQL
4. Upload the files
5. Run these commands:

```bash
npm install
npm run db:push
npm run build
npm start
```

## Production Port

The app runs on port 5000. Configure your Hostinger reverse proxy (nginx) to point your domain to port 5000.

## Database Setup

Create a PostgreSQL database and user:

```sql
CREATE DATABASE booksswap;
CREATE USER booksswap_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE booksswap TO booksswap_user;
```

Then update DATABASE_URL in your .env file.
