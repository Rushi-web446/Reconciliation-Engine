const mongoose = require("mongoose");

const { Schema } = mongoose;

const TransactionSchema = new Schema(
  {
    source: {
      type: String,
      enum: ["USER", "EXCHANGE"],
      required: true,
    },

    raw: {
      type: mongoose.Schema.Types.Mixed,
    },
    normalized: {
      transaction_id: String,

      timestamp: {
        type: Date,
        index: true, 
      },

      type: {
        type: String,
        enum: ["BUY", "SELL", "TRANSFER", null],
      },

      direction: {
        type: String,
        enum: ["IN", "OUT"],
      },

      asset: {
        type: String,
        index: true,
      },

      quantity: Number,
      price_usd: Number,
      fee: Number,
    },

    validation: {
      isValid: {
        type: Boolean,
        index: true,
      },
      errors: [String],
      warnings: [String],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  },
);
// indexes
TransactionSchema.index({
  "normalized.asset": 1,
  "normalized.type": 1,
  "normalized.timestamp": 1,
});

const TransactionModel = mongoose.model("Transaction", TransactionSchema);

module.exports = TransactionModel;
