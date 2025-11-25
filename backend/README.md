# AI-Trader FastAPI Backend

A subscription-based AI trading platform backend built with FastAPI, designed to manage AI trading agents powered by DeepSeek.

## 🎯 Purpose

This backend API provides the infrastructure for a SaaS platform where users can:
- Subscribe to AI trading services
- Configure AI trading agents with different strategies
- Monitor portfolio performance and trade history
- Manage multiple portfolios and agents

## 🏗️ Architecture

### Core Components

- **FastAPI Application**: Modern, fast web API framework
- **SQLAlchemy ORM**: Database models and relationships
- **JWT Authentication**: Secure user authentication and authorization
- **PostgreSQL Database**: Persistent data storage
- **DeepSeek Integration**: AI model integration for trading decisions
- **AI-Trader Integration**: Connection to existing AI-Trader system

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login with JWT token
- `GET /me` - Get current user info
- `POST /refresh` - Refresh access token

#### User Management (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `POST /change-password` - Change password
- `GET /dashboard` - Dashboard overview
- `DELETE /account` - Deactivate account

#### Subscriptions (`/api/subscriptions`)
- `GET /` - Get subscription history
- `GET /current` - Get active subscription
- `POST /subscribe` - Create new subscription
- `POST /upgrade` - Upgrade subscription tier
- `POST /cancel` - Cancel subscription
- `GET /plans` - Get available plans
- `GET /usage` - Get usage statistics

#### Portfolios (`/api/portfolio`)
- `GET /` - List user portfolios
- `POST /` - Create new portfolio
- `GET /{id}` - Get portfolio details
- `PUT /{id}` - Update portfolio
- `DELETE /{id}` - Delete portfolio
- `GET /{id}/performance` - Performance metrics
- `GET /{id}/holdings` - Current holdings

#### Trades (`/api/trades`)
- `GET /` - Trade history with filtering
- `GET /{id}` - Trade details
- `GET /analytics/summary` - Trade analytics
- `GET /analytics/performance` - Performance analytics

#### Agents (`/api/agents`)
- `GET /` - List agent configurations
- `POST /` - Create agent configuration
- `GET /{id}` - Get agent details
- `PUT /{id}` - Update agent configuration
- `DELETE /{id}` - Delete agent
- `POST /{id}/start` - Start agent
- `POST /{id}/stop` - Stop agent
- `GET /{id}/performance` - Agent performance
- `GET /strategies/available` - Available strategies

## 🛠️ Setup

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Clone and setup:**
   ```bash
   cd backend
   ./setup.sh
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Start the development server:**
   ```bash
   source venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8080
   ```

4. **Access API documentation:**
   - Swagger UI: http://localhost:8080/api/docs
   - ReDoc: http://localhost:8080/api/redoc

## 📊 Database Models

### User
- User accounts and profiles
- Authentication credentials
- Timestamps and status

### Subscription
- Subscription plans and tiers
- Billing information
- Feature limits and usage

### Portfolio
- Investment portfolios
- Performance metrics
- Holdings and cash balance

### Trade
- Individual buy/sell transactions
- AI reasoning and confidence scores
- Execution details and P&L

### AgentConfig
- AI agent configurations
- Trading strategies and parameters
- Performance tracking

## 🔗 Integration

### DeepSeek AI Integration
The backend integrates with DeepSeek's API for AI trading decisions:
- Model configuration and API key management
- Custom prompting for trading strategies
- Decision logging and reasoning capture

### AI-Trader System Integration
Connects to the existing AI-Trader system:
- Agent lifecycle management
- Configuration file generation
- Data synchronization
- Portfolio and trade sync

## 🚀 Deployment

### Environment Variables
```bash
DATABASE_URL=postgresql://user:pass@localhost/aitrader
SECRET_KEY=your-secret-key
DEEPSEEK_API_KEY=your-deepseek-key
DEEPSEEK_API_BASE=https://api.deepseek.com/v1
```

### Docker Deployment
```bash
# Build image
docker build -t ai-trader-backend .

# Run with docker-compose
docker-compose up -d
```

### Production Considerations
- Use environment-specific configuration
- Set up proper logging
- Configure SSL/TLS
- Set up monitoring and health checks
- Use connection pooling for database
- Implement rate limiting
- Set up backup strategies

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- SQL injection prevention with SQLAlchemy
- CORS configuration
- Input validation with Pydantic
- API rate limiting (recommended)

## 📈 Monitoring

### Health Checks
- `GET /api/health` - Basic health check
- Database connectivity monitoring
- AI-Trader integration status

### Logging
- Structured logging with timestamps
- Request/response logging
- Error tracking and alerting
- Performance monitoring

## 🧪 Testing

```bash
# Run tests
pytest tests/

# Run with coverage
pytest --cov=app tests/
```

## 📚 API Documentation

The API is fully documented with OpenAPI/Swagger:
- Interactive documentation at `/api/docs`
- OpenAPI schema at `/api/openapi.json`
- Alternative docs at `/api/redoc`

## 🔄 Development Workflow

1. **Feature Development:**
   - Create feature branch
   - Implement changes
   - Add/update tests
   - Update documentation

2. **Database Changes:**
   - Create migration with Alembic
   - Test migration up/down
   - Update models and schemas

3. **API Changes:**
   - Update Pydantic schemas
   - Implement endpoint logic
   - Update OpenAPI documentation
   - Test with frontend integration

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request

## 📝 License

This project is part of the AI-Trader system and follows the same licensing terms.