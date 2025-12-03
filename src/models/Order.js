const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  prod_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  count: {
    type: Number,
    required: true,
    min: 1
  },
  size: String,
  color: String,
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items.length > 0;
        },
        message: 'Order must have at least one item'
      }
    },
    address: {
      type: String,
      required: [true, 'Address is required']
    },
    shipping: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: String,
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required']
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required']
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
      default: 'pending'
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerName: 'text', phoneNumber: 'text' });

orderSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
