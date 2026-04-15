const ReconciliationService = require("../service/reconciliation.service");
const ReconciliationModel = require("../models/reconciliation.model");
const { Parser } = require("json2csv");

class ReconciliationController {
  constructor() {
    this.reconciliationService = new ReconciliationService();
  }

  async reconcile(req, res) {
    try {
      const config = {
        timestampTolerance:
          req.body.TIMESTAMP_TOLERANCE_SECONDS ??
          process.env.TIMESTAMP_TOLERANCE_SECONDS ??
          300,

        quantityTolerance:
          req.body.QUANTITY_TOLERANCE_PCT ??
          process.env.QUANTITY_TOLERANCE_PCT ??
          0.01,
      };
      const result = await this.reconciliationService.runReconciliation(config);

      return res.status(200).json({
        success: true,
        message: "Reconciliation completed",
        data: result,
      });
    } catch (error) {
      console.error("Reconciliation error:", error);

      return res.status(500).json({
        success: false,
        message: "Reconciliation failed",
      });
    }
  }

  async getReport(req, res) {
    try {
      const { runId } = req.params;

      const report = await ReconciliationModel.findOne({ runId });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  }

  async getSummary(req, res) {
    try {
      const { runId } = req.params;

      const report = await ReconciliationModel.findOne(
        { runId },
        { summary: 1, _id: 0 },
      );

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      return res.json({
        success: true,
        data: report.summary,
      });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  }

  async getUnmatched(req, res) {
    try {
      const { runId } = req.params;

      const report = await ReconciliationModel.findOne({ runId });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      const unmatched = report.results.filter(
        (r) =>
          r.category === "UNMATCHED_USER" ||
          r.category === "UNMATCHED_EXCHANGE",
      );

      return res.json({
        success: true,
        data: unmatched,
      });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  }

  async getInvalid(req, res) {
    try {
      const { runId } = req.params;

      const report = await ReconciliationModel.findOne({ runId });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      const invalid = report.results.filter(
        (r) => r.user && r.user.validation && !r.user.validation.isValid,
      );

      return res.json({
        success: true,
        data: invalid,
      });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  }

  async getCSV(req, res) {
    try {
      const { runId } = req.params;

      const report = await ReconciliationModel.findOne({ runId });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Report not found",
        });
      }

      // Flatten data for CSV
      const rows = report.results.map((r) => ({
        category: r.category,
        reason: r.reason,

        user_transaction_id: r.user?.raw?.transaction_id || "",
        user_asset: r.user?.raw?.asset || "",
        user_quantity: r.user?.raw?.quantity || "",
        user_price: r.user?.raw?.price_usd || "",

        exchange_transaction_id: r.exchange?.raw?.transaction_id || "",
        exchange_asset: r.exchange?.raw?.asset || "",
        exchange_quantity: r.exchange?.raw?.quantity || "",
        exchange_price: r.exchange?.raw?.price_usd || "",
      }));

      const parser = new Parser();
      const csv = parser.parse(rows);

      res.header("Content-Type", "text/csv");
      res.attachment(`reconciliation_${runId}.csv`);

      return res.send(csv);
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  }
}

module.exports = ReconciliationController;
