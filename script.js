console.log("FITNESS PRO MAX LOADED");

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
    "auth/user-not-found":       "Bu e-posta kayıtlı değil.",
    "auth/wrong-password":       "Şifre hatalı.",
    "auth/invalid-email":        "Geçersiz e-posta.",
    "auth/email-already-in-use": "Bu e-posta zaten kayıtlı.",
    "auth/too-many-requests":    "Çok fazla deneme. Biraz bekle.",
    "auth/invalid-credential":   "E-posta veya şifre hatalı."
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
  currentMuscleGroup = group;
  document.getElementById("muscleSelect").classList.add("hidden");
  document.getElementById("muscleChest").classList.add("hidden");
  document.getElementById("muscleBack").classList.add("hidden");
  document.getElementById("muscleLegs").classList.add("hidden");
  const map = { chest:"muscleChest", back:"muscleBack", legs:"muscleLegs" };
  document.getElementById(map[group]).classList.remove("hidden");
  renderExercises(group);
};

window.hideMuscle = function(){
  currentMuscleGroup = null;
  document.getElementById("muscleSelect").classList.remove("hidden");
  document.getElementById("muscleChest").classList.add("hidden");
  document.getElementById("muscleBack").classList.add("hidden");
  document.getElementById("muscleLegs").classList.add("hidden");
};

// ================= EXERCISES =================
let currentMuscleGroup = null;

const DEFAULT_EXERCISES = {
  chest: [
    { id:"plate_incline_press",     name:"Plate Incline Press",        section:"Chest" },
    { id:"smith_low_incline_press", name:"Smith Low Incline Press",    section:"Chest" },
    { id:"chest_fly",               name:"Chest Fly",                  section:"Chest" },
    { id:"machine_shoulder_press",  name:"Shoulder Press",             section:"Shoulder" },
    { id:"lateral_raise",           name:"Lateral Raise",              section:"Shoulder" },
    { id:"skullcrusher",            name:"Skullcrusher",               section:"Triceps" },
    { id:"Triceps_Pushdown",        name:"Triceps Pushdown",           section:"Triceps" },
    { id:"Overhead_Rope_Extension", name:"Overhead Rope Extension",    section:"Triceps" },
  ],
  back: [
    { id:"Lat_Pulldown",            name:"Lat Pulldown",               section:"Back" },
    { id:"Plate_Loaded",            name:"Plate Loaded Wide Grip Row", section:"Back" },
    { id:"Cable_Row",               name:"Cable Row",                  section:"Back" },
    { id:"Cable_Curl",              name:"Cable Curl",                 section:"Biceps" },
    { id:"İncline_Dumbell_Curl",    name:"Incline Dumbbell Curl",      section:"Biceps" },
    { id:"Hammer_Curl",             name:"Hammer Curl",                section:"Biceps" },
  ],
  legs: [
    { id:"Leg_Press",               name:"Leg Press",                  section:"Legs" },
    { id:"Smith_Machine_Squat",     name:"Smith Machine Squat",        section:"Legs" },
    { id:"Leg_Extansion",           name:"Leg Extension",              section:"Legs" },
    { id:"Seated_Leg_Curl",         name:"Seated Leg Curl",            section:"Legs" },
    { id:"Cable_Crunch",            name:"Cable Crunch",               section:"Core" },
  ]
};

// Fetch hidden default exercise IDs for this user
async function getHiddenDefaults() {
  if (!uid()) return [];
  try {
    const snap = await db.collection("users").doc(uid()).collection("hiddenDefaults").get();
    const ids = [];
    snap.forEach(d => ids.push(d.id));
    return ids;
  } catch(e) { return []; }
}

// Get visible exercises for a group (filtered defaults + user-added custom)
async function getExercises(group) {
  const hidden  = await getHiddenDefaults();
  const defaults = (DEFAULT_EXERCISES[group] || []).filter(ex => !hidden.includes(ex.id));
  if (!uid()) return defaults;
  try {
    const snap = await db.collection("users").doc(uid())
      .collection("customExercises").where("group","==",group).get();
    const custom = [];
    snap.forEach(d => custom.push(d.data()));
    return [...defaults, ...custom];
  } catch(e) { return defaults; }
}

