cat > /mnt/user-data/outputs/script.js << 'JSEOF'
console.log("FITNESS PRO MAX LOADED");

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
const db   = firebase.firestore();
const auth = firebase.auth();

// ================= AUTH STATE =================
auth.onAuthStateChanged(user => {
  document.getElementById("splash").style.display = "none";
  if (user) {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    const name = user.email.split("@")[0];
    document.getElementById("topGreeting").textContent = "Hoş geldin, " + name;
    loadData();
    newQuote();
    setActiveNav("home");
  } else {
    document.getElementById("app").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
  }
});

// ================= LOGIN / REGISTER / LOGOUT =================
window.loginUser = async function(){
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  if(!email || !pass){ errEl.textContent = "E-posta ve şifre gir."; return; }
  try {
    document.getElementById("loginBtn").textContent = "Giriş yapılıyor...";
    await auth.signInWithEmailAndPassword(email, pass);
  } catch(e) {
    document.getElementById("loginBtn").textContent = "Giriş Yap";
    errEl.textContent = authError(e.code);
  }
};

window.registerUser = async function(){
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  if(!email || !pass){ errEl.textContent = "E-posta ve şifre gir."; return; }
  if(pass.length < 6){ errEl.textContent = "Şifre en az 6 karakter olmalı."; return; }
  try {
    document.getElementById("registerBtn").textContent = "Oluşturuluyor...";
    await auth.createUserWithEmailAndPassword(email, pass);
  } catch(e) {
    document.getElementById("registerBtn").textContent = "Hesap Oluştur";
    errEl.textContent = authError(e.code);
  }
};

window.logoutUser = async function(){
  await auth.signOut();
};

function authError(code){
  const map = {
    "auth/user-not-found":    "Bu e-posta kayıtlı değil.",
    "auth/wrong-password":    "Şifre hatalı.",
    "auth/invalid-email":     "Geçersiz e-posta.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/too-many-requests": "Çok fazla deneme. Biraz bekle.",
    "auth/invalid-credential":"E-posta veya şifre hatalı."
  };
  return map[code] || "Bir hata oluştu: " + code;
}

// ================= HELPERS =================
const today = () => new Date().toLocaleDateString("tr-TR");
const uid   = () => auth.currentUser ? auth.currentUser.uid : null;

// ================= NAV =================
window.show = function(page){
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  hideMuscle();
  setActiveNav(page);
  loadData();
};

function setActiveNav(page){
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("nav-" + page);
  if(btn) btn.classList.add("active");
}

// ================= MUSCLE SELECT =================
window.showMuscle = function(group){
  document.getElementById("muscleSelect").classList.add("hidden");
  document.getElementById("muscleChest").classList.add("hidden");
  document.getElementById("muscleBack").classList.add("hidden");
  document.getElementById("muscleLegs").classList.add("hidden");
  const map = { chest:"muscleChest", back:"muscleBack", legs:"muscleLegs" };
  document.getElementById(map[group]).classList.remove("hidden");
  loadData();
};

window.hideMuscle = function(){
  document.getElementById("muscleSelect").classList.remove("hidden");
  document.getElementById("muscleChest").classList.add("hidden");
  document.getElementById("muscleBack").classList.add("hidden");
  document.getElementById("muscleLegs").classList.add("hidden");
};

// ================= QUOTES =================
const quotes = [
  "Hafif ağırlık yok, sadece zayıf zihin var.",
  "Her tekrar seni bir adım öteye taşır.",
  "Acı geçici, gurur kalıcıdır.",
  "Bugün yaptıkların yarının vücudunu yapar.",
  "Vücudun yapabilir. Zihnini ikna et.",
  "PR kırmak için buraya geldin.",
  "Dışarıda kimse senin yerine antrenman yapmıyor.",
  "Disiplin motivasyonu geçer.",
  "En iyi yatırım kendi bedenine yapılan yatırımdır.",
  "Yorgunluk bir his, bırakmak bir seçim."
];

window.newQuote = function(){
  const el = document.getElementById("quoteText");
  if(!el) return;
  const q = quotes[Math.floor(Math.random() * quotes.length)];
  el.style.opacity = "0";
  setTimeout(() => { el.textContent = q; el.style.opacity = "1"; }, 200);
};

// ================= GOAL =================
window.setGoal = async function(){
  const g = document.getElementById("goalInput").value;
  if(!g || !uid()) return;
  await db.collection("users").doc(uid()).collection("settings").doc("goal").set({ value: Number(g) });
  loadData();
};

// ================= WEIGHT =================
window.addWeight = async function(){
  const w = document.getElementById("weightInput").value;
  if(!w || !uid()) return;
  await db.collection("users").doc(uid()).collection("weights").add({
    value: Number(w), date: today(), time: Date.now()
  });
  document.getElementById("weightInput").value = "";
  showToast("⚖️ Kilo kaydedildi!");
  loadData();
};

