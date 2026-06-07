console.log("FITNESS APP AKTİF");

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyByBoLqOnpKRos3g3...",
  authDomain: "fitness-app-85f16.firebaseapp.com",
  projectId: "fitness-app-85f16",
  storageBucket: "fitness-app-85f16.firebasestorage.app",
  messagingSenderId: "887431608333",
  appId: "1:887431608333:web:fef66f5189d791379c3d44"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= SAFE INIT =================
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM READY");
});

// ================= HELPERS =================
function today(){
  return new Date().toLocaleDateString("tr-TR");
}

// ================= SAFE NAV =================
window.show = function(page){
  document.querySelectorAll(".page").forEach(p=>{
    if(p) p.classList.add("hidden");
  });

  const el = document.getElementById(page);
  if(el) el.classList.remove("hidden");
};

// ================= GOAL =================
window.setGoal = async function(){
  try {
    let g = document.getElementById("goalInput")?.value;
    if(!g) return;

    await db.collection("settings").doc("goal").set({
      value: Number(g),
      time: Date.now()
    });

    alert("Hedef kaydedildi");
  } catch (e) {
    console.log("GOAL ERROR:", e);
  }
};

// ================= WEIGHT =================
window.addWeight = async function(){
  try {
    let w = document.getElementById("weightInput")?.value;
    if(!w) return;

    await db.collection("weights").add({
      value: Number(w),
      date: today(),
      time: Date.now()
    });

    alert("Kilo eklendi");
  } catch (e) {
    console.log("WEIGHT ERROR:", e);
  }
};

// ================= LIFT =================
window.addLift = async function(type){
  try {
    let v = document.getElementById(type + "Input")?.value;
    if(!v) return;

    await db.collection("lifts").add({
      type,
      value: Number(v),
      date: today(),
      time: Date.now()
    });

    alert("Ağırlık eklendi");
  } catch (e) {
    console.log("LIFT ERROR:", e);
  }
};

// ================= TEST =================
window.testFirebase = async function(){
  try {
    await db.collection("test").add({
      msg:"ok",
      time:Date.now()
    });

    console.log("FIREBASE OK");
  } catch (e) {
    console.log("FIREBASE ERROR:", e);
  }
};

// ================= DEBUG =================
window.db = db;