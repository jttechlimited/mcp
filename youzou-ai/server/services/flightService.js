const { logger } = require('../utils/logger');
const { getCache, setCache } = require('../config/redis');

// Mock flight data for demonstration
const mockFlights = {
  'HKG-NRT': [
    {
      id: 'CX501',
      airline: 'Cathay Pacific',
      airlineCode: 'CX',
      flightNumber: 'CX501',
      origin: 'HKG',
      destination: 'NRT',
      departureTime: '08:30',
      arrivalTime: '13:45',
      duration: '4h 15m',
      aircraft: 'A330',
      price: 4200,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 45,
      amenities: ['WiFi', 'Meal', 'Entertainment'],
      rating: 4.2,
      reviews: 1250
    },
    {
      id: 'JL735',
      airline: 'Japan Airlines',
      airlineCode: 'JL',
      flightNumber: 'JL735',
      origin: 'HKG',
      destination: 'NRT',
      departureTime: '14:20',
      arrivalTime: '19:35',
      duration: '4h 15m',
      aircraft: '787',
      price: 4800,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 32,
      amenities: ['WiFi', 'Meal', 'Entertainment', 'Extra Legroom'],
      rating: 4.5,
      reviews: 890
    },
    {
      id: 'NH912',
      airline: 'ANA',
      airlineCode: 'NH',
      flightNumber: 'NH912',
      origin: 'HKG',
      destination: 'NRT',
      departureTime: '23:55',
      arrivalTime: '05:10+1',
      duration: '4h 15m',
      aircraft: '777',
      price: 3800,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 58,
      amenities: ['WiFi', 'Meal'],
      rating: 4.3,
      reviews: 670
    }
  ],
  'TPE-ICN': [
    {
      id: 'KE692',
      airline: 'Korean Air',
      airlineCode: 'KE',
      flightNumber: 'KE692',
      origin: 'TPE',
      destination: 'ICN',
      departureTime: '09:15',
      arrivalTime: '12:30',
      duration: '2h 15m',
      aircraft: 'A330',
      price: 2800,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 67,
      amenities: ['WiFi', 'Meal', 'Entertainment'],
      rating: 4.1,
      reviews: 543
    },
    {
      id: 'BR160',
      airline: 'EVA Air',
      airlineCode: 'BR',
      flightNumber: 'BR160',
      origin: 'TPE',
      destination: 'ICN',
      departureTime: '15:40',
      arrivalTime: '18:55',
      duration: '2h 15m',
      aircraft: '777',
      price: 3200,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 41,
      amenities: ['WiFi', 'Meal', 'Entertainment', 'Premium Economy'],
      rating: 4.4,
      reviews: 789
    }
  ],
  'HKG-BKK': [
    {
      id: 'TG607',
      airline: 'Thai Airways',
      airlineCode: 'TG',
      flightNumber: 'TG607',
      origin: 'HKG',
      destination: 'BKK',
      departureTime: '13:25',
      arrivalTime: '15:50',
      duration: '3h 25m',
      aircraft: 'A350',
      price: 1800,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 89,
      amenities: ['WiFi', 'Meal', 'Entertainment'],
      rating: 4.0,
      reviews: 423
    },
    {
      id: 'CX701',
      airline: 'Cathay Pacific',
      airlineCode: 'CX',
      flightNumber: 'CX701',
      origin: 'HKG',
      destination: 'BKK',
      departureTime: '19:10',
      arrivalTime: '21:35',
      duration: '3h 25m',
      aircraft: 'A330',
      price: 2100,
      currency: 'HKD',
      class: 'economy',
      stops: 0,
      availableSeats: 76,
      amenities: ['WiFi', 'Meal', 'Entertainment', 'Extra Baggage'],
      rating: 4.3,
      reviews: 567
    }
  ]
};

// Premium class flights (Business/First)
const premiumFlights = {
  'HKG-NRT': [
    {
      id: 'CX501-BUS',
      airline: 'Cathay Pacific',
      airlineCode: 'CX',
      flightNumber: 'CX501',
      origin: 'HKG',
      destination: 'NRT',
      departureTime: '08:30',
      arrivalTime: '13:45',
      duration: '4h 15m',
      aircraft: 'A330',
      price: 12000,
      currency: 'HKD',
      class: 'business',
      stops: 0,
      availableSeats: 12,
      amenities: ['WiFi', 'Premium Meal', 'Lie-flat Seat', 'Priority Boarding', 'Lounge Access'],
      rating: 4.8,
      reviews: 234
    }
  ]
};

// Multi-stop flights
const multiStopFlights = [
  {
    id: 'HKG-NRT-ICN',
    airline: 'Multiple Airlines',
    segments: [
      {
        airline: 'Cathay Pacific',
        flightNumber: 'CX501',
        origin: 'HKG',
        destination: 'NRT',
        departureTime: '08:30',
        arrivalTime: '13:45',
        duration: '4h 15m'
      },
      {
        airline: 'Korean Air',
        flightNumber: 'KE706',
        origin: 'NRT',
        destination: 'ICN',
        departureTime: '16:30',
        arrivalTime: '19:45',
        duration: '2h 15m'
      }
    ],
    totalDuration: '8h 30m',
    totalPrice: 5200,
    currency: 'HKD',
    class: 'economy',
    stops: 1,
    availableSeats: 23,
    rating: 3.8,
    reviews: 156
  }
];