// Render exercise cards
async function renderExercises(group) {
  const container = document.getElementById("exerciseList-" + group);
  if (!container) return;
  container.innerHTML = '<div style="color:#333;font-size:12px;text-align:center;padding:20px">Yükleniyor...</div>';

  const exercises = await getExercises(group);

  const allTimeSnap = uid()
    ? await db.collection("users").doc(uid()).collection("lifts").orderBy("time").get()
    : null;
  const allTimeLifts = [];
  if (allTimeSnap) allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

  const ago14 = Date.now() - 14*24*60*60*1000;
  const recentSnap = uid()
    ? await db.collection("users").doc(uid()).collection("lifts").orderBy("time").where("time",">=",ago14).get()
    : null;
  const recentLifts = [];
  if (recentSnap) recentSnap.forEach(d => recentLifts.push(d.data()));

  // Group by section
  const sections = {};
  exercises.forEach(ex => {
    if (!sections[ex.section]) sections[ex.section] = [];
    sections[ex.section].push(ex);
  });

  let html = "";
  for (const [sectionName, exList] of Object.entries(sections)) {
    html += `<div class="exercise-section-label">${sectionName}</div>`;
    exList.forEach(ex => {
      const allE = allTimeLifts.filter(l => l.type === ex.id);
      const pr   = allE.length ? Math.max(...allE.map(e => e.value)) : null;
      const recE = recentLifts.filter(l => l.type === ex.id).sort((a,b) => a.time-b.time);
      const last = recE.length ? recE[recE.length-1].value : null;
      let prev   = null;
      if(recE.length >= 2){
        const lastDate = recE[recE.length-1].date;
        for(let i = recE.length-2; i >= 0; i--){
          if(recE[i].date !== lastDate){ prev = recE[i].value; break; }
        }
      }
      let badges = "";
      if(pr   !== null) badges += `<span class="pr-badge">PR ${pr} kg</span>`;
      if(last !== null) badges += `<span class="last-val">Son: ${last} kg</span>`;
      if(prev !== null){
        const diff = last - prev;
        const cls  = diff > 0 ? "diff-up" : diff < 0 ? "diff-down" : "diff-same";
        badges += `<span class="${cls}">${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg</span>`;
      }

      const inputId  = "liftInput_" + ex.id;
      const isCustom = !DEFAULT_EXERCISES[group]?.find(d => d.id === ex.id);
      // Her hareketin silinebilir olması için — default'lar "gizlenir", custom'lar silinir
      const deleteBtn = `<button class="delete-ex-btn" onclick="deleteExercise('${ex.id}','${group}',${isCustom})" title="Kaldır">✕</button>`;

      html += `
        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <div class="card-label">${ex.name}</div>
            ${deleteBtn}
          </div>
          <div class="lift-info">${badges}</div>
          <div class="input-row">
            <input id="${inputId}" placeholder="kg" type="number">
            <button class="btn-sm" onclick="addLiftDynamic('${ex.id}','${group}')">Kaydet</button>
          </div>
        </div>`;
    });
  }

  if (exercises.length === 0) {
    html = `<div style="color:#333;font-size:13px;text-align:center;padding:30px 0">Henüz hareket yok.<br>Aşağıdan ekle.</div>`;
  }

  container.innerHTML = html;
}

// Delete or hide exercise
window.deleteExercise = async function(exerciseId, group, isCustom) {
  if (!uid()) return;
  if (isCustom) {
    // Custom: gerçekten sil
    const snap = await db.collection("users").doc(uid()).collection("customExercises")
      .where("id","==",exerciseId).get();
    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } else {
    // Default: bu kullanıcı için gizle
    await db.collection("users").doc(uid()).collection("hiddenDefaults").doc(exerciseId).set({ hidden: true });
  }
  showToast("🗑️ Hareket kaldırıldı");
  renderExercises(group);
};

// Add lift
window.addLiftDynamic = async function(exerciseId, group) {
  const inputEl = document.getElementById("liftInput_" + exerciseId);
  if (!inputEl || !inputEl.value || !uid()) return;
  const val = Number(inputEl.value);

  const prSnap = await db.collection("users").doc(uid()).collection("lifts")
    .where("type","==",exerciseId).get();
  let currentPR = 0;
  prSnap.forEach(d => { if(d.data().value > currentPR) currentPR = d.data().value; });

  await db.collection("users").doc(uid()).collection("lifts").add({
    type: exerciseId, value: val, date: today(), time: Date.now()
  });

  if(val > currentPR && currentPR > 0){
    showToast("🏆 PR kırdın! +" + (val - currentPR).toFixed(1) + " kg");
  } else if(currentPR === 0){
    showToast("✅ Kaydedildi!");
  } else {
    showToast("💾 Kaydedildi — PR: " + currentPR + " kg");
  }

  inputEl.value = "";
  renderExercises(group);
  loadData();
};

