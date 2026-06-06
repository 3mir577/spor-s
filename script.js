let data = JSON.parse(localStorage.getItem("data")) || [];
let streakData = JSON.parse(localStorage.getItem("streak")) || {};

window.onload = () => {
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
    }, 1200);

    update();
    drawCharts();
};

/* SAVE */
function save() {
    localStorage.setItem("data", JSON.stringify(data));
    localStorage.setItem("streak", JSON.stringify(streakData));
}

/* PAGE */
function show(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

/* WEIGHT */
function addWeight() {
    let w = document.getElementById("weightInput").value;
    if (!w) return;

    data.push({
        type: "weight",
        value: Number(w),
        date: new Date().toLocaleDateString()
    });

    updateStreak();
    save();
    update();
    drawCharts();
}

/* LIFTS */
function addLift(type) {
    let val = document.getElementById(type + "Input").value;
    if (!val) return;

    data.push({
        type,
        value: Number(val),
        date: new Date().toLocaleDateString()
    });

    save();
    update();
    drawCharts();
}

/* UPDATE UI */
function update() {

    let weights = data.filter(d => d.type === "weight");
    let last = weights.at(-1);

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = data.filter(d => d.type === "bench");
    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    document.getElementById("benchMax").innerText = max + " kg";

    document.getElementById("streak").innerText =
        (streakData.count || 0) + " gün 🔥";

    document.getElementById("status").innerText =
        max >= 100 ? "Beast Mode 🦍" :
        max >= 80 ? "Strong 💪" :
        "Başlangıç 🟡";

    weeklyAnalysis();
}

/* STREAK SYSTEM */
function updateStreak() {
    let today = new Date().toLocaleDateString();

    if (streakData.lastDay !== today) {
        streakData.count = (streakData.count || 0) + 1;
        streakData.lastDay = today;
    }
}

/* WEEKLY ANALYSIS */
function weeklyAnalysis() {
    let w = data.filter(d => d.type === "weight");

    if (w.length < 2) {
        document.getElementById("weekly").innerText = "-";
        return;
    }

    let first = w[0].value;
    let last = w[w.length - 1].value;

    let diff = (last - first).toFixed(1);

    document.getElementById("weekly").innerText =
        diff < 0
            ? "📉 İyi gidiyorsun " + diff + "kg düşüş"
            : diff > 0
                ? "📈 + " + diff + "kg artış"
                : "⚖️ Stabil";
}

/* CHARTS */
let weightChart;
let liftChart;

function drawCharts() {

    let w = data.filter(d => d.type === "weight");
    let b = data.filter(d => d.type === "bench");

    if (weightChart) weightChart.destroy();
    if (liftChart) liftChart.destroy();

    weightChart = new Chart(document.getElementById("weightChart"), {
        type: "line",
        data: {
            labels: w.map(x => x.date),
            datasets: [{
                label: "Kilo",
                data: w.map(x => x.value),
                borderColor: "white"
            }]
        }
    });

    liftChart = new Chart(document.getElementById("liftChart"), {
        type: "line",
        data: {
            labels: b.map(x => x.date),
            datasets: [{
                label: "Bench",
                data: b.map(x => x.value),
                borderColor: "white"
            }]
        }
    });
}