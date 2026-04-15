const TransactionRepository = require("../repository/transaction.repository");
const ReconciliationModel = require("../models/reconciliation.model");
const { v4: uuidv4 } = require("uuid");

class ReconciliationService {
  constructor() {
    this.repo = new TransactionRepository();
  }

  async runReconciliation(config) {
    const timestampToleranceMs = config.timestampTolerance * 1000;
    const quantityTolerancePct = config.quantityTolerance;

    const userTx = await this.repo.findValidBySource("USER");
    const exchangeTx = await this.repo.findValidBySource("EXCHANGE");

    const usedExchange = new Set();

    const results = [];

    // MAIN LOOP
    for (const u of userTx) {
      const uNorm = u.normalized;

      // STEP 1: Filter by asset + type
      let candidates = exchangeTx.filter((e, idx) => {
        if (usedExchange.has(idx)) return false;

        const eNorm = e.normalized;

        // asset match
        if (uNorm.asset !== eNorm.asset) return false;

        // type match
        if (uNorm.type === "TRANSFER") {
          return (
            eNorm.type === "TRANSFER" && uNorm.direction !== eNorm.direction
          );
        } else {
          return uNorm.type === eNorm.type;
        }
      });

      // STEP 2: Timestamp filter
      const uTime = new Date(uNorm.timestamp).getTime();

      candidates = candidates.filter((e) => {
        const eTime = new Date(e.normalized.timestamp).getTime();
        return Math.abs(uTime - eTime) <= timestampToleranceMs;
      });

      // STEP 3: No candidates
      if (candidates.length === 0) {
        results.push({
          category: "UNMATCHED_USER",
          user: u,
          exchange: null,
          reason: "No matching transaction found",
        });
        continue;
      }

      // STEP 4: Pick best match
      let best = null;
      let bestIdx = -1;
      let minScore = Infinity;

      candidates.forEach((e, idx) => {
        const eTime = new Date(e.normalized.timestamp).getTime();
        const timeDiff = Math.abs(uTime - eTime);

        const qtyDiff = Math.abs(uNorm.quantity - e.normalized.quantity);

        const score = timeDiff + qtyDiff;

        if (score < minScore) {
          minScore = score;
          best = e;
          bestIdx = exchangeTx.indexOf(e);
        }
      });

      // STEP 5: Validate
      const qtyDiffPct =
        Math.abs(uNorm.quantity - best.normalized.quantity) / uNorm.quantity;

      let category = "MATCHED";
      let reason = "Perfect match";
      const diff = Math.abs(uNorm.quantity - best.normalized.quantity);
      const pct = (diff / uNorm.quantity) * 100;

      if (qtyDiffPct > quantityTolerancePct) {
        category = "CONFLICTING";

        reason = `Quantity differs by ${pct.toFixed(4)}% which exceeds tolerance (${quantityTolerancePct * 100}%)`;
      } else if (uNorm.price_usd !== best.normalized.price_usd) {
        category = "CONFLICTING";
        reason = `Price mismatch: user=${uNorm.price_usd}, exchange=${best.normalized.price_usd}`;
      } else if (uNorm.fee !== best.normalized.fee) {
        category = "CONFLICTING";
        reason = `Fee mismatch: user=${uNorm.fee}, exchange=${best.normalized.fee}`;
      }

      // STEP 6: Mark used
      usedExchange.add(bestIdx);

      results.push({
        category,
        user: u,
        exchange: best,
        reason,
      });
    }

    // Remaining exchange = unmatched
    exchangeTx.forEach((e, idx) => {
      if (!usedExchange.has(idx)) {
        results.push({
          category: "UNMATCHED_EXCHANGE",
          user: null,
          exchange: e,
          reason: "No matching user transaction",
        });
      }
    });

    // Summary
    const summary = {
      matched: results.filter((r) => r.category === "MATCHED").length,
      conflicting: results.filter((r) => r.category === "CONFLICTING").length,
      unmatchedUser: results.filter((r) => r.category === "UNMATCHED_USER")
        .length,
      unmatchedExchange: results.filter(
        (r) => r.category === "UNMATCHED_EXCHANGE",
      ).length,
    };

    const runId = uuidv4();

    await ReconciliationModel.create({
      runId,
      config,
      summary,
      results,
    });

    return {
      runId,
      summary,
    };
  }
}

module.exports = ReconciliationService;
