#!/bin/bash

# Docker management script for Simplify project
# Usage: ./scripts/docker.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if docker-compose is available
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose not found. Please install Docker Desktop or docker-compose."
        exit 1
    fi
}

# Start services
start() {
    print_status "Starting Redis and PostgreSQL services..."
    $COMPOSE_CMD up -d
    print_success "Services started successfully!"
    
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Check service health
    if $COMPOSE_CMD ps | grep -q "unhealthy"; then
        print_warning "Some services may not be healthy yet. Check with: $0 status"
    else
        print_success "All services are running!"
    fi
    
    echo
    print_status "Service URLs:"
    echo "  Redis: localhost:6379"
    echo "  PostgreSQL: localhost:5432"
    echo "  Database: simplify"
    echo "  Username: user"
    echo "  Password: password"
}

# Stop services
stop() {
    print_status "Stopping services..."
    $COMPOSE_CMD down
    print_success "Services stopped!"
}

# Restart services
restart() {
    print_status "Restarting services..."
    $COMPOSE_CMD restart
    print_success "Services restarted!"
}

# Show service status
status() {
    print_status "Service status:"
    $COMPOSE_CMD ps
}

# Show service logs
logs() {
    if [ -n "$2" ]; then
        print_status "Showing logs for $2..."
        $COMPOSE_CMD logs -f "$2"
    else
        print_status "Showing logs for all services..."
        $COMPOSE_CMD logs -f
    fi
}

# Clean up (stop and remove volumes)
clean() {
    print_warning "This will stop services and remove all data volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        $COMPOSE_CMD down -v
        print_success "Cleanup complete!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Connect to Redis CLI
redis_cli() {
    print_status "Connecting to Redis CLI..."
    $COMPOSE_CMD exec redis redis-cli
}

# Connect to PostgreSQL
psql() {
    print_status "Connecting to PostgreSQL..."
    $COMPOSE_CMD exec postgres psql -U user -d simplify
}

# Reset database
reset_db() {
    print_warning "This will reset the database and lose all data!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Resetting database..."
        $COMPOSE_CMD exec postgres psql -U user -d simplify -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        $COMPOSE_CMD restart postgres
        print_success "Database reset complete!"
    else
        print_status "Database reset cancelled."
    fi
}

# Show help
help() {
    echo "Docker management script for Simplify project"
    echo
    echo "Usage: $0 [command]"
    echo
    echo "Commands:"
    echo "  start       Start Redis and PostgreSQL services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs [service]  Show logs (optionally for specific service)"
    echo "  clean       Stop services and remove data volumes"
    echo "  redis-cli   Connect to Redis CLI"
    echo "  psql        Connect to PostgreSQL"
    echo "  reset-db    Reset database (WARNING: destroys data)"
    echo "  help        Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs redis"
    echo "  $0 psql"
}

# Main script logic
main() {
    check_docker_compose
    
    case "${1:-help}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs "$@"
            ;;
        clean)
            clean
            ;;
        redis-cli)
            redis_cli
            ;;
        psql)
            psql
            ;;
        reset-db)
            reset_db
            ;;
        help|--help|-h)
            help
            ;;
        *)
            print_error "Unknown command: $1"
            echo
            help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
