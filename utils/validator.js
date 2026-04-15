const VALID_TYPES = [
  "BUY",
  "SELL",
  "TRANSFER_IN",
  "TRANSFER_OUT"
];

/**
 * Validates a single row
 * @param {Object} row
 * @returns {{ isValid: boolean, errors: string[], warnings: string[] }}
 */
const validateRow = (row) => {
  const errors = [];
  const warnings = [];

  // transaction_id
  if (!row.transaction_id) {
    errors.push("MISSING_TRANSACTION_ID");
  }

  // timestamp
  if (!row.timestamp) {
    errors.push("MISSING_TIMESTAMP");
  } else if (isNaN(Date.parse(row.timestamp))) {
    errors.push("INVALID_TIMESTAMP");
  }

  // type
  if (!row.type) {
    errors.push("MISSING_TYPE");
  } else if (!VALID_TYPES.includes(row.type.toUpperCase())) {
    errors.push("INVALID_TYPE");
  }

  // asset
  if (!row.asset) {
    errors.push("MISSING_ASSET");
  }

  // quantity
  const qty = parseFloat(row.quantity);
  if (isNaN(qty)) {
    errors.push("INVALID_QUANTITY");
  } else if (qty < 0) {
    errors.push("NEGATIVE_QUANTITY");
  }

  // fee
  if (row.fee && parseFloat(row.fee) < 0) {
    errors.push("INVALID_FEE");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = { validateRow };