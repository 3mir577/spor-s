let veriler = JSON.parse(localStorage.getItem("veriler")) || [];

function kaydet() {
    localStorage.setItem("veriler", JSON.stringify(veriler));
    guncelle();
}

function kiloEkle() {
    let kilo = document.getElementById("kilo").value;

    veriler.push({
        tip: "kilo",
        veri: kilo,
        tarih: new Date().toLocaleDateString()
    });

    kaydet();
}

function agirlikEkle() {
    let hareket = document.getElementById("hareket").value.toLowerCase();
    let agirlik = Number(document.getElementById("agirlik").value);

    veriler.push({
        tip: "agirlik",
        hareket: hareket,
        veri: agirlik,
        tarih: new Date().toLocaleDateString()
    });

    kaydet();
}

function guncelle() {

    let bugun = veriler.filter(v => v.tip === "kilo").slice(-1)[0];
    document.getElementById("bugunKilo").innerText =
        "Bugünkü kilo: " + (bugun ? bugun.veri + " kg" : "-");

    let bench = veriler.filter(v => v.hareket === "bench");
    let squat = veriler.filter(v => v.hareket === "squat");

    let benchMax = bench.length ? Math.max(...bench.map(v => v.veri)) : "-";
    let squatMax = squat.length ? Math.max(...squat.map(v => v.veri)) : "-";

    document.getElementById("benchMax").innerText = "Bench Max: " + benchMax;
    document.getElementById("squatMax").innerText = "Squat Max: " + squatMax;

    let liste = document.getElementById("liste");
    liste.innerHTML = "";

    veriler.slice().reverse().forEach(v => {
        if (v.tip === "kilo") {
            liste.innerHTML += `<p>📅 ${v.tarih} | Kilo: ${v.veri} kg</p>`;
        } else {
            liste.innerHTML += `<p>🏋️ ${v.tarih} | ${v.hareket}: ${v.veri} kg</p>`;
        }
    });
}

guncelle();