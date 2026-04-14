# NeuroVault Deployment Guide (Free Tier)

This document explains how to deploy the separated NeuroVault monorepo to **Vercel** and **Render** using free tiers for all services.

## 1. Prerequisites (Free Services)

| Service | Purpose | Recommended Provider |
| :--- | :--- | :--- |
| **Frontend** | Next.js UI | [Vercel](https://vercel.com) |
| **Backend** | Express API & Worker | [Render](https://render.com) |
| **Database** | Metadata Store | [MongoDB Atlas](https://mongodb.com/atlas) |
| **Vector DB** | Embeddings | [Supabase](https://supabase.com) (pgvector) |
| **Queue** | BullMQ Broker | [Upstash Redis](https://upstash.com) |
| **Storage** | File Storage | [Supabase Storage](https://supabase.com) or [AWS S3](https://aws.amazon.com) |

---

## 2. Backend Deployment (Render)

1.  Create a **New Web Service** on Render.
2.  Connect your GitHub repository.
3.  **Root Directory**: `apps/backend` (or leave empty and set build/start commands below).
4.  **Environment**: `Node`.
5.  **Build Command**: `cd .. && npm install && npm run build -w @neurovault/backend`
6.  **Start Command**: `npm run start`
7.  **Plan**: `Free`.
8.  **Environment Variables**: Add all variables from `.env.example` (especially `MONGODB_URI`, `REDIS_URL`, `SUPABASE_*`, `NEXTAUTH_SECRET`).

> [!TIP]
> **Stay Awake**: Render free tier sleeps after 15m. Use [Cron-job.org](https://cron-job.org) to ping your Render URL's `/health` endpoint every 10 minutes.

---

## 3. Frontend Deployment (Vercel)

1.  Import your repository into Vercel.
2.  **Root Directory**: `apps/frontend`.
3.  Vercel will automatically detect Next.js.
4.  **Environment Variables**:
    *   `NEXT_PUBLIC_SERVER_URL`: Your Render Web Service URL (e.g., `https://neurovault-api.onrender.com`).
    *   `NEXTAUTH_URL`: Your Vercel URL (e.g., `https://neurovault.vercel.app`).
    *   `NEXTAUTH_SECRET`: **Must match the Backend's NEXTAUTH_SECRET**.
    *   `GOOGLE_CLIENT_ID` / `GITHUB_CLIENT_ID`: For Auth.

---

## 4. Local Development

To run both frontend and backend locally from the root:
```bash
npm install
npm run dev
```
This uses `concurrently` to start the Next.js app (3000) and Express server (3001).
