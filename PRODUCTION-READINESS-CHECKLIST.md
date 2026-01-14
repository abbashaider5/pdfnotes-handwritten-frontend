# Production Readiness Checklist

## ✅ Completed Tasks

### Frontend Changes

1. **Fixed hardcoded URLs in components:**
   - ✅ `src/components/buy-modal.jsx` - Uses `VITE_BACKEND_URL`
   - ✅ `src/components/author-request-modal.jsx` - Uses `VITE_BACKEND_URL`
   - ✅ `src/pages/user/user-dashboard.jsx` - Uses `VITE_BACKEND_URL`
   - ✅ `src/pages/user/author-dashboard.jsx` - Uses `VITE_BACKEND_URL`
   - ✅ `src/pages/dashboard/author-requests.jsx` - Uses `VITE_BACKEND_URL`

2. **Environment variable configuration:**
   - ✅ `src/lib/supabase.js` - Validates and uses all required env vars
   - ✅ Added environment variable validation with clear error messages
   - ✅ Exported `ENV` object for easy access across frontend

3. **Updated .env.example files:**
   - ✅ `.env.example` - Added all frontend env vars with documentation
   - ✅ `server/.env.example` - Updated with all backend env vars

### Backend Changes

1. **Environment variable validation:**
   - ✅ `server/payment-backend.js` - Added comprehensive env var validation
   - ✅ Clear error logging for missing environment variables
   - ✅ Debug logging for loaded env vars (safe partial display)

2. **CORS Configuration:**
   - ✅ Uses `process.env.FRONTEND_URL` for CORS origin
   - ✅ Credentials enabled for cookie/auth support

3. **URL Configuration:**
   - ✅ Download URLs use `process.env.BACKEND_URL`
   - ✅ Email links use `process.env.BACKEND_URL`
   - ✅ Supabase uses env vars (URL, Service Role Key)

---

## 📋 Pre-Deployment Verification Checklist

### Environment Variables

#### Render (Backend)
- [ ] `BACKEND_URL` - Set to your Render backend URL
- [ ] `FRONTEND_URL` - Set to your Vercel frontend URL
- [ ] `NODE_ENV` - Set to `production`
- [ ] `RESEND_API_KEY` - Resend API key for emails
- [ ] `EMAIL_FROM` - From email address (e.g., noreply@yourdomain.com)
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `CURRENCY` - Set to `INR` (or your preferred currency)

#### Vercel (Frontend)
- [ ] `VITE_BACKEND_URL` - Render backend URL
- [ ] `VITE_APP_URL` - Vercel frontend URL
- [ ] `VITE_SUPABASE_URL` - Your Supabase project URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Database Configuration

- [ ] Payment settings configured in Supabase
  - [ ] `payments_enabled` = true
  - [ ] `razorpay_enabled` = true (if using Razorpay)
  - [ ] `razorpay_key_id` - Razorpay key ID (public)
  - [ ] `razorpay_key_secret` - Razorpay secret key
  - [ ] `stripe_enabled` = true (if using Stripe)
  - [ ] `stripe_secret_key` - Stripe secret key (sk_live_xxx or sk_test_xxx)
  - [ ] `stripe_publishable_key` - Stripe public key (pk_live_xxx or pk_test_xxx)
  - [ ] `currency` = "INR" (or your currency)

### CORS Configuration

- [ ] Frontend URL in `FRONTEND_URL` matches actual Vercel deployment URL
- [ ] Backend URL in `VITE_BACKEND_URL` matches actual Render deployment URL

---

## 🔍 Production Testing Steps

### 1. Frontend Loading Test
1. Deploy to Vercel
2. Open the production URL
3. Check browser console for:
   - ✅ "Environment variables loaded" message with correct URLs
   - ✅ No ❌ error messages for missing env vars
4. Verify Supabase auth works:
   - [ ] Login page loads
   - [ ] Can sign up new user
   - [ ] Can sign in existing user
   - [ ] Session persists on page refresh

### 2. API Connection Test
1. Open browser DevTools → Network tab
2. Make a test request (e.g., fetch payment settings)
3. Verify:
   - ✅ Request goes to `VITE_BACKEND_URL` (not localhost)
   - ✅ Response returns successfully (200 OK)
   - ✅ No CORS errors in console
   - ✅ Response data is correct

### 3. Payment Flow Test
1. Navigate to a PDF detail page
2. Click "Buy Now"
3. Test payment modal:
   - [ ] Payment settings load from backend
   - [ ] Can select payment gateway (Razorpay/Stripe)
   - [ ] Payment form loads correctly
   - [ ] After payment, redirects to success modal
4. Check order creation:
   - [ ] Order appears in database
   - [ ] Payment status = "success"
   - [ ] Download URL generated correctly

### 4. Download Link Test
1. Open the download link from email or success modal
2. Verify:
   - ✅ Link uses `BACKEND_URL` (not localhost)
   - ✅ Backend generates signed URL
   - ✅ Redirects to Supabase Storage
   - [ ] PDF downloads successfully
   - [ ] Download count increments in database

### 5. Email Sending Test
1. Complete a test purchase
2. Check email inbox:
   - [ ] Welcome email sent (for new registrations)
   - [ ] Download email sent (after purchase)
   - [ ] Email body contains correct download URL
   - [ ] Download URL uses production backend URL
