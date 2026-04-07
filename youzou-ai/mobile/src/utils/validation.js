// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (international format)
export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 characters, contains uppercase, lowercase, and number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Name validation
export const validateName = (name) => {
  return name && name.length >= 2 && name.length <= 50;
};

// Date validation
export const validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Future date validation
export const validateFutureDate = (date) => {
  const dateObj = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dateObj >= today;
};

// Airport code validation (IATA format)
export const validateAirportCode = (code) => {
  const airportRegex = /^[A-Z]{3}$/;
  return airportRegex.test(code.toUpperCase());
};

// Flight class validation
export const validateFlightClass = (flightClass) => {
  const validClasses = ['economy', 'premium_economy', 'business', 'first'];
  return validClasses.includes(flightClass.toLowerCase());
};

// Hotel rating validation
export const validateHotelRating = (rating) => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
};

// Budget validation
export const validateBudget = (budget) => {
  return budget > 0 && !isNaN(budget);
};

// Passenger count validation
export const validatePassengerCount = (count) => {
  return count > 0 && count <= 9 && Number.isInteger(count);
};

// Search mode validation
export const validateSearchMode = (mode) => {
  const validModes = ['best_price', 'relax'];
  return validModes.includes(mode.toLowerCase());
};

// Auto checker interval validation
export const validateAutoCheckerInterval = (interval) => {
  const validIntervals = ['30m', '2h', '12h', '24h'];
  return validIntervals.includes(interval);
};

// Form validation helpers
export const getValidationErrors = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    const value = formData[field];
    
    // Required validation
    if (rules.required && (!value || value.toString().trim() === '')) {
      errors[field] = rules.requiredMessage || `${field} 為必填項目`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!rules.required && (!value || value.toString().trim() === '')) {
      return;
    }
    
    // Custom validation function
    if (rules.validate && !rules.validate(value)) {
      errors[field] = rules.errorMessage || `${field} 格式不正確`;
      return;
    }
    
    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors[field] = `${field} 至少需要 ${rules.minLength} 個字符`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      errors[field] = `${field} 不能超過 ${rules.maxLength} 個字符`;
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} 格式不正確`;
    }
  });
  
  return errors;
};

// Real-time validation
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Form validation for search
export const validateSearchForm = (formData) => {
  const errors = {};
  
  if (!formData.origin) {
    errors.origin = '請選擇出發地';
  }
  
  if (!formData.destination) {
    errors.destination = '請選擇目的地';
  }
  
  if (!formData.departureDate) {
    errors.departureDate = '請選擇出發日期';
  } else if (!validateFutureDate(formData.departureDate)) {
    errors.departureDate = '出發日期不能是過去日期';
  }
  
  if (formData.tripType === 'round_trip' && !formData.returnDate) {
    errors.returnDate = '請選擇返回日期';
  }
  
  if (formData.tripType === 'round_trip' && formData.departureDate && formData.returnDate) {
    if (new Date(formData.returnDate) <= new Date(formData.departureDate)) {
      errors.returnDate = '返回日期必須晚於出發日期';
    }
  }
  
  if (!formData.passengers || formData.passengers < 1) {
    errors.passengers = '請選擇至少1位乘客';
  }
  
  return errors;
};

// Validation messages in Traditional Chinese
export const validationMessages = {
  email: '請輸入有效的電子郵件地址',
  phone: '請輸入有效的電話號碼',
  password: '密碼必須至少8個字符，包含大小寫字母和數字',
  name: '姓名必須在2-50個字符之間',
  required: '此欄位為必填項目',
  date: '請輸入有效的日期',
  futureDate: '日期不能是過去日期',
  airportCode: '請輸入有效的機場代碼（3個大寫字母）',
  flightClass: '請選擇有效的艙等',
  hotelRating: '酒店評分必須在1-5之間',
  budget: '預算必須大於0',
  passengers: '乘客數量必須在1-9之間',
  searchMode: '請選擇有效的搜索模式',
  autoCheckerInterval: '請選擇有效的檢查間隔'
};