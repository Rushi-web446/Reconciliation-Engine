const fs = require("fs");
const csv = require("csv-parser");

/**
 * Reads CSV file and returns rows
 * @param {string} filePath
 * @returns {Promise<Array>}
 */
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        results.push(data);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

module.exports = { readCSV };