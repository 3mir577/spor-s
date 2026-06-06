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

update();
drawCharts();