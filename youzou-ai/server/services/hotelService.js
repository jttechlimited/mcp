const { logger } = require('../utils/logger');
const { getCache, setCache } = require('../config/redis');

// Mock hotel data for demonstration
const mockHotels = {
  'NRT': [
    {
      id: 'hotel-nrt-001',
      name: '成田機場酒店',
      nameEn: 'Narita Airport Hotel',
      location: '成田',
      address: '成田國際機場內',
      rating: 4.2,
      stars: 4,
      price: 800,
      currency: 'HKD',
      availableRooms: 45,
      amenities: ['免費WiFi', '機場接駁', '餐廳', '健身房'],
      images: ['https://example.com/hotel1.jpg'],
      description: '距離機場僅5分鐘車程，提供免費接駁服務',
      coordinates: { lat: 35.7720, lng: 140.3929 },
      distanceFromAirport: 5,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      cancellationPolicy: '免費取消至入住前24小時',
      reviews: 324,
      reviewScore: 8.1
    },
    {
      id: 'hotel-nrt-002',
      name: '東京成田希爾頓酒店',
      nameEn: 'Tokyo Narita Hilton Hotel',
      location: '成田',
      address: '成田市中心',
      rating: 4.5,
      stars: 5,
      price: 1200,
      currency: 'HKD',
      availableRooms: 32,
      amenities: ['免費WiFi', '游泳池', 'SPA', '餐廳', '健身房', '商務中心'],
      images: ['https://example.com/hotel2.jpg'],
      description: '五星級奢華酒店，提供頂級服務',
      coordinates: { lat: 35.7851, lng: 140.3723 },
      distanceFromAirport: 8,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: '免費取消至入住前48小時',
      reviews: 567,
      reviewScore: 8.7
    },
    {
      id: 'hotel-nrt-003',
      name: '成田膠囊酒店',
      nameEn: 'Narita Capsule Hotel',
      location: '成田',
      address: '成田站附近',
      rating: 3.8,
      stars: 3,
      price: 300,
      currency: 'HKD',
      availableRooms: 89,
      amenities: ['免費WiFi', '公共浴室', '洗衣設施'],
      images: ['https://example.com/hotel3.jpg'],
      description: '經濟實惠的膠囊酒店體驗',
      coordinates: { lat: 35.7682, lng: 140.3774 },
      distanceFromAirport: 3,
      checkInTime: '16:00',
      checkOutTime: '10:00',
      cancellationPolicy: '不可取消',
      reviews: 123,
      reviewScore: 7.2
    }
  ],
  'ICN': [
    {
      id: 'hotel-icn-001',
      name: '仁川機場凱悅酒店',
      nameEn: 'Incheon Airport Hyatt Hotel',
      location: '仁川',
      address: '仁川國際機場',
      rating: 4.6,
      stars: 5,
      price: 1500,
      currency: 'HKD',
      availableRooms: 28,
      amenities: ['免費WiFi', '機場接駁', '游泳池', 'SPA', '餐廳', '健身房'],
      images: ['https://example.com/hotel4.jpg'],
      description: '直接連接機場航站樓的五星級酒店',
      coordinates: { lat: 37.4602, lng: 126.4407 },
      distanceFromAirport: 0,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: '免費取消至入住前24小時',
      reviews: 789,
      reviewScore: 8.9
    },
    {
      id: 'hotel-icn-002',
      name: '仁川商務酒店',
      nameEn: 'Incheon Business Hotel',
      location: '仁川',
      address: '仁川市中心',
      rating: 4.1,
      stars: 4,
      price: 600,
      currency: 'HKD',
      availableRooms: 56,
      amenities: ['免費WiFi', '商務中心', '餐廳', '健身房'],
      images: ['https://example.com/hotel5.jpg'],
      description: '專為商務旅客設計的現代化酒店',
      coordinates: { lat: 37.4563, lng: 126.7052 },
      distanceFromAirport: 15,
      checkInTime: '14:00',
      checkOutTime: '11:00',
      cancellationPolicy: '免費取消至入住前24小時',
      reviews: 234,
      reviewScore: 7.8
    }
  ],
  'BKK': [
    {
      id: 'hotel-bkk-001',
      name: '曼谷半島酒店',
      nameEn: 'Bangkok Peninsula Hotel',
      location: '曼谷',
      address: '湄南河畔',
      rating: 4.8,
      stars: 5,
      price: 2000,
      currency: 'HKD',
      availableRooms: 21,
      amenities: ['免費WiFi', '河景', '游泳池', 'SPA', '餐廳', '健身房', '酒吧'],
      images: ['https://example.com/hotel6.jpg'],
      description: '享有湄南河美景的奢華五星級酒店',
      coordinates: { lat: 13.7563, lng: 100.5018 },
      distanceFromAirport: 30,
      checkInTime: '15:00',
      checkOutTime: '12:00',
      cancellationPolicy: '免費取消至入住前48小時',
      reviews: 1234,
      reviewScore: 9.1
    },
    {
      id: 'hotel-bkk-002',
      name: '曼谷城市酒店',
      nameEn: 'Bangkok City Hotel',
      location: '曼谷',
      address: '市中心商業區',
      rating: 4.0,
      stars: 4,
      price: 800,
      currency: 'HKD',
      availableRooms: 67,
      amenities: ['免費WiFi', '屋頂游泳池', '餐廳', '健身房'],
      images: ['https://example.com/hotel7.jpg'],
      description: '位於市中心的現代化酒店',
      coordinates: { lat: 13.7305, lng: 100.5231 },
      distanceFromAirport: 25,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      cancellationPolicy: '免費取消至入住前24小時',
      reviews: 456,
      reviewScore: 7.9
    }
  ]
};

