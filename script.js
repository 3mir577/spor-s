firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* =========================
   HELPERS
========================= */

function today() {
    return new Date().toLocaleDateString("tr-TR");
}

let goal = 0;

/* =========================
   PAGE NAV
========================= */

function show(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");

    if (page === "stats") {
        loadChart();
    }
}

/* =========================
   GOAL
========================= */

async function setGoal() {
    goal = Number(document.getElementById("goalInput").value);

    await db.collection("settings").doc("goal").set({
        value: goal
    });

    updateUI();
}

/* =========================
   WEIGHT
========================= */

async function addWeight() {
    let w = Number(document.getElementById("weightInput").value);

    await db.collection("weights").add({
        value: w,
        date: today(),
        timestamp: Date.now()
    });

    updateUI();
}

/* =========================
   LIFTS
========================= */

async function addLift(type) {
    let v = Number(document.getElementById(type + "Input").value);

    await db.collection("lifts").add({
        type: type,
        value: v,
        date: today(),
        timestamp: Date.now()
    });

    updateUI();
}

/* =========================
   LOAD DATA
========================= */

async function loadData() {
    let weightSnap = await db.collection("weights").get();
    let liftSnap = await db.collection("lifts").get();
    let goalSnap = await db.collection("settings").doc("goal").get();

    let weights = [];
    let lifts = [];

    weightSnap.forEach(doc => weights.push(doc.data()));
    liftSnap.forEach(doc => lifts.push(doc.data()));

    if (goalSnap.exists) {
        goal = goalSnap.data().value;
    }

    render(weights, lifts);
}

/* =========================
   UI UPDATE
========================= */

function render(weights, lifts) {

    let last = weights.at(-1);

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = lifts.filter(l => l.type === "smith_low_incline_press");
    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    document.getElementById("benchMax").innerText = max + " kg";

    updateGoalBar(weights);
    renderHistory(lifts);
}

/* =========================
   GOAL PROGRESS
========================= */

function updateGoalBar(weights) {
    let last = weights.at(-1);
    if (!goal || !last) return;

    let p = Math.max(0, 100 - Math.abs(goal - last.value) * 5);
    document.getElementById("progressBar").style.width = p + "%";
}

/* =========================
   HISTORY
========================= */

const exercises = [
"plate_incline_press","smith_low_incline_press","chest_fly",
"machine_shoulder_press","lateral_raise","skullcrusher",
"triceps_pushdown","overhead_rope_extension","lat_pulldown",
"wide_row","cable_row","incline_dumbell_curl","cable_curl",
"hammer_curl","leg_press","smith_squat","leg_extension","seated_leg_curl"
];

function renderHistory(lifts) {
    exercises.forEach(ex => {

        let c = document.getElementById(ex + "History");
        if (!c) return;

        c.innerHTML = "";

        lifts.filter(d => d.type === ex)
            .slice(-3)
            .reverse()
            .forEach(i => {
                let div = document.createElement("div");
                div.style.fontSize = "11px";
                div.style.color = "#aaa";
                div.innerText = i.date + " → " + i.value + " kg";
                c.appendChild(div);
            });
    });
}

/* =========================
   CHART
========================= */

let chart;

async function loadChart() {
    let snap = await db.collection("weights").get();

    let w = [];
    snap.forEach(d => w.push(d.data()));

    w.sort((a, b) => a.timestamp - b.timestamp);

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("weightChart"), {
        type: "line",
        data: {
            labels: w.map(x => x.date),
            datasets: [{
                data: w.map(x => x.value),
                borderColor: "white"
            }]
        }
    });
}

/* =========================
   INIT
========================= */

function updateUI() {
    loadData();
}

updateUI();