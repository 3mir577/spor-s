console.log("FITNESS APP AKTİF");

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
function today(){
  return new Date().toLocaleDateString("tr-TR");
}

// ================= NAV =================
window.show = function(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
};

// ================= GOAL =================
window.setGoal = async function(){
  let g = document.getElementById("goalInput").value;

  await db.collection("settings").doc("goal").set({
    value: Number(g)
  });

  alert("Hedef kaydedildi");
};

// ================= WEIGHT =================
window.addWeight = async function(){
  let w = document.getElementById("weightInput").value;

  if(!w) return;

  await db.collection("weights").add({
    value: Number(w),
    date: today(),
    time: Date.now()
  });

  alert("Kilo eklendi");
};

// ================= LIFT =================
window.addLift = async function(type){
  let v = document.getElementById(type + "Input").value;

  if(!v) return;

  await db.collection("lifts").add({
    type,
    value: Number(v),
    date: today(),
    time: Date.now()
  });

  alert("Ağırlık eklendi");
};

// ================= TEST =================
window.testFirebase = async function(){
  await db.collection("test").add({
    msg:"ok",
    time:Date.now()
  });

  console.log("FIREBASE OK");
};

// ================= DEBUG =================
window.db = db;