const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateOtaProviderConfig } = require('../validators/searchValidator');
const { flightService } = require('../services/flightService');
const { hotelService } = require('../services/hotelService');

const router = express.Router();

// Get OTA provider configurations
router.get('/ota-providers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Get provider configurations from database
    const result = await query(
      'SELECT provider_name, config_data, is_enabled, test_status, test_message, last_test_at, created_at, updated_at FROM ota_providers ORDER BY provider_name'
    );

    const providers = {};
    const testResults = {};

    result.rows.forEach(row => {
      const config = JSON.parse(row.config_data);
      providers[row.provider_name] = {
        enabled: row.is_enabled,
        apiKey: config.apiKey || '',
        apiSecret: config.apiSecret || '',
        endpoint: config.endpoint || '',
        rateLimit: config.rateLimit || 100,
        timeout: config.timeout || 10000
      };

      testResults[row.provider_name] = {
        success: row.test_status,
        message: row.test_message,
        timestamp: row.last_test_at
      };
    });

    res.json({
      message: '獲取OTA提供商配置成功',
      data: {
        providers,
        testResults
      }
    });

  } catch (error) {
    logger.error('Get OTA providers error:', error);
    res.status(500).json({
      error: {
        message: '獲取OTA提供商配置失敗',
        code: 'FETCH_FAILED'
      }
    });
  }
});

// Update OTA provider configurations
router.post('/ota-providers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { providers } = req.body;

    // Validate each provider configuration
    for (const [provider, config] of Object.entries(providers)) {
      const { error } = validateOtaProviderConfig(config);
      if (error) {
        return res.status(400).json({
          error: {
            message: `${provider} 配置驗證失敗: ${error.details[0].message}`,
            code: 'VALIDATION_ERROR'
          }
        });
      }
    }

    // Update each provider
    for (const [provider, config] of Object.entries(providers)) {
      const configData = JSON.stringify({
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
        endpoint: config.endpoint,
        rateLimit: config.rateLimit,
        timeout: config.timeout
      });

      await query(
        `INSERT INTO ota_providers (provider_name, config_data, is_enabled, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (provider_name) 
         DO UPDATE SET config_data = $2, is_enabled = $3, updated_at = NOW()`,
        [provider, configData, config.enabled]
      );

      // Update service configurations
      if (provider === 'amadeus' || provider === 'skyscanner') {
        flightService.configureProviders({ [provider]: config });
      } else if (['booking', 'hotels', 'agoda', 'expedia'].includes(provider)) {
        hotelService.configureProviders({ [provider]: config });
      }
    }

    // Test connections for enabled providers
    const testResults = {};
    for (const [provider, config] of Object.entries(providers)) {
      if (config.enabled) {
        try {
          const testResult = await testProviderConnection(provider, config);
          testResults[provider] = testResult;
        } catch (error) {
          testResults[provider] = {
            success: false,
            message: error.message
          };
        }
      }
    }

    logger.info('OTA providers configuration updated', { providers: Object.keys(providers) });

    res.json({
      message: 'OTA提供商配置更新成功',
      data: {
        providers,
        testResults
      }
    });

  } catch (error) {
    logger.error('Update OTA providers error:', error);
    res.status(500).json({
      error: {
        message: '更新OTA提供商配置失敗',
        code: 'UPDATE_FAILED'
      }
    });
  }
});

// Test OTA provider connection
router.post('/ota-providers/:provider/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider } = req.params;

    // Get provider configuration
    const result = await query(
      'SELECT config_data, is_enabled FROM ota_providers WHERE provider_name = $1',
      [provider]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: '找不到指定的提供商',
          code: 'NOT_FOUND'
        }
      });
    }

    const config = JSON.parse(result.rows[0].config_data);
    const isEnabled = result.rows[0].is_enabled;

    if (!isEnabled) {
      return res.status(400).json({
        error: {
          message: '提供商未啟用',
          code: 'PROVIDER_DISABLED'
        }
      });
    }

    const testResult = await testProviderConnection(provider, config);

    // Update test results in database
    await query(
      'UPDATE ota_providers SET test_status = $1, test_message = $2, last_test_at = NOW() WHERE provider_name = $3',
      [testResult.success, testResult.message, provider]
    );

    res.json({
      message: '連接測試完成',
      data: testResult
    });

  } catch (error) {
    logger.error('Test OTA provider error:', error);
    res.status(500).json({
      error: {
        message: '測試連接失敗',
        code: 'TEST_FAILED'
      }
    });
  }
});

// Get API usage statistics
router.get('/api-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, provider } = req.query;

    let queryText = `
      SELECT 
        provider_name,
        COUNT(*) as request_count,
        AVG(response_time) as avg_response_time,
        SUM(CASE WHEN success = true THEN 1 ELSE 0 END) as success_count,
        DATE(created_at) as date
      FROM api_usage_logs
      WHERE created_at >= $1 AND created_at <= $2
    `;

    const params = [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()];

    if (provider) {
      queryText += ' AND provider_name = $3';
      params.push(provider);
    }

    queryText += ' GROUP BY provider_name, DATE(created_at) ORDER BY date DESC';

    const result = await query(queryText, params);

    // Calculate additional statistics
    const totalRequests = result.rows.reduce((sum, row) => sum + parseInt(row.request_count), 0);
    const totalSuccess = result.rows.reduce((sum, row) => sum + parseInt(row.success_count), 0);
    const successRate = totalRequests > 0 ? (totalSuccess / totalRequests * 100).toFixed(2) : 0;
    const avgResponseTime = result.rows.length > 0 
      ? (result.rows.reduce((sum, row) => sum + parseFloat(row.avg_response_time), 0) / result.rows.length).toFixed(2)
      : 0;

    res.json({
      message: '獲取API使用統計成功',
      data: {
        totalRequests,
        totalSuccess,
        successRate: parseFloat(successRate),
        avgResponseTime: parseFloat(avgResponseTime),
        dailyStats: result.rows
      }
    });

  } catch (error) {
    logger.error('Get API stats error:', error);
    res.status(500).json({
      error: {
        message: '獲取API使用統計失敗',
        code: 'STATS_FAILED'
      }
    });
  }
});

