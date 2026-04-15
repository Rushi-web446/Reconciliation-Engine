const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./core/db");
const { loadInitialData } = require("./scripts/loadData");
const path = require("path");


dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;


const reconciliationRoutes = require("./routes/reconciliation.routes");
app.use("/api", reconciliationRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

const startServer = async () => {
  await connectDB();

  await loadInitialData();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};


startServer().catch(err => {
  console.error("Server failed to start:", err);
});