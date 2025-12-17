const express = require("express");
const axios = require("axios");
const multer = require("multer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

/* ===== PDF → WORD ===== */
app.post("/pdf-to-word", upload.single("file"), async (req, res) => {
  try {
    const pdfBase64 = req.file.buffer.toString("base64");

    const response = await axios.post(
      "https://api.pdf.co/v1/pdf/convert/to/doc",
      { file: pdfBase64 },
      {
        headers: {
          "x-api-key": process.env.PDFCO_API_KEY
        }
      }
    );

    res.json({ url: response.data.url });

  } catch (err) {
    res.status(500).json({ error: "Conversion failed" });
  }
});

/* ===== PDF → EXCEL ===== */
app.post("/pdf-to-excel", upload.single("file"), async (req, res) => {
  try {
    const pdfBase64 = req.file.buffer.toString("base64");

    const response = await axios.post(
      "https://api.pdf.co/v1/pdf/convert/to/xlsx",
      { file: pdfBase64 },
      {
        headers: {
          "x-api-key": process.env.PDFCO_API_KEY
        }
      }
    );

    res.json({ url: response.data.url });

  } catch (err) {
    res.status(500).json({ error: "Conversion failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));
