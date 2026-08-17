
const CARS = [
  { id: "s", name: "Model S", src: "racers/model-s-racer.webp" },
  { id: "3", name: "Model 3", src: "racers/model-3-racer.webp" },
  { id: "x", name: "Model X", src: "racers/model-x-racer.webp" },
  { id: "y", name: "Model Y", src: "racers/model-y-racer.webp" },
  { id: "star", name: "Starship", src: "racers/starship-racer.webp" },
  { id: "doge", name: "Doge Shiba Inu", src: "racers/doge-racer.webp" },
];

const state = {
  players: 6,
  seconds: 20,
  announcer: true,
  sound: true,
  drivers: [],
};

const $ = (id) => document.getElementById(id);
const show = (id) => {
  ["intro", "setup1", "setup2", "race", "results"].forEach((k) => $(k).classList.add("hidden"));
  $(id).classList.remove("hidden");
};

function speak(text) {
  if (!state.announcer || !state.sound || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.05;
  u.pitch = 0.9;
  speechSynthesis.speak(u);
}

function chips(el, values, key, fmt) {
  el.innerHTML = "";
  values.forEach((v) => {
    const b = document.createElement("button");
    b.className = "chip" + (state[key] === v ? " on" : "");
    b.textContent = fmt ? fmt(v) : v;
    b.onclick = () => {
      state[key] = v;
      chips(el, values, key, fmt);
    };
    el.appendChild(b);
  });
}

function renderSetup1() {
  chips($("playerCount"), [1, 2, 3, 4, 5, 6], "players", (n) => n + (n === 1 ? " PLAYER" : " PLAYERS"));
  chips($("raceLen"), [10, 20, 30, 40], "seconds", (n) => n + " SEC");
}

function renderDrivers() {
  const names = ["SEVO", "PAPI", "CLAUDIA", "ELON", "BDB", "DOGE"];
  if (state.drivers.length !== state.players) {
    state.drivers = Array.from({ length: state.players }, (_, i) => ({
      name: names[i] || "RACER " + (i + 1),
      car: CARS[i % CARS.length].id,
    }));
  }
  const box = $("driverCards");
  box.innerHTML = "";
  state.drivers.forEach((d, i) => {
    const car = CARS.find((c) => c.id === d.car) || CARS[0];
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<img src="${car.src}" alt="${car.name}" /><input value="${d.name}" /><select>${CARS.map((c) => `<option value="${c.id}" ${c.id === d.car ? "selected" : ""}>${c.name}</option>`).join("")}</select>`;
    card.querySelector("input").oninput = (e) => (d.name = e.target.value);
    card.querySelector("select").onchange = (e) => {
      d.car = e.target.value;
      renderDrivers();
    };
    box.appendChild(card);
  });
}

function fmt(t) {
  const s = Math.max(0, t);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(Math.floor(s % 60)).padStart(2, "0");
  const cs = String(Math.floor((s % 1) * 100)).padStart(2, "0");
  return `${mm}:${ss}:${cs}`;
}

function startRace() {
  show("race");
  const bgm = $("bgm");
  if (state.sound) bgm.play().catch(() => {});
  const lanes = $("lanes");
  lanes.innerHTML = "";
  const racers = state.drivers.map((d) => {
    const car = CARS.find((c) => c.id === d.car) || CARS[0];
    const lane = document.createElement("div");
    lane.className = "lane";
    lane.innerHTML = `<span class="name">${d.name} · ${car.name}</span><img class="car" src="${car.src}" alt="" />`;
    lanes.appendChild(lane);
    return { ...d, car, progress: 0, burst: 0.6 + Math.random() * 0.8, el: lane.querySelector(".car") };
  });
  const count = $("count");
  count.classList.remove("hidden");
  let n = 3;
  count.textContent = "3";
  speak("Start your engines. Three.");
  const cd = setInterval(() => {
    n -= 1;
    if (n > 0) {
      count.textContent = String(n);
      speak(String(n));
    } else {
      clearInterval(cd);
      count.textContent = "GO";
      speak("Go. Sevo presents Gas Station Stadium.");
      setTimeout(() => count.classList.add("hidden"), 400);
      run(racers);
    }
  }, 800);
}

function run(racers) {
  const total = state.seconds;
  let left = total;
  const t0 = performance.now();
  const tick = (now) => {
    const elapsed = (now - t0) / 1000;
    left = total - elapsed;
    $("timer").textContent = fmt(left);
    const maxW = $("lanes").clientWidth - 90;
    racers.forEach((r) => {
      r.progress += (0.35 + Math.random() * r.burst) * (1 / 60);
      const pct = Math.min(1, r.progress / (total * 0.55));
      r.el.style.left = pct * maxW + "px";
    });
    if (left > 0) requestAnimationFrame(tick);
    else finish(racers);
  };
  requestAnimationFrame(tick);
}

function finish(racers) {
  const order = [...racers].sort((a, b) => b.progress - a.progress);
  show("results");
  $("champ").textContent = order[0].name.toUpperCase();
  speak("Champion. " + order[0].name + ". Gas Station Stadium.");
  $("podium").innerHTML = order
    .map((r, i) => `<div class="place"><b>0${i + 1}</b><img src="${r.car.src}" alt="" /><span>${r.name} · ${r.car.name}</span></div>`)
    .join("");
}

$("playIntro").onclick = () => {
  const v = $("introVid");
  v.muted = false;
  v.currentTime = 0;
  v.play().catch(() => {});
  if (state.sound) $("bgm").play().catch(() => {});
  speak("Sevo presents. A Gas Station Stadium film.");
};
$("skipIntro").onclick = () => {
  $("introVid").pause();
  show("setup1");
  renderSetup1();
};
$("introVid").onended = () => {
  show("setup1");
  renderSetup1();
};
$("announcer").onchange = (e) => (state.announcer = e.target.checked);
$("toNames").onclick = () => {
  show("setup2");
  renderDrivers();
};
$("startRace").onclick = startRace;
$("again").onclick = startRace;
$("change").onclick = () => {
  show("setup2");
  renderDrivers();
};
$("exitRace").onclick = () => {
  show("setup1");
  renderSetup1();
};
$("mute").onclick = () => {
  state.sound = !state.sound;
  const bgm = $("bgm");
  if (!state.sound) bgm.pause();
  else bgm.play().catch(() => {});
  $("mute").textContent = state.sound ? "SOUND" : "MUTED";
};

renderSetup1();
