const Joi = require('joi');

/**
 * Validation schemas for all endpoints
 */
const schemas = {
  // ============ AUTH SCHEMAS ============
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // ADDED SIGNUP SCHEMA
  signup: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required'
    })
  }),

  forgetPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    })
  }),

  resetPassword: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required().messages({
      'string.length': 'OTP must be 6 digits',
      'any.required': 'OTP is required'
    }),
    newPassword: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'New password is required'
    })
  }),

  // ============ USER SCHEMAS ============
  createUser: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required'
    }),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match',
      'any.required': 'Confirm password is required'
    }),
    role: Joi.string().valid('customer', 'admin').optional()
  }),

  updateUserStatus: Joi.object({
    status: Joi.string().valid('active', 'blocked', 'deleted').required().messages({
      'any.only': 'Status must be active, blocked, or deleted',
      'any.required': 'Status is required'
    })
  }),

  // ============ PRODUCT SCHEMAS ============
  createProduct: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Product name is required'
    }),
    image: Joi.string().allow('').optional(), // Image handled by multer or URL
    category: Joi.string().required().messages({
      'any.required': 'Category is required'
    }),
    price: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    ).required().messages({
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required'
    }),
    description: Joi.string().allow('').optional(),
    colors: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).optional(),
    sizes: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).optional()
  }),

  updateProduct: Joi.object({
    name: Joi.string().optional(),
    image: Joi.string().allow('').optional(), // Image handled by multer or URL
    category: Joi.string().optional(),
    price: Joi.alternatives().try(
      Joi.number().min(0),
      Joi.string().pattern(/^\d+(\.\d+)?$/)
    ).optional(),
    description: Joi.string().allow('').optional(),
    colors: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).optional(),
    sizes: Joi.alternatives().try(
      Joi.array().items(Joi.string()),
      Joi.string()
    ).optional(),
    status: Joi.string().valid('active', 'inactive', 'deleted').optional()
  }),

  updateProductStatus: Joi.object({
    status: Joi.string().valid('active', 'inactive', 'deleted').required().messages({
      'any.only': 'Status must be active, inactive, or deleted',
      'any.required': 'Status is required'
    })
  }),

  // ============ ORDER SCHEMAS ============
  createOrder: Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          prod_id: Joi.string().required().messages({
            'any.required': 'Product ID is required'
          }),
          count: Joi.number().integer().min(1).required().messages({
            'number.min': 'Count must be at least 1',
            'any.required': 'Count is required'
          }),
          size: Joi.string().optional(),
          color: Joi.string().optional(),
          price: Joi.number().min(0).required().messages({
            'number.min': 'Price cannot be negative',
            'any.required': 'Price is required'
          })
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'Order must have at least one item',
        'any.required': 'Items are required'
      }),
    address: Joi.string().required().messages({
      'any.required': 'Address is required'
    }),
    shipping: Joi.number().min(0).required().messages({
      'number.min': 'Shipping cost cannot be negative',
      'any.required': 'Shipping cost is required'
    }),
    total: Joi.number().min(0).required().messages({
      'number.min': 'Total cannot be negative',
      'any.required': 'Total is required'
    }),
    discount: Joi.number().min(0).optional(),
    notes: Joi.string().optional(),
    phoneNumber: Joi.string().required().messages({
      'any.required': 'Phone number is required'
    }),
    customerName: Joi.string().required().messages({
      'any.required': 'Customer name is required'
    })
  }),

  updateOrderStatus: Joi.object({
    status: Joi.string()
      .valid('pending', 'paid', 'shipped', 'completed', 'cancelled')
      .required()
      .messages({
        'any.only': 'Invalid status value',
        'any.required': 'Status is required'
      })
  }),

  // ============ ADMIN SCHEMAS ============
  createAdmin: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords must match'
    }),
    numberOfUsers: Joi.number().integer().min(0).required().messages({
      'number.min': 'Number of users cannot be negative',
      'any.required': 'Number of users is required'
    })
  }),

  // ============ QUERY PARAMS SCHEMAS ============
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    rowsPerPage: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().allow('').optional(),
    status: Joi.string().allow('').optional(),
    sort: Joi.string().valid('asc', 'desc').default('desc'),
    sortBy: Joi.string().default('createdAt'),
    category: Joi.string().allow('').optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    customer: Joi.string().allow('').optional(),
    user: Joi.string().allow('').optional(),
    name: Joi.string().allow('').optional()
  }),

  mongoId: Joi.object({
    id: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid ID format'
      })
  })
};

module.exports = schemas;
