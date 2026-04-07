const Joi = require('joi');

const registrationSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '請輸入有效的電子郵件地址',
      'any.required': '電子郵件為必填項目'
    }),
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': '請輸入有效的電話號碼',
      'any.required': '電話號碼為必填項目'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': '密碼至少需要8個字符',
      'string.pattern.base': '密碼必須包含大小寫字母和數字',
      'any.required': '密碼為必填項目'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': '姓名至少需要2個字符',
      'string.max': '姓名不能超過50個字符',
      'any.required': '姓名為必填項目'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': '請輸入有效的電子郵件地址',
      'any.required': '電子郵件為必填項目'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': '密碼為必填項目'
    })
});

function validateRegistration(data) {
  return registrationSchema.validate(data, { abortEarly: false });
}

function validateLogin(data) {
  return loginSchema.validate(data, { abortEarly: false });
}

module.exports = {
  validateRegistration,
  validateLogin
};