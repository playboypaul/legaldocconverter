#!/bin/bash

# 🚀 LegalDocConverter Quick Deploy Script
# Run this after extracting the deployment package

echo "🎯 LegalDocConverter.com Deployment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the extracted deployment folder"
    echo "   Make sure you have both 'frontend' and 'backend' folders here"
    exit 1
fi

echo "✅ Found frontend and backend folders"

# Frontend Setup
echo ""
echo "📦 Setting up Frontend..."
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in frontend folder"
    exit 1
fi

# Install dependencies
echo "📥 Installing frontend dependencies..."
if command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

# Build the frontend
echo "🔨 Building frontend for production..."
if command -v yarn &> /dev/null; then
    yarn build
else
    npm run build
fi

echo "✅ Frontend build complete! 'build' folder is ready for deployment"

# Backend Setup
echo ""
echo "🔧 Setting up Backend..."
cd ../backend

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found in backend folder"
    exit 1
fi

# Create virtual environment (optional but recommended)
if command -v python3 &> /dev/null; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    echo "📥 Installing Python dependencies..."
    pip install -r requirements.txt
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Python3 not found. Please install Python dependencies manually:"
    echo "   pip install -r requirements.txt"
fi

# Go back to root
cd ..

echo ""
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo ""
echo "📁 Your files are ready:"
echo "   • Frontend build: ./frontend/build/ (deploy this to Netlify/Vercel)"
echo "   • Backend app: ./backend/ (deploy this to Railway/Heroku)"
echo ""
echo "🌐 Next Steps:"
echo "   1. Deploy frontend/build/ folder to Netlify"
echo "   2. Deploy backend/ folder to Railway or Heroku"
echo "   3. Update environment variables with your backend URL"
echo "   4. Connect your domain: legaldocconverter.com"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🚀 Ready to launch LegalDocConverter.com!"