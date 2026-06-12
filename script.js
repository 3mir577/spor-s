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

// Sayfa açılışında temayı uygula
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

    // Kalori ayarını da yükle (ana ekran için)
    loadCalorieSetting();

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

  // Mifflin-St Jeor BMR
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

  const dispEl = document.getElementById("dailyCalDisplay");
  if (dispEl) dispEl.textContent = val.toLocaleString("tr-TR");

  showToast("🔥 " + labelMap[type] + " modu: " + val.toLocaleString("tr-TR") + " kcal/gün");
};

async function loadCalorieSetting() {
  if (!uid()) return;
  try {
    const snap = await db.collection("users").doc(uid()).collection("settings").doc("calories").get();
    if (snap.exists && snap.data().value) {
      const d = snap.data();
      const dispEl = document.getElementById("dailyCalDisplay");
      if (dispEl) dispEl.textContent = d.value.toLocaleString("tr-TR");

      // Formu doldur (kalori sayfasındaysa)
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
      // Sonuç göster
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

  // Gram değiştikçe kcal güncelle
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

window.db = db;