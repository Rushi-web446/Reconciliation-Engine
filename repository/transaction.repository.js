const TransactionModel = require("../models/transaction.model");

class TransactionRepository {

  /**
   * Bulk insert transactions
   * @param {Array} data
   */
  async insertMany(data) {
    if (!data || data.length === 0) return;

    try {
      await TransactionModel.insertMany(data);
    } catch (error) {
      console.error("Error inserting transactions:", error);
      throw error;
    }
  }

  /**
   * Get valid transactions by source
   * @param {"USER" | "EXCHANGE"} source
   * @returns {Promise<Array>}
   */
  async findValidBySource(source) {
    try {
      return await TransactionModel.find({
        source,
        "validation.isValid": true
      }).lean();
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }
}

module.exports = TransactionRepository;