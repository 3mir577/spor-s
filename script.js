let data = JSON.parse(localStorage.getItem("data")) || [];

/* SPLASH */
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
    update();
    drawCharts();
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

    save();
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
}

/* UPDATE */
function update() {

    let w = data.filter(d => d.type === "weight");
    let last = w[w.length - 1];

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = data.filter(d => d.type === "bench");

    document.getElementById("benchMax").innerText =
        bench.length ? Math.max(...bench.map(x => x.value)) + " kg" : "-";

    analysis();
    achievements();
}

/* ANALYSIS */
function analysis() {
    let w = data.filter(d => d.type === "weight");
    if (w.length < 2) return;

    let last = w[w.length - 1].value;
    let prev = w[w.length - 2].value;

    if (last < prev) notify("📉 İyi gidiyorsun");
    else if (last > prev) notify("📈 Artış var");
}

/* ACHIEVEMENTS */
function achievements() {
    let bench = data.filter(d => d.type === "bench");
    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    if (max >= 100) notify("🏆 100kg Bench!");
    else if (max >= 80) notify("🔥 Güçleniyorsun");
}

/* NOTIFY */
function notify(msg) {
    let n = document.createElement("div");

    n.innerText = msg;
    n.style.position = "fixed";
    n.style.top = "15px";
    n.style.left = "50%";
    n.style.transform = "translateX(-50%)";
    n.style.background = "rgba(0,0,0,0.85)";
    n.style.border = "1px solid #333";
    n.style.padding = "10px";
    n.style.borderRadius = "10px";
    n.style.color = "white";
    n.style.fontSize = "12px";
    n.style.zIndex = "9999";

    document.body.appendChild(n);

    setTimeout(() => n.remove(), 2000);
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