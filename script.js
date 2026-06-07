console.log("PRO FITNESS APP LOADED");

// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "BURAYA_KENDİ_KEYİNİ_YAZ",
  authDomain: "fitness-app-85f16.firebaseapp.com",
  projectId: "fitness-app-85f16",
  storageBucket: "fitness-app-85f16.firebasestorage.app",
  messagingSenderId: "887431608333",
  appId: "1:887431608333:web:fef66f5189d791379c3d44"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= HELPERS =================
const today = () => new Date().toLocaleDateString("tr-TR");

// ================= NAV =================
window.show = function(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  loadData();
};

// ================= GOAL =================
window.setGoal = async function(){
  let g = document.getElementById("goalInput").value;
  if(!g) return;

  await db.collection("settings").doc("goal").set({
    value: Number(g)
  });

  loadData();
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

  loadData();
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

  loadData();
};

// ================= MAIN LOAD =================
async function loadData(){

  // WEIGHTS
  let wSnap = await db.collection("weights").orderBy("time").get();
  let weights = [];

  wSnap.forEach(d => weights.push(d.data()));

  if(weights.length){
    document.getElementById("todayWeight").innerText =
      weights[weights.length - 1].value + " kg";
  }

  // LIFTS (BENCH PR)
  let lSnap = await db.collection("lifts")
    .where("type","==","smith_low_incline_press")
    .get();

  let max = 0;

  lSnap.forEach(d=>{
    let v = d.data().value;
    if(v > max) max = v;
  });

  document.getElementById("benchMax").innerText =
    max ? max + " kg" : "-";

  // GOAL 🔥 (SENDE EKSİK OLAN BUYDU)
  let goalSnap = await db.collection("settings").doc("goal").get();

  if(goalSnap.exists){
    let goal = goalSnap.data().value;
    document.getElementById("goalText").innerText = "Hedef: " + goal + " kg";
  }

  drawWeightChart(weights);
}

// ================= CHART =================
let weightChart;

function drawWeightChart(weights){

  let ctx = document.getElementById("weightChart");
  if(!ctx) return;

  if(weightChart) weightChart.destroy();

  weightChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weights.map(w => w.date),
      datasets: [{
        data: weights.map(w => w.value),
        borderColor: "white"
      }]
    }
  });
}

// ================= INIT =================
window.addEventListener("load", () => {
  loadData();
});

window.db = db;