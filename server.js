// simple backend – later we will add PDF tools here

const express = require("express");
const cors = require("cors");
const app = express();

// yaha par baad me apna actual domain lagana:
// origin: "https://agitools24.com"
app.use(cors({ origin: "*" }));

app.use(express.json());

// test route – backend check karne ke liye
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Tools24 backend is running. PDF tools will be added soon."
  });
});

// future ke liye dummy route (abhi kuch nahi karta)
app.post("/api/pdf-locker", (req, res) => {
  res.json({
    success: true,
    message: "PDF locker endpoint placeholder. Real logic coming soon."
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
