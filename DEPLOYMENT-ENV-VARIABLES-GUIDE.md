# 🚀 Complete Environment Variables Report for Vercel & Render Deployment

This report lists **all** environment variables used across the entire project (frontend + backend) for seamless deployment to Vercel (frontend) and Render (backend).

---

## 1️⃣ Frontend Environment Variables (Vercel)

### Supabase Configuration

#### `VITE_SUPABASE_URL`
- **Purpose:** Supabase project URL for client-side database access
- **Where Used:** `src/lib/supabase.js`
- **Required:** ✅ **MUST HAVE**
- **Format:** `https://your-project.supabase.co`
- **Notes:** 
  - Used to initialize Supabase client
  - Missing this variable causes app crash on startup
  - Error thrown: "Supabase environment variables are missing"

#### `VITE_SUPABASE_ANON_KEY`
- **Purpose:** Supabase anonymous/public key for client-side access
- **Where Used:** `src/lib/supabase.js`
- **Required:** ✅ **MUST HAVE**
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Notes:**
  - Used to initialize Supabase client
  - This is the PUBLIC key (safe to expose)
  - Missing this variable causes app crash on startup
  - Error thrown: "Supabase environment variables are missing"

### Razorpay Configuration

#### `VITE_RAZORPAY_KEY_ID` (OPTIONAL - Fallback Only)
- **Purpose:** Razorpay public key for payment checkout
- **Where Used:** `src/components/buy-modal.jsx` (as fallback)
- **Required:** ⚠️ **OPTIONAL** (preferred to use database value)
- **Format:** `rzp_test_xxxxxxxxxx` or `rzp_live_xxxxxxxxxx`
- **Notes:**
  - **This is a FALLBACK only**
  - Primary method: Razorpay key is fetched from database (`payment_settings.razorpay_key_id`)
  - Used only if database value is not available
  - This is a PUBLIC key (safe to expose)
  - If using database storage, this can be omitted

### Backend URL Configuration

#### `VITE_BACKEND_URL`
- **Purpose:** Backend API URL for server communication
- **Where Used:** `src/pages/auth/register.jsx` (welcome email API)
- **Required:** ⚠️ **OPTIONAL** (has default)
- **Format:** `https://your-backend.onrender.com` or `http://localhost:3001`
- **Default:** `http://localhost:3001`
- **Notes:**
  - Used to call backend API for sending welcome emails
  - Set to Render URL in production: `https://your-backend.onrender.com`
  - If not set, defaults to localhost (will fail in production)

### Stripe Configuration (DEPRECATED - Use Database)

#### `VITE_STRIPE_PUBLISHABLE_KEY` (NOT CURRENTLY USED)
- **Purpose:** Stripe publishable key for client-side payments
- **Where Used:** ❌ **NOT USED** (keys fetched from database)
- **Required:** ❌ **NOT REQUIRED**
- **Format:** `pk_test_xxxxxxxxxx` or `pk_live_xxxxxxxxxx`
- **Notes:**
  - **DO NOT ADD THIS** - Stripe keys are now fetched from database
  - `payment_settings.stripe_publishable_key` is used instead
  - This variable is deprecated and should not be used

### Application URL

#### `VITE_APP_URL` (OPTIONAL - Recommended)
- **Purpose:** Frontend application URL for redirects and links
- **Where Used:** Not currently in code (recommended for future use)
- **Required:** ⚠️ **OPTIONAL** (but recommended)
- **Format:** `https://your-frontend.vercel.app`
- **Notes:**
  - Recommended to set for consistent URL references
  - Useful for authentication redirects
  - Not currently used in code but good practice to set

---

## 2️⃣ Backend Environment Variables (Render)

### Server Configuration

#### `PORT`
- **Purpose:** Server port number
- **Where Used:** `server/payment-backend.js` (line 13)
- **Required:** ❌ **OPTIONAL** (has default)
- **Format:** `3001`
- **Default:** `3001`
- **Notes:**
  - Render automatically assigns a port via `$PORT`
  - Can usually be omitted on Render
  - Code: `const PORT = process.env.PORT || 3001;`

#### `NODE_ENV`
- **Purpose:** Node.js environment mode
- **Where Used:** Multiple places (logging, optimizations)
- **Required:** ⚠️ **OPTIONAL** (defaults to development)
- **Format:** `production` or `development`
- **Default:** `development`
- **Notes:**
  - Set to `production` on Render
  - Affects error handling, logging, and optimizations
  - Important for production performance

### Supabase Configuration