3. Test author emails:
   - [ ] Author application email sent
   - [ ] Author approval email sent
   - [ ] Author rejection email sent

### 6. Author Dashboard Test
1. Login as author user
2. Navigate to Author Dashboard
3. Test:
   - [ ] PDF upload works
   - [ ] Can view uploaded PDFs
   - [ ] Download counts update
   - [ ] Earnings display correctly
   - [ ] Payout requests work

### 7. Admin Dashboard Test
1. Login as admin user
2. Navigate to Admin Dashboard
3. Test:
   - [ ] Orders display correctly
   - [ ] Analytics calculate correctly
   - [ ] Author requests appear
   - [ ] Can approve/reject authors
   - [ ] Payout management works

---

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
**Symptom:** Console shows "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
1. Verify `FRONTEND_URL` in Render env vars exactly matches Vercel URL
2. Check for trailing slashes (e.g., `https://app.com/` vs `https://app.com`)
3. Ensure both use HTTPS in production

### Issue: Environment Variable Not Found
**Symptom:** "❌ VITE_BACKEND_URL is not defined"

**Solution:**
1. Check Vercel Settings → Environment Variables
2. Verify variable name matches exactly (case-sensitive)
3. Redeploy after adding env vars
4. Check Vercel build logs for errors

### Issue: Backend API Returns 404
**Symptom:** All API requests fail with 404

**Solution:**
1. Verify `VITE_BACKEND_URL` is correct (no typos)
2. Check if backend service is running on Render
3. Verify Render service is healthy: `https://your-backend.onrender.com/api/health`
4. Check Render logs for startup errors

### Issue: Download Link Uses Localhost
**Symptom:** Email contains `http://localhost:3001` instead of production URL

**Solution:**
1. Check `BACKEND_URL` env var on Render
2. Ensure it includes `https://` protocol
3. Redeploy Render service after updating
4. Test new orders (old orders will keep old URLs)

### Issue: PDF Download Fails
**Symptom:** Download link returns 404 or "Object not found"

**Solution:**
1. Check Supabase Storage bucket name (should be `pdfs`)
2. Verify `pdf_url` column contains correct path
3. Check Supabase Storage permissions (RLS policies)
4. Test signed URL generation in backend logs

### Issue: Emails Not Sending
**Symptom:** No emails received after actions

**Solution:**
1. Verify `RESEND_API_KEY` is set and valid
2. Check `EMAIL_FROM` domain is verified in Resend
3. Check Render logs for email errors
4. Verify Resend API quota not exceeded

---

## 📊 Environment Variable Reference

### Frontend (Vercel)
| Variable | Purpose | Example |
|-----------|---------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `https://pdfnotes-backend.onrender.com` |
| `VITE_APP_URL` | Frontend URL | `https://pdfnotes.vercel.app` |
| `VITE_SUPABASE_URL` | Supabase URL | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5...` |

### Backend (Render)
| Variable | Purpose | Example |
|-----------|---------|---------|
| `BACKEND_URL` | Backend URL for emails/downloads | `https://pdfnotes-backend.onrender.com` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://pdfnotes.vercel.app` |
| `SUPABASE_URL` | Supabase URL | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | `eyJhbGciOiJIUzI1NiIsInR5...` |
| `RESEND_API_KEY` | Email API key | `re_Y8uZ5Dzz_FSAKX...` |
| `EMAIL_FROM` | From email address | `noreply@yourdomain.com` |
| `CURRENCY` | Currency code | `INR` |
| `NODE_ENV` | Environment | `production` |

---

## 🎯 Post-Deployment Monitoring

### Log Monitoring
1. **Render Logs:**
   - Check for startup errors
   - Monitor environment variable validation
   - Watch for API errors
   - Track payment gateway initialization

2. **Vercel Logs:**
   - Check build errors
   - Monitor client-side errors
   - Track environment variable loading

3. **Browser Console:**
   - Check for environment variable errors
   - Monitor failed API requests
   - Track CORS issues

### Key Metrics to Watch
- ✅ Successful API calls
- ✅ Payment success rate
- ✅ Email delivery rate
- ✅ PDF download success rate
- ✅ Error rates (404, 500, etc.)

---

## 📞 Support & Troubleshooting

### Getting Help
If you encounter issues:

1. Check this document's "Common Issues" section
2. Review console errors (both frontend and backend)
3. Verify environment variables match between platforms
4. Check CORS configuration
5. Test individual components in isolation

### Quick Debug Commands

```bash
# Test backend health
curl https://your-backend.onrender.com/api/health

# Test payment settings endpoint
curl https://your-backend.onrender.com/api/payment-settings

# Check frontend env vars in browser console
# Open DevTools → Console and look for:
# ✅ Environment variables loaded
```

---

## ✨ Summary

All hardcoded URLs have been replaced with environment variables. Both frontend and backend now validate environment variables on startup and provide clear error messages when variables are missing.

**Key Changes:**
- Frontend uses `import.meta.env.VITE_*` variables
- Backend uses `process.env.*` variables
- CORS configured dynamically based on `FRONTEND_URL`
- Download URLs use `BACKEND_URL` dynamically
- Comprehensive validation added to both platforms

**Next Steps:**
1. Set all environment variables in Render and Vercel
2. Configure payment settings in Supabase database
3. Deploy to production
4. Run through the Production Testing Steps
5. Monitor logs and metrics

Good luck with your deployment! 🚀
