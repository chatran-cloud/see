const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(".")); // serves index.html

/* GOOGLE SHEETS SETUP */

const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

const sheets = google.sheets({
  version: "v4",
  auth
});

const SPREADSHEET_ID = "1B3IBP8m7FRgmC1U2YDKSjI9zIWLCmRk6DZQt4ELjpdg";

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

    console.error(err);

    res.status(500).json({error:"failed"});

  }

});

app.listen(3000,()=>{
  console.log("Server running → http://localhost:3000");
});
