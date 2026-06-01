# Fintech Dashboard (Apex Trading)

A real-time fintech dashboard and mock trading web application built using Turborepo, Next.js, Express, WebSocket streams, TimescaleDB, and Alpaca Market Data APIs.

## Prerequisites
- Node.js (version >= 18)
- PNPM (version >= 9.0)
- PostgreSQL with TimescaleDB extension
- Redis server

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Database Migrations**:
   Run Prisma database sync:
   ```bash
   pnpm --filter api prisma db push
   ```

3. **Configure Environment Variables**:
   Create an `.env` file under `apps/api` (using `apps/api/.env.example` as a template) and add the following keys:
   ```env
   # API Configuration
   PORT=3001
   DATABASE_URL="postgresql://user:password@localhost:5432/apex_trading?schema=public"
   REDIS_URL="redis://localhost:6379"
   JWT_ACCESS_SECRET="your_jwt_access_secret_key"
   JWT_REFRESH_SECRET="your_jwt_refresh_secret_key"

   # Alpaca Market API (Paper Trading)
   ALPACA_API_KEY="YOUR_ALPACA_PAPER_KEY"
   ALPACA_SECRET_KEY="YOUR_ALPACA_PAPER_SECRET"
   ALPACA_PAPER=true
   ```

4. **Run in Development mode**:
   ```bash
   pnpm dev
   ```
   - **Frontend App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:3001`
   - **WebSocket Stream**: `ws://localhost:3001/ws`

## Architecture Highlights
* **TimescaleDB Integration**: OHLCV candlesticks are logged in hypertables to deliver sub-200ms historical price responses.
* **WebSocket Feeds**: Live market updates are multiplexed from a single upstream Alpaca connection and distributed to connected client browsers.
* **Autocompletion**: Fuzzy client-side search indexing covering active US equities (cached 1 hour).
* **Keyboard navigation**: Press `/` or `Ctrl+K` to search tickers; navigate results with arrow keys and press `Enter` to navigate. Press `Ctrl+P` for system Command Palette.