// Different hotel categories
const hotelCategories = {
  budget: [
    { name: '膠囊酒店', minPrice: 100, maxPrice: 400, amenities: ['WiFi', '公共浴室'] },
    { name: '青年旅社', minPrice: 150, maxPrice: 500, amenities: ['WiFi', '共享廚房', '洗衣'] },
    { name: '經濟型酒店', minPrice: 300, maxPrice: 800, amenities: ['WiFi', '私人浴室', '空調'] }
  ],
  midRange: [
    { name: '商務酒店', minPrice: 600, maxPrice: 1200, amenities: ['WiFi', '商務中心', '健身房'] },
    { name: '精品酒店', minPrice: 800, maxPrice: 1500, amenities: ['WiFi', '餐廳', '設計感'] },
    { name: '連鎖酒店', minPrice: 700, maxPrice: 1300, amenities: ['WiFi', '游泳池', '健身房'] }
  ],
  luxury: [
    { name: '五星級酒店', minPrice: 1500, maxPrice: 3000, amenities: ['WiFi', 'SPA', '多個餐廳', '游泳池'] },
    { name: '度假村', minPrice: 2000, maxPrice: 5000, amenities: ['WiFi', '私人海灘', '水上運動', '多個游泳池'] },
    { name: '精品度假村', minPrice: 2500, maxPrice: 6000, amenities: ['WiFi', '私人管家', '定制服務', '奢華設施'] }
  ]
};

class HotelService {
  constructor() {
    this.apiKeys = {};
    this.otaProviders = {};
  }

  // Configure OTA providers
  configureProviders(providers) {
    this.otaProviders = providers;
    logger.info('Hotel OTA providers configured', { providers: Object.keys(providers) });
  }

