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

// ================= THEME =================
function applyTheme(mode) {
  if (mode === "light") {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }
  localStorage.setItem("fpm_theme", mode);
}

window.toggleTheme = function() {
  const current = localStorage.getItem("fpm_theme") || "dark";
  applyTheme(current === "dark" ? "light" : "dark");
};

applyTheme(localStorage.getItem("fpm_theme") || "dark");

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
  if (page === "kalori") {
    renderFoods();
    loadMealLog();
    loadCalorieSetting();
  }
  if (page === "ai") {
    loadAiMealLog();
    loadCalorieSetting();
  }
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

async function getHiddenDefaults() {
  if (!uid()) return [];
  try {
    const snap = await db.collection("users").doc(uid()).collection("hiddenDefaults").get();
    const ids = [];
    snap.forEach(d => ids.push(d.id));
    return ids;
  } catch(e) { return []; }
}

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

window.deleteExercise = async function(exerciseId, group, isCustom) {
  if (!uid()) return;
  if (isCustom) {
    const snap = await db.collection("users").doc(uid()).collection("customExercises")
      .where("id","==",exerciseId).get();
    const batch = db.batch();
    snap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } else {
    await db.collection("users").doc(uid()).collection("hiddenDefaults").doc(exerciseId).set({ hidden: true });
  }
  showToast("🗑️ Hareket kaldırıldı");
  renderExercises(group);
};

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

    const wSnap = await userRef.collection("weights").orderBy("time").get();
    const weights = [];
    wSnap.forEach(d => weights.push(d.data()));

    document.getElementById("todayWeight").textContent =
      weights.length ? weights[weights.length-1].value : "—";

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

    const allTimeSnap = await userRef.collection("lifts").orderBy("time").get();
    const allTimeLifts = [];
    allTimeSnap.forEach(d => allTimeLifts.push(d.data()));

    const ago14 = Date.now() - 14*24*60*60*1000;
    const lSnap = await userRef.collection("lifts").orderBy("time").where("time",">=",ago14).get();
    const recentLifts = [];
    lSnap.forEach(d => recentLifts.push(d.data()));

    const benchAll = allTimeLifts.filter(l => l.type === "smith_low_incline_press");
    const benchMax = benchAll.length ? Math.max(...benchAll.map(e => e.value)) : 0;
    document.getElementById("benchMax").textContent = benchMax ? benchMax + " kg" : "—";

    updateStreak(weights);
    drawWeightChart(weights);
    drawStatsCharts(weights, recentLifts);

    loadCalorieSetting();
    loadHomeAiSummary();

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

function getChartOpts() {
  const isLight = document.body.classList.contains("light-mode");
  const tickColor = isLight ? "#999" : "#333";
  const gridColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)";
  return {
    plugins:{ legend:{display:false} },
    scales:{
      x:{ ticks:{color:tickColor, font:{size:10, family:"Space Grotesk"}}, grid:{color:gridColor} },
      y:{ ticks:{color:tickColor, font:{size:10, family:"Space Grotesk"}}, grid:{color:gridColor} }
    }
  };
}

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
    options: getChartOpts()
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
      options: getChartOpts()
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
      options: getChartOpts()
    });
  }
}

// ================= KALORİ HESAPLAMA =================
let selectedGender   = "male";
let selectedActivity = 1.55;
let lastCalcTDEE     = 0;
let savedDailyGoal   = 0;

window.selectGender = function(g) {
  selectedGender = g;
  document.getElementById("genderMale").classList.toggle("active",   g === "male");
  document.getElementById("genderFemale").classList.toggle("active", g === "female");
};