#### `SUPABASE_URL`
- **Purpose:** Supabase project URL for server-side database access
- **Where Used:** `server/payment-backend.js` (line 16)
- **Required:** ✅ **MUST HAVE**
- **Format:** `https://your-project.supabase.co`
- **Notes:**
  - Used to create Supabase client with service role key
  - Same value as frontend `VITE_SUPABASE_URL`
  - Critical for all database operations

#### `SUPABASE_SERVICE_ROLE_KEY`
- **Purpose:** Supabase service role key for full admin access
- **Where Used:** `server/payment-backend.js` (line 17)
- **Required:** ✅ **MUST HAVE**
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Security:** 🔴 **NEVER EXPOSE TO FRONTEND**
- **Notes:**
  - **CRITICAL:** This is the SERVICE ROLE key (admin access)
  - NOT the same as `VITE_SUPABASE_ANON_KEY`
  - Bypasses RLS (Row Level Security)
  - Get from: Supabase Dashboard → Project Settings → API → service_role
  - Never share this key publicly

### Backend URL Configuration

#### `BACKEND_URL`
- **Purpose:** Backend URL for download links and email links
- **Where Used:** `server/payment-backend.js` (line 119)
- **Required:** ⚠️ **OPTIONAL** (has default)
- **Format:** `https://your-backend.onrender.com` or `http://localhost:3001`
- **Default:** `http://localhost:3001`
- **Notes:**
  - Used to generate download URLs in emails
  - Example: `${BACKEND_URL}/api/download-pdf?order_id=123`
  - **MUST** be set to Render URL in production
  - If not set, download links will point to localhost (will fail for users)

### CORS Configuration

#### `FRONTEND_URL`
- **Purpose:** Frontend URL for CORS configuration
- **Where Used:** `server/payment-backend.js` (line 20)
- **Required:** ⚠️ **OPTIONAL** (has default)
- **Format:** `https://your-frontend.vercel.app` or `http://localhost:5173`
- **Default:** `http://localhost:5173`
- **Notes:**
  - Used to configure CORS allowed origins
  - **MUST** match Vercel URL in production
  - If not set, frontend requests will be blocked by CORS
  - Code: `origin: process.env.FRONTEND_URL || 'http://localhost:5173'`

### Email Configuration (Resend)

#### `RESEND_API_KEY`
- **Purpose:** Resend API key for sending emails
- **Where Used:** `server/utils/sendEmail.js` (multiple functions)
- **Required:** ⚠️ **OPTIONAL** (gracefully degrades)
- **Format:** `re_Y8uZ5Dzz_FSAKXNX1JVeTSN2QrbCDU7MT`
- **Notes:**
  - Used to send: PDF download emails, welcome emails, author notification emails
  - If missing, emails are skipped (app continues to work)
  - Get from: https://resend.com/api/api-keys
  - Gracefully degrades - won't crash the app

#### `EMAIL_FROM`
- **Purpose:** Sender email address for all emails
- **Where Used:** `server/utils/sendEmail.js` (line 76, 120, 168, 216)
- **Required:** ⚠️ **OPTIONAL** (gracefully degrades)
- **Format:** `noreply@yourdomain.com`
- **Notes:**
  - Used as "From" address in all emails
  - Must be verified in Resend dashboard
  - Example: `noreply@abbaslogic.com`
  - If missing, emails are skipped (app continues to work)

### Payment Gateway Configuration (DEPRECATED - Use Database)

#### `RAZORPAY_KEY_ID` (DEPRECATED)
- **Purpose:** Razorpay key ID
- **Where Used:** ❌ **NO LONGER USED** (keys fetched from database)
- **Required:** ❌ **NOT REQUIRED**
- **Format:** `rzp_test_xxxxxxxxxx` or `rzp_live_xxxxxxxxxx`
- **Notes:**
  - **DEPRECATED:** Payment keys are now stored in database
  - Stored in: `payment_settings.razorpay_key_id` (public)
  - Stored in: `payment_settings.razorpay_key_secret` (private)
  - Can be omitted

#### `RAZORPAY_KEY_SECRET` (DEPRECATED)
- **Purpose:** Razorpay key secret
- **Where Used:** ❌ **NO LONGER USED** (keys fetched from database)
- **Required:** ❌ **NOT REQUIRED**
- **Format:** Secret key from Razorpay dashboard
- **Security:** 🔴 **NEVER EXPOSE TO FRONTEND** (if used)
- **Notes:**
  - **DEPRECATED:** Payment keys are now stored in database
  - Stored in: `payment_settings.razorpay_key_secret`
  - Can be omitted

