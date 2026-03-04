const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(".")); // serve frontend

/* =========================
   GOOGLE AUTH
========================= */

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const auth = new google.auth.GoogleAuth({
  credentials: credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({
  version: "v4",
  auth
});

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/* =========================
   SAVE APPLICATION
========================= */

async function saveApplication(data) {

  const values = [[
    new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
    data.email || "",
    data.name || "",
    data.year || "",
    data.motivation || "",
    data.positions || "",
    data.skills || "",
    data.events || "",
    data.communication || "",
    data.extra || ""
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values }
  });

}

/* =========================
   APPLICATION ROUTE
========================= */

app.post("/apply", async (req, res) => {

  try {

    const data = req.body;

    if (!data.email || !data.name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await saveApplication(data);

    res.json({ status: "success" });

  } catch (err) {

    console.error("APPLICATION ERROR:");
    console.error(err.message);

    res.status(500).json({
      error: "Submission failed"
    });

  }

});

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req,res)=>{
  res.send("VSA Knox application server running");
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


