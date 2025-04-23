
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json());

const FILE = "meds.json";

app.get("/meds", (req, res) => {
  fs.readFile(FILE, "utf8", (err, data) => {
    if (err) return res.status(500).send("error");
    res.send(JSON.parse(data));
  });
});

app.post("/add", (req, res) => {
  const med = req.body;
  fs.readFile(FILE, "utf8", (err, data) => {
    let meds = [];
    if (!err) meds = JSON.parse(data || "[]");
    meds.push({ ...med, taken: false });
    fs.writeFile(FILE, JSON.stringify(meds, null, 2), () => {
      res.send({ success: true });
    });
  });
});

app.post("/acknowledge", (req, res) => {
  const index = req.body.index;
  fs.readFile(FILE, "utf8", (err, data) => {
    if (err) return res.status(500).send("error");
    let meds = JSON.parse(data);
    if (meds[index]) meds[index].taken = true;
    fs.writeFile(FILE, JSON.stringify(meds, null, 2), () => {
      res.send({ success: true });
    });
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});
