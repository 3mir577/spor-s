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

// ================= ADD WEIGHT =================
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

// ================= ADD LIFT =================
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

// ================= SET GOAL =================
window.setGoal = async function(){
  let g = document.getElementById("goalInput").value;
  if(!g) return;

  await db.collection("settings").doc("goal").set({
    value: Number(g)
  });

  loadData();
};

// ================= LOAD GOAL (FIX) =================
async function loadGoal(){
  let goalSnap = await db.collection("settings").doc("goal").get();

  if(goalSnap.exists){
    let goal = goalSnap.data().value;
    document.getElementById("goalText").innerText = "Hedef: " + goal + " kg";
  }
}

// ================= MAIN LOAD =================
async function loadData(){

  // WEIGHTS
  let wSnap = await db.collection("weights").orderBy("time").get();
  let weights = [];

  wSnap.forEach(d => weights.push(d.data()));

  if(weights.length){
    document.getElementById("todayWeight").innerText =
      weights.at(-1).value + " kg";
  }

  // BENCH PR
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

  drawWeightChart(weights);
  drawLiftChart();
  loadGoal(); // ⭐ FIX EKLENDİ
}

// ================= WEIGHT CHART =================
let weightChart;

function drawWeightChart(weights){

  let ctx = document.getElementById("weightChart") 
          || document.getElementById("weightChartStats");

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

// ================= LIFT CHART =================
let liftChart;

async function drawLiftChart(){

  let snap = await db.collection("lifts").get();
  let data = [];

  snap.forEach(d => data.push(d.data()));

  let ctx = document.getElementById("liftChart");
  if(!ctx) return;

  if(liftChart) liftChart.destroy();

  liftChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: data.map(x => x.type),
      datasets: [{
        data: data.map(x => x.value),
        backgroundColor: "white"
      }]
    }
  });
}

// ================= INIT =================
window.addEventListener("load", () => {
  loadData();
});

window.db = db;