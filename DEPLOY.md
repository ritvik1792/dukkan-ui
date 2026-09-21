# Deploy Dukkan UI to Google Cloud

The UI is a Next.js app on **Cloud Run**. The API, Cloud SQL, and Secret Manager live in the `dukkan` repo — follow **[dukkan/DEPLOY.md](../dukkan/DEPLOY.md)** (or that repo on GitHub) for the full GCP layout.

## Pieces

| GCP product | Role |
| --- | --- |
| Cloud Run `dukkan-ui` | This Next.js app |
| Cloud Run `dukkan-api` | Spring Boot (other repo) |
| Secret Manager | JWT + **database** user/password only — **not** storefront logins |
| Cloud SQL instance + database `dukkan` | Tables and hashed passwords after signup |

`NEXT_PUBLIC_API_URL` is baked in at **Docker build** time. Build the UI after the API service URL exists.

## Build and deploy

```bash
export PROJECT_ID=your-project-id
export REGION=asia-south1
export AR_REPO=dukkan
export UI_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${AR_REPO}/dukkan-ui:latest"
export API_URL="https://dukkan-api-xxxxxxxx-xx.a.run.app"   # from gcloud run services describe dukkan-api

gcloud config set project "$PROJECT_ID"

gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_IMAGE="$UI_IMAGE",_API_URL="$API_URL"

gcloud run deploy dukkan-ui \
  --image="$UI_IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated \
  --port=3000 \
  --cpu=1 \
  --memory=512Mi
```

Then set `DUKKAN_CORS_ORIGINS` on `dukkan-api` to this UI URL (see the API `DEPLOY.md`).

## First admin

1. Open `https://<dukkan-ui>/signup` and register.
2. In Cloud SQL: `UPDATE app_users SET role = 'ADMIN' WHERE email = 'you@yourdomain.com';`
3. Sign in at `/console/login` (role is inside the JWT, so sign in again after the SQL update).

Do not put that password in Secret Manager or in `NEXT_PUBLIC_*` env vars.
