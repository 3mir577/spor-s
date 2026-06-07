console.log("SCRIPT ÇALIŞIYOR");


const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================
   HELPERS
========================= */

function today() {
  return new Date().toLocaleDateString("tr-TR");
}

/* =========================
   TEST FUNCTION
========================= */

async function testFirebase() {
  try {
    await db.collection("test").add({
      msg: "Firebase çalışıyor",
      time: Date.now()
    });
    console.log("✅ Firebase OK - veri gitti");
  } catch (e) {
    console.error("❌ Firebase hata:", e);
  }
}

/* =========================
   WEIGHT ADD
========================= */

async function addWeight() {
  let w = document.getElementById("weightInput").value;

  await db.collection("weights").add({
    value: Number(w),
    date: today(),
    time: Date.now()
  });

  console.log("Weight eklendi:", w);
}

/* =========================
   LIFT ADD
========================= */

async function addLift(type) {
  let v = document.getElementById(type + "Input").value;

  await db.collection("lifts").add({
    type: type,
    value: Number(v),
    date: today(),
    time: Date.now()
  });

  console.log("Lift eklendi:", type, v);
}

/* =========================
   LOAD DATA (TEST)
========================= */

async function loadData() {
  let wSnap = await db.collection("weights").get();

  wSnap.forEach(doc => {
    console.log("DB Weight:", doc.data());
  });
}

/* =========================
   DEBUG GLOBAL
========================= */

window.db = db;
window.testFirebase = testFirebase;