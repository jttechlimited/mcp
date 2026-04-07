const express = require('express');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');
const { getCache, setCache } = require('../config/redis');
const { authenticateToken } = require('../middleware/auth');
const { validateSearch } = require('../validators/searchValidator');
const { calculatePointsCost } = require('../utils/pointsUtils');
const { searchFlights } = require('../services/flightService');
const { searchHotels } = require('../services/hotelService');

const router = express.Router();

// Flight search endpoint
router.post('/flights', authenticateToken, async (req, res) => {
  try {
    const { error } = validateSearch(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      flightClass,
      searchMode,
      preferredAirlines
    } = req.body;

    const userId = req.user.userId;

    // Calculate points cost
    const pointsCost = calculatePointsCost('flight_search', searchMode);
    
    // Check if user has enough points
    const userPoints = await query(
      'SELECT points FROM users WHERE id = $1',
      [userId]
    );

    if (userPoints.rows[0].points < pointsCost) {
      return res.status(403).json({
        error: {
          message: '點數不足，請充值後再試',
          code: 'INSUFFICIENT_POINTS'
        }
      });
    }

    // Check cache first
    const cacheKey = `flight_search:${origin}:${destination}:${departureDate}:${returnDate}:${passengers}:${flightClass}:${searchMode}`;
    const cachedResults = await getCache(cacheKey);
    
    if (cachedResults) {
      logger.info(`Flight search returned from cache: ${cacheKey}`);
      return res.json({
        message: '搜索成功',
        data: {
          results: cachedResults,
          cached: true,
          pointsCost: 0 // No points deduction for cached results
        }
      });
    }

    // Perform flight search
    const searchResults = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      flightClass,
      searchMode,
      preferredAirlines,
      userId
    });

    // Cache results for 10 minutes
    await setCache(cacheKey, searchResults, 600); // 10 minutes

    // Deduct points
    await query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [pointsCost, userId]
    );

    // Add points transaction record
    await query(
      'INSERT INTO points_transactions (user_id, points_change, transaction_type, description, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, -pointsCost, 'flight_search', `航班搜索 (${searchMode}模式)`, cacheKey]
    );

    // Save search history
    await query(
      `INSERT INTO search_history 
       (user_id, search_type, origin, destination, departure_date, return_date, passengers, flight_class, search_mode, results, points_cost, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() + INTERVAL '24 hours')`,
      [
        userId,
        'flight',
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        flightClass,
        searchMode,
        JSON.stringify(searchResults),
        pointsCost
      ]
    );

    logger.info(`Flight search completed: ${origin} → ${destination}`);

    res.json({
      message: '搜索成功',
      data: {
        results: searchResults,
        cached: false,
        pointsCost
      }
    });

  } catch (error) {
    logger.error('Flight search error:', error);
    res.status(500).json({
      error: {
        message: '搜索失敗，請稍後再試',
        code: 'SEARCH_FAILED'
      }
    });
  }
});

