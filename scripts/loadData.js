const path = require("path");
const IngestionService = require("../service/ingestion.service");
const TransactionModel = require("../models/transaction.model");

const rootDir = path.resolve();

const loadInitialData = async () => {
  try {
    console.log("Starting data ingestion...");

    // If by chance server crash then again restart then it might add one more time data into the DB.
    // so delete old data
    // since this is a hardware bug so will not happens frequently so we can allowed to delete old data and add again.
    await TransactionModel.deleteMany({});
    console.log("Old data cleared");

    const ingestionService = new IngestionService();

    const userFile = path.join(rootDir, "datasets", "user_transactions.csv");
    const exchangeFile = path.join(rootDir, "datasets", "exchange_transactions.csv");

    const userResult = await ingestionService.ingestFile(userFile, "USER");
    console.log("USER ingestion:", userResult);

    const exchangeResult = await ingestionService.ingestFile(exchangeFile, "EXCHANGE");
    console.log("EXCHANGE ingestion:", exchangeResult);

    console.log("Data ingestion completed successfully");
  } catch (error) {
    console.error("Data ingestion failed:", error.message);
    throw error;
  }
};

module.exports = { loadInitialData };