// Add exercise modal
window.openAddExercise = function(group) {
  currentMuscleGroup = group;
  document.getElementById("newExerciseName").value = "";
  document.getElementById("newExerciseSection").value = "";
  document.getElementById("addExerciseModal").classList.remove("hidden");
};

window.closeAddExercise = function() {
  document.getElementById("addExerciseModal").classList.add("hidden");
};

window.confirmAddExercise = async function() {
  const name    = document.getElementById("newExerciseName").value.trim();
  const section = document.getElementById("newExerciseSection").value.trim();
  if (!name || !section || !uid() || !currentMuscleGroup) {
    showToast("⚠️ İsim ve grup gir");
    return;
  }
  const id = "custom_" + name.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_" + Date.now();
  await db.collection("users").doc(uid()).collection("customExercises").add({
    id, name, section, group: currentMuscleGroup, createdAt: Date.now()
  });
  closeAddExercise();
  showToast("✅ Hareket eklendi!");
  renderExercises(currentMuscleGroup);
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
  showToast("🎯 Hedef kaydedildi!");
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

    // WEIGHTS — sadece bu kullanıcının
    const wSnap = await userRef.collection("weights").orderBy("time").get();
    const weights = [];
    wSnap.forEach(d => weights.push(d.data()));

    document.getElementById("todayWeight").textContent =
      weights.length ? weights[weights.length-1].value : "—";

    // GOAL
    const goalSnap = await userRef.collection("settings").doc("goal").get();
    if(goalSnap.exists && goalSnap.data().value !== undefined){
      const goal = goalSnap.data().value;
      document.getElementById("goalDisplay").textContent = goal;
      document.getElementById("goalText").textContent = "Hedef: " + goal + " kg";
      if(weights.length){
        const cur   = weights[weights.length-1].value;
        const first = weights[0].value;
        let pct = 0;
        if(first !== goal) pct = Math.min(100, Math.max(0, ((first-cur)/(first-goal))*100));
        document.getElementById("progressBar").style.width = pct + "%";
      }
    } else {
      document.getElementById("goalDisplay").textContent = "—";
      document.getElementById("goalText").textContent = "Hedef belirlenmedi";
    }

    // LIFTS
    const allTimeSnap = await userRef.collection("lifts").orderBy("time").get();
    const allTimeLifts = [];
    allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

    const ago14 = Date.now() - 14*24*60*60*1000;
    const lSnap = await userRef.collection("lifts").orderBy("time").where("time",">=",ago14).get();
    const recentLifts = [];
    lSnap.forEach(d => recentLifts.push(d.data()));

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
    x:{ ticks:{color:"#333", font:{size:10, family:"Space Grotesk"}}, grid:{color:"rgba(255,255,255,0.03)"} },
    y:{ ticks:{color:"#333", font:{size:10, family:"Space Grotesk"}}, grid:{color:"rgba(255,255,255,0.03)"} }
  }
};

function drawWeightChart(weights){
  const ctx = document.getElementById("weightChart");
  if(!ctx) return;
  if(weightChart) weightChart.destroy();
  weightChart = new Chart(ctx, {
    type:"line",
    data:{ labels:weights.map(w=>w.date), datasets:[{
      data:weights.map(w=>w.value), borderColor:"rgba(255,255,255,0.65)",
      backgroundColor:"rgba(255,255,255,0.03)", tension:0.4,
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
        data:weights.map(w=>w.value), borderColor:"rgba(255,255,255,0.65)",
        backgroundColor:"rgba(255,255,255,0.03)", tension:0.4,
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
        data:bd.map(l=>l.value), borderColor:"rgba(255,255,255,0.65)",
        backgroundColor:"rgba(255,255,255,0.03)", tension:0.4,
        pointRadius:3, pointBackgroundColor:"#fff"
      }]},
      options: chartOpts
    });
  }
}

// ================= STARS =================
function createStars() {
  const container = document.querySelector(".stars");
  if (!container) return;
  for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.top    = Math.random() * 100 + "%";
    star.style.left   = Math.random() * 100 + "%";
    star.style.animationDuration = (1 + Math.random() * 3) + "s";
    star.style.animationDelay    = (Math.random() * 3) + "s";
    star.style.opacity = Math.random() * 0.5;
    container.appendChild(star);
  }
}
createStars();

window.db = db;