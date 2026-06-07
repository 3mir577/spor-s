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
  const el = document.getElementById(page);
  el.classList.remove("hidden");
  // Kart animasyonunu yeniden tetikle
  el.querySelectorAll(".card").forEach(c => {
    c.style.animation = "none";
    c.offsetHeight;
    c.style.animation = "";
  });
  loadData();
};

// ================= GOAL =================
window.setGoal = async function(){
  let g = document.getElementById("goalInput").value;
  if(!g) return;
  await db.collection("settings").doc("goal").set({ value: Number(g) });
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
  document.getElementById("weightInput").value = "";
  loadData();
};

// ================= LIFT (GELİŞTİRİLMİŞ) =================
window.addLift = async function(type){
  let v = document.getElementById(type + "Input").value;
  if(!v) return;
  const val = Number(v);

  // Kaydetmeden önce mevcut PR'ı al
  const prSnap = await db.collection("lifts").where("type","==",type).get();
  let currentPR = 0;
  prSnap.forEach(d => { if(d.data().value > currentPR) currentPR = d.data().value; });

  await db.collection("lifts").add({
    type,
    value: val,
    date: today(),
    time: Date.now()
  });

  // Toast mesajı
  if(val > currentPR && currentPR > 0){
    showToast("🏆 PR kırdın! +" + (val - currentPR).toFixed(1) + " kg");
  } else if(currentPR === 0){
    showToast("✅ Kaydedildi!");
  } else {
    showToast("💾 Kaydedildi — PR: " + currentPR + " kg (" + (val - currentPR).toFixed(1) + " kg fark)");
  }

  document.getElementById(type + "Input").value = "";
  loadData();
};

// ================= TOAST =================
function showToast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ================= MAIN LOAD =================
async function loadData(){
  try {

    // ── WEIGHTS ──
    let wSnap = await db.collection("weights").orderBy("time").get();
    let weights = [];
    wSnap.forEach(d => weights.push(d.data()));

    if(weights.length){
      document.getElementById("todayWeight").innerText =
        weights[weights.length - 1].value + " kg";
    }

    // ── GOAL ──
    let goalSnap = await db.collection("settings").doc("goal").get();
    if(goalSnap.exists && goalSnap.data().value !== undefined){
      const goal = goalSnap.data().value;
      document.getElementById("goalText").innerText = "Hedef: " + goal + " kg";

      // Progress bar
      if(weights.length){
        const current = weights[weights.length - 1].value;
        const first = weights[0].value;
        let pct = 0;
        if(first !== goal){
          pct = Math.min(100, Math.max(0, ((first - current) / (first - goal)) * 100));
        }
        document.getElementById("progressBar").style.width = pct + "%";
      }
    } else {
      document.getElementById("goalText").innerText = "Hedef: -";
    }

    // ── LIFTS (son 14 gün) ──
    const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    let lSnap = await db.collection("lifts").orderBy("time").where("time",">=",fourteenDaysAgo).get();
    let allLifts = [];
    lSnap.forEach(d => allLifts.push(d.data()));

    const LIFT_TYPES = [
      "plate_incline_press",
      "smith_low_incline_press",
      "chest_fly",
      "machine_shoulder_press",
      "lateral_raise",
      "skullcrusher",
      "Lat_Pulldown",
      "Plate_Loaded",
      "Cable_Row",
      "Cable_Curl",
      "İncline_Dumbell_Curl",
      "Leg_Press",
      "Smith_Machine_Squat",
      "Leg_Extansion",
      "Seated_Leg_Curl",
      "Cable_Crunch"
            
    ];

    // ── TÜM ZAMANLAR (PR rozetleri için) ──
    const allTimeSnap = await db.collection("lifts").orderBy("time").get();
    let allTimeLifts = [];
    allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

    // Her egzersiz için PR, son değer ve önceki seans hesapla
    LIFT_TYPES.forEach(type => {
      // PR → tüm zamanlar
      const allEntries = allTimeLifts.filter(l => l.type === type);
      const pr = allEntries.length ? Math.max(...allEntries.map(e => e.value)) : null;

      // Son değer ve önceki seans → son 14 gün
      const entries = allLifts.filter(l => l.type === type).sort((a,b) => a.time - b.time);
      const last   = entries.length ? entries[entries.length - 1].value : null;

      // Önceki farklı günün son değeri
      let prevSession = null;
      if(entries.length >= 2){
        const lastDate = entries[entries.length - 1].date;
        for(let i = entries.length - 2; i >= 0; i--){
          if(entries[i].date !== lastDate){ prevSession = entries[i].value; break; }
        }
      }

      const infoEl = document.getElementById(type + "Info");
      if(!infoEl) return;

      let html = "";
      if(pr !== null)   html += `<span class="pr-badge">PR ${pr} kg</span>`;
      if(last !== null) html += `<span class="last-val">Son: ${last} kg</span>`;
      if(prevSession !== null){
        const diff = last - prevSession;
        const sign = diff > 0 ? "+" : "";
        const cls  = diff > 0 ? "diff-up" : diff < 0 ? "diff-down" : "diff-same";
        html += `<span class="${cls}">${sign}${diff.toFixed(1)} kg geçen sefere göre</span>`;
      }
      infoEl.innerHTML = html;
    });

    // ── BENCH PR (tüm zamanlar) ──
    const allBenchSnap = await db.collection("lifts").where("type","==","smith_low_incline_press").get();
    let allBenchVals = [];
    allBenchSnap.forEach(d => allBenchVals.push(d.data().value));
    const benchMax = allBenchVals.length ? Math.max(...allBenchVals) : 0;
    document.getElementById("benchMax").innerText = benchMax ? benchMax + " kg" : "-";

    // ── STREAK ──
    updateStreak(weights);

    // ── CHARTS ──
    drawWeightChart(weights);
    drawStatsCharts(weights, allLifts);

  } catch(err){
    console.error("LOAD ERROR:", err);
  }
}

