const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(".")); // serve frontend

/* GOOGLE SHEETS SETUP */

// read credentials from Render environment variable
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

/* SAVE APPLICATION */

async function saveApplication(data) {

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        new Date().toLocaleString(),
        data.email,
        data.name,
        data.year,
        data.motivation,
        data.positions,
        data.skills,
        data.events,
        data.communication,
        data.extra
      ]]
    }
  });

}

/* API ROUTE */

app.post("/apply", async (req,res)=>{

  try{

    const data = req.body;

    await saveApplication(data);

    res.json({status:"success"});

  }catch(err){

    console.error("GOOGLE SHEETS ERROR:", err);

    res.status(500).json({error:"failed"});

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
  console.log(`Server running → http://localhost:${PORT}`);
});
