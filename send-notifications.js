const fetch = require("node-fetch");

const SERVER_URL = "https://meds-server.onrender.com";
const ONESIGNAL_APP_ID = "c37286d3-4ac2-482a-912f-81c3edd172da";
const ONESIGNAL_API_KEY = "os_v2_app_ynzinu2kyjecvejpqhb63uls3ivypqx5vdyuhmnagdrg24qtmvl2uamb33esbh7hvppyqszpcxexr4gpqx3hdvpmqjfamcqqkytclfi";
const ONESIGNAL_URL = "https://onesignal.com/api/v1/notifications";

const dayNames = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

(async () => {
  const now = new Date();
  const currentDay = dayNames[now.getDay()];
  const currentTime = now.toTimeString().slice(0, 5); // hh:mm

  try {
    const res = await fetch(`${SERVER_URL}/meds`);
    const meds = await res.json();

    for (let i = 0; i < meds.length; i++) {
      const med = meds[i];
      if (med.day === currentDay && med.time === currentTime && !med.taken) {
        // שלח התראה
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
        console.log("התראה נשלחה על התרופה:", med.name);
      }
    }
  } catch (e) {
    console.error("שגיאה בשליחת התראות:", e.message);
  }
})();