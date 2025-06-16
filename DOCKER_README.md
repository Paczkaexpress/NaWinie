# Docker Deployment Guide for Na Winie

This guide explains how to run the Na Winie application using Docker with Supabase integration for authentication and database.

## 🐳 Docker Setup

### Prerequisites

- Docker installed (version 20.10+)
- Docker Compose (usually included with Docker Desktop)
- A Supabase account and project

### Quick Start

1. **Clone the repository** (if not already done):
   ```bash
   git clone <your-repo-url>
   cd NaWinie
   ```

2. **Create environment file**:
   ```bash
   # Create .env file with your Supabase credentials
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`:
   ```env
   # JWT Configuration
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

   # Supabase Configuration (Required)
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # Database Configuration
   DATABASE_URL=postgresql://username:password@host:port/database

   # CORS Settings
   CORS_ORIGINS=http://localhost:3000,http://localhost:4321,http://localhost:8000

   # Environment
   ENVIRONMENT=production
   PUBLIC_USE_LOCAL_BACKEND=false
   ```

4. **Build and run with Docker Compose**:
   ```bash
   # Build and start the application
   docker-compose up --build -d

   # View logs
   docker-compose logs -f

   # Stop the application
   docker-compose down
   ```

5. **Access the application**:
   - API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🔧 Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET_KEY` | Secret key for JWT tokens | `openssl rand -hex 32` |
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | From Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | From Supabase dashboard |
| `PUBLIC_SUPABASE_URL` | Public Supabase URL | Same as `SUPABASE_URL` |
| `PUBLIC_SUPABASE_ANON_KEY` | Public Supabase anon key | Same as `SUPABASE_ANON_KEY` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | SQLite (development) |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:*` |
| `ENVIRONMENT` | Application environment | `production` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | `30` |

## 🗄️ Supabase Setup

### 1. Create Supabase Project
1. Go to [Supabase](https://app.supabase.com/)
2. Create a new project
3. Note your project URL and keys

### 2. Configure Database
You can either:
- **Option A**: Use Supabase PostgreSQL (recommended for production)
- **Option B**: Use local SQLite (for development/testing)

For Supabase PostgreSQL:
```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

### 3. Set up Authentication
The application uses Supabase for authentication. Make sure your Supabase project has:
- Email authentication enabled
- Proper RLS (Row Level Security) policies
- Required tables (will be created by the application)

## 📁 Docker Architecture

### Multi-Stage Build
The Dockerfile uses a multi-stage build process:

1. **Frontend Builder**: Builds the Astro/React frontend
2. **Backend Builder**: Installs Python dependencies
3. **Production Runtime**: Combines everything into a minimal image

### Directory Structure in Container
```
/app/
├── backend/           # FastAPI backend
├── frontend/dist/     # Built Astro frontend
├── db/               # Database migrations
├── logs/             # Application logs (mounted)
└── backend/images/   # Recipe images (mounted)
```

## 🚀 Deployment Options

### Development Mode
For development with live reloading:
```bash
# Use the development configuration (commented in docker-compose.yml)
# Uncomment the nawinie-dev service and run:
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Production Mode
For production deployment:
```bash
# Build optimized image
docker-compose up --build -d

# Or build specific image
docker build -t nawinie:latest .
docker run -d -p 8000:8000 --env-file .env nawinie:latest
```

### Cloud Deployment
For cloud platforms (AWS, GCP, Azure):
1. Push image to container registry
2. Set environment variables in your cloud platform
3. Deploy using platform-specific methods

## 🔍 Monitoring & Health Checks

The Docker container includes:
- Health checks every 30 seconds
- Automatic restart on failure
- Log rotation and management

Check container health:
```bash
# View container status
docker-compose ps

# Check health
docker inspect <container-id> | grep Health

# View logs
docker-compose logs -f nawinie-app
```

## 🛠️ Troubleshooting

### Common Issues

1. **Environment variables not loaded**:
   ```bash
   # Verify .env file exists and has correct format
   cat .env
   
   # Check environment in container
   docker-compose exec nawinie-app env | grep SUPABASE
   ```

2. **Database connection issues**:
   ```bash
   # Check Supabase credentials
   # Verify DATABASE_URL format
   # Check network connectivity
   ```

3. **Build failures**:
   ```bash
   # Clear Docker cache
   docker system prune -a
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

4. **Permission issues**:
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER logs/ backend/images/
   ```

### Debug Commands
```bash
# Access container shell
docker-compose exec nawinie-app bash

# View application logs
docker-compose logs -f

# Restart specific service
docker-compose restart nawinie-app

# View resource usage
docker stats

# Clean up containers and volumes
docker-compose down -v
docker system prune
```

## 📊 Performance Optimization

### Production Recommendations
- Use PostgreSQL instead of SQLite
- Configure proper CPU/memory limits
- Use Redis for caching (if needed)
- Implement proper logging and monitoring
- Use HTTPS in production
- Configure firewall and security groups

### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  nawinie-app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🔐 Security Notes

- Never commit `.env` files to version control
- Use strong `JWT_SECRET_KEY` (32+ characters)
- Regularly rotate Supabase keys
- Use HTTPS in production
- Implement proper CORS settings
- Regular security updates

## 📝 Additional Resources

- [Na Winie Documentation](README.md)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [FastAPI Docker Guide](https://fastapi.tiangolo.com/deployment/docker/) 