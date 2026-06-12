// ─────────────────────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────────────────────
const S = {
  cities: [],
  results: null,
  algo: "nearest_neighbor",
  step: 0,
  playing: false,
  timer: null,
  view: "tour",       // tour | mst | compare
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOM
// ─────────────────────────────────────────────────────────────────────────────
const canvas     = document.getElementById("mapCanvas");
const ctx        = canvas.getContext("2d");
const btnRandom  = document.getElementById("btnRandom");
const btnClear   = document.getElementById("btnClear");
const btnSolve   = document.getElementById("btnSolve");
const btnPlay    = document.getElementById("btnPlayPause");
const btnFwd     = document.getElementById("btnStepFwd");
const btnBack    = document.getElementById("btnStepBack");
const btnRst     = document.getElementById("btnReset");
const speed      = document.getElementById("speedSlider");
const speedVal   = document.getElementById("speedVal");
const pfill      = document.getElementById("pfill");
const stepLbl    = document.getElementById("stepLbl");
const statusMsg  = document.getElementById("statusMsg");
const actionLog  = document.getElementById("actionLog");
const resultsCard= document.getElementById("resultsCard");
const nCities    = document.getElementById("nCities");
const nPerms     = document.getElementById("nPerms");

const C = { nn:"#f59e0b", mst:"#818cf8", two_opt:"#34d399", city:"#ffffff", mstEdge:"rgba(129,140,248,0.25)" };

// ─────────────────────────────────────────────────────────────────────────────
//  CANVAS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function scale(){ return canvas.getBoundingClientRect().width / canvas.width; }
function canvasXY(e){
  const r = canvas.getBoundingClientRect(), sc = scale();
  return [ Math.round((e.clientX-r.left)/sc), Math.round((e.clientY-r.top)/sc) ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  DRAW
// ─────────────────────────────────────────────────────────────────────────────
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  if(!S.cities.length){ drawPlaceholder(); return; }

  if(S.view==="compare" && S.results){
    drawAllTours();
  } else {
    if(S.view==="mst" && S.results?.mst?.mst_edges) drawMSTEdges(S.results.mst.mst_edges);
    const res = S.results?.[S.algo];
    if(res?.steps?.length){
      const snap = res.steps[Math.min(S.step, res.steps.length-1)];
      drawTour(snap.tour, C[S.algo] || C.mst);
    }
  }
  drawCities();
}

function drawGrid(){
  ctx.strokeStyle="rgba(37,42,66,0.6)"; ctx.lineWidth=1;
  for(let x=0;x<=canvas.width;x+=50){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for(let y=0;y<=canvas.height;y+=50){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
}

function drawPlaceholder(){
  ctx.fillStyle="rgba(107,114,150,0.35)"; ctx.font="15px Inter"; ctx.textAlign="center";
  ctx.fillText("Click to place cities — or hit ⚡ Generate Random Cities", canvas.width/2, canvas.height/2);
  ctx.textAlign="left";
}

function drawMSTEdges(edges){
  ctx.strokeStyle=C.mstEdge; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
  edges.forEach(([u,v])=>{ ctx.beginPath(); ctx.moveTo(S.cities[u][0],S.cities[u][1]); ctx.lineTo(S.cities[v][0],S.cities[v][1]); ctx.stroke(); });
  ctx.setLineDash([]);
}

function drawTour(tour, color, alpha=1){
  if(!tour||tour.length<2) return;
  ctx.globalAlpha = alpha;
  ctx.strokeStyle=color; ctx.lineWidth=2.5; ctx.shadowColor=color; ctx.shadowBlur=7;
  ctx.beginPath();
  ctx.moveTo(S.cities[tour[0]][0], S.cities[tour[0]][1]);
  for(let i=1;i<tour.length;i++){
    const c=S.cities[tour[i]]; if(c) ctx.lineTo(c[0],c[1]);
  }
  ctx.stroke(); ctx.shadowBlur=0;
  if(tour.length>=2) drawArrow(S.cities[tour[0]], S.cities[tour[1]], color);
  ctx.globalAlpha=1;
}

function drawAllTours(){
  if(!S.results) return;
  const algos = ["nearest_neighbor","mst","two_opt"];
  algos.forEach(a=>{
    const t = S.results[a]?.tour;
    if(t) drawTour(t, C[a], 0.7);
  });
}

function drawArrow(from, to, color){
  const dx=to[0]-from[0], dy=to[1]-from[1], len=Math.sqrt(dx*dx+dy*dy);
  if(len<25) return;
  const mx=from[0]+dx*.5, my=from[1]+dy*.5, a=Math.atan2(dy,dx), s=7;
  ctx.fillStyle=color;
  ctx.beginPath(); ctx.moveTo(mx+s*Math.cos(a),my+s*Math.sin(a));
  ctx.lineTo(mx+s*Math.cos(a+2.5),my+s*Math.sin(a+2.5));
  ctx.lineTo(mx+s*Math.cos(a-2.5),my+s*Math.sin(a-2.5));
  ctx.closePath(); ctx.fill();
}

function drawCities(){
  S.cities.forEach((c,i)=>{
    ctx.beginPath(); ctx.arc(c[0],c[1],10,0,Math.PI*2);
    ctx.fillStyle="rgba(255,255,255,0.05)"; ctx.fill();
    ctx.beginPath(); ctx.arc(c[0],c[1],5,0,Math.PI*2);
    ctx.fillStyle=C.city; ctx.shadowColor="rgba(255,255,255,0.5)"; ctx.shadowBlur=6; ctx.fill(); ctx.shadowBlur=0;
    ctx.fillStyle="rgba(255,255,255,0.5)"; ctx.font="bold 10px Inter";
    ctx.fillText(i, c[0]+8, c[1]-6);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PLAYBACK
// ─────────────────────────────────────────────────────────────────────────────
function steps(){ return S.results?.[S.algo]?.steps || []; }

function setStep(n){
  const st = steps();
  S.step = Math.max(0,Math.min(n, st.length-1));
  draw();
  updateProgress();
  const info = st[S.step];
  if(info?.action) actionLog.textContent = info.action;
}

function updateProgress(){
  const total=steps().length;
  pfill.style.width = total>1 ? ((S.step/(total-1))*100)+"%":"0%";
  stepLbl.textContent = total ? `${S.step+1} / ${total}` : "—";
}

function play(){
  S.playing=true; btnPlay.textContent="⏸"; tick();
}
function pause(){
  clearTimeout(S.timer); S.timer=null; S.playing=false; btnPlay.textContent="▶";
}
function tick(){
  if(S.step>=steps().length-1){ pause(); return; }
  setStep(S.step+1);
  const delay=800-parseInt(speed.value);
  S.timer=setTimeout(tick, Math.max(40,delay));
}
function resetPB(){ pause(); S.step=0; draw(); updateProgress(); actionLog.textContent="—"; }
function enablePB(){ [btnPlay,btnFwd,btnBack,btnRst].forEach(b=>b.disabled=false); }
function disablePB(){ [btnPlay,btnFwd,btnBack,btnRst].forEach(b=>b.disabled=true); }

// ─────────────────────────────────────────────────────────────────────────────
//  NP INFO
// ─────────────────────────────────────────────────────────────────────────────
function updateNP(n){
  nCities.textContent=n;
  if(n<=13){
    let f=1; for(let i=1;i<=n-1;i++) f*=i;
    nPerms.textContent = Math.floor(f/2).toLocaleString();
  } else {
    const exp=Math.round((n-1)*Math.log10(n-1)-(n-1)*Math.log10(Math.E));
    nPerms.textContent=`~10^${exp}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  RESULTS PANEL
// ─────────────────────────────────────────────────────────────────────────────
function showResults(data){
  resultsCard.style.display="flex";
  const dnn=data.nearest_neighbor.distance, dmst=data.mst.distance, dopt=data.two_opt.distance;
  document.getElementById("d-nn").textContent=dnn.toFixed(1);
  document.getElementById("d-mst").textContent=dmst.toFixed(1);
  document.getElementById("d-opt").textContent=dopt.toFixed(1);
  ["ri-nn","ri-mst","ri-opt"].forEach(id=>document.getElementById(id).classList.remove("best"));
  const best=Math.min(dnn,dmst,dopt);
  if(best===dopt) document.getElementById("ri-opt").classList.add("best");
  else if(best===dmst) document.getElementById("ri-mst").classList.add("best");
  else document.getElementById("ri-nn").classList.add("best");
  // improvement bar
  const improvPct = ((dnn-dopt)/dnn*100);
  const ib=document.getElementById("improvementBar");
  ib.style.display="block";
  document.getElementById("ibFill").style.width=Math.max(0,improvPct).toFixed(1)+"%";
  document.getElementById("ibPct").textContent=improvPct.toFixed(1)+"% shorter than greedy";
}

// ─────────────────────────────────────────────────────────────────────────────
//  API
// ─────────────────────────────────────────────────────────────────────────────
async function randomCities(){
  const n=parseInt(document.getElementById("cityCount").value)||20;
  const r=await fetch("/api/random_cities",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({n})});
  const d=await r.json();
  S.cities=d.cities; S.results=null;
  disablePB(); resultsCard.style.display="none"; resetPB();
  updateNP(S.cities.length);
  statusMsg.textContent=`${S.cities.length} cities ready — click Solve All`;
  draw();
}

async function solve(){
  if(S.cities.length<4){ statusMsg.textContent="⚠ Place at least 4 cities first!"; return; }
  statusMsg.textContent="⏳ Solving..."; btnSolve.disabled=true;
  const r=await fetch("/api/solve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cities:S.cities})});
  const data=await r.json();
  S.results=data; S.step=0;
  btnSolve.disabled=false;
  statusMsg.textContent="✅ Done! Select an algorithm and press ▶ to animate.";
  showResults(data); enablePB(); draw(); updateProgress();
}

// ─────────────────────────────────────────────────────────────────────────────
//  EVENTS
// ─────────────────────────────────────────────────────────────────────────────
canvas.addEventListener("click",e=>{
  S.cities.push(canvasXY(e)); S.results=null;
  disablePB(); resultsCard.style.display="none";
  updateNP(S.cities.length);
  statusMsg.textContent=`${S.cities.length} cities placed`;
  draw();
});

btnRandom.addEventListener("click", randomCities);
btnClear.addEventListener("click",()=>{
  S.cities=[]; S.results=null; disablePB(); resultsCard.style.display="none";
  statusMsg.textContent="Click the map to place cities"; resetPB(); draw();
});
btnSolve.addEventListener("click", solve);
btnPlay.addEventListener("click",()=> S.playing ? pause() : play());
btnFwd.addEventListener("click",()=>{ pause(); setStep(S.step+1); });
btnBack.addEventListener("click",()=>{ pause(); setStep(S.step-1); });
btnRst.addEventListener("click", resetPB);

document.querySelectorAll('input[name="algo"]').forEach(r=>{
  r.addEventListener("change",e=>{
    S.algo=e.target.value;
    document.querySelectorAll(".radio-opt").forEach(c=>c.classList.remove("active"));
    e.target.closest(".radio-opt").classList.add("active");
    resetPB(); draw(); updateProgress();
  });
});

document.querySelectorAll(".vtab").forEach(t=>{
  t.addEventListener("click",()=>{
    document.querySelectorAll(".vtab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active"); S.view=t.dataset.view; draw();
  });
});

speed.addEventListener("input",()=>{
  const v=parseInt(speed.value);
  speedVal.textContent=v<300?"Slow":v<550?"Mid":"Fast";
});

// ─────────────────────────────────────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────────────────────────────────────
updateNP(20);
disablePB();
draw();
