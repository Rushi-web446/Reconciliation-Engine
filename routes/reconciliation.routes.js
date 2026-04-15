const express = require("express");
const ReconciliationController = require("../controller/reconciliation.controller");

const router = express.Router();

const controller = new ReconciliationController();

router.post("/reconcile", (req, res) =>
  controller.reconcile(req, res)
);

router.get("/report/:runId", (req, res) =>
  controller.getReport(req, res)
);

router.get("/report/:runId/summary", (req, res) =>
  controller.getSummary(req, res)
);

router.get("/report/:runId/unmatched", (req, res) =>
  controller.getUnmatched(req, res)
);

router.get("/report/:runId/invalid", (req, res) =>
  controller.getInvalid(req, res)
);

router.get("/report/:runId/csv", (req, res) =>
  controller.getCSV(req, res)
);



module.exports = router;