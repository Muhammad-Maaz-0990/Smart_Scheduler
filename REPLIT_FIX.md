# Replit Backend Deployment - Quick Fix Guide

## Latest Issue: "crash loop detected" with module loading errors

### Root Cause
Dependencies aren't being properly installed in the backend folder during Replit deployment, causing Express and other modules to fail loading.

### What I Fixed (Latest Update)

1. **Created deployment script** (`deploy.sh`) - Handles installation and startup properly
2. **Added engine requirements** - Specifies Node.js 18+ in package.json
3. **Added .npmrc** - Optimizes npm behavior for deployment
4. **Added .replitignore** - Excludes unnecessary files from deployment
5. **Fixed .replit config** - Uses proper deployment command
6. **Added root `/` endpoint** - Returns 200 OK for health checks
7. **Server listens on `0.0.0.0`** - Makes server accessible to Replit

### Files Updated

1. **Added root `/` endpoint** - Returns 200 OK immediately
2. **Listen on `0.0.0.0`** - Makes server accessible to Replit's health checker
3. **Non-blocking MongoDB** - Server starts even if MongoDB connection is slow
4. **Better health info** - Shows MongoDB status and available endpoints

### Replit Secrets Configuration

Make sure you have these secrets set in Replit (Tools → Secrets):

**Required:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/smart_scheduler
JWT_SECRET=your_random_jwt_secret_minimum_32_chars
SESSION_SECRET=your_random_session_secret_minimum_32_chars
NODE_ENV=production
```

**Optional:**
```
FRONTEND_URL=https://your-frontend-url.pages.dev
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
PORT=5000
```

### MongoDB Atlas Configuration

**CRITICAL:** Whitelist Replit IPs:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" 
4. Enter: `0.0.0.0/0`
5. Click "Confirm"

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/smart_scheduler?retryWrites=true&w=majority
```

Replace:
- `username` - Your MongoDB database user
- `password` - User's password (URL-encode special characters)
- `cluster` - Your cluster name

### Testing the Fix

1. **Push updated code to GitHub**:
   ```bash
   git add backend/server.js
   git commit -m "Fix Replit health check endpoint"
   git push
   ```

2. **In Replit, pull latest code**:
   - Open Shell in Replit
   - Run: `git pull`

3. **Restart deployment**:
   - Click "Deploy" button again
   - Watch logs for:
     - "🚀 Server running on port 5000"
     - "📍 Health check available at http://localhost:5000/"

4. **Verify health check**:
   Once deployed, visit your Replit URL in browser:
   ```
   https://your-repl-name.repl.co/
   ```
   
   Should see:
   ```json
   {
     "status": "OK",
     "message": "Smart Scheduler API is running",
     "timestamp": "2026-01-08...",
     "endpoints": {...}
   }
   ```

### Common Issues & Solutions

#### Issue: MongoDB connection timeout
**Symptoms:** Server starts but can't connect to database

**Fix:**
1. Check `MONGODB_URI` is correct in Replit Secrets
2. Verify MongoDB Atlas Network Access allows 0.0.0.0/0
3. Test connection string locally first
4. Ensure password doesn't have special characters (or URL-encode them)

#### Issue: Environment variables not loading
**Symptoms:** Server crashes with "Cannot read property of undefined"

**Fix:**
1. Double-check all secrets are set in Replit (Tools → Secrets)
2. Secret names must match exactly (case-sensitive)
3. No spaces in secret names or values
4. Redeploy after adding secrets

#### Issue: Server responds but shows "Disconnected" for MongoDB
**Symptoms:** Health check passes but database queries fail

**Fix:**
1. This is actually OK - server is running!
2. MongoDB connection happens in background
3. Check Replit logs for MongoDB connection success
4. If it keeps failing, verify MongoDB Atlas configuration

### Deployment Checklist

Before deploying:
- [ ] Code pushed to GitHub repository
- [ ] All Replit Secrets configured (especially MONGODB_URI)
- [ ] MongoDB Atlas IP whitelist includes 0.0.0.0/0
- [ ] MongoDB user has read/write permissions
- [ ] Connection string tested locally
- [ ] `.replit` file present in repository root

After deployment:
- [ ] Visit root URL (/) - should return JSON
- [ ] Check `/api/health` endpoint - should show MongoDB status
- [ ] Test login endpoint with Postman/curl
- [ ] Verify CORS allows your frontend domain
- [ ] Monitor logs for any errors

### Quick Test Commands

Test in Replit Shell:
```bash
# Test root endpoint
curl http://localhost:5000/

# Test health endpoint  
curl http://localhost:5000/api/health

# Test with your deployed URL
curl https://your-repl.repl.co/
```

### Need More Help?

1. **Check Replit Logs**: Click on deployment → View logs
2. **MongoDB Logs**: MongoDB Atlas → Clusters → Metrics
3. **Test Locally**: Clone repo and run `cd backend && npm start`
4. **Verify Secrets**: Print them in code temporarily (remove after testing!)

### Success Indicators

✅ Deployment shows "Running"
✅ Health check endpoint returns 200 OK
✅ MongoDB shows "Connected" in /api/health
✅ Frontend can make API calls successfully
✅ No crash loops in logs

---

**Last Updated:** January 8, 2026
**Backend Port:** 5000
**Health Check:** `/` (root endpoint)
**API Prefix:** `/api/*`
