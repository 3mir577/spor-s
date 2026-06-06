let data = JSON.parse(localStorage.getItem("data")) || [];

function save() {
    localStorage.setItem("data", JSON.stringify(data));
    update();
    drawCharts();
}

/* PAGE SYSTEM */
function show(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

/* WEIGHT */
function addWeight() {
    let w = document.getElementById("weightInput").value;

    data.push({
        type: "weight",
        value: Number(w),
        date: new Date().toLocaleDateString()
    });

    save();
}

/* LIFTS */
function add(type) {
    let val = document.getElementById(type + "Input").value;

    data.push({
        type: type,
        value: Number(val),
        date: new Date().toLocaleDateString()
    });

    save();
}

/* UPDATE DASHBOARD */
function update() {

    let w = data.filter(d => d.type === "weight");
    let last = w.slice(-1)[0];

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = data.filter(d => d.type === "bench");

    document.getElementById("benchMax").innerText =
        bench.length ? Math.max(...bench.map(x => x.value)) + " kg" : "-";
}

/* CHARTS */
function drawCharts() {

    let weights = data.filter(d => d.type === "weight");

    new Chart(document.getElementById("weightChart"), {
        type: "line",
        data: {
            labels: weights.map(x => x.date),
            datasets: [{
                label: "Kilo",
                data: weights.map(x => x.value),
                borderColor: "white"
            }]
        }
    });

    let bench = data.filter(d => d.type === "bench");

    new Chart(document.getElementById("liftChart"), {
        type: "line",
        data: {
            labels: bench.map(x => x.date),
            datasets: [{
                label: "Bench",
                data: bench.map(x => x.value),
                borderColor: "white"
            }]
        }
    });

}
function checkAchievements() {
    let bench = data.filter(d => d.type === "bench");

    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    if (max >= 100) notify("🏆 100kg Bench! Güçleniyorsun");
    else if (max >= 80) notify("🔥 Çok iyi gidiyorsun");
}

function analyze() {
    let weights = data.filter(d => d.type === "weight");

    if (weights.length < 2) return;

    let last = weights[weights.length - 1].value;
    let prev = weights[weights.length - 2].value;

    if (last < prev) {
        notify("📉 İyi gidiyorsun, kilo düşüyor");
    } else if (last > prev) {
        notify("📈 Biraz artış var, dikkat");
    } else {
        notify("⚖️ Stabil gidiyorsun");
    }
}

function notify(msg) {

    let n = document.createElement("div");

    n.innerText = msg;

    n.style.position = "fixed";
    n.style.top = "10px";
    n.style.left = "50%";
    n.style.transform = "translateX(-50%)";
    n.style.background = "#111";
    n.style.color = "white";
    n.style.padding = "10px";
    n.style.borderRadius = "10px";
    n.style.fontSize = "12px";
    n.style.zIndex = "99999";
    n.style.border = "1px solid #333";

    document.body.appendChild(n);

    setTimeout(() => {
        n.remove();
    }, 2000);
}

function update() {
    let w = data.filter(d => d.type === "weight");
    let last = w.slice(-1)[0];

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    checkAchievements();
    analyze();
}

update();
drawCharts();