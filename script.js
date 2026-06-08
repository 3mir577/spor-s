  loadData();
};

const LEGACY_LIFT_TYPES = {
  Incline_Dumbell_Curl: ["İncline_Dumbell_Curl", "Ä°ncline_Dumbell_Curl"]
};

function liftTypeMatches(lift, type) {
  return lift.type === type || (LEGACY_LIFT_TYPES[type] || []).includes(lift.type);
}

window.addLift = async function(type){
  const v = document.getElementById(type + "Input").value;
  if(!v || !uid()) return;
  const val = Number(v);

  const prSnap = await db.collection("users").doc(uid()).collection("lifts").get();
  let currentPR = 0;
  prSnap.forEach(d => {
    const lift = d.data();
    if(liftTypeMatches(lift, type) && lift.value > currentPR) currentPR = lift.value;
  });

  await db.collection("users").doc(uid()).collection("lifts").add({
    type, value: val, date: today(), time: Date.now()
  });

  if(val > currentPR && currentPR > 0){
    showToast("PR kırdın! +" + (val - currentPR).toFixed(1) + " kg");
  } else if(currentPR === 0){
    showToast("Kaydedildi!");
  } else {
    showToast("Kaydedildi - PR: " + currentPR + " kg");
  }

  document.getElementById(type + "Input").value = "";
  loadData();
};

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

async function loadData(){
  if(!uid()) return;
  try {
    const userRef = db.collection("users").doc(uid());
    const wSnap = await userRef.collection("weights").orderBy("time").get();
    const weights = [];
    wSnap.forEach(d => weights.push(d.data()));

    if(weights.length){
      document.getElementById("todayWeight").textContent = weights[weights.length-1].value + " kg";
    }

    const goalSnap = await userRef.collection("settings").doc("goal").get();
    if(goalSnap.exists && goalSnap.data().value !== undefined){
      const goal = goalSnap.data().value;
      document.getElementById("goalText").textContent = "Hedef: " + goal + " kg";
      if(weights.length){
        const cur = weights[weights.length-1].value;
        const first = weights[0].value;
        let pct = 0;
        if(first !== goal) pct = Math.min(100, Math.max(0, ((first-cur)/(first-goal))*100));
        document.getElementById("progressBar").style.width = pct + "%";
      }
    } else {
      document.getElementById("goalText").textContent = "Hedef: —";
    }

    const allTimeSnap = await userRef.collection("lifts").orderBy("time").get();
    const allTimeLifts = [];
    allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

    const ago14 = Date.now() - 14*24*60*60*1000;
    const lSnap = await userRef.collection("lifts").orderBy("time").where("time",">=",ago14).get();
    const recentLifts = [];
    lSnap.forEach(d => recentLifts.push(d.data()));

    const LIFT_TYPES = [
      "plate_incline_press","smith_low_incline_press","chest_fly",
      "machine_shoulder_press","lateral_raise","skullcrusher",
      "Triceps_Pushdown","Overhead_Rope_Extension",
      "Lat_Pulldown","Plate_Loaded","Cable_Row",
      "Cable_Curl","Incline_Dumbell_Curl","Hammer_Curl",
      "Leg_Press","Smith_Machine_Squat","Leg_Extansion",
      "Seated_Leg_Curl","Cable_Crunch"
    ];

    LIFT_TYPES.forEach(type => {
      const allE = allTimeLifts.filter(l => liftTypeMatches(l, type));
      const pr = allE.length ? Math.max(...allE.map(e => e.value)) : null;
      const recE = recentLifts.filter(l => liftTypeMatches(l, type)).sort((a,b) => a.time-b.time);
      const last = recE.length ? recE[recE.length-1].value : null;
      let prev = null;
      if(recE.length >= 2){
        const lastDate = recE[recE.length-1].date;
        for(let i = recE.length-2; i >= 0; i--){
          if(recE[i].date !== lastDate){ prev = recE[i].value; break; }
        }
      }
      const el = document.getElementById(type + "Info");
      if(!el) return;
      let html = "";
      if(pr !== null) html += `<span class="pr-badge">PR ${pr} kg</span>`;
      if(last !== null) html += `<span class="last-val">Son: ${last} kg</span>`;
      if(prev !== null){
        const diff = last - prev;
        const cls = diff > 0 ? "diff-up" : diff < 0 ? "diff-down" : "diff-same";
        html += `<span class="${cls}">${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg</span>`;
      }
      el.innerHTML = html;
    });

    const benchAll = allTimeLifts.filter(l => l.type === "smith_low_incline_press");
    const benchMax = benchAll.length ? Math.max(...benchAll.map(e => e.value)) : 0;
    document.getElementById("benchMax").textContent = benchMax ? benchMax + " kg" : "—";

    updateStreak(weights);
    drawWeightChart(weights);
    drawStatsCharts(weights, recentLifts);
  } catch(err){
    console.error("LOAD ERROR:", err);
  }
}

function updateStreak(weights){
  const el = document.getElementById("streak");
  if(!weights.length){ el.textContent = "0"; return; }
  const days = [...new Set(weights.map(w => w.date))];
  let streak = 1;
  for(let i = days.length-1; i > 0; i--){
    const a = new Date(days[i].split(".").reverse().join("-"));
    const b = new Date(days[i-1].split(".").reverse().join("-"));
    if((a-b)/(1000*60*60*24) === 1) streak++;
    else break;
  }
  el.textContent = streak;
}

let weightChart, weightChartStats, liftChart;
const chartOpts = {
  responsive: true,
  plugins:{ legend:{display:false} },
  scales:{
    x:{ ticks:{color:"#8d99b0", font:{size:10}}, grid:{color:"rgba(255,255,255,0.05)"} },
    y:{ ticks:{color:"#8d99b0", font:{size:10}}, grid:{color:"rgba(255,255,255,0.05)"} }
  }
};

function drawWeightChart(weights){
  const ctx = document.getElementById("weightChart");
  if(!ctx) return;
  if(weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type:"line",
    data:{ labels:weights.map(w=>w.date), datasets:[{
      data:weights.map(w=>w.value), borderColor:"#8ed8ff",
      backgroundColor:"rgba(142,216,255,0.10)", tension:0.4,
      pointRadius:3, pointBackgroundColor:"#f4d38a"
    }]},
    options: chartOpts
  });
}

function drawStatsCharts(weights, lifts){
  const ctx2 = document.getElementById("weightChartStats");
  if(ctx2){
    if(weightChartStats) weightChartStats.destroy();
    weightChartStats = new Chart(ctx2, {
      type:"line",
      data:{ labels:weights.map(w=>w.date), datasets:[{
        data:weights.map(w=>w.value), borderColor:"#8ed8ff",
        backgroundColor:"rgba(142,216,255,0.10)", tension:0.4,
        pointRadius:3, pointBackgroundColor:"#f4d38a"
      }]},
      options: chartOpts
    });
  }
  const ctx3 = document.getElementById("liftChart");
  if(ctx3){
    if(liftChart) liftChart.destroy();
    const bd = lifts.filter(l=>l.type==="smith_low_incline_press").sort((a,b)=>a.time-b.time);
    liftChart = new Chart(ctx3, {
      type:"line",
      data:{ labels:bd.map(l=>l.date), datasets:[{
        data:bd.map(l=>l.value), borderColor:"#f4d38a",
        backgroundColor:"rgba(244,211,138,0.12)", tension:0.4,
        pointRadius:3, pointBackgroundColor:"#8ed8ff"
      }]},
      options: chartOpts
    });
  }
}

window.db = db;