  // Main hotel search function
  async searchHotels(params) {
    const {
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
    } = params;

    try {
      logger.info('Starting hotel search', {
        destination,
        checkInDate,
        checkOutDate,
        guests,
        rooms,
        hotelRating,
        maxPrice,
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
      logger.error('Hotel search error:', error);
      throw error;
    }
  }

  // Search with real OTA APIs
  async searchWithRealAPIs(params) {
    const results = [];
    
    // Booking.com API
    if (this.otaProviders.booking?.enabled) {
      try {
        const bookingResults = await this.searchBooking(params);
        results.push(...bookingResults);
      } catch (error) {
        logger.error('Booking.com API error:', error);
      }
    }

    // Hotels.com API
    if (this.otaProviders.hotels?.enabled) {
      try {
        const hotelsResults = await this.searchHotelsCom(params);
        results.push(...hotelsResults);
      } catch (error) {
        logger.error('Hotels.com API error:', error);
      }
    }

    // Agoda API
    if (this.otaProviders.agoda?.enabled) {
      try {
        const agodaResults = await this.searchAgoda(params);
        results.push(...agodaResults);
      } catch (error) {
        logger.error('Agoda API error:', error);
      }
    }

    return this.processAndRankResults(results, params);
  }

  // Search with mock data for demonstration
  async searchWithMockData(params) {
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
    } = params;

    let hotels = [];

    // Get base hotels for the destination
    if (mockHotels[destination]) {
      hotels = [...mockHotels[destination]];
    }

    // Generate additional hotels based on search criteria
    hotels = this.generateAdditionalHotels(hotels, params);

    // Apply search filters and preferences
    hotels = this.applySearchFilters(hotels, params);

    // Apply dynamic pricing
    hotels = this.applyDynamicPricing(hotels, checkInDate, checkOutDate);

    // Add booking links and payment options
    hotels = hotels.map(hotel => ({
      ...hotel,
      bookingUrl: this.generateBookingUrl(hotel),
      paymentMethods: ['credit_card', 'paypal', 'stripe', 'alipay'],
      cancellationPolicy: hotel.cancellationPolicy,
      totalPrice: this.calculateTotalPrice(hotel, checkInDate, checkOutDate, rooms),
      pricePerNight: Math.round(hotel.price / this.calculateNights(checkInDate, checkOutDate)),
      nights: this.calculateNights(checkInDate, checkOutDate)
    }));

    logger.info(`Mock hotel search completed: ${destination}, found ${hotels.length} hotels`);

    return hotels;
  }

  // Generate additional hotels based on search criteria
  generateAdditionalHotels(baseHotels, params) {
    const { maxPrice, hotelRating, searchMode } = params;
    let additionalHotels = [...baseHotels];

    // Generate more hotels if needed
    const targetCount = searchMode === 'best_price' ? 15 : 10;
    const currentCount = additionalHotels.length;

    if (currentCount < targetCount) {
      const needed = targetCount - currentCount;
      
      for (let i = 0; i < needed; i++) {
        const category = this.selectHotelCategory(maxPrice, hotelRating);
        const hotel = this.generateHotelFromCategory(category, params.destination, i);
        additionalHotels.push(hotel);
      }
    }

    return additionalHotels;
  }

  // Select appropriate hotel category based on price and rating
  selectHotelCategory(maxPrice, minRating) {
    if (maxPrice && maxPrice < 500) return 'budget';
    if (minRating && minRating >= 4) return 'luxury';
    return 'midRange';
  }

  // Generate hotel from category
  generateHotelFromCategory(category, destination, index) {
    const categoryData = hotelCategories[category];
    const hotelTemplate = categoryData[index % categoryData.length];
    
    const basePrice = hotelTemplate.minPrice + Math.random() * (hotelTemplate.maxPrice - hotelTemplate.minPrice);
    
    return {
      id: `hotel-${destination}-${category}-${index}`,
      name: `${destination}${hotelTemplate.name}`,
      nameEn: `${destination} ${hotelTemplate.name}`,
      location: destination,
      address: `${destination}市中心`,
      rating: 3.5 + Math.random() * 1.5, // 3.5 to 5.0
      stars: category === 'budget' ? 3 : category === 'midRange' ? 4 : 5,
      price: Math.round(basePrice / 10) * 10,
      currency: 'HKD',
      availableRooms: 20 + Math.floor(Math.random() * 80),
      amenities: hotelTemplate.amenities,
      images: [`https://example.com/hotel-${category}-${index}.jpg`],
      description: this.generateHotelDescription(category),
      coordinates: { 
        lat: 35.6762 + (Math.random() - 0.5) * 0.1, 
        lng: 139.6503 + (Math.random() - 0.5) * 0.1 
      },
      distanceFromAirport: 5 + Math.floor(Math.random() * 40),
      checkInTime: category === 'luxury' ? '15:00' : '14:00',
      checkOutTime: category === 'luxury' ? '12:00' : '11:00',
      cancellationPolicy: category === 'budget' ? '不可取消' : '免費取消至入住前24小時',
      reviews: 50 + Math.floor(Math.random() * 500),
      reviewScore: 6.0 + Math.random() * 3.0
    };
  }

  // Generate hotel description based on category
  generateHotelDescription(category) {
    const descriptions = {
      budget: '經濟實惠的住宿選擇，提供基本設施和舒適的環境',
      midRange: '現代化的住宿體驗，平衡價格與舒適度',
      luxury: '奢華的住宿體驗，提供頂級服務和設施'
    };
    return descriptions[category];
  }

  // Apply search filters
  applySearchFilters(hotels, params) {
    let filteredHotels = [...hotels];

    // Filter by rating
    if (params.hotelRating) {
      filteredHotels = filteredHotels.filter(hotel => hotel.rating >= params.hotelRating);
    }

    // Filter by max price
    if (params.maxPrice) {
      filteredHotels = filteredHotels.filter(hotel => hotel.price <= params.maxPrice);
    }

    // Filter by amenities if specified
    if (params.amenities && params.amenities.length > 0) {
      filteredHotels = filteredHotels.filter(hotel => 
        params.amenities.every(amenity => hotel.amenities.includes(amenity))
      );
    }

    // Filter by rooms available
    if (params.rooms) {
      filteredHotels = filteredHotels.filter(hotel => hotel.availableRooms >= params.rooms);
    }

    // Apply search mode
    filteredHotels = this.applySearchMode(filteredHotels, params.searchMode);

    return filteredHotels;
  }

  // Apply search mode preferences
  applySearchMode(hotels, searchMode) {
    let filteredHotels = [...hotels];

    switch (searchMode) {
      case 'best_price':
        filteredHotels.sort((a, b) => a.price - b.price);
        break;
      
      case 'relax':
        // Sort by distance from airport (closer = more relaxing)
        filteredHotels.sort((a, b) => a.distanceFromAirport - b.distanceFromAirport);
        break;
      
      case 'highest_rated':
        filteredHotels.sort((a, b) => b.rating - a.rating);
        break;
      
      default:
        // Default sorting by rating then price
        filteredHotels.sort((a, b) => {
          if (b.rating === a.rating) {
            return a.price - b.price;
          }
          return b.rating - a.rating;
        });
    }

    return filteredHotels;
  }

  // Apply dynamic pricing based on dates and demand
  applyDynamicPricing(hotels, checkInDate, checkOutDate) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkIn - now) / (1000 * 60 * 60 * 24));
    const nights = this.calculateNights(checkInDate, checkOutDate);

    return hotels.map(hotel => {
      let price = hotel.price;
      
      // Price increases as check-in date approaches
      if (daysUntilCheckIn < 7) {
        price *= 1.2; // 20% increase for last-minute bookings
      } else if (daysUntilCheckIn < 30) {
        price *= 1.1; // 10% increase for bookings within 30 days
      }
      
      // Weekend pricing
      const checkInDay = checkIn.getDay();
      if (checkInDay === 5 || checkInDay === 6) { // Friday or Saturday
        price *= 1.15; // 15% weekend surcharge
      }
      
      // Round to nearest 10
      price = Math.round(price / 10) * 10;
      
      return {
        ...hotel,
        price,
        originalPrice: hotel.price,
        priceReason: this.getPriceReason(daysUntilCheckIn, checkInDay, nights)
      };
    });
  }

  // Calculate total price including taxes and fees
  calculateTotalPrice(hotel, checkInDate, checkOutDate, rooms) {
    const nights = this.calculateNights(checkInDate, checkOutDate);
    const basePrice = hotel.price * nights * rooms;
    
    // Add taxes and fees (approximate)
    const taxesAndFees = basePrice * 0.15; // 15% taxes and fees
    const totalPrice = basePrice + taxesAndFees;
    
    return Math.round(totalPrice);
  }

  // Calculate number of nights
  calculateNights(checkInDate, checkOutDate) {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  }

  // Get price reason for display
  getPriceReason(daysUntilCheckIn, checkInDay, nights) {
    if (daysUntilCheckIn < 7) {
      return 'Last-minute booking';
    } else if (daysUntilCheckIn < 30) {
      return 'High demand period';
    } else if (checkInDay === 5 || checkInDay === 6) {
      return 'Weekend pricing';
    } else if (nights >= 7) {
      return 'Long stay discount';
    }
    return 'Standard pricing';
  }

  // Generate booking URL
  generateBookingUrl(hotel) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/booking/hotel/${hotel.id}?utm_source=youzou-ai`;
  }

  // Process and rank results from multiple sources
  processAndRankResults(results, params) {
    // Remove duplicates based on hotel ID
    const uniqueResults = results.filter((hotel, index, self) => 
      index === self.findIndex(h => h.id === hotel.id)
    );

    // Apply ranking algorithm
    return uniqueResults.map(hotel => ({
      ...hotel,
      score: this.calculateHotelScore(hotel, params),
      ranking: this.calculateRanking(hotel, params)
    })).sort((a, b) => b.score - a.score);
  }

  // Calculate hotel score based on multiple factors
  calculateHotelScore(hotel, params) {
    let score = 0;
    
    // Rating factor (35% weight)
    score += (hotel.rating / 5) * 35;
    
    // Price factor (30% weight) - better value scores higher
    const maxPrice = Math.max(...results.map(h => h.price) || [hotel.price]);
    const priceScore = (maxPrice - hotel.price) / maxPrice * 30;
    score += priceScore;
    
    // Distance from airport factor (20% weight)
    const distanceScore = (50 - hotel.distanceFromAirport) / 50 * 20;
    score += Math.max(0, distanceScore);
    
    // Review score factor (15% weight)
    score += (hotel.reviewScore / 10) * 15;
    
    return Math.round(score * 100) / 100;
  }

  // Calculate ranking position
  calculateRanking(hotel, params) {
    return Math.floor(Math.random() * 100) + 1;
  }

  // Check if real API keys are configured
  hasRealApiKeys() {
    return Object.keys(this.otaProviders).length > 0 && 
           Object.values(this.otaProviders).some(provider => provider.enabled);
  }

  // Mock API implementations for demonstration
  async searchBooking(params) {
    logger.info('Searching Booking.com', params);
    return this.searchWithMockData(params);
  }

  async searchHotelsCom(params) {
    logger.info('Searching Hotels.com', params);
    return this.searchWithMockData(params);
  }

  async searchAgoda(params) {
    logger.info('Searching Agoda', params);
    return this.searchWithMockData(params);
  }

  // Get hotel recommendations based on user preferences
  async getRecommendations(userId, limit = 5) {
    try {
      // Get user's search history
      const history = await query(
        'SELECT destination, search_mode FROM search_history WHERE user_id = $1 AND search_type = $2 ORDER BY created_at DESC LIMIT 10',
        [userId, 'hotel']
      );

      const destinations = [...new Set(history.rows.map(h => h.destination))];
      
      const recommendations = [];
      
      for (const destination of destinations.slice(0, 3)) {
        const hotels = await this.searchWithMockData({
          destination,
          checkInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checkOutDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          guests: 2,
          rooms: 1,
          searchMode: 'best_price'
        });
        
        if (hotels.length > 0) {
          recommendations.push({
            destination,
            bestDeal: hotels[0],
            alternatives: hotels.slice(1, 3)
          });
        }
      }

      return recommendations;
    } catch (error) {
      logger.error('Hotel recommendations error:', error);
      return [];
    }
  }
}

module.exports = new HotelService();