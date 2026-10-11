/* Starship Tower — EXAMPLE Mechazilla catch theater (offline, no APIs) */
(function () {
  "use strict";

  const PHASES = [
    { id: "idle", label: "PAD IDLE", t0: 0, t1: 0.12 },
    { id: "liftoff", label: "LIFTOFF TRAIL", t0: 0.12, t1: 0.32 },
    { id: "boostback", label: "BOOSTBACK", t0: 0.32, t1: 0.55 },
    { id: "catch", label: "CATCH ATTEMPT", t0: 0.55, t1: 0.82 },
    { id: "result", label: "RESULT", t0: 0.82, t1: 1.0 }
  ];

  const FLEET = [
    { serial: "S-DEMO-1", kind: "Starship · upper stage (EXAMPLE)", status: "stack", chip: "busy", note: "Demo stack mate for wall theater", fill: 72 },
    { serial: "S-DEMO-2", kind: "Starship · upper stage (EXAMPLE)", status: "pad", chip: "idle", note: "Placeholder pad hold — not a live vehicle", fill: 40 },
    { serial: "S-DEMO-3", kind: "Starship · upper stage (EXAMPLE)", status: "bay", chip: "warn", note: "EXAMPLE bay work — fictional", fill: 28 },
    { serial: "B-DEMO-1", kind: "Super Heavy · booster (EXAMPLE)", status: "catch", chip: "busy", note: "Chopsticks theater subject", fill: 88 },
    { serial: "B-DEMO-2", kind: "Super Heavy · booster (EXAMPLE)", status: "refurb", chip: "ok", note: "Demo refurb chip only", fill: 55 },
    { serial: "B-DEMO-3", kind: "Super Heavy · booster (EXAMPLE)", status: "storage", chip: "idle", note: "EXAMPLE storage row", fill: 15 },
    { serial: "TWR-DEMO", kind: "Mechazilla tower (EXAMPLE)", status: "armed", chip: "ok", note: "Arms stow / deploy sim", fill: 95 },
    { serial: "QL-DEMO-A", kind: "Quick-look camera (EXAMPLE)", status: "rec", chip: "busy", note: "Decorative feed label", fill: 60 }
  ];

  const BATCHES = [
    { name: "DEMO Batch Alpha", val: "≈ 22 sats", desc: "Fictional batch size for the strip — not a real deploy." },
    { name: "DEMO Batch Bravo", val: "≈ 20 sats", desc: "Placeholder constellation fill. No orbital elements." },
    { name: "DEMO Plane Sketch", val: "6 planes", desc: "Decorative plane count for animation density." },
    { name: "DEMO Inclination", val: "~53° label", desc: "Atmosphere-only label. Not ephemeris." },
    { name: "DEMO Link Theme", val: "Ku / Ka vibe", desc: "Product-name mood only — offline dots." }
  ];

  const MILESTONES = [
    { t: -600, label: "T−10:00", name: "EXAMPLE go/no-go poll" },
    { t: -120, label: "T−2:00", name: "EXAMPLE tank press" },
    { t: 0, label: "T−0", name: "EXAMPLE liftoff mark" },
    { t: 120, label: "T+2:00", name: "EXAMPLE stage sep vibe" },
    { t: 480, label: "T+8:00", name: "EXAMPLE boostback window" }
  ];

  /* ---------- state ---------- */
  const state = {
    tab: "tower",
    playing: false,
    progress: 0,          // 0..1 tower sequence
    speed: 1,
    outcome: "catch",     // catch | miss
    countProgress: 0,     // 0..1 over T-10m .. T+8m
    countPlaying: false,
    countSpeed: 10,
    slSpin: true,
    slDensity: 64,
    wall: false,
    telemHistory: []
  };

  const SEQ_DURATION = 28; // seconds at 1× for full tower sequence
  const COUNT_SPAN = 600 + 480; // seconds from T-10m to T+8m

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const phaseAt = (p) => {
    for (const ph of PHASES) if (p >= ph.t0 && p < ph.t1) return ph;
    return PHASES[PHASES.length - 1];
  };
  const fmtClock = (sec) => {
    const sign = sec < 0 ? "−" : "+";
    const s = Math.abs(Math.floor(sec));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const r = s % 60;
    if (h > 0) return `T${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
    return `T${sign}${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };
  const countSeconds = (prog) => lerp(-600, 480, prog);

  /* ---------- background stars ---------- */
  function initStars() {
    const c = $("#bgStars");
    if (!c) return;
    const ctx = c.getContext("2d");
    let stars = [];
    const resize = () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      stars = Array.from({ length: 140 }, () => ({
        x: Math.random() * c.width,
        y: Math.random() * c.height,
        r: Math.random() * 1.4 + 0.2,
        a: Math.random() * 0.7 + 0.15,
        tw: Math.random() * Math.PI * 2
      }));
    };
    resize();
    window.addEventListener("resize", resize);
    let t0 = performance.now();
    (function loop(now) {
      const dt = (now - t0) / 1000;
      t0 = now;
      ctx.clearRect(0, 0, c.width, c.height);
      for (const s of stars) {
        s.tw += dt * 1.5;
        const a = s.a * (0.65 + 0.35 * Math.sin(s.tw));
        ctx.fillStyle = `rgba(220,230,255,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // faint horizon glow
      const g = ctx.createLinearGradient(0, c.height * 0.7, 0, c.height);
      g.addColorStop(0, "rgba(255,107,44,0)");
      g.addColorStop(1, "rgba(255,107,44,0.06)");
      ctx.fillStyle = g;
      ctx.fillRect(0, c.height * 0.7, c.width, c.height * 0.3);
      requestAnimationFrame(loop);
    })(performance.now());
  }

  /* ---------- particles ---------- */
  function makeParticles(n) {
    return Array.from({ length: n }, () => ({
      x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, r: 2, hue: 30
    }));
  }
  function burst(parts, x, y, n, power, hue) {
    let used = 0;
    for (const p of parts) {
      if (used >= n) break;
      if (p.life <= 0) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const spd = power * (0.5 + Math.random());
        p.x = x; p.y = y;
        p.vx = Math.cos(ang) * spd * (Math.random() > 0.5 ? 1 : -0.3);
        p.vy = Math.sin(ang) * spd;
        p.life = p.max = 0.4 + Math.random() * 0.7;
        p.r = 1.5 + Math.random() * 3.5;
        p.hue = hue + Math.random() * 25;
        used++;
      }
    }
  }
  function stepParticles(parts, dt) {
    for (const p of parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 8 * dt;
      p.vx *= 0.98;
    }
  }
  function drawParticles(ctx, parts) {
    for (const p of parts) {
      if (p.life <= 0) continue;
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},100%,60%,${a * 0.85})`;
      ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- tower theater ---------- */
  const towerParts = makeParticles(180);
  let towerTrail = [];

  function towerPose(p, outcome) {
    // Returns positions for booster + arms given progress 0..1
    const ph = phaseAt(p);
    let boostY = 0.82; // normalized from top
    let boostX = 0.42;
    let boostRot = 0;
    let armOpen = 0.15; // 0 stowed-ish, 1 closed on booster
    let flame = 0;
    let ascending = false;

    if (ph.id === "idle") {
      boostY = 0.82;
      boostX = 0.42;
      armOpen = 0.12;
      flame = 0;
    } else if (ph.id === "liftoff") {
      const u = easeInOut((p - ph.t0) / (ph.t1 - ph.t0));
      boostY = lerp(0.82, 0.12, u);
      boostX = 0.42 + Math.sin(u * Math.PI) * 0.02;
      flame = 1;
      ascending = true;
      armOpen = 0.1;
      towerTrail.push({ x: boostX, y: boostY, a: 1 });
    } else if (ph.id === "boostback") {
      const u = easeInOut((p - ph.t0) / (ph.t1 - ph.t0));
      boostY = lerp(0.12, 0.35, u);
      boostX = lerp(0.44, 0.58, u);
      boostRot = lerp(0, -0.35, u);
      flame = 0.55 + 0.35 * Math.sin(u * Math.PI * 4);
      armOpen = lerp(0.1, 0.45, u);
    } else if (ph.id === "catch") {
      const u = easeInOut((p - ph.t0) / (ph.t1 - ph.t0));
      boostY = lerp(0.35, 0.48, u);
      boostX = lerp(0.58, 0.62, u);
      boostRot = lerp(-0.35, 0, u);
      flame = lerp(0.7, 0.15, u);
      armOpen = lerp(0.45, 0.92, u);
    } else {
      const u = easeInOut((p - ph.t0) / (ph.t1 - ph.t0));
      if (outcome === "catch") {
        boostY = lerp(0.48, 0.46, u);
        boostX = 0.62;
        boostRot = Math.sin(u * Math.PI * 2) * 0.02;
        armOpen = 1;
        flame = 0;
      } else {
        boostY = lerp(0.48, 0.92, u);
        boostX = lerp(0.62, 0.72, u);
        boostRot = lerp(0, 0.4, u);
        armOpen = lerp(0.92, 0.5, u);
        flame = 0.2;
      }
    }
    if (towerTrail.length > 90) towerTrail.splice(0, towerTrail.length - 90);
    for (const t of towerTrail) t.a *= 0.985;

    return { boostX, boostY, boostRot, armOpen, flame, ascending, phase: ph };
  }

  function drawTower(ctx, W, H, pose, dt) {
    ctx.clearRect(0, 0, W, H);
    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#06080f");
    sky.addColorStop(0.55, "#0c1018");
    sky.addColorStop(1, "#1a140e");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ground / gulf haze
    const ground = ctx.createLinearGradient(0, H * 0.78, 0, H);
    ground.addColorStop(0, "rgba(40,30,20,0)");
    ground.addColorStop(0.4, "rgba(50,38,22,0.5)");
    ground.addColorStop(1, "#1c1610");
    ctx.fillStyle = ground;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);

    // pad
    const padX = W * 0.28;
    const padY = H * 0.86;
    ctx.fillStyle = "#2a303c";
    ctx.fillRect(padX - 70, padY, 140, 14);
    ctx.fillStyle = "#3a4252";
    ctx.fillRect(padX - 50, padY - 6, 100, 6);

    // Mechazilla tower structure (right side)
    const twX = W * 0.62;
    const twTop = H * 0.08;
    const twBot = H * 0.88;
    const twW = 28;

    // lattice
    ctx.strokeStyle = "#6a7384";
    ctx.lineWidth = 2;
    ctx.fillStyle = "#3d4558";
    ctx.fillRect(twX - twW / 2, twTop, twW, twBot - twTop);
    ctx.strokeStyle = "#9aa3b5";
    ctx.lineWidth = 1.5;
    for (let y = twTop; y < twBot; y += 28) {
      ctx.beginPath();
      ctx.moveTo(twX - twW / 2, y);
      ctx.lineTo(twX + twW / 2, y + 14);
      ctx.moveTo(twX + twW / 2, y);
      ctx.lineTo(twX - twW / 2, y + 14);
      ctx.stroke();
    }
    // crown
    ctx.fillStyle = "#c8d0dc";
    ctx.fillRect(twX - 40, twTop - 8, 80, 12);
    ctx.fillStyle = "#ff6b2c";
    ctx.fillRect(twX - 6, twTop - 18, 12, 10);

    // chopsticks arms
    const armY = H * 0.46;
    const open = pose.armOpen;
    const reach = lerp(50, 118, open);
    const ang = lerp(-0.55, -0.08, open);
    drawChopstick(ctx, twX - twW / 2, armY, -1, reach, ang, open);
    drawChopstick(ctx, twX + twW / 2, armY, 1, reach, ang, open);

    // trail
    for (const t of towerTrail) {
      if (t.a < 0.05) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,140,60,${t.a * 0.35})`;
      ctx.arc(t.x * W, t.y * H, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // booster / ship
    const bx = pose.boostX * W;
    const by = pose.boostY * H;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(pose.boostRot);
    drawBooster(ctx, pose.flame > 0.05);
    ctx.restore();

    // flames / particles
    if (pose.flame > 0.05) {
      const n = Math.floor(8 * pose.flame);
      const dir = pose.ascending ? 1 : -0.2;
      burst(towerParts, bx, by + 55, n, 3.5 * pose.flame, 25);
      // engine plume
      const pg = ctx.createRadialGradient(bx, by + 50, 2, bx, by + 50 + 40 * pose.flame, 50);
      pg.addColorStop(0, `rgba(255,220,140,${0.7 * pose.flame})`);
      pg.addColorStop(0.4, `rgba(255,100,40,${0.45 * pose.flame})`);
      pg.addColorStop(1, "rgba(255,60,20,0)");
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.ellipse(bx, by + 70 * pose.flame * (pose.ascending ? 1 : 0.6), 18 * pose.flame, 50 * pose.flame, 0, 0, Math.PI * 2);
      ctx.fill();
      void dir;
    }
    stepParticles(towerParts, dt);
    drawParticles(ctx, towerParts);

    // EXAMPLE watermark
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ff6b2c";
    ctx.font = "bold 64px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("EXAMPLE", W / 2, H * 0.55);
    ctx.restore();

    // base label
    ctx.fillStyle = "rgba(200,208,220,0.45)";
    ctx.font = "11px ui-monospace,monospace";
    ctx.fillText("MECHAZILLA · DEMO THEATER", 16, H - 16);
  }

  function drawChopstick(ctx, x, y, side, reach, ang, open) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * ang);
    // arm beam
    const grad = ctx.createLinearGradient(0, 0, side * reach, 0);
    grad.addColorStop(0, "#8a93a5");
    grad.addColorStop(1, "#d0d6e2");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(side * reach, 0);
    ctx.stroke();
    // tip grippers
    ctx.strokeStyle = "#ff8a4c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(side * reach, -8);
    ctx.lineTo(side * (reach + 8), 0);
    ctx.lineTo(side * reach, 8);
    ctx.stroke();
    // hydraulic glow when nearly closed
    if (open > 0.7) {
      ctx.strokeStyle = `rgba(61,214,140,${(open - 0.7) * 2})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(side * (reach - 20), -6, side * 18, 12);
    }
    ctx.restore();
  }

  function drawBooster(ctx, lit) {
    // Super Heavy-ish stack silhouette
    const body = ctx.createLinearGradient(-18, -60, 18, 70);
    body.addColorStop(0, "#d8dde8");
    body.addColorStop(0.5, "#9aa3b5");
    body.addColorStop(1, "#5c6478");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-16, -55);
    ctx.lineTo(16, -55);
    ctx.lineTo(20, 60);
    ctx.lineTo(-20, 60);
    ctx.closePath();
    ctx.fill();
    // grid fins vibe
    ctx.fillStyle = "#6a7384";
    ctx.fillRect(-28, -20, 10, 18);
    ctx.fillRect(18, -20, 10, 18);
    // china / black tiles nod (decorative)
    ctx.fillStyle = "rgba(20,22,28,0.55)";
    ctx.fillRect(-14, 10, 28, 40);
    // DEMO band
    ctx.fillStyle = "#ff6b2c";
    ctx.fillRect(-16, -40, 32, 5);
    ctx.fillStyle = lit ? "#ffd28a" : "#3a4252";
    ctx.beginPath();
    ctx.arc(0, 58, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function updateTowerHUD(pose) {
    const ph = pose.phase;
    $("#hudPhase").textContent = `PHASE · ${ph.label}`;
    $("#phasePill").textContent = ph.label;
    let arms = "STOWED";
    if (pose.armOpen > 0.85) arms = "LOCKED";
    else if (pose.armOpen > 0.4) arms = "DEPLOYING";
    else if (pose.armOpen > 0.2) arms = "ARMING";
    $("#hudArms").textContent = `CHOPSTICKS · ${arms}`;

    let booster = "ON PAD";
    if (ph.id === "liftoff") booster = "ASCENT";
    else if (ph.id === "boostback") booster = "BOOSTBACK BURN";
    else if (ph.id === "catch") booster = "TOWER APPROACH";
    else if (ph.id === "result") booster = state.outcome === "catch" ? "TOWER HOLD" : "MISS / DIVERT";
    $("#hudBooster").textContent = `BOOSTER · ${booster}`;

    if (ph.id === "result") {
      $("#hudOutcome").textContent = state.outcome === "catch" ? "OUTCOME · CATCH (DEMO)" : "OUTCOME · MISS (DEMO)";
    } else {
      $("#hudOutcome").textContent = "OUTCOME · —";
    }

    $$("#phaseList li").forEach((li) => {
      const id = li.getAttribute("data-p");
      li.classList.toggle("on", id === ph.id);
      const idx = PHASES.findIndex((x) => x.id === id);
      const cur = PHASES.findIndex((x) => x.id === ph.id);
      li.classList.toggle("done", idx < cur);
    });

    const glow = $("#flameGlow");
    if (glow) glow.classList.toggle("on", pose.flame > 0.2);

    // mission clock approx from sequence
    const tApprox = lerp(-30, 480, state.progress);
    $("#missionClock").textContent = fmtClock(tApprox);
  }

  function initTower() {
    const canvas = $("#towerCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let last = performance.now();
    let pose = towerPose(0, state.outcome);

    (function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state.playing) {
        state.progress = clamp(state.progress + (dt * state.speed) / SEQ_DURATION, 0, 1);
        if (state.progress >= 1) state.playing = false;
        const scrub = $("#towerScrub");
        if (scrub && document.activeElement !== scrub) scrub.value = String(Math.round(state.progress * 1000));
        syncPlayButton();
      }
      pose = towerPose(state.progress, state.outcome);
      drawTower(ctx, canvas.width, canvas.height, pose, dt);
      updateTowerHUD(pose);
      pushTelemSample(pose);
      requestAnimationFrame(frame);
    })(performance.now());

    $("#towerScrub")?.addEventListener("input", (e) => {
      state.progress = (+e.target.value) / 1000;
      state.playing = false;
      syncPlayButton();
    });
    $("#btnPlay")?.addEventListener("click", () => {
      if (state.progress >= 1) state.progress = 0;
      state.playing = !state.playing;
      syncPlayButton();
    });
    $("#btnReset")?.addEventListener("click", () => {
      state.progress = 0;
      state.playing = false;
      towerTrail = [];
      $("#towerScrub").value = "0";
      syncPlayButton();
    });
    $("#btnCatch")?.addEventListener("click", () => { state.outcome = "catch"; });
    $("#btnMiss")?.addEventListener("click", () => { state.outcome = "miss"; });
    $("#speedSel")?.addEventListener("change", (e) => { state.speed = +e.target.value; });
  }

  function syncPlayButton() {
    const b = $("#btnPlay");
    if (!b) return;
    b.textContent = state.playing ? "❚❚ Pause" : (state.progress > 0 && state.progress < 1 ? "▶ Resume" : "▶ Run Sequence");
  }

  /* ---------- countdown ---------- */
  function initCountdown() {
    const strip = $("#milestoneStrip");
    if (strip) {
      strip.innerHTML = MILESTONES.map((m) =>
        `<div class="ms" data-t="${m.t}"><span class="t">${m.label}</span>${m.name}</div>`
      ).join("");
    }
    const scrub = $("#countScrub");
    const render = () => {
      const sec = countSeconds(state.countProgress);
      $("#bigClock").textContent = fmtClock(sec);
      $("#clockProgress").textContent = `${Math.round(state.countProgress * 100)}%`;
      let label = "Pre-flight hold (demo)";
      if (sec >= 480) label = "EXAMPLE late ascent window";
      else if (sec >= 120) label = "EXAMPLE early ascent";
      else if (sec >= 0) label = "EXAMPLE liftoff + climb";
      else if (sec >= -120) label = "EXAMPLE final count";
      $("#clockPhaseLabel").textContent = label;
      $$(".ms").forEach((el) => {
        const t = +el.getAttribute("data-t");
        el.classList.toggle("on", Math.abs(sec - t) < 45 || (sec >= t && sec < t + 90));
      });
      if (scrub && document.activeElement !== scrub) scrub.value = String(Math.round(state.countProgress * 1000));
    };
    scrub?.addEventListener("input", (e) => {
      state.countProgress = (+e.target.value) / 1000;
      state.countPlaying = false;
      syncCountBtn();
      render();
    });
    $("#btnCountPlay")?.addEventListener("click", () => {
      if (state.countProgress >= 1) state.countProgress = 0;
      state.countPlaying = !state.countPlaying;
      syncCountBtn();
    });
    $("#btnCountReset")?.addEventListener("click", () => {
      state.countProgress = 0;
      state.countPlaying = false;
      syncCountBtn();
      render();
    });
    $("#countSpeed")?.addEventListener("change", (e) => { state.countSpeed = +e.target.value; });

    let last = performance.now();
    (function loop(now) {
      const dt = (now - last) / 1000;
      last = now;
      if (state.countPlaying) {
        state.countProgress = clamp(state.countProgress + (dt * state.countSpeed) / COUNT_SPAN, 0, 1);
        if (state.countProgress >= 1) state.countPlaying = false;
        syncCountBtn();
      }
      render();
      requestAnimationFrame(loop);
    })(performance.now());
  }
  function syncCountBtn() {
    const b = $("#btnCountPlay");
    if (b) b.textContent = state.countPlaying ? "❚❚ Pause Clock" : "▶ Advance Clock";
  }

  /* ---------- fleet ---------- */
  function initFleet() {
    const grid = $("#fleetGrid");
    if (!grid) return;
    const statusLabel = { stack: "In stack", pad: "On pad", bay: "High bay", catch: "Catch theater", refurb: "Refurb", storage: "Storage", armed: "Arms armed", rec: "Recording" };
    grid.innerHTML = FLEET.map((v) => `
      <article class="fleet-card">
        <div class="serial">${v.serial}</div>
        <div class="kind">${v.kind}</div>
        <div class="chip-row">
          <span class="chip ${v.chip}">${statusLabel[v.status] || v.status}</span>
          <span class="chip demo">EXAMPLE</span>
        </div>
        <div class="fleet-meta">${v.note}</div>
        <div class="bar" aria-hidden="true"><i style="width:${v.fill}%"></i></div>
      </article>`).join("");
  }

  /* ---------- starlink strip ---------- */
  let slSats = [];
  function rebuildSats(n) {
    slSats = Array.from({ length: n }, (_, i) => ({
      plane: i % 6,
      u: Math.random(),
      speed: 0.02 + Math.random() * 0.04,
      r: 1.2 + Math.random() * 1.8,
      bright: 0.4 + Math.random() * 0.6
    }));
  }
  function initStarlink() {
    const canvas = $("#slCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    rebuildSats(state.slDensity);
    const list = $("#batchList");
    if (list) {
      list.innerHTML = BATCHES.map((b) =>
        `<li><span class="bn">${b.name}</span><span class="bv">${b.val}</span><span class="bd">${b.desc}</span></li>`
      ).join("");
    }
    $("#btnSlSpin")?.addEventListener("click", () => { state.slSpin = true; });
    $("#btnSlPause")?.addEventListener("click", () => { state.slSpin = false; });
    $("#slDensity")?.addEventListener("input", (e) => {
      state.slDensity = +e.target.value;
      rebuildSats(state.slDensity);
    });

    let last = performance.now();
    (function frame(now) {
      const dt = (now - last) / 1000;
      last = now;
      drawStarlink(ctx, canvas.width, canvas.height, dt);
      requestAnimationFrame(frame);
    })(performance.now());
  }

  function drawStarlink(ctx, W, H, dt) {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#05070e");
    g.addColorStop(1, "#10141e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Earth arc
    ctx.beginPath();
    ctx.fillStyle = "#142032";
    ctx.ellipse(W / 2, H + 40, W * 0.55, H * 0.55, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,107,44,0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(W / 2, H + 40, W * 0.55, H * 0.55, 0, Math.PI, 0, true);
    ctx.stroke();

    // orbital tracks
    for (let i = 0; i < 6; i++) {
      const ry = H * (0.22 + i * 0.08);
      const rx = W * (0.38 + i * 0.04);
      ctx.strokeStyle = `rgba(150,170,200,${0.08 + i * 0.02})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.72, rx, ry, -0.15 + i * 0.04, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const s of slSats) {
      if (state.slSpin) s.u = (s.u + s.speed * dt) % 1;
      const i = s.plane;
      const ry = H * (0.22 + i * 0.08);
      const rx = W * (0.38 + i * 0.04);
      const ang = s.u * Math.PI * 2 - 0.15 + i * 0.04;
      const cx = W / 2 + Math.cos(ang) * rx;
      const cy = H * 0.72 + Math.sin(ang) * ry;
      // only draw "above" earth-ish
      if (cy > H * 0.85) continue;
      ctx.beginPath();
      ctx.fillStyle = `rgba(200,220,255,${s.bright})`;
      ctx.arc(cx, cy, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.bright > 0.75) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,180,100,${s.bright * 0.35})`;
        ctx.arc(cx, cy, s.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(255,138,76,0.7)";
    ctx.font = "bold 12px system-ui,sans-serif";
    ctx.fillText("DEMO CONSTELLATION · NOT LIVE ORBITS", 18, 28);
  }

  /* ---------- telemetry ---------- */
  function pushTelemSample(pose) {
    const ph = pose.phase;
    let speed = 0, alt = 0, prop = 100, offset = 200;
    if (ph.id === "idle") { speed = 0; alt = 0; prop = 100; offset = 180; }
    else if (ph.id === "liftoff") {
      const u = (state.progress - ph.t0) / (ph.t1 - ph.t0);
      speed = lerp(0, 4500, u);
      alt = lerp(0, 40, u);
      prop = lerp(100, 72, u);
      offset = lerp(180, 400, u);
    } else if (ph.id === "boostback") {
      const u = (state.progress - ph.t0) / (ph.t1 - ph.t0);
      speed = lerp(4500, 1200, u);
      alt = lerp(40, 25, u);
      prop = lerp(72, 48, u);
      offset = lerp(400, 80, u);
    } else if (ph.id === "catch") {
      const u = (state.progress - ph.t0) / (ph.t1 - ph.t0);
      speed = lerp(1200, 40, u);
      alt = lerp(25, 0.2, u);
      prop = lerp(48, 35, u);
      offset = lerp(80, 2, u);
    } else {
      const u = (state.progress - ph.t0) / (ph.t1 - ph.t0);
      if (state.outcome === "catch") {
        speed = lerp(40, 0, u);
        alt = 0.15;
        prop = 34;
        offset = 0.5;
      } else {
        speed = lerp(40, 300, u);
        alt = lerp(0.2, 2, u);
        prop = lerp(35, 30, u);
        offset = lerp(2, 120, u);
      }
    }
    state._telem = { speed, alt, prop, offset, phase: ph.label };
    state.telemHistory.push({ speed, alt, prop, offset });
    if (state.telemHistory.length > 120) state.telemHistory.shift();
  }

  function drawGauge(canvas, value, max, color, label) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2 + 8, R = 78;
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    ctx.strokeStyle = "#252b3a";
    ctx.lineWidth = 12;
    ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25);
    ctx.stroke();
    const t = clamp(value / max, 0, 1);
    const end = Math.PI * 0.75 + t * Math.PI * 1.5;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.arc(cx, cy, R, Math.PI * 0.75, end);
    ctx.stroke();
    // needle
    const ang = Math.PI * 0.75 + t * Math.PI * 1.5;
    ctx.strokeStyle = "#e8ecf4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(ang) * (R - 18), cy + Math.sin(ang) * (R - 18));
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    void label;
  }

  function initTelemetry() {
    $("#btnTelemSync")?.addEventListener("click", () => switchTab("tower"));
    let last = performance.now();
    (function loop(now) {
      const dt = now - last;
      last = now;
      void dt;
      const t = state._telem || { speed: 0, alt: 0, prop: 100, offset: 200, phase: "PAD IDLE" };
      drawGauge($("#gSpeed"), t.speed, 5000, "#ff6b2c");
      drawGauge($("#gAlt"), t.alt, 50, "#ffb347");
      drawGauge($("#gProp"), t.prop, 100, "#3dd68c");
      drawGauge($("#gOffset"), Math.max(0, 200 - t.offset), 200, "#7ec8ff");
      $("#vSpeed").textContent = `${Math.round(t.speed).toLocaleString()} km/h`;
      $("#vAlt").textContent = `${t.alt < 1 ? t.alt.toFixed(2) : t.alt.toFixed(1)} km`;
      $("#vProp").textContent = `${Math.round(t.prop)}%`;
      $("#vOffset").textContent = `${t.offset < 10 ? t.offset.toFixed(1) : Math.round(t.offset)} m`;
      $("#telemPhase").textContent = t.phase;
      drawSpark($("#sparkCanvas"));
      requestAnimationFrame(loop);
    })(performance.now());
  }

  function drawSpark(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(0, 0, W, H);
    const hist = state.telemHistory;
    if (hist.length < 2) return;
    const drawLine = (key, color, max) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      hist.forEach((s, i) => {
        const x = (i / (hist.length - 1)) * (W - 20) + 10;
        const y = H - 12 - (clamp(s[key] / max, 0, 1) * (H - 28));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    drawLine("speed", "#ff6b2c", 5000);
    drawLine("alt", "#ffb347", 50);
    drawLine("prop", "#3dd68c", 100);
    ctx.fillStyle = "rgba(139,147,168,0.7)";
    ctx.font = "10px ui-monospace,monospace";
    ctx.fillText("speed · alt · prop  (EXAMPLE trace)", 12, 14);
  }

  /* ---------- tabs / chrome ---------- */
  function switchTab(id) {
    state.tab = id;
    $$(".tab").forEach((t) => {
      const on = t.getAttribute("data-tab") === id;
      t.classList.toggle("on", on);
      t.setAttribute("aria-selected", on ? "true" : "false");
    });
    $$(".panel").forEach((p) => {
      const on = p.id === `panel-${id}`;
      p.classList.toggle("on", on);
      if (on) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "");
    });
  }

  function initChrome() {
    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.getAttribute("data-tab"))));
    $("#btnWall")?.addEventListener("click", () => {
      state.wall = !state.wall;
      document.body.classList.toggle("wall", state.wall);
    });
    $("#btnHelp")?.addEventListener("click", () => $("#helpDlg")?.showModal());
    window.addEventListener("keydown", (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (state.tab === "countdown") {
          state.countPlaying = !state.countPlaying;
          syncCountBtn();
        } else {
          if (state.progress >= 1) state.progress = 0;
          state.playing = !state.playing;
          syncPlayButton();
        }
      } else if (e.key === "r" || e.key === "R") {
        state.progress = 0; state.playing = false; towerTrail = [];
        const scrub = $("#towerScrub"); if (scrub) scrub.value = "0";
        syncPlayButton();
      } else if (e.key === "c" || e.key === "C") state.outcome = "catch";
      else if (e.key === "m" || e.key === "M") state.outcome = "miss";
      else if (e.key === "w" || e.key === "W") {
        state.wall = !state.wall;
        document.body.classList.toggle("wall", state.wall);
      } else if (e.key === "?" || e.key === "/") $("#helpDlg")?.showModal();
      else if (e.key >= "1" && e.key <= "5") {
        const tabs = ["tower", "countdown", "fleet", "starlink", "telemetry"];
        switchTab(tabs[+e.key - 1]);
      }
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    initStars();
    initChrome();
    initTower();
    initCountdown();
    initFleet();
    initStarlink();
    initTelemetry();
    syncPlayButton();
    syncCountBtn();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
