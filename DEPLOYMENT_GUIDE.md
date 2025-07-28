# 🚀 LegalDocConverter.com - Complete Deployment Guide

## 📦 What You Have

Your complete LegalDocConverter platform includes:
- **Frontend**: React application (located in `/frontend` folder)
- **Backend**: FastAPI Python application (located in `/backend` folder)
- **Database**: MongoDB integration
- **AI Integration**: OpenAI GPT-4 for legal analysis
- **Payment**: Stripe integration for subscriptions

## 🎯 Deployment Options

### Option 1: Full-Stack Deployment (Recommended)
Deploy both frontend and backend for complete functionality.

### Option 2: Frontend-Only Deployment  
Deploy just the frontend (will need to modify for static hosting).

---

## 🌐 FRONTEND DEPLOYMENT (React App)

### **Method A: Netlify Deployment (Easiest)**

#### Step 1: Prepare Your Files
1. Download the deployment package: `legaldocconverter-deployment.tar.gz`
2. Extract it to your local computer
3. Navigate to the `frontend` folder

#### Step 2: Build the React App
```bash
cd frontend
npm install  # or yarn install
npm run build  # This creates a 'build' folder
```

#### Step 3: Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `build` folder from your frontend directory
4. Your site will get a random URL like `https://amazing-site-123.netlify.app`

#### Step 4: Connect Your Domain
1. In Netlify dashboard, go to "Domain settings"
2. Click "Add custom domain"
3. Enter: `legaldocconverter.com`
4. Follow the DNS setup instructions (update your domain's nameservers)

#### Step 5: Environment Variables
1. In Netlify dashboard, go to "Site settings" → "Environment variables"
2. Add: `REACT_APP_BACKEND_URL` = `https://your-backend-url.com`

---

### **Method B: Vercel Deployment**

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Deploy
```bash
cd frontend
vercel --prod
```

#### Step 3: Connect Domain
Follow Vercel's domain connection guide for `legaldocconverter.com`

---

### **Method C: Traditional Web Hosting**

#### Step 1: Build the App
```bash
cd frontend
npm install
npm run build
```

#### Step 2: Upload Files
1. Upload the entire `build` folder contents to your web host
2. Point your domain `legaldocconverter.com` to the hosting folder

---

## 🔧 BACKEND DEPLOYMENT (FastAPI + MongoDB)

### **Method A: Railway Deployment (Recommended)**

#### Step 1: Prepare Backend
1. Create account at [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repo or upload files

#### Step 2: Add Environment Variables
In Railway dashboard, add:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=legalconverter
OPENAI_API_KEY=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
```

#### Step 3: Add MongoDB Service
1. In Railway, add MongoDB service
2. Update `MONGO_URL` with the Railway MongoDB connection string

#### Step 4: Deploy
Railway will auto-deploy and give you a backend URL like:
`https://your-app.railway.app`

---

### **Method B: Heroku Deployment**

#### Step 1: Create Heroku App
```bash
heroku create legaldocconverter-api
```

#### Step 2: Add MongoDB
```bash
heroku addons:create mongolab:sandbox
```

#### Step 3: Set Environment Variables
```bash
heroku config:set OPENAI_API_KEY=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
```

#### Step 4: Create Procfile
Create `Procfile` in backend folder:
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

#### Step 5: Deploy
```bash
git push heroku main
```

---

### **Method C: DigitalOcean App Platform**

1. Create DigitalOcean account
2. Use App Platform to deploy your backend
3. Add environment variables
4. Connect MongoDB database

---

## 🔗 CONNECTING FRONTEND TO BACKEND

After deploying both:

1. **Get your backend URL** (e.g., `https://your-api.railway.app`)
2. **Update frontend environment variables**:
   - Netlify: Site settings → Environment variables
   - Vercel: Project settings → Environment variables
   - Set `REACT_APP_BACKEND_URL` to your backend URL
3. **Redeploy frontend** to pick up the new backend URL

---

## 📋 QUICK DEPLOYMENT CHECKLIST

### Before Deployment:
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Backend runs locally (`python server.py`)
- [ ] OpenAI API key is working
- [ ] Stripe payment link is correct
- [ ] Domain `legaldocconverter.com` is purchased

### After Deployment:
- [ ] Frontend loads at your domain
- [ ] File upload works
- [ ] Document conversion works  
- [ ] AI analysis works
- [ ] Stripe payment button works
- [ ] All pages are responsive

---

## 🚨 IMPORTANT NOTES

### Security:
- Never expose API keys in frontend code
- All sensitive keys should be in backend environment variables only
- Use HTTPS for both frontend and backend

### Domain Setup:
1. Point `legaldocconverter.com` to your frontend hosting
2. You might want `api.legaldocconverter.com` for your backend
3. Update CORS settings in backend to allow your domain

### MongoDB:
- For production, use MongoDB Atlas (cloud) instead of local MongoDB
- Update connection string in environment variables

---

## 🆘 TROUBLESHOOTING

### Common Issues:

**"Backend not responding"**
- Check if backend URL is correct in environment variables
- Verify backend is deployed and running
- Check CORS settings

**"File upload fails"**
- Ensure backend has proper file size limits
- Check if all required packages are installed
- Verify environment variables are set

**"AI analysis not working"**
- Verify OpenAI API key is correct and has credits
- Check backend logs for API errors

**"Payment not working"**
- Verify Stripe link is correct
- Test the payment link directly

---

## 📞 SUPPORT

If you encounter issues:
1. Check browser console for errors
2. Check backend logs
3. Verify all environment variables are set correctly
4. Test each component individually

---

## 🎉 YOU'RE READY TO LAUNCH!

Once deployed, your customers can:
1. Visit `legaldocconverter.com`
2. Upload legal documents
3. Get AI-powered analysis
4. Convert between formats
5. Subscribe to Professional plan

**Your legal document processing platform is ready to serve customers!** 🚀