window.selectActivity = function(btn) {
  document.querySelectorAll(".activity-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedActivity = parseFloat(btn.dataset.val);
};

window.calcCalories = function() {
  const age    = parseInt(document.getElementById("calAge").value);
  const height = parseInt(document.getElementById("calHeight").value);
  const weight = parseInt(document.getElementById("calWeight").value);

  if (!age || !height || !weight) { showToast("⚠️ Yaş, boy ve kilo gir"); return; }

  let bmr;
  if (selectedGender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = Math.round(bmr * selectedActivity);
  lastCalcTDEE = tdee;

  document.getElementById("calLose").textContent = (tdee - 500).toLocaleString("tr-TR");
  document.getElementById("calKeep").textContent = tdee.toLocaleString("tr-TR");
  document.getElementById("calGain").textContent = (tdee + 500).toLocaleString("tr-TR");

  document.getElementById("calResult").classList.remove("hidden");
};

window.saveCalorieGoal = async function(type) {
  if (!lastCalcTDEE) { showToast("⚠️ Önce hesapla"); return; }
  const map = { lose: lastCalcTDEE - 500, keep: lastCalcTDEE, gain: lastCalcTDEE + 500 };
  const labelMap = { lose: "Zayıflama", keep: "Koruma", gain: "Kilo alma" };
  const val = map[type];

  if (uid()) {
    const age    = parseInt(document.getElementById("calAge").value);
    const height = parseInt(document.getElementById("calHeight").value);
    const weight = parseInt(document.getElementById("calWeight").value);
    await db.collection("users").doc(uid()).collection("settings").doc("calories").set({
      value: val, gender: selectedGender, age, height, weight,
      activity: selectedActivity, goalType: type, updatedAt: Date.now()
    });
  }

  savedDailyGoal = val;
  const dispEl = document.getElementById("dailyCalDisplay");
  if (dispEl) dispEl.textContent = val.toLocaleString("tr-TR");

  showToast("🔥 " + labelMap[type] + " modu: " + val.toLocaleString("tr-TR") + " kcal/gün");
  updateAiSummaryDisplay();
};

async function loadCalorieSetting() {
  if (!uid()) return;
  try {
    const snap = await db.collection("users").doc(uid()).collection("settings").doc("calories").get();
    if (snap.exists && snap.data().value) {
      const d = snap.data();
      savedDailyGoal = d.value;
      const dispEl = document.getElementById("dailyCalDisplay");
      if (dispEl) dispEl.textContent = d.value.toLocaleString("tr-TR");

      const ageEl = document.getElementById("calAge");
      if (ageEl && d.age) ageEl.value = d.age;
      const htEl = document.getElementById("calHeight");
      if (htEl && d.height) htEl.value = d.height;
      const wtEl = document.getElementById("calWeight");
      if (wtEl && d.weight) wtEl.value = d.weight;
      if (d.gender) selectGender(d.gender);
      if (d.activity) {
        selectedActivity = d.activity;
        document.querySelectorAll(".activity-btn").forEach(b => {
          b.classList.toggle("active", parseFloat(b.dataset.val) === d.activity);
        });
      }
      if (d.age && d.height && d.weight) {
        lastCalcTDEE = Math.round(d.value + (d.goalType === "lose" ? 500 : d.goalType === "gain" ? -500 : 0));
        document.getElementById("calLose") && (document.getElementById("calLose").textContent = (lastCalcTDEE - 500).toLocaleString("tr-TR"));
        document.getElementById("calKeep") && (document.getElementById("calKeep").textContent = lastCalcTDEE.toLocaleString("tr-TR"));
        document.getElementById("calGain") && (document.getElementById("calGain").textContent = (lastCalcTDEE + 500).toLocaleString("tr-TR"));
        const resEl = document.getElementById("calResult");
        if (resEl) resEl.classList.remove("hidden");
      }
    }
  } catch(e) { console.error("cal setting load err", e); }
}

// ================= YEMEK VERİTABANI =================
const FOODS = [
  { name:"Beyaz pilav",             unit:"100g",               kcal:130,  baseGram:100, cat:"Karbonhidrat" },
  { name:"Esmer pilav",             unit:"100g",               kcal:110,  baseGram:100, cat:"Karbonhidrat" },
  { name:"Makarna (haşlanmış)",     unit:"100g",               kcal:131,  baseGram:100, cat:"Karbonhidrat" },
  { name:"Ekmek",                   unit:"1 dilim (30g)",       kcal:80,   baseGram:30,  cat:"Karbonhidrat" },
  { name:"Yulaf ezmesi",            unit:"100g",               kcal:68,   baseGram:100, cat:"Karbonhidrat" },
  { name:"Tatlı patates",           unit:"100g",               kcal:86,   baseGram:100, cat:"Karbonhidrat" },
  { name:"Patates (haşlanmış)",     unit:"100g",               kcal:77,   baseGram:100, cat:"Karbonhidrat" },
  { name:"Muz",                     unit:"1 orta (120g)",       kcal:107,  baseGram:120, cat:"Karbonhidrat" },
  { name:"Tavuk göğsü",             unit:"100g",               kcal:165,  baseGram:100, cat:"Protein" },
  { name:"Tavuk but (derisiz)",     unit:"100g",               kcal:177,  baseGram:100, cat:"Protein" },
  { name:"Kırmızı et (dana)",       unit:"100g",               kcal:250,  baseGram:100, cat:"Protein" },
  { name:"Ton balığı (konserve)",   unit:"100g",               kcal:116,  baseGram:100, cat:"Protein" },
  { name:"Somon",                   unit:"100g",               kcal:208,  baseGram:100, cat:"Protein" },
  { name:"Yumurta",                 unit:"1 adet (50g)",        kcal:70,   baseGram:50,  cat:"Protein" },
  { name:"Yumurta akı",             unit:"1 adet (33g)",        kcal:17,   baseGram:33,  cat:"Protein" },
  { name:"Süzme peynir (lor)",      unit:"100g",               kcal:98,   baseGram:100, cat:"Protein" },
  { name:"Kuru fasulye (pişmiş)",   unit:"100g",               kcal:127,  baseGram:100, cat:"Protein" },
  { name:"Nohut (pişmiş)",          unit:"100g",               kcal:164,  baseGram:100, cat:"Protein" },
  { name:"Yağlı süt (%3.5)",        unit:"100ml",              kcal:62,   baseGram:100, cat:"Süt Ürünleri" },
  { name:"Yağsız süt",              unit:"100ml",              kcal:34,   baseGram:100, cat:"Süt Ürünleri" },
  { name:"Yoğurt (sade)",           unit:"100g",               kcal:61,   baseGram:100, cat:"Süt Ürünleri" },
  { name:"Süzme yoğurt",            unit:"100g",               kcal:97,   baseGram:100, cat:"Süt Ürünleri" },
  { name:"Beyaz peynir",            unit:"30g",                kcal:75,   baseGram:30,  cat:"Süt Ürünleri" },
  { name:"Whey protein tozu",       unit:"30g (1 ölçek)",       kcal:120,  baseGram:30,  cat:"Süt Ürünleri" },
  { name:"Zeytinyağı",              unit:"14g (1 yk)",          kcal:119,  baseGram:14,  cat:"Sağlıklı Yağ" },
  { name:"Fıstık ezmesi",           unit:"32g (2 yk)",          kcal:190,  baseGram:32,  cat:"Sağlıklı Yağ" },
  { name:"Badem",                   unit:"30g",                kcal:174,  baseGram:30,  cat:"Sağlıklı Yağ" },
  { name:"Avokado",                 unit:"75g (yarım)",         kcal:120,  baseGram:75,  cat:"Sağlıklı Yağ" },
  { name:"Brokoli",                 unit:"100g",               kcal:34,   baseGram:100, cat:"Sebze" },
  { name:"Ispanak",                 unit:"100g",               kcal:23,   baseGram:100, cat:"Sebze" },
  { name:"Salatalık",               unit:"100g",               kcal:15,   baseGram:100, cat:"Sebze" },
  { name:"Domates",                 unit:"100g",               kcal:18,   baseGram:100, cat:"Sebze" },
];

let mealLog = [];

function renderFoods(filter) {
  const container = document.getElementById("foodList");
  if (!container) return;

  const lower = (filter || "").toLowerCase();
  const filtered = lower
    ? FOODS.filter(f => f.name.toLowerCase().includes(lower) || f.cat.toLowerCase().includes(lower))
    : FOODS;

  const cats = {};
  filtered.forEach(f => {
    if (!cats[f.cat]) cats[f.cat] = [];
    cats[f.cat].push(f);
  });

  let html = "";
  for (const [cat, foods] of Object.entries(cats)) {
    html += `<div class="exercise-section-label">${cat}</div>`;
    foods.forEach(f => {
      const idx = FOODS.indexOf(f);
      html += `
        <div class="food-item">
          <div class="food-item-left">
            <div class="food-item-name">${f.name}</div>
            <div class="food-item-sub">${f.unit} = ${f.kcal} kcal</div>
          </div>
          <input class="food-gram-input" id="foodGram_${idx}" type="number" value="${f.baseGram}" title="gram">
          <div class="food-item-kcal" id="foodKcal_${idx}">${f.kcal} kcal</div>
          <button class="food-add-btn" onclick="addToMealLog(${idx})">+ Ekle</button>
        </div>`;
    });
  }

  if (!filtered.length) {
    html = `<div style="color:#555;font-size:13px;text-align:center;padding:20px 0">Sonuç bulunamadı.</div>`;
  }

  container.innerHTML = html;

  filtered.forEach(f => {
    const idx = FOODS.indexOf(f);
    const gramInput = document.getElementById("foodGram_" + idx);
    const kcalEl    = document.getElementById("foodKcal_" + idx);
    if (gramInput && kcalEl) {
      gramInput.addEventListener("input", () => {
        const g = parseFloat(gramInput.value) || 0;
        const kcal = Math.round((f.kcal / f.baseGram) * g);
        kcalEl.textContent = kcal + " kcal";
      });
    }
  });
}

window.filterFoods = function() {
  const val = document.getElementById("foodSearchInput")?.value || "";
  renderFoods(val);
};

window.addToMealLog = function(foodIdx) {
  const food = FOODS[foodIdx];
  if (!food) return;
  const gramInput = document.getElementById("foodGram_" + foodIdx);
  const grams = (gramInput && parseFloat(gramInput.value)) || food.baseGram;
  const kcal  = Math.round((food.kcal / food.baseGram) * grams);

  mealLog.push({ name: food.name, kcal, grams });
  renderMealLog();
  showToast("✅ " + food.name + " (" + grams + "g) eklendi");
  saveMealLog();
};

function renderMealLog() {
  const container = document.getElementById("mealLog");
  const totalEl   = document.getElementById("mealTotal");
  if (!container) return;

  if (!mealLog.length) {
    container.innerHTML = `<div style="color:#444;font-size:12px;text-align:center;padding:14px 0">Henüz eklenmedi.</div>`;
    if (totalEl) totalEl.textContent = "0 kcal";
    return;
  }

  let total = 0;
  let html  = "";
  mealLog.forEach((item, i) => {
    total += item.kcal;
    html += `
      <div class="meal-log-item">
        <span class="meal-log-name">${item.name}${item.grams ? ` <span style="color:var(--text-sub);font-size:10px">(${item.grams}g)</span>` : ""}</span>
        <div class="meal-log-right">
          <span class="meal-log-kcal">${item.kcal} kcal</span>
          <button class="meal-remove-btn" onclick="removeMealItem(${i})">✕</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = total.toLocaleString("tr-TR") + " kcal";
}

window.removeMealItem = function(idx) {
  mealLog.splice(idx, 1);
  renderMealLog();
  saveMealLog();
};

async function saveMealLog() {
  if (!uid()) return;
  await db.collection("users").doc(uid()).collection("mealLogs").doc(today()).set({
    items: mealLog, date: today(), updatedAt: Date.now()
  });
}

async function loadMealLog() {
  if (!uid()) return;
  try {
    const snap = await db.collection("users").doc(uid()).collection("mealLogs").doc(today()).get();
    mealLog = (snap.exists && snap.data().items) ? snap.data().items : [];
    renderMealLog();
  } catch(e) { mealLog = []; renderMealLog(); }
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

// ═══════════════════════════════════════════════════════
//  AI KALORİ SİSTEMİ
// ═══════════════════════════════════════════════════════

let aiMealLog = [];      // Bugünkü AI ile eklenen öğünler
let lastAiResult = null; // Son AI analiz sonucu (henüz eklenmemiş)

// --- Ana ekrandaki AI özet kartını güncelle ---
async function loadHomeAiSummary() {
  if (!uid()) return;
  try {
    const snap = await db.collection("users").doc(uid()).collection("aiMealLogs").doc(today()).get();
    const items = (snap.exists && snap.data().items) ? snap.data().items : [];

    const total = items.reduce((s, i) => s + i.kcal, 0);
    const el = document.getElementById("homeTodayKcal");
    if (el) el.textContent = total.toLocaleString("tr-TR") + " kcal";

    // Hedef bar
    const goal = savedDailyGoal;
    const barEl = document.getElementById("homeGoalBar");
    const goalTxt = document.getElementById("homeGoalText");
    if (barEl) barEl.style.width = (goal ? Math.min(100, (total / goal) * 100) : 0) + "%";
    if (goalTxt) goalTxt.textContent = goal ? "Hedef: " + goal.toLocaleString("tr-TR") + " kcal" : "Hedef belirlenmedi";

    // Son 3 öğün pill
    const pillsEl = document.getElementById("homeAiMeals");
    if (pillsEl) {
      const last3 = items.slice(-3);
      if (last3.length) {
        pillsEl.innerHTML = last3.map(i =>
          `<span class="ai-today-pill">${i.name} · ${i.kcal} kcal</span>`
        ).join("");
      } else {
        pillsEl.innerHTML = `<span style="color:var(--text-sub);font-size:11px">Henüz öğün eklenmedi</span>`;
      }
    }
  } catch(e) { console.error("homeAiSummary err", e); }
}

// --- AI Kalori sayfasını güncelle ---
function updateAiSummaryDisplay() {
  const total = aiMealLog.reduce((s, i) => s + i.kcal, 0);
  const goal  = savedDailyGoal;

  const totalEl = document.getElementById("aiTodayTotal");
  if (totalEl) totalEl.textContent = total.toLocaleString("tr-TR");

  const goalEl = document.getElementById("aiGoalKcal");
  if (goalEl) goalEl.textContent = goal ? goal.toLocaleString("tr-TR") : "—";

  const remEl = document.getElementById("aiRemaining");
  if (remEl) {
    const rem = goal ? goal - total : null;
    remEl.textContent = rem !== null ? Math.abs(rem).toLocaleString("tr-TR") : "—";
    remEl.classList.toggle("over", rem !== null && rem < 0);
  }

  const pct = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0;
  const barEl = document.getElementById("aiDailyBar");
  if (barEl) {
    barEl.style.width = pct + "%";
    barEl.classList.toggle("over", goal && total > goal);
  }
  const pctEl = document.getElementById("aiDailyPct");
  if (pctEl) pctEl.textContent = pct + "%";

  // Makrolar
  const totalProtein = aiMealLog.reduce((s, i) => s + (i.protein || 0), 0);
  const totalCarb    = aiMealLog.reduce((s, i) => s + (i.carb || 0), 0);
  const totalFat     = aiMealLog.reduce((s, i) => s + (i.fat || 0), 0);

  const macroCard = document.getElementById("aiMacroCard");
  if (macroCard) {
    if (totalProtein || totalCarb || totalFat) {
      macroCard.style.display = "block";
      document.getElementById("macroProtein").textContent = Math.round(totalProtein) + "g";
      document.getElementById("macroCarb").textContent    = Math.round(totalCarb) + "g";
      document.getElementById("macroFat").textContent     = Math.round(totalFat) + "g";
    } else {
      macroCard.style.display = "none";
    }
  }
}

// --- AI Öğün Logunu Render Et ---
function renderAiMealLog() {
  const container = document.getElementById("aiMealLog");
  const totalEl   = document.getElementById("aiMealTotal");
  if (!container) return;

  if (!aiMealLog.length) {
    container.innerHTML = `<div style="color:#444;font-size:12px;text-align:center;padding:16px 0">Henüz öğün eklenmedi.<br><span style="font-size:10px;color:#333">Yukarıdan AI ile analiz et</span></div>`;
    if (totalEl) totalEl.textContent = "0 kcal";
    updateAiSummaryDisplay();
    return;
  }

  let total = 0;
  let html  = "";
  aiMealLog.forEach((item, i) => {
    total += item.kcal;
    const macroStr = (item.protein || item.carb || item.fat)
      ? ` <span style="color:var(--text-sub);font-size:10px">P:${Math.round(item.protein||0)}g K:${Math.round(item.carb||0)}g Y:${Math.round(item.fat||0)}g</span>`
      : "";
    html += `
      <div class="meal-log-item">
        <span class="meal-log-name">${item.name}${macroStr}</span>
        <div class="meal-log-right">
          <span class="meal-log-kcal">${item.kcal} kcal</span>
          <button class="ai-meal-remove-btn" onclick="removeAiMealItem(${i})">✕</button>
        </div>
      </div>`;
  });

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = total.toLocaleString("tr-TR") + " kcal";
  updateAiSummaryDisplay();
}

window.removeAiMealItem = function(idx) {
  aiMealLog.splice(idx, 1);
  renderAiMealLog();
  saveAiMealLog();
  loadHomeAiSummary();
};

async function saveAiMealLog() {
  if (!uid()) return;
  await db.collection("users").doc(uid()).collection("aiMealLogs").doc(today()).set({
    items: aiMealLog, date: today(), updatedAt: Date.now()
  });
}

async function loadAiMealLog() {
  if (!uid()) return;
  try {
    const snap = await db.collection("users").doc(uid()).collection("aiMealLogs").doc(today()).get();
    aiMealLog = (snap.exists && snap.data().items) ? snap.data().items : [];
    renderAiMealLog();
  } catch(e) { aiMealLog = []; renderAiMealLog(); }
}

// --- Mevcut öğünleri listeye ekle ---
window.addAiResultToLog = function() {
  if (!lastAiResult || !lastAiResult.items || !lastAiResult.items.length) return;

  lastAiResult.items.forEach(item => {
    aiMealLog.push({
      name:    item.name,
      kcal:    item.kcal,
      protein: item.protein || 0,
      carb:    item.carb    || 0,
      fat:     item.fat     || 0,
      addedAt: Date.now()
    });
  });

  saveAiMealLog();
  renderAiMealLog();
  loadHomeAiSummary();

  // Giriş ve sonuç temizle
  const inp = document.getElementById("aiMealInput");
  if (inp) inp.value = "";
  const res = document.getElementById("aiResult");
  if (res) res.classList.add("hidden");
  lastAiResult = null;

  showToast("✅ Öğün listeye eklendi!");
};

// ═══════════════════════════════════════════════════
//  AKILLI KALORİ MOTORU — 200+ yiyecek, offline çalışır
// ═══════════════════════════════════════════════════

// Her kayıt: [anahtar kelimeler, kcal/100g, protein/100g, karb/100g, yağ/100g, varsayılan porsiyon(g), porsiyon adı]
const CALORIE_DB = [
  // YUMURTA & SÜTSÜZ PROTEİN
  { keys:["yumurta","egg"],                    kcal:5000, p:5, c:1, f:11, def:50,  unit:"adet" },
  { keys:["yumurta akı","egg white","beyaz"],  kcal:52,  p:11, c:0.7, f:0.2,def:33, unit:"adet" },
  { keys:["haşlanmış yumurta"],                kcal:155, p:13, c:1.1, f:11, def:50,  unit:"adet" },
  { keys:["sahanda yumurta","omlet","omelet"],  kcal:185, p:12, c:1,   f:15, def:100, unit:"porsiyon" },
  { keys:["menemen"],                           kcal:120, p:7,  c:5,   f:8,  def:200, unit:"porsiyon" },

  // TAVUK
  { keys:["tavuk göğsü","chicken breast","tavuk gogsu"], kcal:165, p:31, c:0,  f:3.6, def:150, unit:"porsiyon" },
  { keys:["tavuk but","chicken thigh","but"],            kcal:209, p:26, c:0,  f:11,  def:150, unit:"porsiyon" },
  { keys:["tavuk kanat","kanat","wing"],                 kcal:203, p:19, c:0,  f:14,  def:100, unit:"porsiyon" },
  { keys:["ızgara tavuk","grilled chicken"],             kcal:165, p:31, c:0,  f:3.6, def:150, unit:"porsiyon" },
  { keys:["tavuk döner","döner"],                        kcal:220, p:22, c:5,  f:12,  def:150, unit:"porsiyon" },
  { keys:["tavuk şiş","şiş"],                           kcal:185, p:28, c:2,  f:7,   def:150, unit:"porsiyon" },
  { keys:["nugget","tavuk nugget"],                      kcal:297, p:14, c:17, f:19,  def:100, unit:"porsiyon" },
  { keys:["tavuk çorbası"],                              kcal:55,  p:5,  c:5,  f:2,   def:250, unit:"kase" },

  // KIRMIZI ET
  { keys:["köfte","meatball"],                  kcal:280, p:20, c:5,  f:20, def:150, unit:"porsiyon" },
  { keys:["biftek","steak","et"],               kcal:250, p:26, c:0,  f:17, def:150, unit:"porsiyon" },
  { keys:["dana","dana eti","beef"],             kcal:250, p:26, c:0,  f:17, def:150, unit:"porsiyon" },
  { keys:["kıyma","minced","ground beef"],       kcal:260, p:25, c:0,  f:18, def:100, unit:"porsiyon" },
  { keys:["kuzu","lamb","kuzu eti"],             kcal:294, p:25, c:0,  f:21, def:150, unit:"porsiyon" },
  { keys:["sucuk"],                              kcal:450, p:18, c:2,  f:41, def:30,  unit:"dilim" },
  { keys:["sosis","sausage"],                    kcal:300, p:12, c:3,  f:27, def:50,  unit:"adet" },
  { keys:["pastırma"],                           kcal:380, p:30, c:0,  f:29, def:30,  unit:"porsiyon" },
  { keys:["şiş kebap","kebap","kebab"],          kcal:220, p:25, c:3,  f:12, def:150, unit:"porsiyon" },

  // BALIK & DENİZ ÜRÜNLERİ
  { keys:["somon","salmon"],                     kcal:208, p:20, c:0,  f:13, def:150, unit:"porsiyon" },
  { keys:["ton balığı","tuna","ton"],            kcal:116, p:26, c:0,  f:1,  def:100, unit:"porsiyon" },
  { keys:["levrek","sea bass"],                  kcal:124, p:24, c:0,  f:3,  def:150, unit:"porsiyon" },
  { keys:["çipura","sea bream"],                 kcal:115, p:21, c:0,  f:3,  def:150, unit:"porsiyon" },
  { keys:["hamsi","anchovy"],                    kcal:131, p:20, c:0,  f:5,  def:100, unit:"porsiyon" },
  { keys:["karides","shrimp","prawn"],           kcal:99,  p:24, c:0.2,f:0.3,def:100, unit:"porsiyon" },
  { keys:["balık","fish"],                       kcal:130, p:22, c:0,  f:4,  def:150, unit:"porsiyon" },
  { keys:["midye","mussel"],                     kcal:86,  p:12, c:4,  f:2,  def:100, unit:"porsiyon" },

  // PİLAV & TAHILLAR
  { keys:["beyaz pilav","pilav","rice","pirinç"],kcal:130, p:2.7,c:28, f:0.3,def:150, unit:"porsiyon" },
  { keys:["esmer pilav","brown rice","esmer"],   kcal:112, p:2.6,c:23, f:0.9,def:150, unit:"porsiyon" },
  { keys:["bulgur","bulgur pilavı"],             kcal:83,  p:3,  c:19, f:0.2,def:150, unit:"porsiyon" },
  { keys:["makarna","pasta","spagetti","penne"], kcal:131, p:5,  c:25, f:1.1,def:200, unit:"porsiyon" },
  { keys:["erişte","noodle"],                    kcal:138, p:4.5,c:27, f:1.5,def:150, unit:"porsiyon" },
  { keys:["yulaf","oat","yulaf ezmesi"],         kcal:389, p:17, c:66, f:7,  def:40,  unit:"porsiyon" },
  { keys:["müsli","granola"],                    kcal:380, p:10, c:65, f:9,  def:50,  unit:"porsiyon" },
  { keys:["mısır","corn","mısır gevreği"],       kcal:86,  p:3.2,c:19, f:1.2,def:100, unit:"porsiyon" },
  { keys:["kinoa","quinoa"],                     kcal:120, p:4.4,c:21, f:2,  def:150, unit:"porsiyon" },

  // EKMEK & HAMURLU
  { keys:["ekmek","bread","somun"],              kcal:265, p:9,  c:49, f:3.2,def:30,  unit:"dilim" },
  { keys:["tam buğday ekmek","tam buğday","whole wheat"], kcal:247,p:13,c:41,f:4,def:30,"unit":"dilim"},
  { keys:["tost","toast"],                       kcal:265, p:9,  c:49, f:3.2,def:60,  unit:"porsiyon" },
  { keys:["simit"],                              kcal:275, p:9,  c:55, f:2,  def:80,  unit:"adet" },
  { keys:["poğaça"],                             kcal:330, p:7,  c:42, f:15, def:80,  unit:"adet" },
  { keys:["börek","su böreği","ıspanak böreği"], kcal:280, p:10, c:28, f:15, def:100, unit:"dilim" },
  { keys:["gözleme"],                            kcal:240, p:8,  c:32, f:9,  def:150, unit:"adet" },
  { keys:["lahmacun"],                           kcal:222, p:12, c:28, f:7,  def:160, unit:"adet" },
  { keys:["pide","pide ekmek"],                  kcal:260, p:8,  c:50, f:3,  def:100, unit:"dilim" },
  { keys:["pizza"],                              kcal:266, p:11, c:33, f:10, def:150, unit:"dilim" },
  { keys:["hamburger","burger"],                 kcal:295, p:17, c:24, f:14, def:200, unit:"adet" },
  { keys:["sandviç","sandwich"],                 kcal:250, p:12, c:30, f:9,  def:150, unit:"adet" },
  { keys:["dürüm","wrap"],                       kcal:230, p:14, c:28, f:8,  def:150, unit:"adet" },
  { keys:["pankek","pancake","krep"],            kcal:227, p:6,  c:40, f:6,  def:100, unit:"porsiyon" },
  { keys:["waffle"],                             kcal:290, p:8,  c:37, f:13, def:100, unit:"adet" },

  // PATATES
  { keys:["patates","potato"],                   kcal:77,  p:2,  c:17, f:0.1,def:150, unit:"porsiyon" },
  { keys:["haşlanmış patates"],                  kcal:77,  p:2,  c:17, f:0.1,def:150, unit:"porsiyon" },
  { keys:["patates kızartması","kızartma","french fries","fries"], kcal:312,p:3.4,c:41,f:15,def:150,"unit":"porsiyon"},
  { keys:["tatlı patates","sweet potato"],       kcal:86,  p:1.6,c:20, f:0.1,def:150, unit:"porsiyon" },
  { keys:["patates cipsi","cips","chips"],       kcal:536, p:7,  c:53, f:35, def:30,  unit:"porsiyon" },

  // SEBZELİ YEMEKLER
  { keys:["mercimek çorbası","mercimek"],        kcal:116, p:8,  c:20, f:1,  def:250, unit:"kase" },
  { keys:["domates çorbası"],                    kcal:45,  p:1.5,c:8,  f:1,  def:250, unit:"kase" },
  { keys:["ezogelin çorbası","ezogelin"],        kcal:80,  p:4,  c:14, f:1,  def:250, unit:"kase" },
  { keys:["çorba","soup"],                       kcal:65,  p:3,  c:10, f:1.5,def:250, unit:"kase" },
  { keys:["kuru fasulye","fasulye","kidney bean"],kcal:127,p:9,  c:23, f:0.5,def:200, unit:"porsiyon" },
  { keys:["nohut","chickpea","humus","hummus"],  kcal:164, p:9,  c:27, f:2.6,def:200, unit:"porsiyon" },
  { keys:["mercimek"],                           kcal:116, p:9,  c:20, f:0.4,def:200, unit:"porsiyon" },
  { keys:["türlü","sebze yemeği","sebze"],       kcal:70,  p:2,  c:12, f:2,  def:200, unit:"porsiyon" },
  { keys:["zeytinyağlı","zeytinyağlı sebze"],    kcal:90,  p:2,  c:10, f:5,  def:200, unit:"porsiyon" },
  { keys:["patlıcan","eggplant"],                kcal:25,  p:1,  c:6,  f:0.2,def:100, unit:"porsiyon" },
  { keys:["brokoli","broccoli"],                 kcal:34,  p:2.8,c:7,  f:0.4,def:100, unit:"porsiyon" },
  { keys:["karnabahar","cauliflower"],           kcal:25,  p:2,  c:5,  f:0.3,def:100, unit:"porsiyon" },
  { keys:["ıspanak","spinach"],                  kcal:23,  p:2.9,c:3.6,f:0.4,def:100, unit:"porsiyon" },
  { keys:["salatalık","cucumber"],               kcal:15,  p:0.7,c:3.6,f:0.1,def:100, unit:"porsiyon" },
  { keys:["domates","tomato"],                   kcal:18,  p:0.9,c:3.9,f:0.2,def:100, unit:"porsiyon" },
  { keys:["marul","lettuce","salata"],           kcal:15,  p:1.4,c:2.9,f:0.2,def:100, unit:"porsiyon" },
  { keys:["havuç","carrot"],                     kcal:41,  p:0.9,c:10, f:0.2,def:100, unit:"porsiyon" },
  { keys:["kabak","zucchini","courgette"],       kcal:17,  p:1.2,c:3.1,f:0.3,def:100, unit:"porsiyon" },
  { keys:["biber","pepper","dolma biber"],       kcal:31,  p:1,  c:7,  f:0.3,def:100, unit:"porsiyon" },
  { keys:["soğan","onion"],                      kcal:40,  p:1.1,c:9,  f:0.1,def:50,  unit:"porsiyon" },
  { keys:["sarımsak","garlic"],                  kcal:149, p:6.4,c:33, f:0.5,def:5,   unit:"diş" },
  { keys:["mantar","mushroom"],                  kcal:22,  p:3.1,c:3.3,f:0.3,def:100, unit:"porsiyon" },
  { keys:["mısır"],                              kcal:86,  p:3.2,c:19, f:1.2,def:100, unit:"porsiyon" },

  // MEYVE
  { keys:["muz","banana"],                       kcal:89,  p:1.1,c:23, f:0.3,def:120, unit:"adet" },
  { keys:["elma","apple"],                       kcal:52,  p:0.3,c:14, f:0.2,def:150, unit:"adet" },
  { keys:["armut","pear"],                       kcal:57,  p:0.4,c:15, f:0.1,def:150, unit:"adet" },
  { keys:["portakal","orange"],                  kcal:47,  p:0.9,c:12, f:0.1,def:150, unit:"adet" },
  { keys:["mandalina","tangerine"],              kcal:53,  p:0.8,c:13, f:0.3,def:75,  unit:"adet" },
  { keys:["üzüm","grape"],                       kcal:69,  p:0.7,c:18, f:0.2,def:100, unit:"porsiyon" },
  { keys:["çilek","strawberry"],                 kcal:32,  p:0.7,c:7.7,f:0.3,def:100, unit:"porsiyon" },
  { keys:["karpuz","watermelon"],                kcal:30,  p:0.6,c:7.5,f:0.2,def:300, unit:"dilim" },
  { keys:["kavun","melon"],                      kcal:34,  p:0.8,c:8,  f:0.2,def:200, unit:"dilim" },
  { keys:["kivi","kiwi"],                        kcal:61,  p:1.1,c:15, f:0.5,def:75,  unit:"adet" },
  { keys:["ananas","pineapple"],                 kcal:50,  p:0.5,c:13, f:0.1,def:100, unit:"porsiyon" },
  { keys:["mango"],                              kcal:60,  p:0.8,c:15, f:0.4,def:150, unit:"porsiyon" },
  { keys:["şeftali","peach"],                    kcal:39,  p:0.9,c:10, f:0.3,def:150, unit:"adet" },
  { keys:["kayısı","apricot"],                   kcal:48,  p:1.4,c:11, f:0.4,def:50,  unit:"adet" },
  { keys:["erik","plum"],                        kcal:46,  p:0.7,c:11, f:0.3,def:66,  unit:"adet" },
  { keys:["kiraz","cherry"],                     kcal:50,  p:1,  c:12, f:0.3,def:100, unit:"porsiyon" },
  { keys:["incir","fig"],                        kcal:74,  p:0.8,c:19, f:0.3,def:50,  unit:"adet" },
  { keys:["hurma","date"],                       kcal:282, p:2.5,c:75, f:0.4,def:24,  unit:"adet" },
  { keys:["avokado","avocado"],                  kcal:160, p:2,  c:9,  f:15, def:75,  unit:"yarım" },

  // SÜT ÜRÜNLERİ
  { keys:["süt","milk","tam yağlı süt"],         kcal:61,  p:3.2,c:4.8,f:3.3,def:200, unit:"bardak" },
  { keys:["yağsız süt","az yağlı süt","light süt"],kcal:34,p:3.4,c:5, f:0.1,def:200, unit:"bardak" },
  { keys:["yoğurt","yogurt","sade yoğurt"],      kcal:61,  p:3.5,c:4.7,f:3.3,def:150, unit:"porsiyon" },
  { keys:["süzme yoğurt","greek yogurt","greek yoğurt","skyr"], kcal:97,p:9,c:4,f:5,def:150,"unit":"porsiyon"},
  { keys:["ayran"],                              kcal:37,  p:1.7,c:5,  f:1,  def:200, unit:"bardak" },
  { keys:["kefir"],                              kcal:61,  p:3.4,c:4.7,f:3.5,def:200, unit:"bardak" },
  { keys:["beyaz peynir","feta"],                kcal:264, p:14, c:4,  f:21, def:30,  unit:"dilim" },
  { keys:["kaşar","kaşar peyniri","cheddar"],    kcal:403, p:25, c:1.3,f:33, def:20,  unit:"dilim" },
  { keys:["lor peyniri","süzme peynir","cottage"],kcal:98, p:11, c:3.4,f:4.3,def:100, unit:"porsiyon"},
  { keys:["ricotta"],                            kcal:174, p:11, c:3,  f:13, def:100, unit:"porsiyon" },
  { keys:["mozzarella"],                         kcal:280, p:28, c:2.2,f:17, def:30,  unit:"dilim" },
  { keys:["tereyağı","butter"],                  kcal:717, p:0.9,c:0.1,f:81, def:10,  unit:"porsiyon" },
  { keys:["margarin"],                           kcal:720, p:0.2,c:0.7,f:80, def:10,  unit:"porsiyon" },
  { keys:["krema","cream"],                      kcal:340, p:2.1,c:2.8,f:36, def:30,  unit:"porsiyon" },
  { keys:["whey","protein tozu","protein shake"], kcal:120,p:24, c:3,  f:2,  def:30,  unit:"ölçek" },
  { keys:["dondurma","ice cream"],               kcal:207, p:3.5,c:24, f:11, def:100, unit:"porsiyon" },

  // KURUYEMİŞ & TOHUMLAR
  { keys:["badem","almond"],                     kcal:579, p:21, c:22, f:50, def:28,  unit:"avuç" },
  { keys:["ceviz","walnut"],                     kcal:654, p:15, c:14, f:65, def:28,  unit:"avuç" },
  { keys:["fıstık","peanut","fıstık ezmesi","peanut butter"],kcal:567,p:26,c:16,f:49,def:30,"unit":"porsiyon"},
  { keys:["kaju","cashew"],                      kcal:553, p:18, c:30, f:44, def:28,  unit:"avuç" },
  { keys:["antep fıstığı","pistachio"],          kcal:560, p:20, c:28, f:45, def:28,  unit:"avuç" },
  { keys:["çekirdek","ay çekirdeği","sunflower"],kcal:584, p:21, c:20, f:51, def:28,  unit:"avuç" },
  { keys:["susam","sesame","tahin"],             kcal:573, p:18, c:23, f:50, def:15,  unit:"porsiyon" },
  { keys:["chia"],                               kcal:486, p:17, c:42, f:31, def:15,  unit:"porsiyon" },
  { keys:["keten tohumu","flaxseed"],            kcal:534, p:18, c:29, f:42, def:15,  unit:"porsiyon" },
  { keys:["hindistan cevizi","coconut"],         kcal:354, p:3.3,c:15, f:33, def:30,  unit:"porsiyon" },

  // YAĞ & SOSLAR
  { keys:["zeytinyağı","olive oil"],             kcal:884, p:0,  c:0,  f:100,def:14,  unit:"yemek kaşığı" },
  { keys:["ayçiçek yağı","sunflower oil","yağ"],kcal:884, p:0,  c:0,  f:100,def:14,  unit:"yemek kaşığı" },
  { keys:["ketçap","ketchup"],                   kcal:112, p:1.4,c:27, f:0.4,def:20,  unit:"porsiyon" },
  { keys:["mayonez","mayo","mayonnaise"],         kcal:680, p:1,  c:0.6,f:75, def:15,  unit:"porsiyon" },
  { keys:["hardal","mustard"],                   kcal:66,  p:4,  c:8,  f:3,  def:10,  unit:"porsiyon" },
  { keys:["bal","honey"],                        kcal:304, p:0.3,c:82, f:0,  def:21,  unit:"kaşık" },
  { keys:["reçel","jam"],                        kcal:250, p:0.5,c:65, f:0.1,def:20,  unit:"kaşık" },
  { keys:["nutella","çikolata kreması"],         kcal:539, p:6,  c:58, f:31, def:20,  unit:"kaşık" },

  // İÇECEKLER
  { keys:["su","water"],                         kcal:0,   p:0,  c:0,  f:0,  def:200, unit:"bardak" },
  { keys:["çay","tea"],                          kcal:2,   p:0,  c:0.4,f:0,  def:200, unit:"bardak" },
  { keys:["kahve","coffee","americano"],         kcal:5,   p:0.3,c:0.7,f:0.2,def:200, unit:"bardak" },
  { keys:["sütlü kahve","latte","cappuccino"],   kcal:67,  p:3.5,c:5,  f:3.5,def:200, unit:"bardak" },
  { keys:["meyve suyu","juice","portakal suyu"], kcal:47,  p:0.7,c:11, f:0.2,def:200, unit:"bardak" },
  { keys:["kola","cola","gazoz","soda"],         kcal:42,  p:0,  c:10, f:0,  def:330, unit:"kutu" },
  { keys:["light kola","diyet kola","zero"],     kcal:1,   p:0,  c:0.1,f:0,  def:330, unit:"kutu" },
  { keys:["enerji içeceği","energy drink","redbull"],kcal:47,p:0, c:11, f:0,  def:250, unit:"kutu" },
  { keys:["bira","beer"],                        kcal:43,  p:0.5,c:3.6,f:0,  def:500, unit:"bardak" },
  { keys:["şarap","wine"],                       kcal:83,  p:0.1,c:2.7,f:0,  def:150, unit:"kadeh" },
  { keys:["protein shake","protein bar"],        kcal:150, p:25, c:10, f:3,  def:100, unit:"adet" },
  { keys:["smoothie"],                           kcal:80,  p:2,  c:18, f:0.5,def:250, unit:"bardak" },

  // TATLILAR & ATISTIRMALIKLAR
  { keys:["çikolata","chocolate","bitter çikolata"],kcal:546,p:5,c:60,f:31,def:25,"unit":"kare"},
  { keys:["gofret","wafer"],                     kcal:490, p:5,  c:67, f:22, def:35,  unit:"adet" },
  { keys:["bisküvi","cookie","kurabiye"],        kcal:480, p:7,  c:68, f:20, def:30,  unit:"adet" },
  { keys:["kek","cake"],                         kcal:395, p:5,  c:55, f:18, def:80,  unit:"dilim" },
  { keys:["baklava"],                            kcal:430, p:7,  c:48, f:24, def:60,  unit:"dilim" },
  { keys:["helva","tahin helvası"],              kcal:520, p:11, c:55, f:29, def:30,  unit:"dilim" },
  { keys:["sütlaç","muhallebi","pudding"],       kcal:130, p:4,  c:22, f:3,  def:150, unit:"porsiyon" },
  { keys:["cheesecake","cheese cake"],           kcal:321, p:5.5,c:26, f:22, def:100, unit:"dilim" },
  { keys:["beze","marshmallow"],                 kcal:318, p:1.8,c:81, f:0,  def:30,  unit:"porsiyon" },
  { keys:["şeker","candy","karamel"],            kcal:387, p:0,  c:100,f:0,  def:10,  unit:"adet" },
  { keys:["mısır patlaması","popcorn"],          kcal:375, p:12, c:74, f:5,  def:30,  unit:"porsiyon" },
  { keys:["cips","chips","patates cipsi"],       kcal:536, p:7,  c:53, f:35, def:30,  unit:"porsiyon" },

  // FAST FOOD
  { keys:["döner","dürüm döner"],               kcal:230, p:18, c:22, f:8,  def:200, unit:"porsiyon" },
  { keys:["lahmacun"],                           kcal:222, p:12, c:28, f:7,  def:160, unit:"adet" },
  { keys:["tantuni"],                            kcal:210, p:16, c:24, f:6,  def:150, unit:"porsiyon" },
  { keys:["iskender"],                           kcal:280, p:18, c:22, f:13, def:300, unit:"porsiyon" },
  { keys:["adana kebap","adana"],                kcal:250, p:22, c:4,  f:16, def:200, unit:"porsiyon" },

  // HAZIR/PAKET
  { keys:["konserve fasulye","konserve"],        kcal:130, p:7,  c:24, f:0.5,def:200, unit:"porsiyon" },
  { keys:["hazır çorba","paket çorba"],          kcal:60,  p:2,  c:11, f:1,  def:250, unit:"porsiyon" },
  { keys:["instant noodle","hazır noodle"],      kcal:450, p:9,  c:63, f:18, def:85,  unit:"paket" },
];

// Sayı + birim çözümleyici
function parseAmount(text) {
  const normalBirimler = {
    "adet":1,"tane":1,"dilim":1,"kase":1,"tabak":1,"avuç":1,"diş":1,"kadeh":1,"kutu":1,"paket":1,
    "ölçek":1,"porsiyon":1,"yarım":0.5,"çeyrek":0.25,"yarısı":0.5,
    "küçük":0.7,"büyük":1.5,"orta":1,"ufak":0.6,"geniş":1.4
  };
  const gramBirimler  = { "g":1,"gr":1,"gram":1,"kg":1000,"ml":1,"cl":10,"lt":1000,"litre":1000,"dl":100 };
  const bardakBirimler= { "bardak":240,"su bardağı":240,"çay bardağı":100,"fincan":80,"kupa":300,"kâse":250 };
  const kasikBirimler = { "yemek kaşığı":15,"çorba kaşığı":15,"tatlı kaşığı":5,"çay kaşığı":5,"kaşık":15,"yk":15 };

  // Türkçe sayılar
  const tr = {"bir":1,"iki":2,"üç":3,"dört":4,"beş":5,"altı":6,"yedi":7,"sekiz":8,"dokuz":9,"on":10,
               "yarım":0.5,"buçuk":0.5,"çeyrek":0.25};
  let t = text.toLowerCase().trim();

  // Türkçe sayıyı rakama çevir
  for (const [word,val] of Object.entries(tr)) {
    t = t.replace(new RegExp("\\b"+word+"\\b","g"), val+" ");
  }
  t = t.replace(/(\d)\s*buçuk/g, (_, n) => (parseFloat(n)+0.5)+" ");

  // Sayı çıkar
  const numMatch = t.match(/(\d+[\.,]?\d*)/);
  const num = numMatch ? parseFloat(numMatch[1].replace(",",".")) : 1;

  // Birimi tespit et
  for (const [b,mult] of Object.entries(gramBirimler)) {
    if (t.includes(b)) return { gram: num * mult, multiplier: null };
  }
  for (const [b,gram] of Object.entries(bardakBirimler)) {
    if (t.includes(b)) return { gram: num * gram, multiplier: null };
  }
  for (const [b,gram] of Object.entries(kasikBirimler)) {
    if (t.includes(b)) return { gram: num * gram, multiplier: null };
  }
  for (const [b,mult] of Object.entries(normalBirimler)) {
    if (t.includes(b)) return { gram: null, multiplier: num * mult };
  }
  return { gram: null, multiplier: num };
}

// Yiyecek eşleştirici
function findFood(text) {
  const t = text.toLowerCase()
    .replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ı/g,"i")
    .replace(/ö/g,"o").replace(/ü/g,"u").replace(/ç/g,"c");

  let best = null, bestScore = 0;
  for (const food of CALORIE_DB) {
    for (const key of food.keys) {
      const k = key.toLowerCase()
        .replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ı/g,"i")
        .replace(/ö/g,"o").replace(/ü/g,"u").replace(/ç/g,"c");
      if (t.includes(k)) {
        const score = k.length; // daha uzun eşleşme = daha iyi
        if (score > bestScore) { bestScore = score; best = food; }
      }
    }
  }
  return best;
}

// Tek bir öğeyi parse et: "3 yumurta" veya "200g tavuk"
function parseSingleItem(text) {
  const food = findFood(text);
  if (!food) return null;

  const amount = parseAmount(text);
  let gram;

  if (amount.gram !== null) {
    gram = amount.gram;
  } else {
    // adet/multiplier bazlı
    gram = food.def * (amount.multiplier || 1);
  }

  const factor = gram / 100;
  const kcal   = Math.round(food.kcal * factor);
  const p      = Math.round(food.p    * factor * 10) / 10;
  const c      = Math.round(food.c    * factor * 10) / 10;
  const f      = Math.round(food.f    * factor * 10) / 10;

  // Güzel miktar açıklaması
  let amountStr = "";
  if (amount.gram !== null) {
    amountStr = Math.round(gram) + "g";
  } else {
    const mult = amount.multiplier || 1;
    amountStr  = (mult === Math.floor(mult) ? mult : mult.toFixed(1)) + " " + food.unit;
    amountStr += " (" + Math.round(gram) + "g)";
  }

  return { name: food.keys[0].charAt(0).toUpperCase() + food.keys[0].slice(1), amount: amountStr, kcal, protein:p, carb:c, fat:f };
}

// Ana analiz fonksiyonu — virgülle ayrılmış çoklu giriş
window.analyzeWithAI = function() {
  const inputEl = document.getElementById("aiMealInput");
  const input   = inputEl?.value?.trim();
  if (!input) { showToast("⚠️ Bir şeyler yaz"); return; }

  const resEl = document.getElementById("aiResult");
  const errEl = document.getElementById("aiError");
  resEl.classList.add("hidden");
  errEl.classList.add("hidden");

  // Virgül veya "ve" ile böl
  const parts = input
    .split(/,|ve\s|ile\s|\+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const items = [];
  const notFound = [];

  for (const part of parts) {
    const result = parseSingleItem(part);
    if (result) {
      items.push(result);
    } else {
      notFound.push(part);
    }
  }

  if (!items.length) {
    errEl.textContent = "⚠️ Yiyecek bulunamadı: \"" + input + "\". Farklı bir yazım dene. (Örn: tavuk göğsü, pilav, yumurta)";
    errEl.classList.remove("hidden");
    return;
  }

  const totalKcal = items.reduce((s, i) => s + i.kcal, 0);
  const parsed = { items, totalKcal };
  if (notFound.length) parsed.note = "Bulunamadı: " + notFound.join(", ");

  lastAiResult = parsed;
  showAiResult(parsed, input);
};

function showAiResult(parsed, originalInput) {
  const resEl = document.getElementById("aiResult");
  if (!resEl) return;

  let itemsHtml = parsed.items.map(item => `
    <div class="ai-result-item">
      <span class="ai-result-item-name">
        ${item.name}
        <span class="ai-result-item-detail">${item.amount || ""}</span>
      </span>
      <span class="ai-result-item-kcal">${item.kcal} kcal</span>
    </div>
  `).join("");

  const macroTotal = {
    p: parsed.items.reduce((s, i) => s + (i.protein || 0), 0),
    c: parsed.items.reduce((s, i) => s + (i.carb    || 0), 0),
    f: parsed.items.reduce((s, i) => s + (i.fat     || 0), 0),
  };

  const macroHtml = (macroTotal.p || macroTotal.c || macroTotal.f) ? `
    <div style="display:flex;gap:10px;margin-top:8px;margin-bottom:2px">
      <span style="font-size:10px;color:#cc99ff">P: ${Math.round(macroTotal.p)}g</span>
      <span style="font-size:10px;color:#ffcc44">K: ${Math.round(macroTotal.c)}g</span>
      <span style="font-size:10px;color:#ff9944">Y: ${Math.round(macroTotal.f)}g</span>
    </div>
  ` : "";

  const noteHtml = parsed.note
    ? `<div style="font-size:10px;color:var(--text-sub);margin-top:6px;font-style:italic">${parsed.note}</div>`
    : "";

  resEl.innerHTML = `
    <div class="ai-result-header">✦ AI Analiz Sonucu</div>
    ${itemsHtml}
    ${macroHtml}
    <div class="ai-result-total">
      <span class="ai-result-total-label">Toplam</span>
      <span class="ai-result-total-kcal">${parsed.totalKcal} kcal</span>
    </div>
    ${noteHtml}
    <button class="ai-result-add-btn" onclick="addAiResultToLog()">+ Listeye Ekle</button>
  `;

  resEl.classList.remove("hidden");
}

window.db = db;