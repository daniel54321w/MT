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

function readData() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

app.get("/meds", (req, res) => {
  const userId = req.query.userId;
  const data = readData();
  const userMeds = data.filter(m => m.userId === userId);
  res.send(userMeds);
});

app.post("/add", (req, res) => {
  const { name, time, day, userId, playerId } = req.body;
  const data = readData();
  data.push({ name, time, day, userId, playerId, taken: false });
  writeData(data);
  res.send({ success: true });
});

app.post("/acknowledge", (req, res) => {
  const { index, userId } = req.body;
  const data = readData();
  const userMeds = data.filter(m => m.userId === userId);
  if (userMeds[index]) {
    userMeds[index].taken = true;
    // עדכון הרשימה המקורית
    const updated = data.map(m => (m.userId === userId && m.name === userMeds[index].name && m.time === userMeds[index].time) ? userMeds[index] : m);
    writeData(updated);
  }
  res.send({ success: true });
});

app.get("/trigger", async (req, res) => {
  const now = new Date();
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5);

  const data = readData();
  const notifications = [];

  for (let med of data) {
    if (med.day === currentDay && med.time === currentTime && !med.taken && med.playerId) {
      notifications.push(fetch(ONESIGNAL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          include_player_ids: [med.playerId],
          headings: { "en": "הגיע זמן התרופה!" },
          contents: { "he": `נא לקחת את התרופה: ${med.name}` },
          url: "https://golden-chebakia-f94a0b.netlify.app"
        }),
      }));
    }
  }

  try {
    await Promise.all(notifications);
    res.send({ status: "notifications sent", count: notifications.length });
  } catch (e) {
    res.status(500).send("שגיאה בשליחת התראות");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});