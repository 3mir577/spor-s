console.log("SCRIPT ÇALIŞTI");

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyByBoLqOnpKRos3g8v3334t54xpjKFoeGw",
  authDomain: "fitness-app-85f16.firebaseapp.com",
  projectId: "fitness-app-85f16",
  storageBucket: "fitness-app-85f16.firebasestorage.app",
  messagingSenderId: "887431608333",
  appId: "1:887431608333:web:fef66f5189d791379c3d44"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= HELPERS =================
function today() {
  return new Date().toLocaleDateString("tr-TR");
}

// ================= TEST =================
window.testFirebase = async function () {
  await db.collection("test").add({
    msg: "Firebase çalışıyor",
    time: Date.now()
  });
  console.log("FIREBASE OK");
};

// ================= WEIGHT =================
window.addWeight = async function () {
  let w = document.getElementById("weightInput").value;

  if (!w) return;

  await db.collection("weights").add({
    value: Number(w),
    date: today(),
    time: Date.now()
  });

  console.log("Weight eklendi:", w);
};

// ================= LIFTS =================
window.addLift = async function (type) {
  let v = document.getElementById(type + "Input").value;

  if (!v) return;

  await db.collection("lifts").add({
    type,
    value: Number(v),
    date: today(),
    time: Date.now()
  });

  console.log("Lift eklendi:", type, v);
};

// ================= LOAD DATA =================
window.loadData = async function () {
  let wSnap = await db.collection("weights").get();

  console.log("---- WEIGHTS ----");
  wSnap.forEach(doc => {
    console.log(doc.data());
  });
};

// ================= GLOBAL DEBUG =================
window.db = db;