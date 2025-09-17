# Personal Life Manager

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

### Testing

- **Bun Test** - Built-in testing framework with TypeScript support
- **JSDOM** - DOM simulation for React component testing
- **Comprehensive Test Coverage** - Unit tests, integration tests, and mocks

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (latest version)
- [Docker](https://www.docker.com/) (for database services)
- [Google Cloud Console](https://console.cloud.google.com/) account (for OAuth)

### 1. Clone and Install

```bash
git clone <repository-url>
cd palm
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
DB_NAME=palm

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
bun run start            # Start production server (with Bun's native bundling)
bun run start:static     # Start production server (with pre-built static files)

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

# Testing
bun test                 # Run all tests
bun run test:watch       # Run tests in watch mode
bun run test:coverage    # Run tests with coverage report

# Build
bun run build            # Build static assets for production (outputs to dist/)
```

### Project Structure

```
src/
├── components/          # React components
│   ├── BiometricsPage.tsx
│   ├── Dashboard.tsx
│   ├── AddMeasurementDialog.tsx
│   └── ...
├── contexts/           # React contexts
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx
│   └── useBiometrics.ts
├── stores/             # Zustand stores
│   └── biometricStore.ts
├── auth/               # Authentication logic
│   ├── oauth.ts
│   ├── session.ts
│   ├── middleware.ts
│   └── handlers.ts
├── types/              # TypeScript type definitions
└── index.tsx           # Main server entry point

db/
├── schema.ts           # Database schema definitions
├── migrate.ts          # Migration runner
├── seed.ts             # Database seeding
└── services/           # Database service layer
    ├── userService.ts
    ├── biometricService.ts
    └── sessionService.ts

tests/
├── setup.ts            # Test configuration and utilities
├── auth/               # Authentication tests
├── db/services/        # Database service tests
├── hooks/              # React hooks tests
├── stores/             # State management tests
├── api/                # API endpoint tests
└── utils/              # Utility function tests
```

## 🧪 Testing

The project includes comprehensive test coverage using Bun's built-in testing framework:

### Test Types

- **Unit Tests**: Individual components, hooks, and services
- **Integration Tests**: API endpoints and database operations
- **Mock Tests**: External dependencies and complex integrations

### Running Tests

```bash
# Run all tests
bun test

# Run specific test files
bun test tests/auth/
bun test tests/stores/biometricStore.test.ts

# Run tests in watch mode (auto-rerun on changes)
bun run test:watch

# Run with coverage report
bun run test:coverage
```

### Test Structure

```bash
tests/
├── setup.ts                    # Global test configuration
├── basic.test.ts              # Smoke tests
├── auth/
│   ├── oauth.test.ts          # OAuth flow tests
│   ├── session.test.ts        # Session management tests
│   ├── middleware.test.ts     # Auth middleware tests
│   └── simple-auth.test.ts    # Basic auth logic tests
├── db/services/
│   ├── userService.test.ts    # User database operations
│   └── biometricService.test.ts # Biometric data operations
├── hooks/
│   └── useAuth.test.ts        # React authentication hooks
├── stores/
│   └── biometricStore.test.ts # Zustand state management
├── api/
│   └── endpoints.test.ts      # API endpoint integration tests
└── utils/
    ├── testHelpers.ts         # Test utilities and mocks
    └── validation.test.ts     # Utility function tests
```

### Test Coverage

The test suite covers:

- ✅ Authentication flows (OAuth, sessions, middleware)
- ✅ Database services (users, biometrics, CRUD operations)
- ✅ State management (Zustand stores)
- ✅ API endpoints (CRUD, error handling, authentication)
- ✅ Utility functions (validation, formatting)
- ✅ Mock implementations for external dependencies

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

## 🚨 Troubleshooting

### Common Issues

**Redis Connection Errors**

```bash
# Start Redis container
docker run -d -p 6379:6379 --name palm-redis redis:alpine
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

**Test Failures**

```bash
# Run tests with verbose output
bun test --verbose

# Run specific failing test
bun test tests/path/to/specific.test.ts
```

## 🏗️ Build System

### Development vs Production

The project supports two deployment modes:

**Development Mode:**

- Uses Bun's native HTML imports with HMR
- No build step required
- All bundling happens at runtime
- Perfect for development with instant updates

```bash
bun run dev  # Start with hot reloading
```

**Production Mode:**

- Option 1: Use Bun's native bundling (faster startup)
  ```bash
  bun run start  # Runtime bundling
  ```
- Option 2: Use pre-built static assets (optimized for CDN/caching)
  ```bash
  bun run build       # Build static assets to dist/
  bun run start:static # Serve pre-built assets
  ```

**Benefits of `build.ts`:**

- 🚀 **Minification & Bundling**: Combines 26+ source files into optimized chunks
- 📦 **Asset Optimization**: Fingerprinted filenames for cache busting
- 🔒 **Source Maps**: Production debugging support
- ⚡ **Performance**: Fewer HTTP requests, smaller bundle sizes
- 🏭 **CDN Ready**: Static assets can be served by CDN/nginx
- 🎯 **Tree Shaking**: Dead code elimination
- 💾 **TailwindCSS**: CSS purging and optimization

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

   **Option A: Runtime bundling (faster deployment)**

   ```bash
   bun start
   ```

   **Option B: Pre-built assets (optimized for scale)**

   ```bash
   bun run build
   bun run start:static
   ```

## 🤖 Continuous Integration

The project includes comprehensive GitHub Actions workflows:

### 🧪 **Test Suite** (`test.yml`)

- **Triggers**: Push to main/develop, Pull Requests to main/develop, Manual
- **Focus**: Pure functionality testing (no linting - handled by PR checks)
- **Matrix Testing**: Multiple Bun versions (1.2.17, latest)
- **Services**: PostgreSQL 15, Redis 7
- **Coverage**: Unit tests, integration tests, Docker validation
- **Reporting**: Codecov integration for coverage reports

### 🔍 **Pull Request Checks** (`pr-checks.yml`)

- **Triggers**: All Pull Requests (fast ~3min feedback)
- **Code Quality**: Linting, formatting, TypeScript validation
- **Build Verification**: Ensures build process works
- **Security Audit**: Basic dependency vulnerability scanning
- **PR Analytics**: File changes, dependency analysis, bundle size reports
- **Smart Separation**: Handles all code quality checks so test suite can focus on functionality

### 🔒 **Security & Dependencies** (`security.yml`)

- **Schedule**: Weekly security audits (Sundays 2 AM UTC)
- **CodeQL Analysis**: Static security analysis
- **Dependency Review**: License compliance checks
- **Bundle Analysis**: Performance impact assessment

### 📊 **Workflow Features**

- ✅ **Parallel Execution**: Concurrent job processing
- ✅ **Service Integration**: Real database/Redis testing
- ✅ **Matrix Testing**: Multiple environment validation
- ✅ **Docker Testing**: Container build verification
- ✅ **Coverage Reporting**: Test coverage tracking
- ✅ **Security Scanning**: Automated vulnerability detection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

This is a personal project, but contributions are welcome! Please feel free to submit issues or pull requests.

## 🆘 Support

For questions or issues, please check the [documentation](docs/) or create an issue in the repository.
