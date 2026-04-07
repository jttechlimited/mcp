const Joi = require('joi');

// Base search schema
const baseSearchSchema = Joi.object({
  searchMode: Joi.string().valid('best_price', 'relax', 'fastest', 'highest_rated').default('best_price'),
  passengers: Joi.number().integer().min(1).max(9).default(1),
  userId: Joi.number().integer().optional()
});

// Flight search schema
const flightSearchSchema = baseSearchSchema.keys({
  origin: Joi.string().length(3).uppercase().required()
    .messages({
      'string.length': '出發地機場代碼必須為3個字母',
      'string.uppercase': '機場代碼必須為大寫',
      'any.required': '請選擇出發地'
    }),
  destination: Joi.string().length(3).uppercase().required()
    .messages({
      'string.length': '目的地機場代碼必須為3個字母',
      'string.uppercase': '機場代碼必須為大寫',
      'any.required': '請選擇目的地'
    }),
  departureDate: Joi.date().min('now').required()
    .messages({
      'date.min': '出發日期不能是過去日期',
      'any.required': '請選擇出發日期'
    }),
  returnDate: Joi.date().min(Joi.ref('departureDate')).optional()
    .messages({
      'date.min': '返回日期必須晚於出發日期'
    }),
  flightClass: Joi.string().valid('economy', 'premium_economy', 'business', 'first').default('economy')
    .messages({
      'any.only': '請選擇有效的艙等'
    }),
  preferredAirlines: Joi.array().items(Joi.string().length(2).uppercase()).optional()
    .messages({
      'string.length': '航空公司代碼必須為2個字母',
      'string.uppercase': '航空公司代碼必須為大寫'
    })
});

// Hotel search schema
const hotelSearchSchema = baseSearchSchema.keys({
  destination: Joi.string().length(3).uppercase().required()
    .messages({
      'string.length': '目的地機場代碼必須為3個字母',
      'string.uppercase': '機場代碼必須為大寫',
      'any.required': '請選擇目的地'
    }),
  checkInDate: Joi.date().min('now').required()
    .messages({
      'date.min': '入住日期不能是過去日期',
      'any.required': '請選擇入住日期'
    }),
  checkOutDate: Joi.date().min(Joi.ref('checkInDate')).required()
    .messages({
      'date.min': '退房日期必須晚於入住日期',
      'any.required': '請選擇退房日期'
    }),
  guests: Joi.number().integer().min(1).max(10).default(2)
    .messages({
      'number.min': '客人數量至少為1人',
      'number.max': '客人數量不能超過10人'
    }),
  rooms: Joi.number().integer().min(1).max(5).default(1)
    .messages({
      'number.min': '房間數量至少為1間',
      'number.max': '房間數量不能超過5間'
    }),
  hotelRating: Joi.number().min(1).max(5).optional()
    .messages({
      'number.min': '酒店評分最低為1星',
      'number.max': '酒店評分最高為5星'
    }),
  maxPrice: Joi.number().positive().optional()
    .messages({
      'number.positive': '最大價格必須為正數'
    }),
  amenities: Joi.array().items(Joi.string()).optional()
});

// Combined search schema
const combinedSearchSchema = flightSearchSchema.keys({
  checkInDate: hotelSearchSchema.extract('checkInDate'),
  checkOutDate: hotelSearchSchema.extract('checkOutDate'),
  guests: hotelSearchSchema.extract('guests'),
  rooms: hotelSearchSchema.extract('rooms'),
  hotelRating: hotelSearchSchema.extract('hotelRating'),
  maxPrice: hotelSearchSchema.extract('maxPrice'),
  amenities: hotelSearchSchema.extract('amenities')
});

// Search history query schema
const searchHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  searchType: Joi.string().valid('flight', 'hotel', 'combined').optional()
});

// OTA provider configuration schema
const otaProviderConfigSchema = Joi.object({
  provider: Joi.string().valid('amadeus', 'skyscanner', 'expedia', 'booking', 'hotels', 'agoda').required(),
  enabled: Joi.boolean().default(false),
  apiKey: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  apiSecret: Joi.string().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  endpoint: Joi.string().uri().when('enabled', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  rateLimit: Joi.number().integer().min(1).max(1000).default(100),
  timeout: Joi.number().integer().min(1000).max(30000).default(10000)
});

// Search result validation schema
const searchResultSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().default('HKD'),
  rating: Joi.number().min(0).max(5).optional(),
  available: Joi.boolean().default(true)
});

