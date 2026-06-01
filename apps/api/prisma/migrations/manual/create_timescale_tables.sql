-- Enable TimescaleDB extension if not already enabled
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create daily OHLCV table
CREATE TABLE IF NOT EXISTS ohlcv_daily (
  symbol      VARCHAR(20) NOT NULL,
  open        DECIMAL(18,6) NOT NULL,
  high        DECIMAL(18,6) NOT NULL,
  low         DECIMAL(18,6) NOT NULL,
  close       DECIMAL(18,6) NOT NULL,
  volume      BIGINT NOT NULL,
  vwap        DECIMAL(18,6),
  timestamp   TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (symbol, timestamp)
);

-- Convert ohlcv_daily into a hypertable
SELECT create_hypertable('ohlcv_daily', 'timestamp', if_not_exists => TRUE);

-- Create optimized index for symbol and timestamp desc
CREATE INDEX IF NOT EXISTS ohlcv_daily_symbol_timestamp_idx ON ohlcv_daily (symbol, timestamp DESC);

-- Create 1-minute OHLCV table with the same structure
CREATE TABLE IF NOT EXISTS ohlcv_1min (LIKE ohlcv_daily INCLUDING ALL);

-- Convert ohlcv_1min into a hypertable with 1-day chunks
SELECT create_hypertable('ohlcv_1min', 'timestamp', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);

-- Create optimized index for 1min table
CREATE INDEX IF NOT EXISTS ohlcv_1min_symbol_timestamp_idx ON ohlcv_1min (symbol, timestamp DESC);
