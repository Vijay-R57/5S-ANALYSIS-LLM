# Deploying ARCOLAB 5S to Vercel

This guide outlines how to deploy the **ARCOLAB 5S** frontend application to [Vercel](https://vercel.com).

---

## 🚀 Quick Deployment Options

### Option 1: Root Directory Deployment (Default / Recommended)

The workspace includes a root `vercel.json` configured for monorepo / subfolder builds out of the box.

1. Connect your GitHub repository to Vercel.
2. Select **Vite** as the Framework Preset (Vercel automatically detects `vercel.json`).
3. Set the **Environment Variables** in Vercel (see section below).
4. Click **Deploy**.

---

### Option 2: Set Root Directory to `frontend`

If you prefer to configure Vercel to target the frontend subdirectory directly:

1. In Vercel Project Settings → **General**:
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Select `Vite`
   - **Build Command**: `npm run build` (or `vite build`)
   - **Output Directory**: `dist`
2. Save settings and deploy.

---

## 🔑 Environment Variables

Add the following environment variables in the **Vercel Dashboard → Environment Variables** settings:

| Variable Name | Required | Description | Example Value |
| :--- | :---: | :--- | :--- |
| `VITE_SUPABASE_URL` | Yes | Supabase Project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase Publishable / Anon Key | `sb_publishable_...` |
| `VITE_GEMINI_API_KEY` | Yes | Gemini API Key for browser-side AI analysis | `AIzaSy...` |
| `VITE_BYPASS_SUPABASE_FUNCTIONS` | Optional | Set to `false` in production (default `false`) | `false` |
| `VITE_AI_DEBUG` | Optional | Set to `false` in production | `false` |

---

## 🛠️ Verification & Build Check

Before deploying, you can run a local production build check:

```bash
cd frontend
npm run build
```

This compiles the TypeScript code and produces the optimized static build assets in `frontend/dist/`.

---

## ⚡ Single Page Application (SPA) Routing

Both root `vercel.json` and `frontend/vercel.json` include SPA rewrite rules so that client-side routes (such as `/office-selection`, `/history`, `/audit`) load cleanly without 404 errors on page refresh:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