// Search mode descriptions for UI
const searchModeDescriptions = {
  best_price: {
    zh: '最佳價格模式 - 優先顯示最低價格的選項',
    en: 'Best Price Mode - Prioritizes lowest price options'
  },
  relax: {
    zh: '放鬆模式 - 優先顯示時間合理、距離適中的選項',
    en: 'Relax Mode - Prioritizes reasonable timing and convenient location'
  },
  fastest: {
    zh: '最快模式 - 優先顯示時間最短的選項',
    en: 'Fastest Mode - Prioritizes shortest duration options'
  },
  highest_rated: {
    zh: '最高評分模式 - 優先顯示評分最高的選項',
    en: 'Highest Rated Mode - Prioritizes highest rated options'
  }
};

// Flight class descriptions
const flightClassDescriptions = {
  economy: { zh: '經濟艙', en: 'Economy' },
  premium_economy: { zh: '特選經濟艙', en: 'Premium Economy' },
  business: { zh: '商務艙', en: 'Business' },
  first: { zh: '頭等艙', en: 'First Class' }
};

// Popular destinations for autocomplete
const popularDestinations = [
  { code: 'HKG', name: '香港', nameEn: 'Hong Kong' },
  { code: 'TPE', name: '台北', nameEn: 'Taipei' },
  { code: 'NRT', name: '東京成田', nameEn: 'Tokyo Narita' },
  { code: 'ICN', name: '首爾仁川', nameEn: 'Seoul Incheon' },
  { code: 'BKK', name: '曼谷', nameEn: 'Bangkok' },
  { code: 'SIN', name: '新加坡', nameEn: 'Singapore' },
  { code: 'KUL', name: '吉隆坡', nameEn: 'Kuala Lumpur' },
  { code: 'MNL', name: '馬尼拉', nameEn: 'Manila' },
  { code: 'PVG', name: '上海浦東', nameEn: 'Shanghai Pudong' },
  { code: 'PEK', name: '北京首都', nameEn: 'Beijing Capital' }
];

// Validation functions
function validateSearch(data, type = 'flight') {
  let schema;
  
  switch (type) {
    case 'flight':
      schema = flightSearchSchema;
      break;
    case 'hotel':
      schema = hotelSearchSchema;
      break;
    case 'combined':
      schema = combinedSearchSchema;
      break;
    default:
      schema = flightSearchSchema;
  }
  
  return schema.validate(data, { abortEarly: false });
}

function validateSearchHistoryQuery(data) {
  return searchHistoryQuerySchema.validate(data, { abortEarly: false });
}

function validateOtaProviderConfig(data) {
  return otaProviderConfigSchema.validate(data, { abortEarly: false });
}

function validateSearchResult(data) {
  return searchResultSchema.validate(data, { abortEarly: false });
}

// Helper functions
function formatSearchResults(results, type = 'flight') {
  return results.map(result => ({
    ...result,
    priceFormatted: `HK$${result.price.toLocaleString()}`,
    ratingFormatted: result.rating ? `${result.rating}/5` : '暫無評分',
    classText: flightClassDescriptions[result.class]?.zh || result.class,
    searchModeText: searchModeDescriptions[result.searchMode]?.zh || result.searchMode
  }));
}

function getSearchModeDescription(mode, language = 'zh') {
  return searchModeDescriptions[mode]?.[language] || mode;
}

function getFlightClassDescription(flightClass, language = 'zh') {
  return flightClassDescriptions[flightClass]?.[language] || flightClass;
}

module.exports = {
  validateSearch,
  validateSearchHistoryQuery,
  validateOtaProviderConfig,
  validateSearchResult,
  formatSearchResults,
  getSearchModeDescription,
  getFlightClassDescription,
  searchModeDescriptions,
  flightClassDescriptions,
  popularDestinations
};