// Hotel search endpoint
router.post('/hotels', authenticateToken, async (req, res) => {
  try {
    const { error } = validateSearch(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const {
      destination,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      hotelRating,
      maxPrice,
      searchMode,
      amenities
    } = req.body;

    const userId = req.user.userId;

    // Calculate points cost
    const pointsCost = calculatePointsCost('hotel_search', searchMode);
    
    // Check if user has enough points
    const userPoints = await query(
      'SELECT points FROM users WHERE id = $1',
      [userId]
    );

    if (userPoints.rows[0].points < pointsCost) {
      return res.status(403).json({
        error: {
          message: '點數不足，請充值後再試',
          code: 'INSUFFICIENT_POINTS'
        }
      });
    }

    // Check cache first
    const cacheKey = `hotel_search:${destination}:${checkInDate}:${checkOutDate}:${guests}:${rooms}:${hotelRating}:${maxPrice}:${searchMode}`;
    const cachedResults = await getCache(cacheKey);
    
    if (cachedResults) {
      logger.info(`Hotel search returned from cache: ${cacheKey}`);
      return res.json({
        message: '搜索成功',
        data: {
          results: cachedResults,
          cached: true,
          pointsCost: 0
        }
      });
    }

    // Perform hotel search
    const searchResults = await searchHotels({
      destination,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      hotelRating,
      maxPrice,
      searchMode,
      amenities,
      userId
    });

    // Cache results for 10 minutes
    await setCache(cacheKey, searchResults, 600);

    // Deduct points
    await query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [pointsCost, userId]
    );

    // Add points transaction record
    await query(
      'INSERT INTO points_transactions (user_id, points_change, transaction_type, description, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, -pointsCost, 'hotel_search', `酒店搜索 (${searchMode}模式)`, cacheKey]
    );

    // Save search history
    await query(
      `INSERT INTO search_history 
       (user_id, search_type, destination, departure_date, return_date, passengers, hotel_preferences, search_mode, results, points_cost, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + INTERVAL '24 hours')`,
      [
        userId,
        'hotel',
        destination,
        checkInDate,
        checkOutDate,
        guests,
        JSON.stringify({ rooms, hotelRating, maxPrice, amenities }),
        searchMode,
        JSON.stringify(searchResults),
        pointsCost
      ]
    );

    logger.info(`Hotel search completed: ${destination}`);

    res.json({
      message: '搜索成功',
      data: {
        results: searchResults,
        cached: false,
        pointsCost
      }
    });

  } catch (error) {
    logger.error('Hotel search error:', error);
    res.status(500).json({
      error: {
        message: '搜索失敗，請稍後再試',
        code: 'SEARCH_FAILED'
      }
    });
  }
});

// Combined flight + hotel search
router.post('/combined', authenticateToken, async (req, res) => {
  try {
    const { error } = validateSearch(req.body);
    if (error) {
      return res.status(400).json({
        error: {
          message: error.details[0].message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const userId = req.user.userId;
    const { searchMode } = req.body;

    // Calculate points cost for combined search
    const pointsCost = calculatePointsCost('combined_search', searchMode);
    
    // Check if user has enough points
    const userPoints = await query(
      'SELECT points FROM users WHERE id = $1',
      [userId]
    );

    if (userPoints.rows[0].points < pointsCost) {
      return res.status(403).json({
        error: {
          message: '點數不足，請充值後再試',
          code: 'INSUFFICIENT_POINTS'
        }
      });
    }

    // Perform both searches in parallel
    const [flightResults, hotelResults] = await Promise.all([
      searchFlights({ ...req.body, userId }),
      searchHotels({ ...req.body, userId })
    ]);

    // Combine and optimize results
    const combinedResults = optimizeCombinedResults(flightResults, hotelResults, searchMode);

    // Deduct points
    await query(
      'UPDATE users SET points = points - $1 WHERE id = $2',
      [pointsCost, userId]
    );

    // Add points transaction record
    await query(
      'INSERT INTO points_transactions (user_id, points_change, transaction_type, description) VALUES ($1, $2, $3, $4)',
      [userId, -pointsCost, 'combined_search', `組合搜索 (${searchMode}模式)`]
    );

    logger.info(`Combined search completed for user: ${userId}`);

    res.json({
      message: '搜索成功',
      data: {
        flights: flightResults,
        hotels: hotelResults,
        combined: combinedResults,
        pointsCost
      }
    });

  } catch (error) {
    logger.error('Combined search error:', error);
    res.status(500).json({
      error: {
        message: '搜索失敗，請稍後再試',
        code: 'SEARCH_FAILED'
      }
    });
  }
});

// Search history endpoint
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, searchType } = req.query;

    const offset = (page - 1) * limit;

    let queryText = `
      SELECT 
        id,
        search_type,
        origin,
        destination,
        departure_date,
        return_date,
        passengers,
        flight_class,
        hotel_preferences,
        search_mode,
        results,
        points_cost,
        status,
        created_at
      FROM search_history
      WHERE user_id = $1
    `;

    const params = [userId];

    if (searchType) {
      queryText += ' AND search_type = $2';
      params.push(searchType);
    }

    queryText += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(limit, offset);

    const results = await query(queryText, params);

    // Get total count
    const countQuery = await query(
      'SELECT COUNT(*) FROM search_history WHERE user_id = $1' + (searchType ? ' AND search_type = $2' : ''),
      searchType ? [userId, searchType] : [userId]
    );

    const total = parseInt(countQuery.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      message: '獲取搜索歷史成功',
      data: {
        searches: results.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    logger.error('Search history error:', error);
    res.status(500).json({
      error: {
        message: '獲取搜索歷史失敗',
        code: 'HISTORY_FAILED'
      }
    });
  }
});

// Get search details by ID
router.get('/history/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const searchId = req.params.id;

    const result = await query(
      `SELECT * FROM search_history WHERE id = $1 AND user_id = $2`,
      [searchId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: '找不到搜索記錄',
          code: 'NOT_FOUND'
        }
      });
    }

    const search = result.rows[0];
    
    // Parse JSON results if they exist
    if (search.results) {
      search.results = JSON.parse(search.results);
    }
    if (search.hotel_preferences) {
      search.hotel_preferences = JSON.parse(search.hotel_preferences);
    }

    res.json({
      message: '獲取搜索詳情成功',
      data: {
        search
      }
    });

  } catch (error) {
    logger.error('Search details error:', error);
    res.status(500).json({
      error: {
        message: '獲取搜索詳情失敗',
        code: 'DETAILS_FAILED'
      }
    });
  }
});

