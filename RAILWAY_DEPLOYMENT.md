# LegalDocConverter - Railway Deployment

This application consists of a React frontend and FastAPI backend.

## Deployment Instructions

### Backend Service
- Runtime: Python 3.11
- Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`

### Frontend Service  
- Runtime: Node.js 18
- Build Command: `yarn install && yarn build`
- Start Command: `npx serve -s build -l $PORT`

### Environment Variables Required

#### Backend:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `EMERGENT_LLM_KEY` - For AI analysis
- `JWT_SECRET_KEY` - For authentication tokens
- `OPENAI_API_KEY` - OpenAI API key

#### Frontend:
- `REACT_APP_BACKEND_URL` - URL of deployed backend service
