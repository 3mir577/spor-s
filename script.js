let veriler = JSON.parse(localStorage.getItem("veriler")) || [];

function kaydet() {
    localStorage.setItem("veriler", JSON.stringify(veriler));
    goster();
}

function kiloEkle() {
    let kilo = document.getElementById("kilo").value;

    veriler.push({
        tip: "kilo",
        veri: kilo + " kg",
        tarih: new Date().toLocaleDateString()
    });

    kaydet();
}

function agirlikEkle() {
    let hareket = document.getElementById("hareket").value;
    let agirlik = document.getElementById("agirlik").value;

    veriler.push({
        tip: "ağırlık",
        veri: hareket + " - " + agirlik + " kg",
        tarih: new Date().toLocaleDateString()
    });

    kaydet();
}

function goster() {
    let liste = document.getElementById("liste");
    liste.innerHTML = "";

    veriler.forEach(v => {
        liste.innerHTML += `
            <p>${v.tarih} | ${v.tip.toUpperCase()} | ${v.veri}</p>
        `;
    });
}

goster();