class FlightService {
  constructor() {
    this.apiKeys = {};
    this.otaProviders = {};
  }

  // Configure OTA providers
  configureProviders(providers) {
    this.otaProviders = providers;
    logger.info('Flight OTA providers configured', { providers: Object.keys(providers) });
  }

  // Main flight search function
  async searchFlights(params) {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      flightClass,
      searchMode,
      preferredAirlines,
      userId
    } = params;

    try {
      logger.info('Starting flight search', {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        flightClass,
        searchMode,
        userId
      });

      // Check if we have real API keys configured
      if (this.hasRealApiKeys()) {
        return await this.searchWithRealAPIs(params);
      } else {
        return await this.searchWithMockData(params);
      }

    } catch (error) {
      logger.error('Flight search error:', error);
      throw error;
    }
  }

  // Search with real OTA APIs
  async searchWithRealAPIs(params) {
    const results = [];
    
    // Amadeus API
    if (this.otaProviders.amadeus?.enabled) {
      try {
        const amadeusResults = await this.searchAmadeus(params);
        results.push(...amadeusResults);
      } catch (error) {
        logger.error('Amadeus API error:', error);
      }
    }

    // Skyscanner API
    if (this.otaProviders.skyscanner?.enabled) {
      try {
        const skyscannerResults = await this.searchSkyscanner(params);
        results.push(...skyscannerResults);
      } catch (error) {
        logger.error('Skyscanner API error:', error);
      }
    }

    // Expedia API
    if (this.otaProviders.expedia?.enabled) {
      try {
        const expediaResults = await this.searchExpedia(params);
        results.push(...expediaResults);
      } catch (error) {
        logger.error('Expedia API error:', error);
      }
    }

    return this.processAndRankResults(results, params);
  }

  // Search with mock data for demonstration
  async searchWithMockData(params) {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers,
      flightClass,
      searchMode,
      preferredAirlines
    } = params;

    const routeKey = `${origin}-${destination}`;
    let flights = [];

    // Get base flights for the route
    if (mockFlights[routeKey]) {
      flights = [...mockFlights[routeKey]];
    }

    // Add premium flights if requested
    if (flightClass === 'business' || flightClass === 'first') {
      if (premiumFlights[routeKey]) {
        flights.push(...premiumFlights[routeKey]);
      }
    }

    // Add multi-stop flights if no direct flights or search mode allows
    if (flights.length < 3 && searchMode === 'best_price') {
      flights.push(...multiStopFlights);
    }

    // Apply search mode preferences
    flights = this.applySearchMode(flights, searchMode, preferredAirlines);

    // Apply passenger count filter
    flights = flights.filter(flight => flight.availableSeats >= passengers);

    // Add dynamic pricing based on date and demand
    flights = this.applyDynamicPricing(flights, departureDate, returnDate);

    // Add booking links and payment options
    flights = flights.map(flight => ({
      ...flight,
      bookingUrl: this.generateBookingUrl(flight),
      paymentMethods: ['credit_card', 'paypal', 'stripe'],
      cancellationPolicy: 'Free cancellation within 24 hours',
      baggagePolicy: '1 carry-on + 1 checked bag included'
    }));

    logger.info(`Mock flight search completed: ${routeKey}, found ${flights.length} flights`);

    return flights;
  }

  // Apply search mode preferences
  applySearchMode(flights, searchMode, preferredAirlines) {
    let filteredFlights = [...flights];

    switch (searchMode) {
      case 'best_price':
        filteredFlights.sort((a, b) => a.price - b.price);
        break;
      
      case 'relax':
        // Filter flights between 8AM and 8PM
        filteredFlights = filteredFlights.filter(flight => {
          const departureHour = parseInt(flight.departureTime.split(':')[0]);
          return departureHour >= 8 && departureHour <= 20;
        });
        
        // Sort by departure time
        filteredFlights.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        break;
      
      case 'fastest':
        filteredFlights.sort((a, b) => {
          const durationA = this.parseDuration(a.duration);
          const durationB = this.parseDuration(b.duration);
          return durationA - durationB;
        });
        break;
      
      default:
        // Default sorting by price
        filteredFlights.sort((a, b) => a.price - b.price);
    }

    // Apply preferred airlines filter if specified
    if (preferredAirlines && preferredAirlines.length > 0) {
      filteredFlights = filteredFlights.filter(flight => 
        preferredAirlines.includes(flight.airlineCode)
      );
    }

    return filteredFlights;
  }

  // Apply dynamic pricing based on date and demand
  applyDynamicPricing(flights, departureDate, returnDate) {
    const departure = new Date(departureDate);
    const now = new Date();
    const daysUntilDeparture = Math.ceil((departure - now) / (1000 * 60 * 60 * 24));
    
    return flights.map(flight => {
      let price = flight.price;
      
      // Price increases as departure date approaches
      if (daysUntilDeparture < 7) {
        price *= 1.3; // 30% increase for last-minute bookings
      } else if (daysUntilDeparture < 30) {
        price *= 1.15; // 15% increase for bookings within 30 days
      }
      
      // Weekend pricing
      const departureDay = departure.getDay();
      if (departureDay === 0 || departureDay === 6) { // Sunday or Saturday
        price *= 1.1; // 10% weekend surcharge
      }
      
      // Round to nearest 10
      price = Math.round(price / 10) * 10;
      
      return {
        ...flight,
        price,
        originalPrice: flight.price,
        priceReason: this.getPriceReason(daysUntilDeparture, departureDay)
      };
    });
  }

  // Generate booking URL for each flight
  generateBookingUrl(flight) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/booking/flight/${flight.id}?utm_source=youzou-ai`;
  }

  // Get price reason for display
  getPriceReason(daysUntilDeparture, departureDay) {
    if (daysUntilDeparture < 7) {
      return 'Last-minute booking';
    } else if (daysUntilDeparture < 30) {
      return 'High demand period';
    } else if (departureDay === 0 || departureDay === 6) {
      return 'Weekend pricing';
    }
    return 'Standard pricing';
  }

  // Parse duration string to minutes
  parseDuration(durationStr) {
    const parts = durationStr.split(' ');
    let totalMinutes = 0;
    
    for (let i = 0; i < parts.length; i += 2) {
      const value = parseInt(parts[i]);
      const unit = parts[i + 1];
      
      if (unit.includes('h')) {
        totalMinutes += value * 60;
      } else if (unit.includes('m')) {
        totalMinutes += value;
      }
    }
    
    return totalMinutes;
  }

  // Check if real API keys are configured
  hasRealApiKeys() {
    return Object.keys(this.otaProviders).length > 0 && 
           Object.values(this.otaProviders).some(provider => provider.enabled);
  }

  // Mock API implementations for demonstration
  async searchAmadeus(params) {
    // Simulate Amadeus API call
    logger.info('Searching Amadeus', params);
    
    // Return mock data formatted like Amadeus API
    return mockFlights[`${params.origin}-${params.destination}`] || [];
  }

  async searchSkyscanner(params) {
    // Simulate Skyscanner API call
    logger.info('Searching Skyscanner', params);
    
    // Return mock data formatted like Skyscanner API
    return mockFlights[`${params.origin}-${params.destination}`] || [];
  }

  async searchExpedia(params) {
    // Simulate Expedia API call
    logger.info('Searching Expedia', params);
    
    // Return mock data formatted like Expedia API
    return mockFlights[`${params.origin}-${params.destination}`] || [];
  }

  // Process and rank results from multiple sources
  processAndRankResults(results, params) {
    // Remove duplicates based on flight ID
    const uniqueResults = results.filter((flight, index, self) => 
      index === self.findIndex(f => f.id === flight.id)
    );

    // Apply ranking algorithm
    return uniqueResults.map(flight => ({
      ...flight,
      score: this.calculateFlightScore(flight, params),
      ranking: this.calculateRanking(flight, params)
    })).sort((a, b) => b.score - a.score);
  }

  // Calculate flight score based on multiple factors
  calculateFlightScore(flight, params) {
    let score = 0;
    
    // Price factor (40% weight)
    const maxPrice = Math.max(...mockFlights[`${params.origin}-${params.destination}`]?.map(f => f.price) || [flight.price]);
    const priceScore = (maxPrice - flight.price) / maxPrice * 40;
    score += priceScore;
    
    // Rating factor (30% weight)
    score += (flight.rating / 5) * 30;
    
    // Duration factor (20% weight) - shorter flights score higher
    const durationScore = (5 - this.parseDuration(flight.duration) / 60) / 5 * 20;
    score += Math.max(0, durationScore);
    
    // Available seats factor (10% weight)
    score += (flight.availableSeats / 100) * 10;
    
    return Math.round(score * 100) / 100;
  }

  // Calculate ranking position
  calculateRanking(flight, params) {
    // This would be more complex in real implementation
    return Math.floor(Math.random() * 100) + 1;
  }

  // Get flight recommendations based on user preferences
  async getRecommendations(userId, limit = 5) {
    try {
      // Get user's search history
      const history = await query(
        'SELECT destination, search_mode FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
        [userId]
      );

      const destinations = [...new Set(history.rows.map(h => h.destination))];
      
      const recommendations = [];
      
      for (const destination of destinations.slice(0, 3)) {
        const flights = await this.searchWithMockData({
          origin: 'HKG', // Default origin
          destination,
          departureDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
          passengers: 1,
          flightClass: 'economy',
          searchMode: 'best_price'
        });
        
        if (flights.length > 0) {
          recommendations.push({
            destination,
            bestDeal: flights[0],
            alternatives: flights.slice(1, 3)
          });
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('Flight recommendations error:', error);
      return [];
    }
  }
}

module.exports = new FlightService();