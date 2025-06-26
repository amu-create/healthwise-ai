# HealthWise AI

AI 기반 개인 맞춤형 헬스케어 플랫폼

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Git

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/amu-create/healthwise-ai.git
cd healthwise-ai

# 2. Create .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Add Firebase config to frontend/.env
# Edit frontend/.env and add your Firebase configuration

# 4. Run with Docker
docker-compose -f docker-compose.dev.yml up --build -d
```

### Access
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Admin Panel: http://localhost:8000/admin (admin/admin123)

## 🛠️ Commands

```bash
# Start services
docker-compose -f docker-compose.dev.yml up --build -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down

# Reset everything (delete data)
docker-compose -f docker-compose.dev.yml down -v
```

## 📁 Project Structure

```
healthwise-ai/
├── backend/              # Django REST API
│   ├── apps/            # Django applications
│   ├── healthwise/      # Project settings
│   └── requirements.txt # Python dependencies
├── frontend/            # React TypeScript
│   ├── src/            # Source code
│   └── package.json    # Node dependencies
├── docker/             # Docker configurations
├── docs/               # Documentation
└── docker-compose.dev.yml
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Copy from backend/.env.example
# Add your API keys if needed:
OPENAI_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Frontend (.env)
```env
# Firebase Configuration (Required)
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🐛 Troubleshooting

### Docker not running
- Make sure Docker Desktop is running

### Port already in use
- Check ports 3000, 8000, 5432, 6379
- Stop conflicting services or change ports in docker-compose.dev.yml

### Database issues
```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

## 📝 License

MIT License
