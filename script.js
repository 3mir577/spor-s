let data = JSON.parse(localStorage.getItem("data")) || [];

function save() {
    localStorage.setItem("data", JSON.stringify(data));
    update();
}

function show(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

function addWeight() {
    let w = document.getElementById("weightInput").value;

    data.push({
        type: "weight",
        value: w,
        date: new Date().toLocaleDateString()
    });

    save();
}

function add(type) {
    let input = document.getElementById(type + "Input").value;

    data.push({
        type: "lift",
        lift: type,
        value: Number(input),
        date: new Date().toLocaleDateString()
    });

    save();
}

function update() {

    let weights = data.filter(d => d.type === "weight");
    let lastWeight = weights.slice(-1)[0];

    document.getElementById("todayWeight").innerText =
        lastWeight ? lastWeight.value + " kg" : "-";

    let lifts = data.filter(d => d.type === "lift");

    let bench = lifts.filter(l => l.lift === "bench");
    let squat = lifts.filter(l => l.lift === "squat");

    let benchMax = bench.length ? Math.max(...bench.map(l => l.value)) : "-";
    let squatMax = squat.length ? Math.max(...squat.map(l => l.value)) : "-";

    document.getElementById("pr").innerText =
        "Bench: " + benchMax + " | Squat: " + squatMax;

    document.getElementById("benchLast").innerText =
        bench.slice(-1)[0]?.value || "-";

    document.getElementById("squatLast").innerText =
        squat.slice(-1)[0]?.value || "-";

    document.getElementById("log").innerHTML =
        lifts.slice().reverse().map(l =>
            `<p>${l.date} - ${l.lift}: ${l.value} kg</p>`
        ).join("");
}

update();