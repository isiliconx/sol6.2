(() => {
  "use strict";
  const entries = [];
  const register = (id, title, summary, tag, accent, mount) => entries.push({ id, title, summary, tag, accent, mount });
  const tau = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a + (b - a) * t;
  const rng = (state) => () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };

  function node(tag, parent, opts = {}) {
    const el = document.createElement(tag);
    if (opts.className) el.className = opts.className;
    if (opts.text !== undefined) el.textContent = opts.text;
    if (opts.css) el.style.cssText = opts.css;
    for (const [key, val] of Object.entries(opts.attr || {})) el.setAttribute(key, val);
    parent?.append(el);
    return el;
  }
  function kit(root, bright = false) {
    const ctr = node("div", root, { className: "demo-controls", css: "display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin-block:0 14px" });
    const stage = node("div", root, { className: "demo-stage", css: "padding:0;border-radius:9px;overflow:hidden;min-height:0;" + (bright ? "background:#f4edd8;color:#1c1f21;" : "background:#151c25;color:#f6f1dd;") });
    const output = node("div", root, { className: "demo-output", css: "margin-top:10px;min-height:1.4em;font-size:.88rem" });
    return { ctr, stage, output };
  }
  function button(parent, label, fn) {
    const el = node("button", parent, { text: label, attr: { type: "button" } });
    el.addEventListener("click", fn);
    return el;
  }
  function field(parent, label) {
    const wrap = node("label", parent, { css: "display:inline-grid;gap:5px;min-width:0;font-size:.81rem;flex-shrink:1;" });
    return [wrap, node("span", wrap, { text: label })];
  }
  function select(parent, label, items, fn) {
    const [wrap] = field(parent, label);
    const el = node("select", wrap, { css: "max-width:100%;" });
    for (const item of items) node("option", el, { text: item });
    el.addEventListener("change", fn);
    return el;
  }
  function range(parent, label, min, max, value, fn, step = 1) {
    const [wrap, caption] = field(parent, label + ": " + value);
    const el = node("input", wrap, { attr: { type: "range", min, max, value, step, "aria-label": label }, css: "width:min(118px, 32vw);margin:0" });
    el.addEventListener("input", () => { caption.textContent = label + ": " + el.value; fn(); });
    return el;
  }
  function checked(parent, label, value, fn) {
    const wrap = node("label", parent, { css: "display:inline-flex;align-items:center;gap:5px;font-size:.84rem;align-self:center" });
    const el = node("input", wrap, { attr: { type: "checkbox" } });
    el.checked = value;
    node("span", wrap, { text: label });
    el.addEventListener("change", fn);
    return el;
  }
  function art(stage, label, width = 960, height = 460) {
    const canvas = node("canvas", stage, { attr: { width, height, role: "img", "aria-label": label }, css: "width:100%;height:auto;display:block;max-width:100%;" });
    return [canvas, canvas.getContext("2d"), width, height];
  }
  function save(url, name) {
    const a = node("a", document.body, { attr: { href: url, download: name }, css: "display:none" });
    a.click();
    a.remove();
  }
  function saveText(value, name, type = "text/plain") {
    const url = URL.createObjectURL(new Blob([value], { type }));
    save(url, name);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function png(parent, canvas, name) {
    button(parent, "Save PNG", () => save(canvas.toDataURL("image/png"), name + ".png"));
  }
  function ellipse(ctx, x, y, rx, ry = rx) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, tau);
    ctx.fill();
  }
  function line(ctx, points) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) (i ? ctx.lineTo : ctx.moveTo).call(ctx, ...points[i]);
    ctx.stroke();
  }

  register("pattern-loom", "Pattern Loom", "Weave an actual over-under repeat with adjustable warp density, twill, and thread palettes.", "Textile", "#bd6540", root => {
    const { ctr, stage, output } = kit(root, true);
    const [canvas, ctx, w, h] = art(stage, "Woven textile with a repeating over-under pattern");
    const colorful = [
      ["#c96a46", "#efb66a", "#b13a43", "#493342", "#eddab1"],
      ["#315f71", "#84a99f", "#486991", "#dbc0a1", "#f0e7d0"],
      ["#191c21", "#6e747a", "#ebe4d3", "#a7a8a3", "#4b4c4b"]
    ];
    const weave = select(ctr, "Weave", ["Diamond twill", "Straight twill", "Basket", "Plain"], draw);
    const palette = select(ctr, "Thread", ["Persimmon", "Tidepool", "Newsprint"], draw);
    const warp = range(ctr, "Warp threads", 20, 72, 48, draw, 2);
    png(ctr, canvas, "woven-repeat");

    function draw() {
      const colors = colorful[palette.selectedIndex], cols = +warp.value, step = w / cols;
      const rows = Math.ceil(h / step), pattern = weave.selectedIndex, random = rng(172);
      ctx.fillStyle = "#2c2524";
      ctx.fillRect(0, 0, w, h);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const X = x * step, Y = y * step;
        const warpInk = colors[Math.floor((x + Math.floor(x / 8)) % 13 / 3)];
        const weftInk = colors[[4, 1, 4, 0, 3, 1, 2, 1][Math.floor(y / 2) % 8]];
        const fold = n => Math.abs(n % 12 - 6);
        const over = pattern === 0 ? (fold(x) + fold(y)) % 5 < 3
          : pattern === 1 ? (x + y) % 5 < 3
            : pattern === 2 ? (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 : (x + y) % 2 === 0;
        ctx.fillStyle = over ? weftInk : warpInk;
        if (over) ctx.fillRect(X, Y + step * .09, step, step * .82);
        else ctx.fillRect(X + step * .09, Y, step * .82, step);
        ctx.fillStyle = over ? warpInk : weftInk;
        if (over) ctx.fillRect(X + step * .09, Y - .3, step * .82, step + .5);
        else ctx.fillRect(X - .3, Y + step * .09, step + .5, step * .82);
        ctx.fillStyle = "rgba(255,249,235,.25)";
        if (over) ctx.fillRect(X + step * .24, Y, 1, step);
        else ctx.fillRect(X, Y + step * .24, step, 1);
        ctx.fillStyle = "rgba(34,21,23,.23)";
        if (over) ctx.fillRect(X + step * .83, Y, step * .08, step);
        else ctx.fillRect(X, Y + step * .83, step, step * .08);
        for (let k = 0; k < 4; k++) {
          ctx.fillStyle = k % 2 ? "rgba(255,255,255,.16)" : "rgba(0,0,0,.18)";
          ctx.fillRect(X + random() * step, Y + random() * step, 1, 1);
        }
      }
      output.textContent = cols + " vertical threads / " + rows + " visible rows. The brighter edge marks the thread on top.";
    }
    draw();
  });

  register("ink-harmonograph", "Ink Harmonograph", "Combine damped pendulums to draw the sort of curves a nineteenth-century machine made on paper.", "Generative ink", "#8276d2", root => {
    const { ctr, stage, output } = kit(root, true);
    const [canvas, ctx, w, h] = art(stage, "Ink curve drawn by a damped two-axis harmonograph");
    const horizontal = range(ctr, "Horizontal ratio", 1, 7, 3, draw);
    const vertical = range(ctr, "Vertical ratio", 1, 7, 2, draw);
    const phase = range(ctr, "Phase", 0, 360, 49, draw);
    const decay = range(ctr, "Damping", 3, 24, 9, draw);
    let raf = 0;
    button(ctr, "Replay trace", () => {
      cancelAnimationFrame(raf);
      const started = performance.now();
      const trace = now => {
        const progress = clamp((now - started) / 1850, 0, 1);
        render(progress);
        if (progress < 1) raf = requestAnimationFrame(trace);
        else raf = 0;
      };
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) render(1);
      else raf = requestAnimationFrame(trace);
    });
    png(ctr, canvas, "ink-harmonograph");

    function render(progress) {
      ctx.fillStyle = "#f2e9d2";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#dfd2b9";
      ctx.lineWidth = 1;
      for (let x = 0; x <= w; x += 20) line(ctx, [[x, 0], [x, h]]);
      for (let y = 0; y <= h; y += 20) line(ctx, [[0, y], [w, y]]);
      ctx.strokeStyle = "#842b60";
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      for (let i = 0; i <= Math.floor(4700 * progress); i++) {
        const t = i * .012, damp = Math.exp(-t * +decay.value / 440);
        const x = w / 2 + damp * 355 * (.66 * Math.sin(+horizontal.value * t / 2 + +phase.value * Math.PI / 180) + .34 * Math.sin((+horizontal.value + .042) * t / 2 + .6));
        const y = h / 2 + damp * 190 * (.61 * Math.sin(+vertical.value * t / 2 + .8) + .39 * Math.sin((+vertical.value + .061) * t / 2));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#563148";
      ctx.font = "16px monospace";
      ctx.fillText(horizontal.value + ":" + vertical.value + "    PHASE " + phase.value + "°", 23, h - 23);
    }
    function draw() {
      cancelAnimationFrame(raf);
      render(1);
      output.textContent = "Smaller damping keeps the loops open for longer. Change the ratio to alter the symmetry.";
    }
    draw();
    return () => cancelAnimationFrame(raf);
  });

  const noteName = (note) => ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"][note % 12] + (Math.floor(note / 12) - 1);
  const frequency = (note) => 440 * Math.pow(2, (note - 69) / 12);
  function sound() {
    let ac;
    let disposed = false;
    return {
      async open() {
        if (disposed) return null;
        if (!ac) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return null;
          ac = new AC();
        }
        if (ac.state === "suspended") await ac.resume();
        return disposed ? null : ac;
      },
      close() {
        disposed = true;
        if (ac && ac.state !== "closed") ac.close().catch(() => {});
      }
    };
  }
  function tone(ac, at, hz, duration, gain, type = "sine", target) {
    const osc = ac.createOscillator(), env = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, at);
    if (target) osc.frequency.exponentialRampToValueAtTime(target, at + duration * .85);
    env.gain.setValueAtTime(.0001, at);
    env.gain.exponentialRampToValueAtTime(gain, at + .012);
    env.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(env).connect(ac.destination);
    osc.start(at);
    osc.stop(at + duration + .01);
    return osc;
  }

  function contrastingInk(h, s, l) {
    const channel = n => {
      const k = (n + h / 30) % 12;
      const scaled = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return scaled <= .04045 ? scaled / 12.92 : ((scaled + .055) / 1.055) ** 2.4;
    };
    const relative = .2126 * channel(0) + .7152 * channel(8) + .0722 * channel(4);
    return relative > .18 ? "#000" : "#fff";
  }

  register("palette-choir", "Palette Choir", "Turn color harmony into a musical voicing. Each swatch can be heard on its own or in a chord.", "Color + sound", "#b84e83", root => {
    const { ctr, stage, output } = kit(root);
    const audio = sound();
    const hue = range(ctr, "Root hue", 0, 359, 176, draw);
    const system = select(ctr, "Harmony", ["Analogous", "Split complement", "Triad", "Quartet"], draw);
    let colors = [];
    const play = (notes, arpeggio = false) => async () => {
      try {
        const ac = await audio.open();
        if (!ac) { output.textContent = "Audio is unavailable in this browser."; return; }
        notes.forEach((note, i) => tone(ac, ac.currentTime + .022 + (arpeggio ? i * .14 : 0), frequency(note), 1.4, .15 / Math.sqrt(notes.length), i % 2 ? "sine" : "triangle"));
        output.textContent = "Playing " + notes.map(noteName).join(", ") + (arpeggio ? " in order." : ".");
      } catch {
        output.textContent = "Audio could not start. Try clicking a swatch again.";
      }
    };
    button(ctr, "Play chord", () => play(colors.map(c => c.note))());
    button(ctr, "Arpeggiate", () => play(colors.map(c => c.note), true)());
    button(ctr, "Save palette", () => saveText(colors.map(c => c.color + "  " + noteName(c.note)).join("\n"), "palette-choir.txt"));

    function draw() {
      const hues = [[-38, -18, 0, 22, 42], [0, 18, 147, 191, 210], [0, 20, 120, 240, 260], [0, 80, 180, 260, 288]][system.selectedIndex];
      const pitches = [[0, 4, 7, 9, 12], [0, 3, 7, 10, 14], [0, 4, 7, 11, 16], [0, 5, 10, 15, 19]][system.selectedIndex];
      const rootNote = 48 + Math.floor(+hue.value / 30);
      stage.replaceChildren();
      const swatches = node("div", stage, { css: "display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;" });
      colors = hues.map((offset, i) => {
        const h = (+hue.value + offset + 360) % 360;
        const light = [28, 43, 54, 68, 83][i];
        const color = "hsl(" + h + " 68% " + light + "%)";
        const note = rootNote + pitches[i];
        const sw = button(swatches, noteName(note), play([note]));
        sw.style.cssText = "display:grid;align-content:end;min-width:0;height:clamp(130px,25vw,230px);padding:12px 2px;border:0;border-radius:0;background:" + color + ";color:" + contrastingInk(h, .68, light / 100) + ";font-weight:bold;outline-offset:-4px;font-size:clamp(.68rem,2vw,1.05rem);";
        sw.title = color;
        sw.setAttribute("aria-label", "Play " + noteName(note) + "; " + color);
        return { color, note };
      });
      output.textContent = "Hue sets the root note. The harmony preset sets both the color offsets and the musical intervals.";
    }
    draw();
    return () => audio.close();
  });

  register("pocket-stepper", "Pocket Stepper", "Program a four-track percussion loop, then change its tempo and swing while it plays.", "Drum machine", "#299e86", root => {
    const { ctr, stage, output } = kit(root);
    const audio = sound();
    const count = 12;
    const tracks = ["Kick", "Clap", "Tick", "Pluck"];
    const inks = ["#fd9869", "#f4c669", "#7ce2ad", "#aeb5fc"];
    const presets = [
      [[0, 5, 8], [3, 9], [0, 2, 3, 5, 6, 8, 9, 11], [0, 4, 7, 10]],
      [[0, 3, 6, 9], [2, 8], [1, 4, 7, 10], [1, 5, 7, 11]],
      [[0, 4, 8, 11], [3, 9], [1, 2, 5, 7, 10], [2, 4, 6, 10]]
    ];
    let cells = [], enabled, live, timer = 0, scheduledAt, next = 0, future = [], selected = -1, pending = false, dead = false;
    let noise;
    const sources = new Set();
    const toggle = button(ctr, "Play beat", startStop);
    const bpm = range(ctr, "Tempo BPM", 70, 160, 110, describe);
    const swing = range(ctr, "Swing", 0, 38, 15, describe);
    const pattern = select(ctr, "Pattern", ["Sidewalk", "Pocket", "Procession"], loadPreset);
    button(ctr, "Clear steps", () => { enabled = tracks.map(() => new Set()); render(); });
    button(ctr, "Save pattern", () => saveText(JSON.stringify({ bpm: +bpm.value, swing: +swing.value, stepsPerBeat: 3, tracks: tracks.map((name, i) => ({ name, steps: [...enabled[i]].sort((a, b) => a - b).map(step => step + 1) })) }, null, 2), "stepper-pattern.json", "application/json"));
    const grid = node("div", stage, { css: "display:grid;grid-template-columns:minmax(32px,64px) repeat(12,minmax(0,1fr));gap:3px;padding:12px 6px;align-items:center;font-variant-numeric:tabular-nums" });
    node("span", grid, { text: "Step", css: "font-size:.69rem;text-align:center;opacity:.75" });
    for (let s = 0; s < count; s++) node("span", grid, { text: s + 1, css: "font-size:.69rem;text-align:center;opacity:.75" });
    cells = tracks.map((name, t) => {
      node("span", grid, { text: name, css: "font-size:clamp(.58rem,2.3vw,.87rem);font-weight:bold;text-align:center;" });
      return Array.from({ length: count }, (_, i) => {
        const el = button(grid, "", () => {
          if (enabled[t].has(i)) enabled[t].delete(i);
          else enabled[t].add(i);
          render();
        });
        el.setAttribute("aria-label", name + " step " + (i + 1));
        el.addEventListener("keydown", e => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
          e.preventDefault();
          const x = (i + (e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0) + count) % count;
          const y = (t + (e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0) + tracks.length) % tracks.length;
          cells[y][x].focus();
        });
        return el;
      });
    });
    loadPreset();

    function describe() {
      output.textContent = (enabled?.reduce((n, track) => n + track.size, 0) || 0) + " live steps. The 12 steps make four beats; arrow keys move between pads.";
    }
    function loadPreset() {
      enabled = presets[pattern.selectedIndex].map(group => new Set(group));
      render();
    }
    function render() {
      cells.forEach((row, t) => row.forEach((el, i) => {
        const on = enabled[t].has(i);
        el.setAttribute("aria-pressed", String(on));
        el.style.cssText = "padding:0;min-width:0;min-height:37px;border-radius:3px;border:1px solid " + (selected === i ? "#fff" : "#3d4b59") + ";background:" + (on ? inks[t] : i % 3 === 0 ? "#2d3a48" : "#1f2a37") + ";box-shadow:" + (selected === i ? "0 0 0 1px #fff inset" : "none");
      }));
      describe();
    }
    function trackSource(source) {
      sources.add(source);
      source.addEventListener("ended", () => sources.delete(source), { once: true });
    }
    function burst(ac, at, gain, duration, kind, hz) {
      const src = ac.createBufferSource(), filter = ac.createBiquadFilter(), env = ac.createGain();
      src.buffer = noise;
      filter.type = kind;
      filter.frequency.value = hz;
      env.gain.setValueAtTime(gain, at);
      env.gain.exponentialRampToValueAtTime(.0001, at + duration);
      src.connect(filter).connect(env).connect(ac.destination);
      src.start(at);
      src.stop(at + duration);
      return src;
    }
    function tick() {
      if (!live) return;
      const now = live.currentTime;
      if (scheduledAt < now - .08) { scheduledAt = now + .015; future = []; }
      while (scheduledAt < now + .095) {
        const step = next;
        if (enabled[0].has(step)) trackSource(tone(live, scheduledAt, 138, .23, .22, "sine", 46));
        if (enabled[1].has(step)) trackSource(burst(live, scheduledAt, .24, .13, "bandpass", 1550));
        if (enabled[2].has(step)) trackSource(burst(live, scheduledAt, .12, .058, "highpass", 5300));
        if (enabled[3].has(step)) trackSource(tone(live, scheduledAt, frequency([40, 43, 47, 55][Math.floor(step / 3)]), .27, .11, "triangle"));
        future.push([step, scheduledAt]);
        next = (next + 1) % count;
        const swingScale = 1 + ((step % 2 === 0 ? 1 : -1) * +swing.value / 100);
        scheduledAt += 60 / (+bpm.value * 3) * swingScale;
      }
      let justPlayed = selected;
      while (future.length && future[0][1] <= now) justPlayed = future.shift()[0];
      if (justPlayed !== selected) { selected = justPlayed; render(); }
    }
    async function startStop() {
      if (timer) { stop(); return; }
      if (pending || dead) return;
      pending = true;
      try {
        const ac = await audio.open();
        if (dead) return;
        if (!ac) { output.textContent = "Web Audio is unavailable in this browser."; return; }
        live = ac;
        if (!noise) {
          noise = live.createBuffer(1, Math.ceil(live.sampleRate * .17), live.sampleRate);
          const samples = noise.getChannelData(0), random = rng(4821);
          for (let i = 0; i < samples.length; i++) samples[i] = random() * 2 - 1;
        }
        scheduledAt = ac.currentTime + .04;
        next = 0;
        timer = setInterval(tick, 24);
        toggle.textContent = "Stop beat";
        tick();
      } catch {
        output.textContent = "Audio could not start. Try Play Beat again.";
      } finally {
        pending = false;
      }
    }
    function stop(visible = true) {
      clearInterval(timer);
      timer = 0;
      live = null;
      future = [];
      selected = -1;
      for (const source of sources) {
        try { source.stop(); } catch { /* already ended */ }
      }
      sources.clear();
      if (visible) { toggle.textContent = "Play beat"; render(); }
    }
    return () => { dead = true; stop(false); audio.close(); };
  });

  register("weather-stage", "Weather Stage", "Light a paper-cut coastal scene. Scrub time, set the weather, and export a frame.", "Scenic design", "#5380bb", root => {
    const { ctr, stage, output } = kit(root);
    const [canvas, ctx, W, H] = art(stage, "Layered coastal illustration with a lighthouse, water, mountains, and sky");
    const time = range(ctr, "Hour", 0, 23, 18, draw);
    const weather = select(ctr, "Sky", ["Clear", "Sea fog", "Rain"], draw);
    const wind = range(ctr, "Wind", 0, 90, 31, draw);
    const beacon = checked(ctr, "Beacon", true, draw);
    png(ctr, canvas, "weather-stage");

    function blend(a, b, t) { return "rgb(" + a.map((v, i) => Math.round(mix(v, b[i], t))).join(",") + ")"; }
    function poly(points, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.fill();
    }
    function draw() {
      const hour = +time.value, effect = weather.selectedIndex, breeze = +wind.value / 90;
      const d = Math.max(0, Math.sin((hour - 6) * Math.PI / 13));
      const warmth = clamp(1 - Math.min(Math.abs(hour - 6), Math.abs(hour - 19)) / 4, 0, 1) * .65;
      const fill = ctx.createLinearGradient(0, 0, 0, 345);
      fill.addColorStop(0, blend([21, 28, 66], [79, 155, 192], d));
      fill.addColorStop(.75, warmth > .29 ? blend([103, 119, 155], [255, 158, 117], warmth) : blend([91, 102, 143], [178, 226, 218], d));
      fill.addColorStop(1, blend([114, 129, 166], [225, 236, 202], d));
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, W, H);
      let random = rng(643);
      if (d < .28 && effect === 0) {
        ctx.fillStyle = "rgba(255,240,211,.8)";
        for (let i = 0; i < 60; i++) ellipse(ctx, 24 + random() * 907, 15 + random() * 194, .5 + random() * 1.6);
      }
      if (effect !== 2) {
        ctx.fillStyle = hour >= 6 && hour < 19 ? "#ffe4a6" : "#f3edcf";
        ellipse(ctx, 230 + ((hour + 4) % 24) * 25, 195 - (d || .52) * 100, hour >= 6 && hour < 19 ? 45 : 28);
      }
      poly([[0, 259], [70, 201], [180, 217], [228, 175], [315, 235], [366, 222], [492, 281], [641, 243], [765, 253], [821, 202], [880, 224], [960, 208], [960, 410], [0, 410]], blend([53, 61, 94], [111, 152, 161], d));
      poly([[0, 276], [109, 233], [188, 254], [284, 235], [380, 293], [498, 308], [642, 279], [760, 303], [860, 260], [960, 287], [960, 410], [0, 410]], blend([34, 51, 76], [72, 124, 135], d));
      ctx.fillStyle = blend([48, 70, 110], [53, 153, 162], d);
      ctx.fillRect(0, 306, W, H - 306);
      for (let i = 0; i < 145; i++) {
        const y = 308 + random() * 153, x = random() * W, len = 3 + random() * (y - 285) * (.17 + breeze * .4);
        ctx.strokeStyle = i % 3 ? "rgba(205,239,217,.20)" : "rgba(17,37,59,.28)";
        ctx.lineWidth = y > 395 ? 2.5 : 1.4;
        line(ctx, [[x, y], [x + len, y]]);
      }
      poly([[0, 393], [114, 378], [229, 399], [323, 442], [457, 460], [0, 460]], "#192735");
      poly([[960, 328], [800, 321], [680, 345], [621, 383], [526, 405], [483, 460], [960, 460]], "#1c303d");
      poly([[960, 352], [816, 339], [685, 382], [668, 416], [620, 460], [960, 460]], "#243b45");
      poly([[742, 339], [752, 228], [783, 228], [794, 338]], "#e7d9bf");
      poly([[777, 228], [783, 228], [794, 338], [781, 339]], "#b98f89");
      poly([[746, 285], [751, 263], [786, 263], [788, 285]], "#994d4d");
      ctx.fillStyle = "#233442";
      ctx.fillRect(750, 220, 36, 14);
      ctx.fillRect(762, 311, 13, 30);
      ctx.fillStyle = beacon.checked ? "#ffdc76" : "#627683";
      ctx.fillRect(754, 207, 28, 16);
      poly([[746, 209], [768, 190], [792, 209]], "#1f2c3a");
      if (beacon.checked) {
        const glow = ctx.createLinearGradient(770, 0, 45, 0);
        glow.addColorStop(0, "rgba(255,222,147,.65)");
        glow.addColorStop(1, "rgba(255,222,147,0)");
        poly([[761, 211], [40, 135], [40, 267], [761, 220]], glow);
      }
      ctx.strokeStyle = "rgba(27,44,60,.6)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const x = 410 + random() * 143, y = 111 + random() * 73;
        line(ctx, [[x - 8, y - 2], [x, y + 2], [x + 9, y - 2 + breeze * 3]]);
      }
      if (effect === 1) {
        const fog = ctx.createLinearGradient(0, 115, 0, 420);
        fog.addColorStop(0, "rgba(211,224,227,0)");
        fog.addColorStop(.52, "rgba(211,224,227,.7)");
        fog.addColorStop(1, "rgba(211,224,227,0)");
        ctx.fillStyle = fog;
        ctx.fillRect(0, 115, W, 305);
      }
      if (effect === 2) {
        ctx.fillStyle = "rgba(44,64,91,.37)";
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = "rgba(216,233,231,.25)";
        for (let i = 0; i < 230; i++) {
          const x = random() * W, y = random() * H;
          line(ctx, [[x, y], [x - 2 - breeze * 11, y + 7 + random() * 14]]);
        }
      }
      output.textContent = String(hour).padStart(2, "0") + ":00 / " + weather.value + " / Beacon " + (beacon.checked ? "lit" : "dark");
    }
    draw();
  });

  register("story-casting-room", "Story Casting Room", "Deal out a protagonist, setting, pivot, and writing constraint. Lock the pieces that belong together.", "Writing", "#bc7349", root => {
    const { ctr, stage, output } = kit(root, true);
    const genre = select(ctr, "Shelf", ["Strange town", "Near future", "Quiet comedy"], () => deal(false));
    const decks = [
      [
        ["A night-shift locksmith", "A substitute ferry captain", "The taxidermist’s apprentice", "A streetlight repairer"],
        ["A museum on the morning it closes", "A village where all the clocks face inward", "An empty ferry on the last trip of the night", "The cellar of a small weather station"],
        ["Someone leaves a key to a room that has not been built", "The only witness has a voice but no shadow", "The missing object comes back slightly taller", "An apology arrives thirty years early"]
      ],
      [
        ["A technician for public dreams", "A translator for extinct birds", "A mechanic who repairs old satellites", "An aunt who owns an obsolete robot"],
        ["The charging bay of a city bus garage", "A rooftop farm on its first winter night", "A city archive that opens once a year", "A laundromat with one unclaimed machine"],
        ["Everyone receives the same wrong prediction", "A recording names the one person nobody remembers", "The backup starts negotiating its duties", "One square inch of the map keeps changing"]
      ],
      [
        ["A swimming teacher afraid of deep water", "A mayor’s overqualified dog walker", "An exacting former wedding pianist", "An understudy whose father takes notes"],
        ["A hotel dining room during a power cut", "The queue for a county fair pie contest", "A neighborhood meeting with no chairs", "The costume room of a village theater"],
        ["A small lie becomes an agenda item", "Everybody recognizes the wrong person", "An interview ends with a potluck signup sheet", "A letter about parking turns into a love note"]
      ]
    ];
    const constraints = ["Tell it in nine sentences. The fifth must be a question.", "Never name the emotion the narrator feels.", "The last sentence must repeat the first with one word changed.", "Let an object appear in three places before anybody comments on it.", "Write the pivot as a single line of overheard dialogue."];
    const labels = ["Protagonist", "Place", "Pivot", "Constraint"];
    const values = [0, 0, 0, 0], keep = [false, false, false, false], phrases = ["", "", "", ""];
    const random = rng(902160);
    button(ctr, "Deal unlocked cards", () => deal(true));
    button(ctr, "Save story brief", () => saveText(labels.map((label, i) => label + "\n" + phrases[i]).join("\n\n"), "story-brief.txt"));
    stage.style.cssText += "display:grid;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr));padding:4px;background:#d9cdb3;gap:1px";
    const cards = labels.map((label, i) => {
      const card = node("section", stage, { css: "background:#f6edda;padding:16px 17px;color:#382727;min-height:109px;display:grid;align-content:start;gap:7px;" });
      node("h3", card, { text: label, css: "font:700 .76rem system-ui;color:#814330;margin:0;" });
      const sample = node("p", card, { css: "font:clamp(1.13rem,3vw,1.52rem)/1.19 Georgia,serif;margin:2px 0 7px;" });
      const lock = checked(card, "Keep " + label.toLowerCase(), false, () => { keep[i] = lock.checked; count(); });
      return sample;
    });
    function count() {
      const n = keep.filter(Boolean).length;
      output.textContent = n === 4 ? "All cards are locked. Unlock one to deal a new line." : n + " of 4 cards locked. Locked cards also survive a change of shelf.";
    }
    function deal(advance) {
      const groups = [...decks[genre.selectedIndex], constraints];
      groups.forEach((items, i) => {
        if (keep[i]) return;
        if (advance) values[i] = (values[i] + 1 + Math.floor(random() * (items.length - 1))) % items.length;
        phrases[i] = items[values[i]];
        cards[i].textContent = phrases[i];
      });
      count();
    }
    deal(false);
  });

  register("riso-press", "Riso Press", "Pull a two-ink test print. Inspect the color separations, then slide one plate out of registration.", "Printmaking", "#d3636d", root => {
    const { ctr, stage, output } = kit(root, true);
    const [canvas, ctx, w, h] = art(stage, "Two-color risograph-style print with paper texture and visible ink misalignment");
    const subject = select(ctr, "Plate design", ["Eclipse", "Ginkgo", "Stepped roof"], draw);
    const inks = select(ctr, "Ink pair", ["Cobalt / Vermilion", "Orchid / Lime", "Forest / Gold"], draw);
    const offset = range(ctr, "Plate shift", -36, 36, 12, draw);
    const view = select(ctr, "Separation", ["Composite", "First ink only", "Second ink only"], draw);
    png(ctr, canvas, "riso-print");

    function plate(ink, side) {
      ctx.fillStyle = ink;
      ctx.strokeStyle = ink;
      ctx.lineWidth = side ? 3 : 5;
      if (subject.selectedIndex === 0) {
        if (side) {
          for (let i = 0; i < 16; i++) line(ctx, [[178, 89 + i * 17], [818, 89 + i * 17]]);
          ellipse(ctx, 523, 237, 107);
        } else {
          ellipse(ctx, 433, 214, 133);
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(433, 214, 151 + i * 14, -.19, 1.79);
            ctx.stroke();
          }
        }
      } else if (subject.selectedIndex === 1) {
        for (let i = 0; i < 5; i++) {
          ctx.save();
          const direction = side ? -1 : 1;
          ctx.translate(476 + (i - 2) * 41, 339 - i * 48 + (side ? 13 : 0));
          ctx.rotate(direction * (.82 + .23 * i));
          ctx.beginPath();
          ctx.moveTo(0, 20);
          ctx.lineTo(0, -52);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, -38);
          ctx.bezierCurveTo(-55, -111, -141, -68, -79, -165);
          ctx.bezierCurveTo(-42, -187, 63, -192, 84, -153);
          ctx.bezierCurveTo(126, -62, 33, -93, 0, -38);
          ctx.fill();
          ctx.restore();
        }
      } else {
        for (let i = 0; i < 7; i++) {
          const x = 119 + i * 103 + (side ? 23 : 0);
          if (side) {
            ctx.fillRect(x, 227 - i * 18, 57, 147 + i * 18);
          } else {
            ctx.fillRect(x, 256 - i * 24, 71, 107 + i * 24);
            line(ctx, [[x - 15, 256 - i * 24], [x + 95, 256 - i * 24]]);
          }
        }
      }
      ctx.font = "700 17px monospace";
      ctx.fillText(side ? "B / 002" : "PRESS PROOF / 001", side ? w - 155 : 68, h - 38);
      for (const x of [54, w - 54]) {
        line(ctx, [[x - 10, 38], [x + 10, 38]]);
        line(ctx, [[x, 28], [x, 48]]);
      }
    }

    function draw() {
      const [first, second] = [["#3c568e", "#e49066"], ["#92598e", "#bcc745"], ["#346c60", "#ecca67"]][inks.selectedIndex];
      ctx.fillStyle = "#f1e7d2";
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = .88;
      if (view.selectedIndex !== 2) plate(first, 0);
      if (view.selectedIndex !== 1) {
        ctx.translate(+offset.value, Math.round(+offset.value * .6));
        plate(second, 1);
      }
      ctx.restore();
      const random = rng(105);
      for (let i = 0; i < 10000; i++) {
        const x = random() * w, y = random() * h;
        ctx.fillStyle = i % 2 ? "rgba(255,245,225,.27)" : "rgba(64,40,24,.12)";
        ctx.fillRect(x, y, .8 + random() * 1.75, .72);
      }
      output.textContent = "The second plate is shifted " + offset.value + " px horizontally. Overprinting darkens the overlap.";
    }
    draw();
  });

  register("type-specimen", "Type Specimen", "Set a custom headline as a small type poster. Compare a centered specimen, a broadside, and a label.", "Typography", "#618f51", root => {
    const { ctr, stage, output } = kit(root, true);
    const [canvas, ctx, w, h] = art(stage, "Type specimen poster using the chosen headline, typeface, and layout");
    const [label] = field(ctr, "Headline");
    const headline = node("input", label, { attr: { type: "text", maxlength: "38", value: "An hour of blue", size: "19", "aria-label": "Headline" }, css: "width:min(201px,76vw)" });
    headline.addEventListener("input", draw);
    const face = select(ctr, "Face", ["Georgia italic", "Heavy grotesk", "Mono"], draw);
    const design = select(ctr, "Layout", ["Specimen", "Broadside", "Ticket"], draw);
    const tracking = range(ctr, "Letter spacing", -8, 22, 1, draw);
    png(ctr, canvas, "type-specimen");
    const fonts = ["italic 400 @px Georgia", "900 @px system-ui", "600 @px monospace"];

    function setFont(size) { ctx.font = fonts[face.selectedIndex].replace("@", size); }
    function letters(text) { return Array.from(text); }
    function span(text, gap) { return letters(text).reduce((n, ch) => n + ctx.measureText(ch).width, 0) + Math.max(0, letters(text).length - 1) * gap; }
    function plot(text, x, y, gap) {
      for (const ch of letters(text)) {
        ctx.fillText(ch, x, y);
        x += ctx.measureText(ch).width + gap;
      }
    }
    function draw() {
      const text = headline.value.trim().replace(/\s+/g, " ") || "Type something";
      const style = design.selectedIndex;
      const themes = [["#ece6c8", "#253723", "#76853f"], ["#c5dcf4", "#192f6c", "#466eb7"], ["#ef914f", "#3b1d1a", "#5f2f24"]];
      const [paper, ink, accent] = themes[style];
      const gap = +tracking.value;
      ctx.fillStyle = paper;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = ink;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      const pieces = text.split(" ");
      const lines = [text];
      if (style === 1 && pieces.length > 2) {
        const split = Math.ceil(pieces.length / 2);
        lines.splice(0, 1, pieces.slice(0, split).join(" "), pieces.slice(split).join(" "));
      }
      const fieldWidth = style === 2 ? 698 : 826;
      let size = 112;
      for (; size > 10; size -= 2) {
        setFont(size);
        if (lines.every(value => span(value, gap) <= fieldWidth)) break;
      }
      setFont(size);
      if (style === 0) {
        ctx.strokeRect(38, 39, w - 76, h - 78);
        line(ctx, [[38, 90], [w - 38, 90]]);
        line(ctx, [[38, h - 90], [w - 38, h - 90]]);
      }
      if (style === 1) {
        for (let i = 0; i < 11; i++) ctx.fillRect(62 + i * 16, 48, 8, 39);
        line(ctx, [[61, h - 55], [w - 61, h - 55]]);
      }
      if (style === 2) {
        ctx.strokeRect(48, 78, w - 96, h - 156);
        ctx.setLineDash([4, 8]);
        line(ctx, [[w - 147, 78], [w - 147, h - 78]]);
        ctx.setLineDash([]);
        for (let i = 0; i < 12; i++) {
          const bw = [3, 7, 1, 6][i % 4];
          ctx.fillRect(w - 132 + 6 * i, h / 2 - 65, bw, 130);
        }
      }
      lines.forEach((value, i) => {
        const x = style === 0 ? (w - span(value, gap)) / 2 : 65;
        const y = h / 2 + size * .3 + (i - (lines.length - 1) / 2) * (size * .94 + 4);
        plot(value, x, y, gap);
      });
      ctx.fillStyle = accent;
      ctx.font = "600 16px monospace";
      if (style === 0) {
        ctx.fillText("FOUNDRY / SPECIMEN 01", 62, 71);
        ctx.fillText("FACE / " + face.value, 62, h - 63);
      } else if (style === 1) {
        ctx.fillText("A TYPE BROADSIDE", 65, h - 28);
      } else {
        ctx.fillText("ADMIT ONE / AFTER HOURS", 66, 109);
        ctx.fillText("VISUAL STUDIES SERIES", 66, h - 103);
      }
      output.textContent = face.value + " / " + design.value + " / fit at " + size + " px";
    }
    draw();
  });

  register("erasure-desk", "Erasure Desk", "Find a new poem inside a paragraph. Keep the words you want, then hide the source around them.", "Found poetry", "#637e91", root => {
    const { ctr, stage, output } = kit(root, true);
    const passages = [
      "By dusk the station clock had lost a minute. A conductor left his lantern on a wooden bench and walked the platform twice, listening for a train that was already gone. Across the tracks a single window burned, bright enough to make the dark look newly painted.",
      "There was a small blue bowl in the center of the table. In the mornings it held the keys, a loose button, or a dry stem from the garden. One winter a visitor mistook it for a cup and asked why nobody had filled it with water.",
      "At low tide the river revealed a shopping cart, two pale stones, and a rusted sign pointing inland. Beneath the bridge the gulls stood shoulder to shoulder as if they were waiting to be let inside. I put my hand on the rail and counted the space between their cries."
    ];
    const source = select(ctr, "Source", ["The station", "The blue bowl", "Under the bridge"], load);
    const visibility = select(ctr, "Show", ["Source", "Finished erasure"], draw);
    button(ctr, "Clear kept words", () => { kept.clear(); draw(); });
    button(ctr, "Save poem", () => saveText(poemText(), "erasure-poem.txt"));
    const paper = node("div", stage, { css: "padding:clamp(12px,3vw,28px);display:flex;flex-wrap:wrap;gap:3px 4px;background:#efdfbf;color:#321f28;align-content:flex-start;min-height:180px" });
    let words = [], kept = new Set(), buttons = [];
    function poemText() { return words.filter((_, i) => kept.has(i)).join(" "); }
    function load() {
      words = passages[source.selectedIndex].split(" ");
      kept = source.selectedIndex === 0 ? new Set([1, 6, 7, 13, 24, 25, 26, 30, 34, 36, 37, 42, 43, 45, 46]) : new Set();
      paper.replaceChildren();
      buttons = words.map((word, i) => {
        const el = button(paper, word, () => {
          if (kept.has(i)) kept.delete(i);
          else kept.add(i);
          draw();
        });
        el.addEventListener("keydown", e => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            buttons[(i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length].focus();
          }
        });
        return el;
      });
      draw();
    }
    function draw() {
      const finished = visibility.selectedIndex === 1;
      buttons.forEach((el, i) => {
        const on = kept.has(i), ink = on ? "#452c36" : finished ? "#322630" : "#675960";
        el.style.cssText = "font:400 clamp(.87rem,2.3vw,1.23rem)/1.32 Georgia,serif;color:" + ink + ";background:" + (on ? "#fff2cf" : finished ? "#322630" : "transparent") + ";padding:3px 5px;min-width:0;min-height:0;border:1px solid " + (on ? "#936749" : finished ? "#322630" : "transparent") + ";border-radius:3px;outline-offset:0";
        el.setAttribute("aria-pressed", String(on));
        el.setAttribute("aria-label", words[i] + (on ? ", kept" : ", erased"));
      });
      output.textContent = kept.size ? kept.size + (kept.size === 1 ? " word kept: " : " words kept: ") + poemText() : "Select words to keep. Arrow keys move between words.";
    }
    load();
  });

  register("motion-flipbook", "Motion Flipbook", "Animate a paper puppet through four key poses. Compare eased and linear timing, onion-skin frames, and export the strip.", "Animation", "#8275c7", root => {
    const { ctr, stage, output } = kit(root);
    const [canvas, ctx, w, h] = art(stage, "Paper puppet bouncing through a sequence of four editable key poses", 860, 440);
    const lifts = [0, 93, 18, 0];
    const pose = select(ctr, "Key pose", ["A / Floor", "B / Rise", "C / Fall", "D / Land"], () => {
      lift.value = lifts[pose.selectedIndex];
      lift.dispatchEvent(new Event("input"));
    });
    const lift = range(ctr, "Pose height", 0, 109, 0, () => {
      lifts[pose.selectedIndex] = +lift.value;
      if (!raf) frame = pose.selectedIndex * 4;
      draw();
    });
    const curve = select(ctr, "Timing", ["Ease in/out", "Linear"], draw);
    const ghost = checked(ctr, "Onion skin", true, draw);
    let frame = 0, raf = 0, last = 0, accumulated = 0;
    const play = button(ctr, "Play loop", () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        play.textContent = "Play loop";
        return;
      }
      play.textContent = "Pause loop";
      last = performance.now();
      accumulated = 0;
      raf = requestAnimationFrame(animate);
    });
    button(ctr, "Next frame", () => { frame = (frame + 1) % 13; draw(); });
    button(ctr, "Save frame strip", strip);

    function animate(now) {
      accumulated += Math.min(180, now - last);
      last = now;
      if (accumulated >= 85) {
        frame = (frame + Math.floor(accumulated / 85)) % 13;
        accumulated %= 85;
        draw();
      }
      raf = requestAnimationFrame(animate);
    }
    function pos(f) {
      const segment = Math.min(2, Math.floor(f / 4)), t = clamp(f / 4 - segment, 0, 1);
      return mix(lifts[segment], lifts[segment + 1], curve.selectedIndex ? t : t * t * (3 - 2 * t));
    }
    function puppet(context, x, y, height, opacity = 1) {
      context.save();
      context.translate(x, y - height * 1.75);
      context.scale(1 + .17 * (1 - clamp(height / 30, 0, 1)), .87 + .13 * clamp(height / 35, 0, 1));
      context.rotate(height / 360);
      context.globalAlpha = opacity;
      context.fillStyle = "#d4aaef";
      ellipse(context, 0, 0, 60, 43);
      context.fillStyle = "#f2d5ff";
      ellipse(context, 23, -30, 29, 25);
      context.fillStyle = "#e5bffc";
      ellipse(context, 11, -53, 7, 24);
      ellipse(context, 35, -50, 7, 25);
      ellipse(context, -58, -14, 14);
      context.fillStyle = "#382c4b";
      ellipse(context, 31, -33, 3.8);
      context.restore();
    }
    function draw() {
      ctx.fillStyle = "#252443";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#433b64";
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) line(ctx, [[0, i * 36], [w, i * 36]]);
      for (let i = 0; i < 18; i++) line(ctx, [[i * 52, 0], [i * 52, 361]]);
      ctx.fillStyle = "#362e53";
      ctx.fillRect(0, 348, w, h - 348);
      ctx.strokeStyle = "#8570a5";
      line(ctx, [[0, 348], [w, 348]]);
      const thisX = 166 + frame * 43.5;
      ctx.fillStyle = "rgba(10,7,28,.35)";
      ellipse(ctx, thisX, 350, Math.max(22, 74 - pos(frame) / 2), 10);
      if (ghost.checked) {
        for (const off of [-2, 2]) if (frame + off >= 0 && frame + off <= 12) puppet(ctx, thisX + off * 43.5, 311, pos(frame + off), .23);
      }
      puppet(ctx, thisX, 311, pos(frame));
      for (let i = 0; i <= 12; i++) {
        const x = 46 + i * 64;
        ctx.fillStyle = i === frame ? "#e2b5f3" : i % 4 === 0 ? "#ad9ccc" : "#665686";
        ctx.fillRect(x - 22, 383, 44, i % 4 === 0 ? 14 : 7);
      }
      ctx.fillStyle = "#dbc5ef";
      ctx.font = "14px monospace";
      ctx.fillText("A", 42, 422);
      ctx.fillText("B", 298, 422);
      ctx.fillText("C", 554, 422);
      ctx.fillText("D", 810, 422);
      output.textContent = "Frame " + (frame + 1) + " of 13 / Preview at ~12 frames per second";
    }
    function strip() {
      const out = node("canvas", null, { attr: { width: 1040, height: 340 } });
      const c = out.getContext("2d");
      c.fillStyle = "#252443";
      c.fillRect(0, 0, 1040, 340);
      for (let i = 0; i <= 12; i++) {
        const row = i < 7 ? 0 : 1, x = 13 + (i - row * 7) * 146, y = 10 + row * 165;
        c.fillStyle = "#3c3459";
        c.fillRect(x, y, 138, 153);
        c.save();
        c.translate(x + 69, y + 131);
        c.scale(.62, .62);
        puppet(c, 0, 0, pos(i) * .66);
        c.restore();
        c.fillStyle = "#ddc2f4";
        c.font = "12px monospace";
        c.fillText(String(i + 1).padStart(2, "0"), x + 8, y + 16);
      }
      save(out.toDataURL("image/png"), "motion-frame-strip.png");
    }
    draw();
    return () => cancelAnimationFrame(raf);
  });

  (window.SOL_SECTIONS ||= {})["Creative"] = entries;
})();
