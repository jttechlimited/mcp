// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development
  : 'https://api.youzou-ai.com/api'; // Production

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  GOOGLE_LOGIN: '/auth/google-login',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGOUT: '/auth/logout',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',

  // User
  USER_PROFILE: '/user/profile',
  USER_PREFERENCES: '/user/preferences',
  USER_POINTS: '/user/points',
  USER_SUBSCRIPTION: '/user/subscription',

  // Search
  FLIGHT_SEARCH: '/search/flights',
  HOTEL_SEARCH: '/search/hotels',
  COMBINED_SEARCH: '/search/combined',
  SEARCH_HISTORY: '/search/history',
  SEARCH_DETAILS: '/search/details',

  // Auto Checker
  AUTO_CHECKER: '/auto-checker',
  AUTO_CHECKER_CREATE: '/auto-checker/create',
  AUTO_CHECKER_UPDATE: '/auto-checker/update',
  AUTO_CHECKER_DELETE: '/auto-checker/delete',
  AUTO_CHECKER_STATUS: '/auto-checker/status',

  // Payment
  PAYMENT_INTENT: '/payment/create-intent',
  PAYMENT_CONFIRM: '/payment/confirm',
  PAYMENT_HISTORY: '/payment/history',
  SUBSCRIPTION_CREATE: '/payment/create-subscription',
  SUBSCRIPTION_CANCEL: '/payment/cancel-subscription',

  // Support
  SUPPORT_TICKETS: '/support/tickets',
  SUPPORT_CREATE: '/support/create-ticket',
  SUPPORT_MESSAGES: '/support/messages',
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  SEARCH_RESULTS_TTL: 10 * 60 * 1000, // 10 minutes
  USER_DATA_TTL: 15 * 60 * 1000, // 15 minutes
};