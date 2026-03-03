require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const cors = require("cors");
const { google } = require("googleapis");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("public"));

/* DATABASE */
const db = new sqlite3.Database("./applicants.db");

db.run(`CREATE TABLE IF NOT EXISTS applicants(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  year TEXT,
  position TEXT,
  reason TEXT,
  experience TEXT,
  ideas TEXT,
  communication TEXT,
  extra TEXT
)`);

/* EMAIL CONFIG */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
/* GOOGLE SHEETS CONFIG */
const auth = new google.auth.GoogleAuth({
  keyFile: "./credentials.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function getSheetsClient() {
  const client = await auth.getClient();
  return google.sheets({ version: "v4", auth: client });
}

const sheets = google.sheets({ version: "v4", auth });

const SPREADSHEET_ID = "1B3IBP8m7FRgmC1U2YDKSjI9zIWLCmRk6DZQt4ELjpdg";

async function appendToSheet(row) {
  try {
    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "sheet1!A:J", // Make sure tab name is EXACT
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    console.log("Saved to Google Sheet");
  } catch (err) {
    console.error("Google Sheets Error:", err);
  }
}

/* SUBMIT APPLICATION */
app.post('/apply', async (req, res) => {
  console.log("==== APPLY ROUTE HIT ====");
  console.log("FORM SUBMITTED");
  console.log(req.body);
  console.log("APPLY ROUTE TRIGGERED");

  const {
    name,
    email,
    year,
    position,
    reason,
    experience,
    ideas,
    communication,
    extra
  } = req.body;

  const mailText = `
${name}

Email: ${email}
Year: ${year}
Position: ${position}

Why join:
${reason}

Event experience:
${experience}

Ideas:
${ideas}

Communication:
${communication}

Extra:
${extra}
`;

  db.run(
    `INSERT INTO applicants(name,email,year,position,reason,experience,ideas,communication,extra)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [name,email,year,position,reason,experience,ideas,communication,extra],
    function(err){
      if(err){
        console.error(err);
        return res.status(500).json({status:"error"});
      }

      sendEmail(mailText);
      generatePDF();

      appendToSheet([
        new Date().toLocaleString(),
        name,
        email,
        year,
        position,
        reason,
        experience,
        ideas,
        communication,
        extra
      ]);

      res.json({ message: "Application submitted successfully!" });
    }
  );

});   // ✅ THIS WAS MISSING

/* EMAIL FUNCTION */
function sendEmail(mailText){
  transporter.sendMail({
    to:"vietnameseclub23@gmail.com",
    subject:`New Vietnamese Club Application`,
    text: mailText
  });
}

/* PDF ROSTER */
function generatePDF(){

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream("roster.pdf"));

  doc.fontSize(18).text("Vietnamese Club Applicants", {align:"center"});
  doc.moveDown();

  db.all("SELECT * FROM applicants",(err,rows)=>{

    rows.forEach(r=>{
      doc.fontSize(12).text(`${r.name} | ${r.email} | ${r.position}`);
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

/* START SERVER */
app.listen(3000,()=>console.log("Running → http://localhost:3000"));

