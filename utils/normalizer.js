/**
 * Asset normalization map
 */
const ASSET_MAP = {
  btc: "BTC",
  bitcoin: "BTC",
  eth: "ETH",
  ethereum: "ETH",
  sol: "SOL",
  usdt: "USDT",
  matic: "MATIC",
  link: "LINK"
};

/**
 * Normalize a raw row
 * @param {Object} row
 * @returns {Object}
 */
const normalizeRow = (row) => {
  // -------- TYPE + DIRECTION --------
  let type = null;
  let direction = undefined;

  if (row.type) {
    const t = row.type.toUpperCase();

    if (t === "TRANSFER_IN") {
      type = "TRANSFER";
      direction = "IN";
    } else if (t === "TRANSFER_OUT") {
      type = "TRANSFER";
      direction = "OUT";
    } else if (t === "BUY" || t === "SELL") {
      type = t;
    }
  }

  // -------- ASSET --------
  let asset = null;
  if (row.asset) {
    const lower = row.asset.toLowerCase();
    asset = ASSET_MAP[lower] || row.asset.toUpperCase();
  }

  return {
    transaction_id: row.transaction_id || "",

    timestamp: row.timestamp
      ? new Date(row.timestamp)
      : null,

    type,
    direction,

    asset,

    quantity: row.quantity
      ? parseFloat(row.quantity)
      : null,

    price_usd: row.price_usd
      ? parseFloat(row.price_usd)
      : null,

    fee: row.fee
      ? parseFloat(row.fee)
      : null
  };
};

module.exports = { normalizeRow };