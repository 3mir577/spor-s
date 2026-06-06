let data = JSON.parse(localStorage.getItem("data")) || [];
let streakData = JSON.parse(localStorage.getItem("streak")) || {};
let goal = localStorage.getItem("goal") || null;

function today(){ return new Date().toLocaleDateString(); }

function save(){
    localStorage.setItem("data", JSON.stringify(data));
    localStorage.setItem("streak", JSON.stringify(streakData));
    localStorage.setItem("goal", goal);
}

function show(page){
    document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
    document.getElementById(page).classList.remove("hidden");
}

function setGoal(){
    goal = Number(document.getElementById("goalInput").value);
    save();
    update();
}

/* WEIGHT */
function addWeight(){
    let w = document.getElementById("weightInput").value;
    let t = today();

    let e = data.find(d=>d.type==="weight"&&d.date===t);

    if(e) e.value = Number(w);
    else data.push({type:"weight", value:Number(w), date:t});

    save();
    update();
    draw();
}

/* LIFTS */
function addLift(type){
    let v = document.getElementById(type+"Input").value;

    data.push({type, value:Number(v), date:today()});

    save();
    update();
    renderHistory();
}

function update(){

    let w = data.filter(d=>d.type==="weight");
    let last = w.at(-1);

    document.getElementById("todayWeight").innerText =
        last? last.value+" kg":"-";

    let bench = data.filter(d=>d.type==="smith_low_incline_press");
    let max = bench.length?Math.max(...bench.map(x=>x.value)):0;

    document.getElementById("benchMax").innerText = max+" kg";

    updateGoal();
}

function updateGoal(){
    let w = data.filter(d=>d.type==="weight");
    let last = w.at(-1);

    if(!goal || !last) return;

    let p = Math.max(0,100 - Math.abs(goal-last.value)*5);

    document.getElementById("progressBar").style.width = p+"%";
}

/* HISTORY */
const exercises = [
"plate_incline_press","smith_low_incline_press","chest_fly",
"machine_shoulder_press","lateral_raise","skullcrusher",
"triceps_pushdown","overhead_rope_extension","lat_pulldown",
"wide_row","cable_row","incline_dumbell_curl","cable_curl",
"hammer_curl","leg_press","smith_squat","leg_extension","seated_leg_curl"
];

function renderHistory(){
    exercises.forEach(ex=>{
        let c = document.getElementById(ex+"History");
        if(!c) return;

        c.innerHTML="";

        data.filter(d=>d.type===ex)
        .slice(-3)
        .reverse()
        .forEach(i=>{
            let div=document.createElement("div");
            div.style.fontSize="11px";
            div.style.color="#aaa";
            div.innerText=i.date+" → "+i.value+"kg";
            c.appendChild(div);
        });
    });
}

/* SIMPLE CHART */
let chart;
function draw(){
    let w = data.filter(d=>d.type==="weight");

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("weightChart"),{
        type:"line",
        data:{
            labels:w.map(x=>x.date),
            datasets:[{
                data:w.map(x=>x.value),
                borderColor:"white"
            }]
        }
    });
}

function updateStreak(){
    let t = today();
    if(streakData.last!==t){
        streakData.count=(streakData.count||0)+1;
        streakData.last=t;
    }
}

update();
draw();
renderHistory();