// ================= STREAK =================
function updateStreak(weights){
  if(!weights.length){ document.getElementById("streak").innerText = "0 gün 🔥"; return; }
  const days = [...new Set(weights.map(w => w.date))];
  let streak = 1;
  for(let i = days.length - 1; i > 0; i--){
    const a = new Date(days[i].split(".").reverse().join("-"));
    const b = new Date(days[i-1].split(".").reverse().join("-"));
    if((a - b) / (1000*60*60*24) === 1) streak++;
    else break;
  }
  document.getElementById("streak").innerText = streak + " gün 🔥";
}

// ================= CHARTS =================
let weightChart, weightChartStats, liftChart;

const chartDefaults = {
  plugins:{ legend:{display:false} },
  scales:{
    x:{ ticks:{color:"#555"}, grid:{color:"rgba(255,255,255,0.04)"} },
    y:{ ticks:{color:"#555"}, grid:{color:"rgba(255,255,255,0.04)"} }
  }
};

function drawWeightChart(weights){
  let ctx = document.getElementById("weightChart");
  if(!ctx) return;
  if(weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type:"line",
    data:{
      labels: weights.map(w => w.date),
      datasets:[{ data: weights.map(w => w.value), borderColor:"white", backgroundColor:"rgba(255,255,255,0.05)", tension:0.4, pointRadius:3, pointBackgroundColor:"white" }]
    },
    options: chartDefaults
  });
}

function drawStatsCharts(weights, allLifts){
  let ctx2 = document.getElementById("weightChartStats");
  if(ctx2){
    if(weightChartStats) weightChartStats.destroy();
    weightChartStats = new Chart(ctx2, {
      type:"line",
      data:{
        labels: weights.map(w=>w.date),
        datasets:[{ data:weights.map(w=>w.value), borderColor:"white", backgroundColor:"rgba(255,255,255,0.05)", tension:0.4, pointRadius:3, pointBackgroundColor:"white" }]
      },
      options: chartDefaults
    });
  }

  let ctx3 = document.getElementById("liftChart");
  if(ctx3){
    if(liftChart) liftChart.destroy();
    const benchData = allLifts.filter(l=>l.type==="smith_low_incline_press").sort((a,b)=>a.time-b.time);
    liftChart = new Chart(ctx3, {
      type:"line",
      data:{
        labels: benchData.map(l=>l.date),
        datasets:[{ data:benchData.map(l=>l.value), borderColor:"white", backgroundColor:"rgba(255,255,255,0.05)", tension:0.4, pointRadius:3, pointBackgroundColor:"white" }]
      },
      options: chartDefaults
    });
  }
}

// ================= INIT =================
window.addEventListener("load", () => { loadData(); });
window.db = db;