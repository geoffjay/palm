# Simplify - Personal Life Manager

A modern personal life management application built with Bun, React, and TypeScript. Track health metrics, visualize trends, and manage your personal data with a clean, intuitive interface.

## 🌟 Features

- **Biometric Tracking**: Record and monitor health metrics like blood pressure, heart rate, weight, and more
- **Interactive Charts**: Visualize trends over time with beautiful, responsive charts powered by Nivo
- **Google OAuth**: Secure authentication with Google accounts
- **Real-time UI**: Modern React interface with Radix UI components and Tailwind CSS
- **Data Persistence**: PostgreSQL database with Redis session management
- **Type Safety**: Full TypeScript coverage for robust development

## 🛠 Technology Stack

### Frontend

- **React 19+** - Modern UI framework with concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Radix UI** - Accessible, unstyled UI components
- **Tailwind CSS v4** - Utility-first CSS framework
- **Nivo** - Rich data visualization library
- **Zustand** - Lightweight state management
- **React Router** - Declarative routing

### Backend

- **Bun** - High-performance JavaScript runtime and package manager
- **Bun.serve()** - Native web server with WebSocket support
- **Drizzle ORM** - Type-safe SQL toolkit
- **PostgreSQL** - Primary database
- **Redis** - Session storage and caching

### Development Tools

- **Biome** - Fast formatter and linter
- **Docker Compose** - Local development services
- **Drizzle Kit** - Database migrations and introspection

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) (for database services)
- [Google Cloud Console](https://console.cloud.google.com/) account (for OAuth)

### 1. Clone and Install

```bash
git clone <repository-url>
cd simplify
bun install
```

### 2. Start Database Services

```bash
# Start PostgreSQL and Redis with Docker Compose
docker-compose up -d

# Or use the management script
./scripts/docker.sh start
```

### 3. Configure Environment

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=user
DB_PASSWORD=password
DB_NAME=simplify

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session
SESSION_TTL=86400

# Development
DEBUG=true
LOG_LEVEL=info
```

### 4. Set Up Database

```bash
# Run database migrations
bun run db:migrate

# Seed with initial data (optional)
bun run db:seed
```

### 5. Start Development Server

```bash
bun run dev
```

The application will be available at `http://localhost:3000`

## 🔧 Development

### Available Scripts

```bash
# Development
bun run dev              # Start development server with hot reload
bun run start            # Start production server

# Database
bun run db:generate      # Generate new migration
bun run db:migrate       # Run migrations
bun run db:push          # Push schema changes to database
bun run db:studio        # Open Drizzle Studio (database GUI)
bun run db:seed          # Seed database with sample data

# Code Quality
bun run lint             # Run linter
bun run lint:fix         # Fix linting issues
bun run format           # Check formatting
bun run format:fix       # Fix formatting issues
bun run check            # Run all checks
bun run check:fix        # Fix all issues

# Build
bun run build            # Build for production
```

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API and OAuth2 API
4. Create OAuth 2.0 Client IDs
5. Add authorized redirect URI:
   - Development: `http://localhost:3000/auth/google/callback`
   - Production: `https://yourdomain.com/auth/google/callback`
6. Copy Client ID and Client Secret to your `.env` file

For detailed setup instructions, see [docs/oauth.md](docs/oauth.md)

## 📊 Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users** - OAuth user profiles
- **User Sessions** - Session management (complemented by Redis)
- **Biometric Measurement Types** - Configurable measurement categories
- **Biometric Measurements** - Individual health metric records
- **Biometric Measurement Subtypes** - Complex measurements (e.g., blood pressure)

See the [database schema](db/schema.ts) for complete structure.

## 🐳 Docker Services

The project includes Docker Compose configuration for local development:

```bash
# Service management
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose ps           # View service status
docker-compose logs -f      # View service logs

# Using the management script
./scripts/docker.sh start   # Start services
./scripts/docker.sh stop    # Stop services
./scripts/docker.sh status  # Check status
./scripts/docker.sh psql    # Connect to PostgreSQL
./scripts/docker.sh redis-cli # Connect to Redis CLI
```

## 🔒 Security Features

- **Google OAuth 2.0** - Secure authentication
- **Session Management** - Redis-backed sessions with TTL
- **CSRF Protection** - Cross-site request forgery prevention
- **Rate Limiting** - API endpoint protection
- **Secure Cookies** - HTTP-only, secure cookies in production
- **Type Safety** - TypeScript throughout the stack

## 📖 API Documentation

### Authentication Endpoints

- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `POST /auth/logout` - User logout
- `GET /auth/user` - Get current user

### Biometrics API

- `GET /api/biometrics/measurements` - Get user measurements
- `POST /api/biometrics/measurements` - Add new measurement
- `GET /api/biometrics/types` - Get measurement types
- `DELETE /api/biometrics/measurements/:id` - Delete measurement

## 🧪 Testing

```bash
# Run tests
bun test

# Run tests in watch mode
bun test --watch

# Run specific test file
bun test src/components/__tests__/BiometricsPage.test.tsx
```

## 📚 Additional Documentation

- [Setup Guide](docs/setup.md) - Detailed development setup
- [OAuth Configuration](docs/oauth.md) - Google OAuth setup guide
- [Docker Services](docs/docker-services.md) - Docker configuration details
- [Migration System](docs/migrations.md) - Database migration guide
- [Technologies](docs/technologies.md) - Technology stack details

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Errors**

```bash
# Start Redis container
docker run -d -p 6379:6379 --name simplify-redis redis:alpine
```

**Port Already in Use**

```bash
# Kill existing Bun processes
pkill -f "bun.*index.tsx"
```

**OAuth Redirect URI Mismatch**

- Ensure redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/auth/google/callback`

**Database Connection Issues**

```bash
# Reset database services
docker-compose down
docker-compose up -d
bun run db:migrate
```

## 🚀 Production Deployment

1. **Environment Configuration**

   ```env
   NODE_ENV=production
   BASE_URL=https://yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   SECURE_COOKIES=true
   ```

2. **Database Setup**
   - Use managed PostgreSQL service
   - Configure Redis cluster for session storage
   - Run migrations: `bun run db:migrate`

3. **Security**
   - Enable HTTPS
   - Configure CORS properly
   - Use secure session settings
   - Update OAuth redirect URIs

4. **Build and Deploy**
   ```bash
   bun run build
   bun start
   ```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to submit issues or pull requests.

## 🆘 Support

For questions or issues, please check the [documentation](docs/) or create an issue in the repository.
