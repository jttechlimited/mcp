const { Pool } = require('pg');
const { logger } = require('../utils/logger');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'youzou_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function connectDatabase() {
  try {
    await pool.connect();
    logger.info('Connected to PostgreSQL database');
    
    // Create tables if they don't exist
    await createTables();
    
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

async function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255),
      google_id VARCHAR(255),
      name VARCHAR(255),
      avatar_url TEXT,
      points INTEGER DEFAULT 100,
      subscription_type VARCHAR(20) DEFAULT 'free',
      subscription_status VARCHAR(20) DEFAULT 'inactive',
      subscription_end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      phone_verified BOOLEAN DEFAULT false
    );
  `;

  const createUserPreferencesTable = `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      flight_class VARCHAR(20) DEFAULT 'economy',
      preferred_airlines TEXT[],
      hotel_rating_min INTEGER DEFAULT 3,
      hotel_budget_max INTEGER,
      hotel_distance_max INTEGER DEFAULT 10,
      flight_time_preference VARCHAR(20) DEFAULT 'flexible',
      notification_enabled BOOLEAN DEFAULT true,
      language VARCHAR(10) DEFAULT 'zh-TW',
      currency VARCHAR(10) DEFAULT 'HKD',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSearchHistoryTable = `
    CREATE TABLE IF NOT EXISTS search_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      search_type VARCHAR(20) NOT NULL,
      origin VARCHAR(10) NOT NULL,
      destination VARCHAR(10) NOT NULL,
      departure_date DATE NOT NULL,
      return_date DATE,
      passengers INTEGER DEFAULT 1,
      flight_class VARCHAR(20) DEFAULT 'economy',
      hotel_preferences JSONB,
      search_mode VARCHAR(20) DEFAULT 'best_price',
      results JSONB,
      points_cost INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'completed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP
    );
  `;

  const createAutoCheckerTable = `
    CREATE TABLE IF NOT EXISTS auto_checker (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      search_history_id INTEGER REFERENCES search_history(id) ON DELETE CASCADE,
      check_interval VARCHAR(20) DEFAULT '24h',
      last_check TIMESTAMP,
      next_check TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      notification_enabled BOOLEAN DEFAULT true,
      price_change_threshold DECIMAL(10,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createPointsTransactionsTable = `
    CREATE TABLE IF NOT EXISTS points_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      points_change INTEGER NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      description TEXT,
      reference_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSubscriptionsTable = `
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      stripe_subscription_id VARCHAR(255),
      plan_type VARCHAR(20) NOT NULL,
      status VARCHAR(20) NOT NULL,
      current_period_start TIMESTAMP,
      current_period_end TIMESTAMP,
      cancel_at_period_end BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createSupportTicketsTable = `
    CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'open',
      priority VARCHAR(20) DEFAULT 'medium',
      whatsapp_number VARCHAR(20),
      email VARCHAR(255),
      response TEXT,
      resolved_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createUsersTable);
    await pool.query(createUserPreferencesTable);
    await pool.query(createSearchHistoryTable);
    await pool.query(createAutoCheckerTable);
    await pool.query(createPointsTransactionsTable);
    await pool.query(createSubscriptionsTable);
    await pool.query(createSupportTicketsTable);
    
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error('Error creating database tables:', error);
    throw error;
  }
}

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    logger.error('Database query error:', error);
    throw error;
  }
}

async function getClient() {
  return await pool.connect();
}

module.exports = {
  connectDatabase,
  query,
  getClient,
  pool
};