const express = require("express");
const cors = require("cors");
const xlsx = require("xlsx");
const path = require("path");

const app = express();
app.use(cors());

app.get("/data", (req, res) => {
  const workbook = xlsx.readFile(path.join(__dirname, "data.xlsx"));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const result = {};
  let currentPortfolio = null;

  for (let row of jsonData) {
    const [portfolio, activity] = row;

    if (portfolio) {
      currentPortfolio = portfolio.trim();
      if (!result[currentPortfolio]) result[currentPortfolio] = [];
    }

    if (activity && currentPortfolio) {
      result[currentPortfolio].push(activity.trim());
    }
  }

  res.json(result);
});

app.listen(3001, () => {
  console.log("Servidor backend en http://localhost:3001");
});