#### `STRIPE_SECRET_KEY` (DEPRECATED)
- **Purpose:** Stripe secret key for payment processing
- **Where Used:** ❌ **NO LONGER USED** (keys fetched from database)
- **Required:** ❌ **NOT REQUIRED**
- **Format:** `sk_test_xxxxxxxxxx` or `sk_live_xxxxxxxxxx`
- **Security:** 🔴 **NEVER EXPOSE TO FRONTEND** (if used)
- **Notes:**
  - **DEPRECATED:** Payment keys are now stored in database
  - Stored in: `payment_settings.stripe_secret_key`
  - Can be omitted

#### `STRIPE_WEBHOOK_SECRET` (NOT USED)
- **Purpose:** Stripe webhook secret for verifying webhooks
- **Where Used:** ❌ **NOT USED** (webhooks not implemented)
- **Required:** ❌ **NOT REQUIRED**
- **Format:** `whsec_xxxxxxxxxx`
- **Notes:**
  - Not currently used in the codebase
  - Can be omitted
  - May be needed if webhooks are added in future

### Currency Configuration

#### `CURRENCY`
- **Purpose:** Default currency for payments
- **Where Used:** `server/payment-backend.js` (NOT CURRENTLY USED)
- **Required:** ❌ **NOT REQUIRED** (hardcoded as INR)
- **Format:** `inr`, `usd`, `eur`, `gbp`
- **Notes:**
  - Currently hardcoded as `INR` in the code
  - Can be omitted
  - Payment amounts are always in INR

---

## 3️⃣ Shared / Common Variables

### `NODE_ENV`
- **Purpose:** Environment mode
- **Required:** Both frontend and backend
- **Values:**
  - `development` (default)
  - `production`
- **Deployment Impact:**
  - **Frontend (Vercel):** Automatically set to `production` by Vercel
  - **Backend (Render):** Set to `production` manually in Render environment variables
  - **If Missing or Incorrect:**
    - Debug logs will appear in production (bad for performance/security)
    - Optimizations won't be applied
    - Error messages may be verbose (security risk)
  - **Best Practice:** Always set to `production` in deployed environments

---

## 4️⃣ Notes & Warnings

### 🔴 Variables That Must NEVER Be Exposed to Frontend

The following variables contain sensitive secrets and must **ONLY** be used in the backend:

1. **`SUPABASE_SERVICE_ROLE_KEY`** - Admin access to Supabase (bypasses RLS)
2. **`RAZORPAY_KEY_SECRET`** (if used) - Secret key for Razorpay
3. **`STRIPE_SECRET_KEY`** (if used) - Secret key for Stripe
4. **`STRIPE_WEBHOOK_SECRET`** (if used) - Webhook verification secret
5. **`RESEND_API_KEY`** - API key for sending emails

**Consequences of Exposure:**
- Users could bypass authentication
- Users could access/modify other users' data
- Financial fraud (payments could be manipulated)
- Email spamming (API key could be abused)

### ✅ Variables Safe for Frontend (Public Keys)

These variables can be safely used in the frontend:

1. **`VITE_SUPABASE_URL`** - Public Supabase URL
2. **`VITE_SUPABASE_ANON_KEY`** - Public Supabase key (has RLS restrictions)
3. **`VITE_RAZORPAY_KEY_ID`** - Public Razorpay key (if used as fallback)
4. **`VITE_STRIPE_PUBLISHABLE_KEY`** - Public Stripe key (if used)

### 🔗 Variables That Must Match Exactly Between Environments

1. **`VITE_SUPABASE_URL`** (Frontend) = **`SUPABASE_URL`** (Backend)
   - Both must point to the same Supabase project
   - Example: `https://your-project.supabase.co`

2. **`FRONTEND_URL`** (Backend) = Actual Vercel URL
   - Must match the deployed Vercel URL
   - Example: `https://your-frontend.vercel.app`
   - If mismatched, CORS will block requests

3. **`BACKEND_URL`** (Backend) = Actual Render URL
   - Must match the deployed Render URL
   - Example: `https://your-backend.onrender.com`
   - If mismatched, download links in emails will fail

### ⚠️ Common Mistakes to Avoid During Vercel/Render Setup

#### Mistake #1: Using Service Role Key in Frontend
- **Wrong:** Setting `VITE_SUPABASE_ANON_KEY` to service role key
- **Correct:** Use the `anon` (public) key from Supabase dashboard
- **Impact:** **CRITICAL SECURITY ISSUE** - Users can bypass all authentication

#### Mistake #2: Setting FRONTEND_URL to localhost
- **Wrong:** `FRONTEND_URL=http://localhost:5173` on Render
- **Correct:** `FRONTEND_URL=https://your-frontend.vercel.app`
- **Impact:** CORS errors - frontend cannot communicate with backend

