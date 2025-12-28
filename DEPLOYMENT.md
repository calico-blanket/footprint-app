# Deployment Instructions

## Prerequisites
- GitHub account
- Vercel account
- Firebase project

## 1. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google Provider).
3. Enable **Firestore Database** (Start in production mode).
    - Rules:
      ```
      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId}/{document=**} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
      ```
4. Enable **Storage**.
    - Rules:
      ```
      rules_version = '2';
      service firebase.storage {
        match /b/{bucket}/o {
          match /users/{userId}/{allPaths=**} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
          }
        }
      }
      ```
5. Get config values from Project Settings > General > Your apps.

## 2. Vercel Deployment
1. Push your code to a GitHub repository.
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and "Add New Project".
3. Import your GitHub repository.
4. Configure **Environment Variables**:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `NEXT_PUBLIC_ALLOWED_EMAILS` (Comma-separated list of allowed emails, e.g., `me@example.com,spouse@example.com`)
5. Click **Deploy**.

## 3. Post-Deployment
1. Add your Vercel domain (e.g., `https://your-app.vercel.app`) to:
   - **Firebase Console** > Authentication > Settings > Authorized domains.
   - **Google Cloud Console** > APIs & Services > Credentials > OAuth 2.0 Client IDs > Authorized JavaScript origins & Authorized redirect URIs.

## 4. PWA Verification
- Visit the deployed URL on your mobile device.
- Tap "Share" > "Add to Home Screen" (iOS) or use the install prompt (Android).
