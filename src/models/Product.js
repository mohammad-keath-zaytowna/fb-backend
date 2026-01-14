const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    image: {
      type: String,
      required: [true, 'Product image is required']
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    description: {
      type: String,
      trim: true
    },
    stock: {
      type: Number,
      default: 0
    },
    colors: {
      type: [String],
      default: []
    },
    sizes: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'deleted'],
      default: 'active'
    },
    visibleToUsers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ admin: 1, visibleToUsers: 1 });

// Pre-save hook to validate stock based on admin's stockManagement setting
productSchema.pre('save', async function () {
  // Only validate stock if it's been modified
  if (this.isModified('stock')) {
    // Populate admin to check stockManagement setting
    await this.populate('admin');

    if (this.admin && this.admin.stockManagement) {
      // If stock management is enabled, stock cannot be negative
      if (this.stock < 0) {
        throw new Error('Stock cannot be negative when stock management is enabled');
      }
    }

    // Depopulate admin to avoid saving populated data
    if (this.admin && typeof this.admin === 'object') {
      this.admin = this.admin._id;
    }
  }
});

// Method to check if sufficient stock is available
productSchema.methods.checkStockAvailability = async function (requestedQuantity) {
  // Populate admin to check stockManagement setting
  await this.populate('admin');

  const stockManagementEnabled = this.admin && this.admin.stockManagement;

  // Depopulate admin
  if (this.admin && typeof this.admin === 'object') {
    this.admin = this.admin._id;
  }

  // If stock management is not enabled, always allow
  if (!stockManagementEnabled) {
    return { available: true, currentStock: this.stock };
  }

  // Check if sufficient stock exists
  const available = this.stock >= requestedQuantity;

  return {
    available,
    currentStock: this.stock,
    stockManagementEnabled: true
  };
};

productSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
