const mongoose = require("mongoose");

const { Schema } = mongoose;

const ReconciliationSchema = new Schema({
  runId: {
    type: String,
    required: true,
    unique: true
  },

  config: {
    timestampTolerance: Number,
    quantityTolerance: Number
  },

  summary: {
    matched: Number,
    conflicting: Number,
    unmatchedUser: Number,
    unmatchedExchange: Number
  },

  results: [
    {
      category: String,
      reason: String,
      user: Schema.Types.Mixed,
      exchange: Schema.Types.Mixed
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Reconciliation", ReconciliationSchema);