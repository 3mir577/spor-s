let data = JSON.parse(localStorage.getItem("data")) || [];
let streakData = JSON.parse(localStorage.getItem("streak")) || {};
let goal = localStorage.getItem("goal") || null;

/* INIT */
window.onload = () => {
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
    }, 1000);

    update();
    drawCharts();
};

function save() {
    localStorage.setItem("data", JSON.stringify(data));
    localStorage.setItem("streak", JSON.stringify(streakData));
    localStorage.setItem("goal", goal);
}

function today() {
    return new Date().toLocaleDateString();
}

function show(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

/* GOAL */
function setGoal() {
    goal = Number(document.getElementById("goalInput").value);
    save();
    update();
}

/* WEIGHT (DAILY ONE) */
function addWeight() {
    let w = document.getElementById("weightInput").value;
    if (!w) return;

    let t = today();

    let existing = data.find(d => d.type === "weight" && d.date === t);

    if (existing) existing.value = Number(w);
    else data.push({ type: "weight", value: Number(w), date: t });

    updateStreak();
    save();
    update();
    drawCharts();
}

/* LIFTS */
function addLift(type) {
    let v = document.getElementById(type + "Input").value;
    if (!v) return;

    data.push({
        type,
        value: Number(v),
        date: today()
    });

    save();
    update();
    drawCharts();
}

/* UPDATE UI */
function update() {

    let w = data.filter(d => d.type === "weight");
    let last = w.at(-1);

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = data.filter(d => d.type === "bench");
    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    document.getElementById("benchMax").innerText = max + " kg";

    document.getElementById("streak").innerText =
        (streakData.count || 0) + " gün 🔥";

    document.getElementById("status").innerText =
        max >= 100 ? "BEAST MODE 🦍" :
        max >= 80 ? "STRONG 💪" :
        "BEGINNER 🟡";

    updateGoalBar();
}

/* GOAL BAR */
function updateGoalBar() {
    let w = data.filter(d => d.type === "weight");
    let last = w.at(-1);

    if (!goal || !last) return;

    let diff = Math.abs(goal - last.value);
    let percent = Math.max(0, 100 - diff * 5);

    document.getElementById("progressBar").style.width = percent + "%";
    document.getElementById("goalText").innerText = "Hedef: " + goal + " kg";
}

/* STREAK */
function updateStreak() {
    let t = today();

    if (streakData.lastDay !== t) {
        streakData.count = (streakData.count || 0) + 1;
        streakData.lastDay = t;
    }
}

/* CHART */
let weightChart, liftChart;

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
                borderColor: "white",
                tension: 0.4
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
                borderColor: "white",
                tension: 0.4
            }]
        }
    });
}