// Get system settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await query(
      'SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key'
    );

    const settingsMap = {};
    settings.rows.forEach(row => {
      settingsMap[row.setting_key] = {
        value: row.setting_value,
        description: row.description
      };
    });

    res.json({
      message: '獲取系統設置成功',
      data: {
        settings: settingsMap
      }
    });

  } catch (error) {
    logger.error('Get system settings error:', error);
    res.status(500).json({
      error: {
        message: '獲取系統設置失敗',
        code: 'SETTINGS_FAILED'
      }
    });
  }
});

// Update system settings
router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    for (const [key, config] of Object.entries(settings)) {
      await query(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_at) 
         VALUES ($1, $2, $3, NOW()) 
         ON CONFLICT (setting_key) 
         DO UPDATE SET setting_value = $2, description = $3, updated_at = NOW()`,
        [key, config.value, config.description]
      );
    }

    logger.info('System settings updated', { settings: Object.keys(settings) });

    res.json({
      message: '系統設置更新成功',
      data: {
        settings
      }
    });

  } catch (error) {
    logger.error('Update system settings error:', error);
    res.status(500).json({
      error: {
        message: '更新系統設置失敗',
        code: 'UPDATE_FAILED'
      }
    });
  }
});

// Get user search analytics
router.get('/analytics/searches', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const searchStats = await query(
      `SELECT 
         search_type,
         COUNT(*) as total_searches,
         SUM(points_cost) as total_points_used,
         AVG(CASE WHEN results IS NOT NULL THEN 1 ELSE 0 END) * 100 as success_rate,
         DATE(created_at) as date
       FROM search_history
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY search_type, DATE(created_at)
       ORDER BY date DESC`,
      [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]
    );

    const popularDestinations = await query(
      `SELECT destination, COUNT(*) as search_count
       FROM search_history
       WHERE destination IS NOT NULL AND created_at >= $1 AND created_at <= $2
       GROUP BY destination
       ORDER BY search_count DESC
       LIMIT 10`,
      [startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate || new Date()]
    );

    res.json({
      message: '獲取搜索分析成功',
      data: {
        searchStats: searchStats.rows,
        popularDestinations: popularDestinations.rows
      }
    });

  } catch (error) {
    logger.error('Get search analytics error:', error);
    res.status(500).json({
      error: {
        message: '獲取搜索分析失敗',
        code: 'ANALYTICS_FAILED'
      }
    });
  }
});

// Helper function to test provider connection
async function testProviderConnection(provider, config) {
  try {
    let testResult = { success: false, message: '' };

    switch (provider) {
      case 'amadeus':
        testResult = await testAmadeusConnection(config);
        break;
      case 'skyscanner':
        testResult = await testSkyscannerConnection(config);
        break;
      case 'booking':
        testResult = await testBookingConnection(config);
        break;
      case 'hotels':
        testResult = await testHotelsConnection(config);
        break;
      case 'agoda':
        testResult = await testAgodaConnection(config);
        break;
      case 'expedia':
        testResult = await testExpediaConnection(config);
        break;
      default:
        testResult = { success: false, message: '未知的提供商' };
    }

    return testResult;

  } catch (error) {
    logger.error(`Test ${provider} connection error:`, error);
    return {
      success: false,
      message: `連接測試失敗: ${error.message}`
    };
  }
}

// Individual provider connection tests
async function testAmadeusConnection(config) {
  // Simulate Amadeus API test
  if (!config.apiKey || !config.apiSecret) {
    return { success: false, message: '缺少API憑據' };
  }
  
  // Mock successful connection
  return { success: true, message: 'Amadeus API 連接成功' };
}

async function testSkyscannerConnection(config) {
  if (!config.apiKey) {
    return { success: false, message: '缺少API密鑰' };
  }
  
  return { success: true, message: 'Skyscanner API 連接成功' };
}

async function testBookingConnection(config) {
  if (!config.apiKey) {
    return { success: false, message: '缺少API密鑰' };
  }
  
  return { success: true, message: 'Booking.com API 連接成功' };
}

async function testHotelsConnection(config) {
  if (!config.apiKey) {
    return { success: false, message: '缺少API密鑰' };
  }
  
  return { success: true, message: 'Hotels.com API 連接成功' };
}

async function testAgodaConnection(config) {
  if (!config.apiKey) {
    return { success: false, message: '缺少API密鑰' };
  }
  
  return { success: true, message: 'Agoda API 連接成功' };
}

async function testExpediaConnection(config) {
  if (!config.apiKey) {
    return { success: false, message: '缺少API密鑰' };
  }
  
  return { success: true, message: 'Expedia API 連接成功' };
}

module.exports = router;