// Delete search history
router.delete('/history/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const searchId = req.params.id;

    const result = await query(
      'DELETE FROM search_history WHERE id = $1 AND user_id = $2 RETURNING *',
      [searchId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          message: '找不到搜索記錄',
          code: 'NOT_FOUND'
        }
      });
    }

    res.json({
      message: '刪除搜索記錄成功',
      data: {
        deletedId: searchId
      }
    });

  } catch (error) {
    logger.error('Delete search history error:', error);
    res.status(500).json({
      error: {
        message: '刪除搜索記錄失敗',
        code: 'DELETE_FAILED'
      }
    });
  }
});

// Get popular destinations
router.get('/popular-destinations', async (req, res) => {
  try {
    const results = await query(
      `SELECT destination, COUNT(*) as search_count
       FROM search_history
       WHERE destination IS NOT NULL
       GROUP BY destination
       ORDER BY search_count DESC
       LIMIT 20`
    );

    res.json({
      message: '獲取熱門目的地成功',
      data: {
        destinations: results.rows
      }
    });

  } catch (error) {
    logger.error('Popular destinations error:', error);
    res.status(500).json({
      error: {
        message: '獲取熱門目的地失敗',
        code: 'POPULAR_FAILED'
      }
    });
  }
});

// Helper function to optimize combined results
function optimizeCombinedResults(flightResults, hotelResults, searchMode) {
  // Implementation for optimizing flight + hotel combinations
  // This would include logic for proximity matching, price optimization, etc.
  
  const optimized = [];
  
  // Sample optimization logic
  for (const flight of flightResults.slice(0, 5)) {
    for (const hotel of hotelResults.slice(0, 5)) {
      const proximity = calculateProximity(flight.destination, hotel.location);
      const totalPrice = flight.price + hotel.price;
      
      optimized.push({
        flight,
        hotel,
        proximity,
        totalPrice,
        savings: calculateSavings(flight, hotel),
        recommended: proximity < 10 && totalPrice < 1000 // Example criteria
      });
    }
  }

  // Sort by search mode preference
  if (searchMode === 'best_price') {
    optimized.sort((a, b) => a.totalPrice - b.totalPrice);
  } else if (searchMode === 'relax') {
    optimized.sort((a, b) => a.proximity - b.proximity);
  }

  return optimized.slice(0, 10); // Return top 10 combinations
}

function calculateProximity(flightDestination, hotelLocation) {
  // Simplified proximity calculation
  // In real implementation, this would use geolocation services
  return Math.random() * 20; // Random value for demo
}

function calculateSavings(flight, hotel) {
  // Calculate potential savings from booking together
  return Math.random() * 200; // Random value for demo
}

module.exports = router;