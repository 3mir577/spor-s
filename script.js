let veriler = JSON.parse(localStorage.getItem("veriler")) || [];

function save() {
    localStorage.setItem("veriler", JSON.stringify(veriler));
    update();
}

function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

function kiloEkle() {
    let kilo = document.getElementById("kiloInput").value;

    veriler.push({
        tip: "kilo",
        veri: kilo,
        tarih: new Date().toLocaleDateString()
    });

    save();
}

function agirlikEkle() {
    let hareket = document.getElementById("hareket").value.toLowerCase();
    let kg = Number(document.getElementById("agirlikInput").value);

    veriler.push({
        tip: "agirlik",
        hareket,
        veri: kg,
        tarih: new Date().toLocaleDateString()
    });

    save();
}

function update() {

    let kiloList = veriler.filter(v => v.tip === "kilo");
    let son = kiloList.slice(-1)[0];

    document.getElementById("bugunKilo").innerText =
        son ? son.veri + " kg" : "-";

    let bench = veriler.filter(v => v.hareket === "bench");
    let squat = veriler.filter(v => v.hareket === "squat");

    document.getElementById("benchMax").innerText =
        bench.length ? Math.max(...bench.map(v => v.veri)) + " kg" : "-";

    document.getElementById("squatMax").innerText =
        squat.length ? Math.max(...squat.map(v => v.veri)) + " kg" : "-";

    // kilo listesi
    document.getElementById("kiloListe").innerHTML =
        veriler.filter(v => v.tip === "kilo")
        .slice().reverse()
        .map(v => `<p>${v.tarih} - ${v.veri} kg</p>`)
        .join("");

    // ağırlık listesi
    document.getElementById("agirlikListe").innerHTML =
        veriler.filter(v => v.tip === "agirlik")
        .slice().reverse()
        .map(v => `<p>${v.tarih} - ${v.hareket}: ${v.veri} kg</p>`)
        .join("");
}

update();