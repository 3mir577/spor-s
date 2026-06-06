let data = JSON.parse(localStorage.getItem("data")) || [];

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

/* ADD WEIGHT */
function addWeight() {
    let w = document.getElementById("weightInput").value;

    data.push({
        type: "weight",
        value: Number(w),
        date: new Date().toLocaleDateString()
    });

    save();
}

/* ADD LIFTS */
function add(type) {
    let val = document.getElementById(type + "Input").value;

    data.push({
        type,
        value: Number(val),
        date: new Date().toLocaleDateString()
    });

    save();
}

/* UPDATE (TEK VE DOĞRU) */
function update() {

    let weights = data.filter(d => d.type === "weight");
    let last = weights.slice(-1)[0];

    document.getElementById("todayWeight").innerText =
        last ? last.value + " kg" : "-";

    let bench = data.filter(d => d.type === "bench");

    document.getElementById("benchMax").innerText =
        bench.length ? Math.max(...bench.map(x => x.value)) + " kg" : "-";

    achievements();
    analysis();
}

/* CHART FIX */
function drawCharts() {

    let weights = data.filter(d => d.type === "weight");
    let bench = data.filter(d => d.type === "bench");

    if (window.weightChartInstance) window.weightChartInstance.destroy();
    if (window.liftChartInstance) window.liftChartInstance.destroy();

    window.weightChartInstance = new Chart(
        document.getElementById("weightChart"),
        {
            type: "line",
            data: {
                labels: weights.map(x => x.date),
                datasets: [{
                    label: "Kilo",
                    data: weights.map(x => x.value),
                    borderColor: "white"
                }]
            }
        }
    );

    window.liftChartInstance = new Chart(
        document.getElementById("liftChart"),
        {
            type: "line",
            data: {
                labels: bench.map(x => x.date),
                datasets: [{
                    label: "Bench",
                    data: bench.map(x => x.value),
                    borderColor: "white"
                }]
            }
        }
    );
}

/* ACHIEVEMENT */
function achievements() {
    let bench = data.filter(d => d.type === "bench");
    let max = bench.length ? Math.max(...bench.map(x => x.value)) : 0;

    if (max >= 100) notify("🏆 100kg Bench!");
    else if (max >= 80) notify("🔥 Güçleniyorsun");
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

/* NOTIFY (TEK) */
function notify(msg) {
    let n = document.createElement("div");

    n.innerText = msg;
    n.style.position = "fixed";
    n.style.top = "15px";
    n.style.left = "50%";
    n.style.transform = "translateX(-50%)";
    n.style.background = "rgba(20,20,20,0.9)";
    n.style.border = "1px solid #333";
    n.style.padding = "10px 14px";
    n.style.borderRadius = "12px";
    n.style.color = "white";
    n.style.fontSize = "12px";
    n.style.zIndex = "9999";

    document.body.appendChild(n);

    setTimeout(() => n.remove(), 2000);
}

update();
drawCharts();