# NextStop Deployment

NextStop is split into:

- `src/` and the root Vite app: frontend
- `backend/`: Express API

To make it a real website, host the frontend on Vercel and the backend on Render. Then the app works from a normal URL on desktop and mobile without starting anything locally.

## What was added

- `vercel.json`
  Handles direct-link routing for pages like `/itinerary` and `/shared/:token`.
- `render.yaml`
  Gives Render a backend service config.
- `backend/.env.example`
  Shows the backend env vars you need in production.
- `.env.example`
  Shows the frontend env var you need in production.
- Production CORS support in `backend/src/server.ts`
  Lets you restrict the API to your deployed frontend domain.

## Deploy the backend on Render

1. Push this repo to GitHub.
2. Go to Render and create a new `Web Service`.
3. Connect the GitHub repo.
4. Use these settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
5. Add these environment variables in Render:
   - `CONNECTION_STRING`
   - `GEOAPIFY_API_KEY`
   - `ALLOWED_ORIGINS`
6. Set `ALLOWED_ORIGINS` to your Vercel URL once you have it.
   Example: `https://nextstop.vercel.app`
7. Deploy.

After deploy, your backend URL will look something like:

```txt
https://nextstop-api.onrender.com
```

You can test it with:

```txt
https://nextstop-api.onrender.com/health
```

## Deploy the frontend on Vercel

1. Go to Vercel and create a new project from the same GitHub repo.
2. Set the project root to the repo root, not `backend/`.
3. Use these settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add this environment variable in Vercel:
   - `VITE_API_BASE_URL`
5. Set it to your deployed Render backend URL.
   Example:

```txt
https://nextstop-api.onrender.com
```

6. Deploy.

After deploy, your frontend URL will look something like:

```txt
https://nextstop.vercel.app
```

## Connect the two

Once both are deployed:

1. Copy the Vercel frontend URL.
2. Paste that URL into the Render `ALLOWED_ORIGINS` env var.
3. Save and redeploy Render if needed.
4. Open the Vercel site and test:
   - login
   - generate itinerary
   - save itinerary
   - load saved itinerary
   - shared itinerary link

## Custom domain

You can add a real domain later.

- On Vercel: add your frontend domain like `www.nextstop.com`
- On Render: keep the API on Render or add an API subdomain like `api.nextstop.com`

If you use a custom frontend domain, add it to `ALLOWED_ORIGINS` too.

Example:

```txt
https://www.nextstop.com,https://nextstop.vercel.app
```

## Mobile support

If the site works in a desktop browser, the same Vercel link also works on mobile browsers. No separate mobile deployment is needed.

Before launch, test on a phone or browser device toolbar:

- login screen
- trip form
- itinerary page
- saved trips section
- shared itinerary page

## Local development

Frontend:

```bash
npm install
npm run dev
```

Backend:

```bash
cd backend
npm install
npm run dev
```

## Production env vars summary

Frontend (`.env` in Vercel):

```txt
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

Backend (Render env vars):

```txt
CONNECTION_STRING=your_mongodb_connection_string
GEOAPIFY_API_KEY=your_geoapify_api_key
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```
