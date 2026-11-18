(function () {
  'use strict';

  const W = 760, H = 320, PI = Math.PI, TAU = 2 * PI;
  const INK = '#081019', GRID = '#1b2a39', LABEL = '#a5b4c5';
  const clamp = (x, a, b) => Math.max(a, Math.min(x, b));
  const f = (x, n = 2) => Number(x).toFixed(n);
  const rand = (seed) => () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  function ui(root, name, note) {
    const controls = document.createElement('div'), wrap = document.createElement('div');
    const canvas = document.createElement('canvas'), output = document.createElement('p');
    const help = document.createElement('p');
    controls.className = 'demo-controls';
    wrap.className = 'demo-stage';
    wrap.style.marginTop = '.6rem';
    canvas.width = W; canvas.height = H;
    canvas.style.cssText = 'display:block;width:100%;height:auto;aspect-ratio:19/8;border-radius:8px;touch-action:pan-y';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', name);
    wrap.append(canvas);
    output.className = 'demo-output';
    output.style.fontVariantNumeric = 'tabular-nums';
    help.style.cssText = 'font-size:.83rem;opacity:.78;margin:.5em 0 0';
    help.textContent = note;
    root.append(controls, wrap, output, help);
    return { controls, canvas, c: canvas.getContext('2d'), output };
  }
  function range(root, name, min, max, step, start, onchange, format = String) {
    const label = document.createElement('label'), heading = document.createElement('span');
    const input = document.createElement('input');
    label.style.cssText = 'display:inline-grid;gap:.15rem;align-self:center;vertical-align:middle;';
    input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = start;
    input.style.width = 'clamp(92px, 17vw, 150px)';
    input.setAttribute('aria-label', name);
    const sync = () => { heading.textContent = name + ' · ' + format(+input.value); };
    input.addEventListener('input', () => { sync(); onchange(+input.value); });
    sync(); label.append(heading, input); root.append(label);
    return { set(v) { input.value = v; sync(); } };
  }
  function button(root, label, click) {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', click); root.append(b);
    return b;
  }
  function select(root, name, labels, change) {
    const label = document.createElement('label'), heading = document.createElement('span'), input = document.createElement('select');
    heading.textContent = name;
    label.style.cssText = 'display:inline-grid;gap:.15rem;align-self:center;vertical-align:middle;';
    input.style.cssText = 'color:#e6edf4;background:#162333;border:1px solid #415063;border-radius:5px;padding:.37em;';
    labels.forEach((item, i) => {
      const opt = document.createElement('option'); opt.textContent = item; opt.value = i; input.append(opt);
    });
    input.addEventListener('change', () => change(+input.value)); label.append(heading, input); root.append(label);
  }
  function animation(root, draw) {
    let token = 0, last = 0;
    const b = button(root, 'Play', () => {
      if (token) { stop(); return; }
      last = 0; token = requestAnimationFrame(frame); b.textContent = 'Pause'; b.setAttribute('aria-pressed', 'true');
    });
    b.setAttribute('aria-pressed', 'false');
    const stop = () => {
      if (token) cancelAnimationFrame(token);
      token = 0; b.textContent = 'Play'; b.setAttribute('aria-pressed', 'false');
    };
    function frame(t) {
      if (last && t - last < 32) { token = requestAnimationFrame(frame); return; }
      const dt = last ? Math.min(.08, (t - last) / 1000) : 1 / 30;
      last = t; draw(dt); token = requestAnimationFrame(frame);
    }
    return stop;
  }
  function point(canvas, event) {
    const r = canvas.getBoundingClientRect();
    return [(event.clientX - r.left) * W / r.width, (event.clientY - r.top) * H / r.height];
  }
  function clear(c, grid = true) {
    c.fillStyle = INK; c.fillRect(0, 0, W, H);
    if (!grid) return;
    c.lineWidth = 1; c.strokeStyle = GRID; c.beginPath();
    for (let x = 20; x < W; x += 20) { c.moveTo(x + .5, 0); c.lineTo(x + .5, H); }
    for (let y = 20; y < H; y += 20) { c.moveTo(0, y + .5); c.lineTo(W, y + .5); }
    c.stroke();
  }
  function label(c, s, x, y, color = LABEL, size = 13) {
    c.fillStyle = color; c.font = size + 'px ui-monospace,monospace'; c.fillText(s, x, y);
  }
  function line(c, x, y, u, v, color, width = 1) {
    c.beginPath(); c.strokeStyle = color; c.lineWidth = width; c.moveTo(x, y); c.lineTo(u, v); c.stroke();
  }
  function ring(c, x, y, r, color, width = 1) {
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }
  function dot(c, x, y, r, color) {
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = color; c.fill();
  }
  function image(c, w, h) {
    const buffer = document.createElement('canvas');
    buffer.width = w; buffer.height = h;
    const pixels = buffer.getContext('2d'), data = pixels.createImageData(w, h);
    for (let i = 3; i < data.data.length; i += 4) data.data[i] = 255;
    return { data: data.data, paint(x = 0, y = 0, width = W, height = H, smooth = true) {
      pixels.putImageData(data, 0, 0); c.imageSmoothingEnabled = smooth; c.drawImage(buffer, x, y, width, height);
    } };
  }
  function palette(stops) {
    return Array.from({ length: 256 }, (_, i) => {
      const v = i * (stops.length - 1) / 255, j = Math.min(stops.length - 2, Math.floor(v)), t = v - j;
      return stops[j].map((n, d) => Math.round(n + (stops[j + 1][d] - n) * t));
    });
  }
  function rgb(data, i, color) {
    data[i] = color[0]; data[i + 1] = color[1]; data[i + 2] = color[2];
  }
  const volt = palette([[6, 10, 24], [26, 29, 72], [58, 55, 168], [48, 191, 210], [218, 255, 238]]);
  const ember = palette([[7, 13, 25], [45, 24, 79], [166, 39, 83], [248, 125, 49], [255, 249, 194]]);

  const projects = [
    {
      id:'dark-fringe', title:'Dark Fringe', summary:'Steer the interference fringes of two coherent point sources.', tag:'WAVE OPTICS', accent:'#7ce9e6',
      mount(root) {
        const {controls, c, output} = ui(root, 'Color map of two-source interference', 'Bright bands mark constructive interference. The two emitters have equal amplitude; this model shows relative intensity without distance falloff.');
        let wave = 51, span = 120, phase = 0;
        const w = 304, h = 128, field = image(c, w, h), delta = new Float32Array(w * h);
        function distances() {
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const xx = x * W / w - 154, yy = y * H / h - H / 2;
            delta[y * w + x] = Math.hypot(xx, yy - span / 2) - Math.hypot(xx, yy + span / 2);
          }
          draw();
        }
        function draw() {
          const k = TAU / wave;
          for (let i = 0; i < delta.length; i++) {
            const power = .5 + .5 * Math.cos(k * delta[i] + phase);
            rgb(field.data, i * 4, volt[Math.floor(255.99 * power)]);
          }
          field.paint();
          const d = span / 2;
          for (const y of [H / 2 - d, H / 2 + d]) {
            ring(c, 154, y, 8, '#e7ffff', 1.4); dot(c, 154, y, 3, '#ffffff');
          }
          c.fillStyle = 'rgba(8,16,25,.84)'; c.fillRect(10, 11, 198, 26);
          label(c, 'RELATIVE INTENSITY', 20, 29, '#e6fffa');
          output.textContent = 'Separation / wavelength: ' + f(span / wave) + ' λ  ·  Phase offset: ' + f(phase * 180 / PI, 0) + '°';
        }
        range(controls, 'Wavelength', 22, 92, 1, wave, v => { wave = v; draw(); }, v => v + ' u');
        range(controls, 'Separation', 35, 212, 1, span, v => { span = v; distances(); }, v => v + ' u');
        const phaseSlider = range(controls, 'Phase', 0, 360, 1, 0, v => { phase = v * PI / 180; draw(); }, v => v + '°');
        const stop = animation(controls, dt => { phase = (phase + dt * 1.25) % TAU; phaseSlider.set(phase * 180 / PI); draw(); });
        distances();
        return stop;
      }
    },
    {
      id:'kepler-loom', title:'Kepler Loom', summary:'Trace the repeating pattern made by two resonant orbits.', tag:'ORBITAL MECHANICS', accent:'#f7bd74',
      mount(root) {
        const {controls, c, output} = ui(root, 'Two concentric orbits connected by periodically sampled chords', 'These are circular orbits around the same center. Their relative radii follow Kepler’s third law, and the weave closes after both bodies complete whole turns.');
        let m = 5, n = 3, time = .88, strands = 126;
        const centerX = 330, centerY = 159, outerR = 134;
        function xy(turns, r) {
          const a = turns * TAU - PI / 2;
          return [centerX + r * Math.cos(a), centerY + r * Math.sin(a)];
        }
        function draw() {
          clear(c);
          const innerR = outerR * Math.pow(n / m, 2 / 3);
          ring(c, centerX, centerY, outerR, '#556386', 1.2);
          ring(c, centerX, centerY, innerR, '#695845', 1.2);
          for (let i = 0; i <= strands * time; i++) {
            const t = i / strands, a = xy(m * t, innerR), b = xy(n * t, outerR);
            line(c, ...a, ...b, 'hsla(' + (37 + 190 * t) + ',87%,64%,.36)');
          }
          const a = xy(m * time, innerR), b = xy(n * time, outerR);
          line(c, ...a, ...b, '#f7e9cd', 1.6);
          dot(c, ...a, 5, '#ffbd70'); dot(c, ...b, 5, '#a9c9ff'); dot(c, centerX, centerY, 3, '#eee8cf');
          label(c, 'CIRCULAR MODEL', 17, 26, '#f7bd74');
          label(c, m + ' : ' + n, 540, 135, '#f8eadc', 31);
          label(c, 'INNER : OUTER TURNS', 540, 163);
          label(c, (m - n) + ' conjunctions / repeat', 540, 190, '#c0aeb2', 12);
          output.textContent = f(time * m) + ' inner turns  ·  ' + f(time * n) + ' outer turns  ·  Inner radius: ' + f(innerR / outerR, 3) + ' × outer radius';
        }
        const modes = [[5,3],[3,2],[2,1],[7,4],[8,5]];
        select(controls, 'Turns per repeat', ['5 : 3','3 : 2','2 : 1','7 : 4','8 : 5'], i => { [m, n] = modes[i]; draw(); });
        const scrub = range(controls, 'Cycle', 0, 100, 1, 88, v => { time = v / 100; draw(); }, v => v + '%');
        range(controls, 'Samples', 40, 220, 1, strands, v => { strands = v; draw(); });
        const stop = animation(controls, dt => { time = (time + dt / 6) % 1; scrub.set(time * 100); draw(); });
        draw();
        return stop;
      }
    },
    {
      id:'velvet-chaos', title:'Velvet Chaos', summary:'Rotate a Lorenz phase portrait and nudge it out of equilibrium.', tag:'DYNAMICAL SYSTEMS', accent:'#f19ddf',
      mount(root) {
        const {controls, c, output} = ui(root, 'Projected three-dimensional Lorenz trajectory', 'The path comes from numerically integrating the Lorenz equations (σ = 10, β = 8/3). A lower ρ often pulls the trajectory toward a fixed point; not every setting produces chaos.');
        let rho = 28, azimuth = 337, elevation = 12, trail = [], ghost = [];
        const steps = 3900, dt = .011;
        function deriv(x, y, z) { return [10 * (y - x), x * (rho - z) - y, x * y - (8 / 3) * z]; }
        function integrate(start) {
          let [x, y, z] = start;
          const record = [];
          for (let i = 0; i < steps; i++) {
            const a = deriv(x,y,z), b = deriv(x+a[0]*dt/2,y+a[1]*dt/2,z+a[2]*dt/2);
            const d = deriv(x+b[0]*dt/2,y+b[1]*dt/2,z+b[2]*dt/2), e = deriv(x+d[0]*dt,y+d[1]*dt,z+d[2]*dt);
            x += (a[0]+2*b[0]+2*d[0]+e[0])*dt/6;
            y += (a[1]+2*b[1]+2*d[1]+e[1])*dt/6;
            z += (a[2]+2*b[2]+2*d[2]+e[2])*dt/6;
            if (i % 2 === 0) record.push([x,y,z]);
          }
          return record;
        }
        function draw() {
          clear(c);
          const a = azimuth * PI / 180, e = elevation * PI / 180;
          const ca = Math.cos(a), sa = Math.sin(a), ce = Math.cos(e), se = Math.sin(e);
          const vertical = p => (rho-1-p[2])*ce + (p[0]*sa + p[1]*ca)*se;
          let extent = 0;
          for (const p of trail) extent = Math.max(extent, Math.abs(vertical(p)));
          if (showGhost) for (const p of ghost) extent = Math.max(extent, Math.abs(vertical(p)));
          const scale = Math.min(10.5, 128 / Math.max(1, extent));
          function project(p) {
            return [W / 2 + scale * (p[0]*ca - p[1]*sa), 174 + scale * vertical(p)];
          }
          function stroke(path, other) {
            if (!path.length) return;
            const chunk = 38;
            let start = project(path[0]);
            for (let i = 1; i < path.length; i += chunk) {
              c.beginPath(); c.moveTo(...start);
              for (let j = i; j < Math.min(i + chunk, path.length); j++) {
                start = project(path[j]); c.lineTo(...start);
              }
              c.strokeStyle = other ? 'rgba(119,227,242,.28)' : 'hsla('+(317-i/path.length*58)+',86%,74%,.57)';
              c.lineWidth = other ? 1 : 1.15; c.stroke();
            }
            dot(c, ...start, 3, other ? '#9af0f0' : '#ffb9d9');
          }
          if (showGhost) stroke(ghost, true);
          stroke(trail, false);
          label(c, 'LORENZ SYSTEM / RUNGE–KUTTA 4', 17, 26, '#f3a9df');
          if (showGhost) {
            const p = trail.at(-1), q = ghost.at(-1);
            output.textContent = 'Initial separation: 0.001  ·  Separation at t = ' + f((steps-1)*dt,1) + ': ' + f(Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]),3);
          } else output.textContent = 'ρ = ' + rho + '  ·  ' + steps.toLocaleString('en-US') + ' integration steps  ·  Pink dot marks the endpoint.';
        }
        let showGhost = false;
        function rebuild() { trail = integrate([.1, .1, 2]); ghost = integrate([.101, .1, 2]); draw(); }
        range(controls, 'ρ', 8, 46, 1, rho, v => { rho = v; rebuild(); });
        const angle = range(controls, 'Rotate', 0, 360, 1, azimuth, v => { azimuth = v; draw(); }, v => v + '°');
        range(controls, 'Tilt', -38, 60, 1, elevation, v => { elevation = v; draw(); }, v => v + '°');
        const compare = button(controls, 'Compare nearby path', () => {
          showGhost = !showGhost; compare.setAttribute('aria-pressed', String(showGhost)); draw();
        });
        compare.setAttribute('aria-pressed', 'false');
        const stop = animation(controls, dt => { azimuth = (azimuth + 31*dt)%360; angle.set(azimuth); draw(); });
        rebuild();
        return stop;
      }
    },
    {
      id:'julia-atlas', title:'Julia Atlas', summary:'Zoom into a quadratic fractal and change the complex constant shaping it.', tag:'FRACTAL GEOMETRY', accent:'#b8a3ff',
      mount(root) {
        const {controls, c, canvas, output} = ui(root, 'Escape-time image of the Julia set', 'The equation iterated at every point is z ← z² + c. Dark points have not escaped after 96 steps. Click the image to recenter, or use the keyboard-accessible pan buttons.');
        let cr = -.8, ci = .156, centerX = 0, centerY = 0, level = 0;
        const w = 456, h = 192, field = image(c, w, h);
        const colors = palette([[8,14,30],[19,34,80],[82,63,159],[135,107,246],[238,153,193],[255,224,177]]);
        const scale = () => 1.47 / Math.pow(2,level);
        function draw() {
          const unit = scale() * 2 / h, max = 96;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            let a = centerX+(x-w/2)*unit, b = centerY+(h/2-y)*unit, i = 0, aa = a*a, bb = b*b;
            while (i < max && aa+bb < 4) { const t = aa-bb+cr; b = 2*a*b+ci; a = t; aa = a*a; bb = b*b; i++; }
            const at = 4*(y*w+x);
            if (i === max) rgb(field.data, at, [4,8,18]);
            else {
              const smooth = i + 1 - Math.log2(Math.log2(Math.sqrt(aa+bb)));
              rgb(field.data, at, colors[clamp(Math.floor(53*Math.log2(1+Math.max(smooth,0))),0,255)]);
            }
          }
          field.paint();
          c.fillStyle = 'rgba(8,16,25,.75)'; c.fillRect(10, 11, 169, 27);
          label(c, 'ESCAPE-TIME MAP', 19, 30, '#e4d7ff');
          line(c,W/2-7,H/2,W/2+7,H/2,'rgba(255,255,255,.45)');
          line(c,W/2,H/2-7,W/2,H/2+7,'rgba(255,255,255,.45)');
          const complex = (a,b,p) => f(a,p) + (b < 0 ? ' − ' : ' + ') + f(Math.abs(b),p) + 'i';
          output.textContent = 'c = ' + complex(cr,ci,3) + '  ·  Center: ' + complex(centerX,centerY,4) + '  ·  ' + Math.pow(2,level) + '× zoom';
        }
        const modes = [[-.8,.156],[-.745,.113],[.285,.01],[-.123,.745],[-1,0]];
        select(controls, 'Constant c', ['Filigree','Seahorse','Rosette','Rabbit','Basilica'], i => {
          [cr, ci] = modes[i]; centerX = 0; centerY = 0; level = 0; zoom.set(0); draw();
        });
        const zoom = range(controls, 'Zoom', 0, 9, 1, 0, v => { level = v; draw(); }, v => Math.pow(2,v) + '×');
        function pan(x,y) { centerX += x*scale()*.48; centerY += y*scale()*.48; draw(); }
        for (const [name, x, y] of [['←',-1,0],['→',1,0],['↑',0,1],['↓',0,-1]]) {
          const b = button(controls, name, () => pan(x,y));
          b.setAttribute('aria-label', 'Pan ' + ({'←':'left','→':'right','↑':'up','↓':'down'})[name]);
        }
        button(controls, 'Reset view', () => { level = 0; centerX = 0; centerY = 0; zoom.set(0); draw(); });
        canvas.addEventListener('click', event => {
          const [x,y] = point(canvas,event);
          centerX += (x-W/2)*scale()*2/H; centerY += (H/2-y)*scale()*2/H; draw();
        });
        draw();
      }
    },
    {
      id:'thermal-ink', title:'Thermal Ink', summary:'Paint heat into a plate, then trap or release it with an insulating wall.', tag:'HEAT TRANSFER', accent:'#ff9d72',
      mount(root) {
        const {controls, canvas, c, output} = ui(root, 'Heat diffusion on a rectangular plate with a possible center barrier', 'Click the plate to add heat, or press Pulse. The model has insulated outer edges. The center wall blocks heat flow except through its opening.');
        const w = 112, h = 48, field = image(c,w,h), wallX = w>>1;
        let a = new Float32Array(w*h), b = new Float32Array(w*h);
        let wall = true, diffusion = .21, time = 0;
        const blocked = (x, y) => wall && x === wallX && (y < 18 || y > 29);
        function heat(x, y) {
          for (let yy = Math.max(0,y-9); yy <= Math.min(h-1,y+9); yy++) for (let xx = Math.max(0,x-9); xx <= Math.min(w-1,x+9); xx++) {
            if (!blocked(xx,yy)) a[yy*w+xx] = Math.max(a[yy*w+xx], Math.exp(-((xx-x)**2+(yy-y)**2)/22));
          }
        }
        function step(count) {
          for (let n = 0; n < count; n++, time++) {
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
              const i = y*w+x, v = a[i];
              if (blocked(x,y)) { b[i] = 0; continue; }
              let sum = 0;
              if (x > 0 && !blocked(x-1,y)) sum += a[i-1] - v;
              if (x < w-1 && !blocked(x+1,y)) sum += a[i+1] - v;
              if (y > 0 && !blocked(x,y-1)) sum += a[i-w] - v;
              if (y < h-1 && !blocked(x,y+1)) sum += a[i+w] - v;
              b[i] = v + sum*diffusion;
            }
            [a,b]=[b,a];
          }
          draw();
        }
        function draw() {
          let mean = 0, peak = 0;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const i = y*w+x, v = a[i]; mean += v; peak = Math.max(peak,v);
            rgb(field.data, i*4, blocked(x,y) ? [69,91,112] : ember[clamp(Math.floor(255*Math.sqrt(v)),0,255)]);
          }
          field.paint(0,0,W,H,false);
          c.fillStyle = 'rgba(8,16,25,.8)'; c.fillRect(10, 10, 150, 27);
          label(c, 'TEMPERATURE', 20, 28, '#facab9');
          output.textContent = 'Step ' + time + '  ·  Peak temperature: ' + f(peak,3) + '  ·  Mean: ' + f(mean/(w*h),3) + ' normalized units';
        }
        range(controls, 'Diffusion', .03, .24, .01, diffusion, v => { diffusion = v; }, v => f(v));
        button(controls, 'Pulse', () => { heat(34,24); draw(); });
        button(controls, 'Step × 20', () => step(20));
        const divider = button(controls, 'Insulating wall', () => { wall = !wall; divider.setAttribute('aria-pressed',String(wall)); if (wall) for(let y=0;y<h;y++) if(blocked(wallX,y)) a[y*w+wallX]=0; draw(); });
        divider.setAttribute('aria-pressed','true');
        const stop = animation(controls, () => step(8));
        button(controls, 'Reset', () => { stop(); a.fill(0); b.fill(0); time = 0; seed(); });
        canvas.addEventListener('click', event => {
          const [x,y] = point(canvas,event);
          heat(clamp(Math.floor(x*w/W),0,w-1),clamp(Math.floor(y*h/H),0,h-1)); draw();
        });
        function seed() { heat(29,15); heat(46,24); heat(29,32); step(12); }
        seed();
        return stop;
      }
    },
    {
      id:'fourier-draw', title:'Fourier Draw', summary:'Rebuild a closed curve from a chain of spinning vectors.', tag:'SIGNAL GEOMETRY', accent:'#f6d580',
      mount(root) {
        const {controls, c, output} = ui(root, 'Fourier epicycle chain and the closed curve it draws', 'A discrete Fourier transform decomposes each outline into rotating vectors. The demo keeps the largest coefficients first, so adding vectors usually sharpens the fit.');
        const N = 128, radius = 102;
        let curve = [], coefficients = [], path = [], count = 7, t = .72, active = 0;
        const shapes = [
          a => { const r = .47 + .4*(.5+.5*Math.cos(5*a))**3.5 + .06*Math.cos(2*a+.4) + .035*Math.sin(17*a); return [r*Math.cos(a), -r*Math.sin(a)]; },
          a => [Math.sin(a)**3, -(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a)+2)/17],
          a => [(.53+.31*Math.cos(3*a))*Math.cos(a), (.53+.31*Math.cos(3*a))*Math.sin(a)]
        ];
        function build(i) {
          active = i;
          curve = Array.from({length:N},(_,j) => shapes[i](TAU*j/N));
          coefficients = Array.from({length:N},(_,k) => {
            let x=0, y=0;
            for (let j=0;j<N;j++) {
              const a = k*TAU*j/N, co = Math.cos(a), si = Math.sin(a), p = curve[j];
              x += p[0]*co + p[1]*si; y += p[1]*co - p[0]*si;
            }
            x /= N; y /= N;
            return {amp:Math.hypot(x,y), phase:Math.atan2(y,x), k:k<=N/2?k:k-N};
          }).sort((a,b) => b.amp-a.amp);
          rebuild();
        }
        function vector(j,u) {
          const o = coefficients[j], a = o.k*u*TAU+o.phase;
          return [o.amp*Math.cos(a),o.amp*Math.sin(a)];
        }
        function approximate(u) {
          let x=0,y=0;
          for (let j=0;j<count;j++) { const p=vector(j,u); x+=p[0]; y+=p[1]; }
          return [x,y];
        }
        function rebuild() { path=Array.from({length:257},(_,j) => approximate(j/256)); draw(); }
        function trace(points,x,y,end,style,width) {
          if (end < 1) return;
          c.beginPath(); c.moveTo(x+radius*points[0][0],y+radius*points[0][1]);
          for(let i=1;i<=end;i++) c.lineTo(x+radius*points[i][0],y+radius*points[i][1]);
          c.strokeStyle=style;c.lineWidth=width;c.stroke();
        }
        function draw() {
          clear(c); line(c,366,12,366,308,'#45546a');
          label(c,'ROTATING VECTORS',16,26,'#f6d580');
          label(c,'TRACED OUTLINE',385,26,'#a8f2e6');
          let x=188,y=163;
          for (let j=0;j<count;j++) {
            const v=vector(j,t), r=coefficients[j].amp*radius, u=x+v[0]*radius, w=y+v[1]*radius;
            if (r>.5) { ring(c,x,y,r,'rgba(246,213,128,.26)'); line(c,x,y,u,w,j%2===0?'#f6d580':'#e38f92',1.35); }
            x=u;y=w;
          }
          dot(c,x,y,3,'#fff0bd');
          const target = [...curve,curve[0]];
          c.setLineDash([4,5]); trace(target,553,166,N,'#66859a',1); c.setLineDash([]);
          trace(path,553,166,256,'rgba(103,228,211,.17)',1.5);
          trace(path,553,166,Math.floor(256*t),'#78ebd5',2.4);
          const p=approximate(t); dot(c,553+radius*p[0],166+radius*p[1],3,'#e4fff1');
          const residual = Math.sqrt(coefficients.slice(count).reduce((s,k) => s+k.amp*k.amp,0));
          output.textContent = ['Five-point bloom','Heart','Trefoil'][active] + '  ·  ' + count + ' vectors  ·  RMS sample error: ' + f(residual,4);
        }
        select(controls,'Target',['Five-point bloom','Heart','Trefoil'],build);
        range(controls,'Vectors',1,24,1,count,v => {count=v;rebuild();});
        const phase=range(controls,'Trace',0,100,1,72,v=>{t=v/100;draw();},v=>v+'%');
        const stop=animation(controls,dt=>{t=(t+dt*.18)%1;phase.set(t*100);draw();});
        build(0);
        return stop;
      }
    },
    {
      id:'spin-weather', title:'Spin Weather', summary:'Watch magnetic domains assemble and dissolve in a thermal lattice.', tag:'STATISTICAL PHYSICS', accent:'#9fe5b6',
      mount(root) {
        const {controls,c,output}=ui(root,'Two-dimensional Ising lattice colored by up and down spin','Each cell flips probabilistically according to the Ising energy change. Raise the temperature to break up domains, or apply a field to favor one spin. The edges wrap.');
        const w=76,h=32,N=w*h,spins=new Int8Array(N), field=image(c,w,h);
        let temperature=2.225, externalField=0, time=0, rng=rand(832879);
        const north=new Int32Array(N), south=new Int32Array(N), east=new Int32Array(N), west=new Int32Array(N);
        for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
          const i=y*w+x;
          north[i]=((y-1+h)%h)*w+x; south[i]=((y+1)%h)*w+x;
          east[i]=y*w+(x+1)%w; west[i]=y*w+(x-1+w)%w;
        }
        function step(sweeps) {
          const chance = Array.from({length:18},(_,i)=>Math.exp(-Math.max(0,2*(i<9?1:-1)*((i%9)-4+externalField))/temperature));
          for(let k=0;k<N*sweeps;k++) {
            const i=Math.floor(rng()*N), s=spins[i], neighbors=spins[north[i]]+spins[south[i]]+spins[east[i]]+spins[west[i]];
            if(rng()<chance[(s>0?0:9)+neighbors+4]) spins[i]=-s;
          }
          time+=sweeps;draw();
        }
        function draw() {
          let sum=0, bonds=0;
          for(let i=0;i<N;i++) {
            const s=spins[i]; sum+=s; bonds+=s*(spins[east[i]]+spins[south[i]]);
            rgb(field.data,i*4,s>0?[170,236,180]:[21,52,73]);
          }
          field.paint(0,0,W,H,false);
          c.fillStyle='rgba(8,16,25,.9)'; c.fillRect(10,10,201,27);
          dot(c,24,23,4,'#aaecb4'); label(c,'UP',34,28,'#d4f8d9');
          dot(c,83,23,4,'#608ead'); label(c,'DOWN',93,28,'#c8e3f3');
          label(c,'PERIODIC',140,28,'#aab6c5',11);
          output.textContent='Sweep '+time+'  ·  Magnetization: '+f(sum/N,3)+'  ·  Energy per spin: '+f(-(bonds+externalField*sum)/N,3)+' J';
        }
        function reset(domains) {
          rng=rand(832879);time=0;
          for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
            const boundary=Math.sin(x*.17)+.8*Math.cos(y*.28)+.7*Math.sin(x*.07+y*.19);
            spins[y*w+x]=rng()<(domains?(boundary>0?.86:.16):.5)?1:-1;
          }
          if(domains) step(18); else draw();
        }
        range(controls,'Temperature',1,4.6,.025,temperature,v=>{temperature=v;},v=>f(v,3)+' J/kB');
        range(controls,'Field',-.65,.65,.05,0,v=>{externalField=v;draw();},v=>f(v)+' J');
        button(controls,'Step × 10',()=>step(10));
        const stop=animation(controls,()=>step(3));
        button(controls,'Reseed',()=>{stop();reset(false);});
        reset(true);
        return stop;
      }
    },
    {
      id:'crystal-diffraction', title:'Crystal Diffraction', summary:'Change a 2D lattice and see which diffraction spots survive.', tag:'CRYSTAL PHYSICS', accent:'#a4e6fb',
      mount(root) {
        const {controls,c,output}=ui(root,'A crystal lattice and its calculated reciprocal-space diffraction pattern','The right panel shows squared scattering amplitude for identical points. A centered lattice adds a second point in every cell and cancels some of the diffraction spots.');
        const w=220,h=148,field=image(c,w,h),plots=[{a:1,b:1,basis:false},{a:1,b:1.5,basis:false},{a:1,b:1,basis:true}];
        let kind=0,n=5,zoom=2.65;
        const px=326,py=30,pw=434,ph=290;
        function sum(q,m) {
          const denom=Math.sin(PI*q);
          return Math.abs(denom)<1e-7?1:Math.sin(PI*q*m)/(m*denom);
        }
        function draw() {
          clear(c);
          const {a,b,basis}=plots[kind], unit=Math.min(40,220/(n*Math.max(a,b)));
          const offset=(n-1+(basis?.5:0))/2;
          for(let y=0;y<n;y++) for(let x=0;x<n;x++) {
            const X=151+(x-offset)*unit*a,Y=166+(y-offset)*unit*b;
            if(x<n-1) line(c,X,Y,X+unit*a,Y,'#334b60');
            if(y<n-1) line(c,X,Y,X,Y+unit*b,'#334b60');
            dot(c,X,Y,3.8,'#b1e9fb');
            if(basis) dot(c,X+unit*a/2,Y+unit*b/2,3.4,'#ffbe7d');
          }
          for(let y=0;y<h;y++) {
            const qy=(1-2*y/(h-1))*zoom, sy=sum(qy*b,n);
            for(let x=0;x<w;x++) {
              const qx=(2*x/(w-1)-1)*zoom*pw/ph, sx=sum(qx*a,n);
              const co=basis?.5+.5*Math.cos(PI*(qx*a+qy*b)):1;
              const intensity=sx*sx*sy*sy*co;
              rgb(field.data,4*(y*w+x),volt[Math.floor(255.99*Math.pow(clamp(intensity,0,1),.27))]);
            }
          }
          field.paint(px,py,pw,ph,true);
          line(c,px,py+ph/2,px+pw,py+ph/2,'rgba(170,212,248,.3)');
          line(c,px+pw/2,py,px+pw/2,py+ph,'rgba(170,212,248,.3)');
          label(c,'REAL SPACE',16,22,'#a4e6fb'); label(c,'DIFFRACTION / RECIPROCAL SPACE',px+16,22,'#a4e6fb');
          label(c,'qₓ',px+pw-22,py+ph/2-7,'#f2eaff');label(c,'qᵧ',px+pw/2+6,py+15,'#f2eaff');
          output.textContent=(n*n*(basis?2:1))+' scattering points  ·  Lattice spacings: '+f(a,1)+' × '+f(b,1)+' a.u.  ·  Relative intensity uses a compressed color scale.';
        }
        select(controls,'Lattice',['Square','Rectangular','Centered square'],i=>{kind=i;draw();});
        range(controls,'Cells per axis',2,10,1,n,v=>{n=v;draw();});
        range(controls,'q range',.7,3.8,.05,zoom,v=>{zoom=v;draw();},v=>f(v,2));
        draw();
      }
    },
    {
      id:'einstein-glass', title:'Einstein Glass', summary:'Move a star behind a compact lens and watch it become two images or a ring.', tag:'GRAVITATIONAL LENSING', accent:'#efc47d',
      mount(root) {
        const {controls,c,output}=ui(root,'Side-by-side unlensed source positions and images formed by a point gravity lens','For a point-mass lens, a star slightly off axis produces a bright image outside the Einstein radius and a fainter image inside it. At exact alignment, the model produces a ring.');
        let x=.66,y=.26,einstein=.89,showField=true;
        const centers=[182,556], cy=166,scale=63, sky=[];
        const r=rand(3192);
        for(let i=0;i<27;i++) sky.push([(r()-.5)*4.55,(r()-.5)*3.88,.24+.61*r()]);
        function glow(X,Y,rad,warm,intensity) {
          const g=c.createRadialGradient(X,Y,0,X,Y,rad*4);
          g.addColorStop(0,warm?'rgba(255,219,158,'+intensity+')':'rgba(197,235,255,'+intensity+')');
          g.addColorStop(1,'rgba(0,0,0,0)');
          c.fillStyle=g;c.fillRect(X-rad*4,Y-rad*4,rad*8,rad*8);
          dot(c,X,Y,Math.max(.6,rad*.52),warm?'#ffe7ac':'#c3e8fa');
        }
        function lens(sx,sy,strength,main) {
          const rr=Math.hypot(sx,sy), ex=einstein;
          glow(centers[0]+sx*scale,cy-sy*scale,main?5:strength*1.8,main,main?.95:.5);
          if(rr<1e-7) {
            const R=ex*scale;
            for(let i=9;i>0;i-=2) ring(c,centers[1],cy,R,'rgba(254,202,121,'+(10-i)*.027+')',i);
            ring(c,centers[1],cy,R,'#ffecb5',1.65);
            return;
          }
          const sep=Math.sqrt(rr*rr+4*ex*ex), u=rr/ex;
          const radii=[(rr+sep)/2,(rr-sep)/2], total=(u*u+2)/(u*Math.sqrt(u*u+4));
          for(let j=0;j<2;j++) {
            const m=Math.abs(.5*(total+(j===0?1:-1))), a=radii[j]/rr, X=centers[1]+sx*a*scale, Y=cy-sy*a*scale;
            if(m<.017&&!main) continue;
            const rad=main?clamp(3.7*Math.sqrt(m),1.3,11):clamp(strength*1.9*Math.sqrt(m),.35,2.3);
            glow(X,Y,rad,main,main?.92:.53);
            if(main) label(c,j===0?'θ+':'θ−',X+8,Y-8,'#ffefc8',12);
          }
        }
        function draw() {
          clear(c,false);
          for(let p=0;p<2;p++) {
            c.save();c.beginPath();c.rect(p?375:0,0,p?385:366,H);c.clip();
            const cx=centers[p];
            for(let i=1;i<=3;i++) ring(c,cx,cy,scale*i/2,'#202d3b');
            line(c,cx-164,cy,cx+164,cy,'#294055');
            line(c,cx,40,cx,292,'#294055');
            c.restore();
          }
          line(c,370,13,370,307,'#425269');
          c.setLineDash([5,6]);ring(c,centers[1],cy,einstein*scale,'#c18d5a',1);c.setLineDash([]);
          dot(c,centers[1],cy,4,'#152231');ring(c,centers[1],cy,4,'#aa895f',1);
          if(showField) for(const s of sky) lens(...s,false);
          lens(x,y,1,true);
          label(c,'SOURCE PLANE',16,25,'#efc47d');label(c,'IMAGE PLANE',390,25,'#efc47d');
          const u=Math.hypot(x,y)/einstein;
          output.textContent=u<1e-7?'Exact alignment  ·  Einstein ring radius: '+f(einstein)+' units  ·  Point-source model': 'Source separation: '+f(u)+' Einstein radii  ·  Total magnification: '+f((u*u+2)/(u*Math.sqrt(u*u+4)))+'×';
        }
        const left=range(controls,'Source x',-1.4,1.4,.01,x,v=>{x=v;draw();},v=>f(v));
        const up=range(controls,'Source y',-1.4,1.4,.01,y,v=>{y=v;draw();},v=>f(v));
        range(controls,'Einstein radius',.35,1.5,.01,einstein,v=>{einstein=v;draw();},v=>f(v));
        button(controls,'Align star',()=>{x=0;y=0;left.set(0);up.set(0);draw();});
        const stars=button(controls,'Background stars',()=>{showField=!showField;stars.setAttribute('aria-pressed',String(showField));draw();});
        stars.setAttribute('aria-pressed','true');
        draw();
      }
    },
    {
      id:'voronoi-commons', title:'Voronoi Commons', summary:'Partition a map by nearest neighbor and watch Lloyd relaxation even it out.', tag:'COMPUTATIONAL GEOMETRY', accent:'#a5e2bc',
      mount(root) {
        const {controls,c,canvas,output}=ui(root,'Voronoi cells divided by distance to their nearest site','Click a blank part of the map to place a site. Relax moves every site to its current cell’s centroid. The dual connects sites whose cells share an edge.');
        const bounds=[13,38,W-13,H-13];
        let sites=[], selected=0, dual=false, iterations=0;
        let rng=rand(11583), nextId=1;
        const d2=(s,p)=>(s.x-p[0])**2+(s.y-p[1])**2;
        function clip(poly, a, b, d) {
          const out=[];
          for(let i=0;i<poly.length;i++) {
            const p=poly[i],q=poly[(i+1)%poly.length],fp=a*p[0]+b*p[1]-d,fq=a*q[0]+b*q[1]-d;
            if(fp<=0) out.push(p);
            if((fp<0&&fq>0)||(fp>0&&fq<0)) {
              const t=fp/(fp-fq);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);
            }
          }
          return out;
        }
        function cells() {
          const [x,y,u,v]=bounds;
          return sites.map((s,j)=>{
            let poly=[[x,y],[u,y],[u,v],[x,v]];
            for(let i=0;i<sites.length&&poly.length;i++) if(i!==j) {
              const t=sites[i];poly=clip(poly,t.x-s.x,t.y-s.y,(t.x*t.x+t.y*t.y-s.x*s.x-s.y*s.y)/2);
            }
            let area=0,cx=0,cyy=0;
            for(let i=0;i<poly.length;i++) {
              const p=poly[i],q=poly[(i+1)%poly.length],k=p[0]*q[1]-q[0]*p[1];
              area+=k;cx+=(p[0]+q[0])*k;cyy+=(p[1]+q[1])*k;
            }
            return {poly,area:Math.abs(area)/2,x:Math.abs(area)>1e-9?cx/(3*area):s.x,y:Math.abs(area)>1e-9?cyy/(3*area):s.y};
          });
        }
        function draw() {
          clear(c,false);
          const regions=cells();
          for(let i=0;i<sites.length;i++) {
            const s=sites[i],p=regions[i].poly;
            if(!p.length) continue;
            c.beginPath();c.moveTo(...p[0]);for(let j=1;j<p.length;j++)c.lineTo(...p[j]);c.closePath();
            const h=(s.id*49+130)%360;
            c.fillStyle='hsl('+h+',42%,'+(i===selected?36:22)+'%)';
            c.fill();c.strokeStyle='rgba(215,236,241,.55)';c.lineWidth=.9;c.stroke();
          }
          if(dual) for(let i=0;i<sites.length;i++) {
            const s=sites[i],p=regions[i].poly;
            for(let k=0;k<p.length;k++) {
              const q=p[(k+1)%p.length],r=p[k],mid=[(q[0]+r[0])/2,(q[1]+r[1])/2];
              if(Math.hypot(q[0]-r[0],q[1]-r[1])<.01)continue;
              for(let j=i+1;j<sites.length;j++) {
                const t=sites[j];
                if(Math.abs(d2(s,mid)-d2(t,mid))<.001)line(c,s.x,s.y,t.x,t.y,'rgba(255,239,189,.8)',1.4);
              }
            }
          }
          sites.forEach((s,i)=>{if(i===selected)ring(c,s.x,s.y,8,'#ffdfa3',1.3);dot(c,s.x,s.y,i===selected?3.8:2.8,i===selected?'#ffdfa3':'#e9fff8');});
          label(c,'NEAREST-SITE PARTITION',14,24,'#a5e2bc');
          label(c,dual?'DUAL VISIBLE':'LLOYD STEP '+iterations,624,24,'#bec9d8',12);
          const areas=regions.map(s=>s.area);
          const mean=areas.reduce((a,b)=>a+b,0)/areas.length;
          const variation=Math.sqrt(areas.reduce((a,b)=>a+(b-mean)**2,0)/areas.length)/mean;
          const relative=areas[selected]/mean;
          output.textContent=sites.length+' sites  ·  Selected cell: '+f(relative)+'× mean area  ·  Area variation: '+f(100*variation,1)+'%';
        }
        function add(x,y) {
          if(sites.length>=32)return;
          sites.push({x,y,id:nextId++});selected=sites.length-1;draw();
        }
        button(controls,'Add site',()=>{
          let x,y;
          for(let i=0;i<50;i++) {
            x=35+rng()*(W-70);y=62+rng()*(H-100);
            if(sites.every(s=>d2(s,[x,y])>220))break;
          }
          add(x,y);
        });
        button(controls,'Select next',()=>{selected=(selected+1)%sites.length;draw();});
        button(controls,'Remove selected',()=>{if(sites.length>1){sites.splice(selected,1);selected=Math.min(selected,sites.length-1);draw();}});
        button(controls,'Relax',()=>{sites=cells().map((cell,i)=>({x:cell.x,y:cell.y,id:sites[i].id}));iterations++;draw();});
        const mesh=button(controls,'Show dual',()=>{dual=!dual;mesh.setAttribute('aria-pressed',String(dual));draw();});
        mesh.setAttribute('aria-pressed','false');
        button(controls,'Reset',reset);
        canvas.addEventListener('click',event=>{
          const [x,y]=point(canvas,event);
          if(x<bounds[0]||x>bounds[2]||y<bounds[1]||y>bounds[3])return;
          const near=sites.findIndex(s=>d2(s,[x,y])<14**2);
          if(near>=0){selected=near;draw();} else add(x,y);
        });
        function reset() {
          rng=rand(11583);selected=0;iterations=0;nextId=1;
          sites=Array.from({length:12},()=>({x:30+rng()*(W-60),y:56+rng()*(H-85),id:nextId++}));
          draw();
        }
        reset();
      }
    }
  ];

  (window.SOL_SECTIONS || (window.SOL_SECTIONS = {})).Science = projects;
}());
