const express = require("express");
const cors = require("cors");
const fs = require("fs");
const fetch = require("node-fetch");
const app = express();
app.use(cors());
app.use(express.json());

const FILE = "meds.json";
const ONESIGNAL_APP_ID = "c37286d3-4ac2-482a-912f-81c3edd172da";
const ONESIGNAL_API_KEY = "os_v2_app_ynzinu2kyjecvejpqhb63uls3ivypqx5vdyuhmnagdrg24qtmvl2uamb33esbh7hvppyqszpcxexr4gpqx3hdvpmqjfamcqqkytclfi";
const ONESIGNAL_URL = "https://onesignal.com/api/v1/notifications";

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

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

app.get("/trigger", async (req, res) => {
  const now = new Date();
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // hh:mm

  try {
    const data = fs.readFileSync(FILE, "utf8");
    const meds = JSON.parse(data);
    for (let med of meds) {
      if (med.day === currentDay && med.time === currentTime && !med.taken) {
        await fetch(ONESIGNAL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${ONESIGNAL_API_KEY}`,
          },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            included_segments: ["All"],
            headings: { "en": "הגיע זמן התרופה!" },
            contents: { "he": `נא לקחת את התרופה: ${med.name}` },
            url: "https://golden-chebakia-f94a0b.netlify.app"
          }),
        });
      }
    }
    res.send({ status: "notifications checked" });
  } catch (e) {
    res.status(500).send("שגיאה בשליחת התראות");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});