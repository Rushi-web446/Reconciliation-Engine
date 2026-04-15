const { readCSV } = require("../utils/csvReader");
const { validateRow } = require("../utils/validator");
const { normalizeRow } = require("../utils/normalizer");
const TransactionRepository = require("../repository/transaction.repository");

class IngestionService {
  constructor() {
    this.transactionRepo = new TransactionRepository();
  }

  async ingestFile(filePath, source) {
    console.log(`Starting ingestion for ${source} file: ${filePath}`);

    // 1. Read CSV
    const rows = await readCSV(filePath);
    console.log(`Total rows read: ${rows.length}`);

    const documents = [];

    let validCount = 0;
    let invalidCount = 0;

    // 2. Process rows 
    for (const row of rows) {
      const validation = validateRow(row);

      let normalized = null;

      if (validation.isValid) {
        normalized = normalizeRow(row);
        validCount++;
      } else {
        invalidCount++;
      }

      documents.push({
        source,

        raw: row,

        normalized,

        validation,

        createdAt: new Date()
      });
    }

    // 3. Bulk insert
    if (documents.length > 0) {
      await this.transactionRepo.insertMany(documents);
    }

    console.log(`Inserted ${documents.length} records for ${source}`);

    return {
      total: rows.length,
      valid: validCount,
      invalid: invalidCount
    };
  }
}

module.exports = IngestionService;