#### Mistake #3: Setting BACKEND_URL to localhost
- **Wrong:** `BACKEND_URL=http://localhost:3001` on Render
- **Correct:** `BACKEND_URL=https://your-backend.onrender.com`
- **Impact:** Download links in emails will point to localhost (won't work for users)

#### Mistake #4: Using Secret Keys in Frontend
- **Wrong:** Adding `STRIPE_SECRET_KEY` or `RAZORPAY_KEY_SECRET` to Vercel
- **Correct:** Only use publishable/public keys in frontend
- **Impact:** **CRITICAL SECURITY ISSUE** - Payment fraud

#### Mistake #5: Mixing Up Anon vs Service Role Keys
- **Wrong:** Using service role key for frontend, anon key for backend
- **Correct:**
  - Frontend: `VITE_SUPABASE_ANON_KEY` (public key)
  - Backend: `SUPABASE_SERVICE_ROLE_KEY` (admin key)
- **Impact:** Frontend has admin access (security issue), backend has restricted access (functional issue)

#### Mistake #6: Forgetting to Set NODE_ENV to production
- **Wrong:** Leaving `NODE_ENV` as `development` on Render
- **Correct:** Set `NODE_ENV=production` in Render
- **Impact:** Debug logs in production, suboptimal performance

#### Mistake #7: Hardcoding Keys in Code
- **Wrong:** Directly pasting keys in source code
- **Correct:** Always use environment variables
- **Impact:** Keys exposed in git repository (security breach)

#### Mistake #8: Missing Email Configuration (Optional but Important)
- **Wrong:** Not setting `RESEND_API_KEY` and `EMAIL_FROM`
- **Correct:** Set both variables for email functionality
- **Impact:** Users won't receive download links (but app still works)

---

## 5️⃣ Final Checklist for Deployment

### ✅ Supabase Keys Separated Correctly
- [ ] Frontend uses `VITE_SUPABASE_ANON_KEY` (public key)
- [ ] Backend uses `SUPABASE_SERVICE_ROLE_KEY` (admin key)
- [ ] Both use the same `SUPABASE_URL`

### ✅ Stripe Keys Separated Correctly (If Using Database)
- [ ] `payment_settings.stripe_publishable_key` is public key (starts with `pk_`)
- [ ] `payment_settings.stripe_secret_key` is secret key (starts with `sk_`)
- [ ] Secret key is never exposed to frontend

### ✅ Razorpay Keys Separated Correctly (If Using Database)
- [ ] `payment_settings.razorpay_key_id` is public key (starts with `rzp_`)
- [ ] `payment_settings.razorpay_key_secret` is secret key
- [ ] Secret key is never exposed to frontend

### ✅ No Hard-Coded Keys Left in Code
- [ ] Searched codebase for: `"sk_test_"`, `"rzp_test_"`, `"eyJhbGci"` (Supabase)
- [ ] Verified all keys are loaded from environment variables
- [ ] No secrets in `src/` directory

### ✅ Download/Email Links Depend on Correct BACKEND_URL
- [ ] `BACKEND_URL` is set to Render URL on backend
- [ ] `FRONTEND_URL` is set to Vercel URL on backend
- [ ] Both URLs are HTTPS (not HTTP)
- [ ] URLs match actual deployment URLs

### ✅ CORS Configuration Correct
- [ ] `FRONTEND_URL` matches Vercel URL
- [ ] No CORS errors in browser console
- [ ] Backend accepts requests from frontend

### ✅ Node Environment Set Correctly
- [ ] `NODE_ENV=production` set on Render
- [ ] `NODE_ENV=production` automatically set on Vercel
- [ ] Development features disabled in production

### ✅ Email Configuration (Optional)
- [ ] `RESEND_API_KEY` is set on Render
- [ ] `EMAIL_FROM` is set to verified email address
- [ ] Emails are being sent successfully (test after deployment)

### ✅ Payment Gateway Configuration
- [ ] Payment settings are stored in `payment_settings` table
- [ ] At least one gateway (Stripe or Razorpay) is enabled
- [ ] Keys in database are correct and valid
- [ ] Payments can be created successfully
- [ ] Payment verification works end-to-end

---

## 6️⃣ Quick Copy-Paste Reference

### For Vercel (Frontend) - Copy These:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=https://your-backend.onrender.com
VITE_APP_URL=https://your-frontend.vercel.app
```

### For Render (Backend) - Copy These:

```bash
PORT=3001
NODE_ENV=production

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.vercel.app

RESEND_API_KEY=re_Y8uZ5Dzz_FSAKXNX1JVeTSN2QrbCDU7MT
EMAIL_FROM=noreply@yourdomain.com
```

---

## 7️⃣ Where to Get These Keys

### Supabase Keys
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: Project Settings → API
4. Copy:
   - `Project URL` → `SUPABASE_URL` / `VITE_SUPABASE_URL`
   - `anon` key → `VITE_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (backend only)

### Razorpay Keys
1. Go to: https://dashboard.razorpay.com/apikeys
2. Generate keys for Test or Live mode
3. Copy:
   - Key ID → Store in database (`payment_settings.razorpay_key_id`)
   - Key Secret → Store in database (`payment_settings.razorpay_key_secret`)

### Stripe Keys
1. Go to: https://dashboard.stripe.com/apikeys
2. Generate keys for Test or Live mode
3. Copy:
   - Publishable key (`pk_...`) → Store in database (`payment_settings.stripe_publishable_key`)
   - Secret key (`sk_...`) → Store in database (`payment_settings.stripe_secret_key`)

### Resend Keys
1. Go to: https://resend.com/api/api-keys
2. Create API key
3. Copy: API key → `RESEND_API_KEY`
4. Verify sender domain: Add domain in Resend dashboard → `EMAIL_FROM`

---

## 8️⃣ Testing After Deployment

### Test 1: Frontend Loads Successfully
- [ ] Visit Vercel URL
- [ ] No console errors about missing environment variables
- [ ] Supabase connection works (check network tab)

### Test 2: Backend API Responds
- [ ] Visit Render URL + `/api/health`
- [ ] Returns: `{ status: 'ok', message: 'Payment backend is running' }`

### Test 3: CORS Works
- [ ] Frontend can call backend API
- [ ] No CORS errors in browser console
- [ ] Payment settings API returns data

### Test 4: Payment Flow Works
- [ ] Can create order (Razorpay or Stripe)
- [ ] Payment modal opens correctly
- [ ] Payment completes successfully
- [ ] Order is verified correctly

### Test 5: Download Works
- [ ] Download email is received
- [ ] Download link in email works
- [ ] PDF can be downloaded

### Test 6: Email System Works (Optional)
- [ ] Welcome email is sent on registration
- [ ] Download email is sent after payment
- [ ] Author notification emails are sent

---

## 9️⃣ Troubleshooting Common Issues

### Issue: "Supabase environment variables are missing"
**Cause:** Frontend variables not set on Vercel
**Fix:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel

### Issue: CORS error when calling backend
**Cause:** `FRONTEND_URL` doesn't match Vercel URL
**Fix:** Set `FRONTEND_URL=https://your-frontend.vercel.app` on Render

### Issue: Download links in emails don't work
**Cause:** `BACKEND_URL` set to localhost or wrong URL
**Fix:** Set `BACKEND_URL=https://your-backend.onrender.com` on Render

### Issue: Payments fail with "Payment gateway not configured"
**Cause:** Payment keys not stored in database
**Fix:** Insert keys into `payment_settings` table:
```sql
INSERT INTO payment_settings (
  payments_enabled,
  razorpay_enabled,
  stripe_enabled,
  razorpay_key_id,
  razorpay_key_secret,
  stripe_publishable_key,
  stripe_secret_key,
  currency
) VALUES (
  true,
  true,
  false,
  'rzp_test_xxxxxxxxxx',
  'your_secret_key',
  'pk_test_xxxxxxxxxx',
  'sk_test_xxxxxxxxxx',
  'INR'
);
```

### Issue: Emails not being sent
**Cause:** `RESEND_API_KEY` or `EMAIL_FROM` not set or invalid
**Fix:** 
1. Verify `RESEND_API_KEY` is set correctly
2. Verify `EMAIL_FROM` domain is verified in Resend dashboard
3. Check backend logs for email errors

### Issue: "Razorpay/Stripe is not configured"
**Cause:** Payment gateway initialization failed
**Fix:**
1. Check backend logs for initialization errors
2. Verify keys in `payment_settings` table
3. Restart backend on Render

---

## 🔟 Conclusion

After following this guide and setting all the environment variables correctly, you should be able to:

✅ Deploy frontend to Vercel without errors  
✅ Deploy backend to Render without errors  
✅ Users can browse and purchase PDFs  
✅ Payments work correctly (Razorpay and/or Stripe)  
✅ Users receive download links via email  
✅ No CORS or authentication issues  
✅ All security best practices followed  

**Remember:** Never commit environment variables to git. Always use environment variables for sensitive data.

---

**Document Version:** 1.0  
**Last Updated:** January 14, 2026  
**Project:** Handwritten PDF Store