// ================= LIFT =================
window.addLift = async function(type){
  const v = document.getElementById(type + "Input").value;
  if(!v || !uid()) return;
  const val = Number(v);

  const prSnap = await db.collection("users").doc(uid()).collection("lifts").where("type","==",type).get();
  let currentPR = 0;
  prSnap.forEach(d => { if(d.data().value > currentPR) currentPR = d.data().value; });

  await db.collection("users").doc(uid()).collection("lifts").add({
    type, value: val, date: today(), time: Date.now()
  });

  if(val > currentPR && currentPR > 0){
    showToast("🏆 PR kırdın! +" + (val - currentPR).toFixed(1) + " kg");
  } else if(currentPR === 0){
    showToast("✅ Kaydedildi!");
  } else {
    showToast("💾 Kaydedildi — PR: " + currentPR + " kg");
  }

  document.getElementById(type + "Input").value = "";
  loadData();
};

// ================= TOAST =================
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ================= LOAD DATA =================
async function loadData(){
  if(!uid()) return;
  try {
    const userRef = db.collection("users").doc(uid());

    // WEIGHTS
    const wSnap = await userRef.collection("weights").orderBy("time").get();
    const weights = [];
    wSnap.forEach(d => weights.push(d.data()));

    if(weights.length){
      document.getElementById("todayWeight").textContent = weights[weights.length-1].value + " kg";
    }

    // GOAL
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

    // LIFTS — tüm zamanlar (PR için)
    const allTimeSnap = await userRef.collection("lifts").orderBy("time").get();
    const allTimeLifts = [];
    allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

    // LIFTS — son 14 gün (karşılaştırma için)
    const ago14 = Date.now() - 14*24*60*60*1000;
    const lSnap = await userRef.collection("lifts").orderBy("time").where("time",">=",ago14).get();
    const recentLifts = [];
    lSnap.forEach(d => recentLifts.push(d.data()));

    const LIFT_TYPES = [
      "plate_incline_press","smith_low_incline_press","chest_fly",
      "machine_shoulder_press","lateral_raise","skullcrusher",
      "Triceps_Pushdown","Overhead_Rope_Extension",
      "Lat_Pulldown","Plate_Loaded","Cable_Row",
      "Cable_Curl","İncline_Dumbell_Curl","Hammer_Curl",
      "Leg_Press","Smith_Machine_Squat","Leg_Extansion",
      "Seated_Leg_Curl","Cable_Crunch"
    ];

    LIFT_TYPES.forEach(type => {
      const allE  = allTimeLifts.filter(l => l.type === type);
      const pr    = allE.length ? Math.max(...allE.map(e => e.value)) : null;
      const recE  = recentLifts.filter(l => l.type === type).sort((a,b) => a.time-b.time);
      const last  = recE.length ? recE[recE.length-1].value : null;
      let prev    = null;
      if(recE.length >= 2){
        const lastDate = recE[recE.length-1].date;
        for(let i = recE.length-2; i >= 0; i--){
          if(recE[i].date !== lastDate){ prev = recE[i].value; break; }
        }
      }
      const el = document.getElementById(type + "Info");
      if(!el) return;
      let html = "";
      if(pr   !== null) html += `<span class="pr-badge">PR ${pr} kg</span>`;
      if(last !== null) html += `<span class="last-val">Son: ${last} kg</span>`;
      if(prev !== null){
        const diff = last - prev;
        const cls  = diff > 0 ? "diff-up" : diff < 0 ? "diff-down" : "diff-same";
        html += `<span class="${cls}">${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg</span>`;
      }
      el.innerHTML = html;
    });

    // BENCH PR
    const benchAll = allTimeLifts.filter(l => l.type === "smith_low_incline_press");
    const benchMax = benchAll.length ? Math.max(...benchAll.map(e => e.value)) : 0;
    document.getElementById("benchMax").textContent = benchMax ? benchMax + " kg" : "—";

    // STREAK
    updateStreak(weights);

    // CHARTS
    drawWeightChart(weights);
    drawStatsCharts(weights, recentLifts);

  } catch(err){ console.error("LOAD ERROR:", err); }
}

// ================= STREAK =================
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

// ================= CHARTS =================
let weightChart, weightChartStats, liftChart;
const chartOpts = {
  plugins:{ legend:{display:false} },
  scales:{
    x:{ ticks:{color:"#444", font:{size:10}}, grid:{color:"rgba(255,255,255,0.03)"} },
    y:{ ticks:{color:"#444", font:{size:10}}, grid:{color:"rgba(255,255,255,0.03)"} }
  }
};

function drawWeightChart(weights){
  const ctx = document.getElementById("weightChart");
  if(!ctx) return;
  if(weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type:"line",
    data:{ labels:weights.map(w=>w.date), datasets:[{
      data:weights.map(w=>w.value), borderColor:"rgba(255,255,255,0.7)",
      backgroundColor:"rgba(255,255,255,0.04)", tension:0.4,
      pointRadius:3, pointBackgroundColor:"#fff"
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
        data:weights.map(w=>w.value), borderColor:"rgba(255,255,255,0.7)",
        backgroundColor:"rgba(255,255,255,0.04)", tension:0.4,
        pointRadius:3, pointBackgroundColor:"#fff"
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
        data:bd.map(l=>l.value), borderColor:"rgba(255,255,255,0.7)",
        backgroundColor:"rgba(255,255,255,0.04)", tension:0.4,
        pointRadius:3, pointBackgroundColor:"#fff"
      }]},
      options: chartOpts
    });
  }
}

window.db = db;
JSEOF