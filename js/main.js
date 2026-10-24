/* ===== water background (WebGL, runs behind the glass UI) ===== */
(function initWaterBackground() {
  const canvas = document.getElementById("bgWater");
  if (!canvas) return;

  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
  });
  if (!gl) return; // the blurred CSS photo stays as the background

  const phone = window.matchMedia("(max-width: 768px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The scene is blurred anyway: render small and let the browser upscale it.
  const SCALE = phone ? 0.4 : 0.55;
  const FPS = phone ? 24 : 30;
  const BLUR_BIAS = phone ? 2.2 : 3.0; // mip level offset: a smooth, cheap blur
  const TEXTURE_SIZE = phone ? [1024, 512] : [2048, 1024];
  const LOOP = 125.6637; // 2*PI/0.05: every wave term wraps seamlessly

  const vertexSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }`;

  const fragmentSource = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D u_tex;
    uniform vec2 u_res;
    uniform vec2 u_img;
    uniform float u_time;
    uniform float u_bias;
    uniform float u_water;
    varying vec2 v_uv;

    vec2 ripple(vec2 p, float t) {
      float d = p.y - u_water;
      float mask = smoothstep(0.0, 0.03, d);
      float depth = clamp(d / (1.0 - u_water), 0.0, 1.0);
      float z = 1.0 / (d + 0.06);
      float wave = sin(z * 5.0 + t * 0.9 + sin(p.x * 7.0 + t * 0.25) * 1.6);
      wave += 0.5 * sin(z * 11.0 - t * 1.3 + p.x * 12.0);
      float amp = mask * (0.0010 + 0.0060 * depth);
      p.x += wave * amp;
      return p;
    }

    void main() {
      float sr = u_res.x / u_res.y;
      float ir = u_img.x / u_img.y;
      vec2 s = sr > ir ? vec2(1.0, ir / sr) : vec2(sr / ir, 1.0);
      vec2 p = ripple((v_uv - 0.5) * s + 0.5, u_time);

      vec2 o = (vec2(0.75) / u_res) * s;
      vec3 c = texture2D(u_tex, p, u_bias).rgb * 0.4;
      c += (texture2D(u_tex, p + o, u_bias).rgb + texture2D(u_tex, p - o, u_bias).rgb
          + texture2D(u_tex, p + vec2(o.x, -o.y), u_bias).rgb + texture2D(u_tex, p + vec2(-o.x, o.y), u_bias).rgb) * 0.15;

      float vignette = smoothstep(1.15, 0.35, length(v_uv - 0.5));
      c *= (0.86 + 0.14 * vignette);
      gl_FragColor = vec4(c, 1.0);
    }`;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }

  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertex || !fragment) return;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_pos");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name) => gl.getUniformLocation(program, name);
  const uRes = uniform("u_res");
  const uImg = uniform("u_img");
  const uTime = uniform("u_time");
  const uBias = uniform("u_bias");
  const uWater = uniform("u_water");

  let ready = false;
  let rafId = 0;
  let lastFrame = 0;
  let viewW = 0;
  let viewH = 0;

  function resize(force) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Ignore the mobile URL bar showing/hiding: only react to real size changes.
    if (!force && w === viewW && Math.abs(h - viewH) < 150) return;
    viewW = w;
    viewH = h;
    canvas.width = Math.max(2, Math.round(w * SCALE));
    canvas.height = Math.max(2, Math.round(h * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    if (ready) draw(performance.now());
  }

  function draw(now) {
    gl.uniform1f(uTime, reduceMotion ? 7.0 : (now / 1000) % LOOP);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - lastFrame < 1000 / FPS) return;
    lastFrame = now;
    draw(now);
  }

  function start() {
    if (rafId || reduceMotion || !ready) return;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  const image = new Image();
  image.decoding = "async";
  image.onload = () => {
    // Pre-scale to a power-of-two texture so mipmaps remove shimmering on the moving water.
    const source = document.createElement("canvas");
    source.width = TEXTURE_SIZE[0];
    source.height = TEXTURE_SIZE[1];
    const sctx = source.getContext("2d");
    sctx.imageSmoothingQuality = "high";
    sctx.drawImage(image, 0, 0, source.width, source.height);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(uniform("u_tex"), 0);
    gl.uniform2f(uImg, image.naturalWidth, image.naturalHeight);
    gl.uniform1f(uWater, 0.675); // where the shore meets the lake in the photo
    gl.uniform1f(uBias, BLUR_BIAS);

    ready = true;
    resize(true);
    draw(performance.now());
    canvas.classList.add("ready");
    start();
  };
  image.src = phone && canvas.dataset.srcSmall ? canvas.dataset.srcSmall : canvas.dataset.src;

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => resize(false), 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    canvas.classList.remove("ready");
  });
})();
/* ===== end water background ===== */



function initNotify() {
  const STORAGE_KEY = "notifySeen";

  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
  } catch (error) {
    return;
  }

  const stack = document.getElementById("notifyStack");
  if (!stack) return;

  const duration = 6000;

  const notify = document.createElement("div");
  notify.className = "notify";
  notify.innerHTML = `
    <div class="notify-header">
      <span class="notify-level"><span class="notify-dot"></span>hint</span>
      <button class="notify-close" aria-label="Dismiss">×</button>
    </div>
    <div class="notify-body">This isn't a screenshot — tabs, files and lines are all clickable. Try it.</div>
    <div class="notify-progress"></div>
  `;

  const progress = notify.querySelector(".notify-progress");
  progress.style.animationDuration = `${duration}ms`;

  stack.appendChild(notify);
  requestAnimationFrame(() => notify.classList.add("show"));

  let dismissTimer = setTimeout(dismiss, duration);

  function dismiss() {
    clearTimeout(dismissTimer);
    notify.classList.remove("show");
    setTimeout(() => notify.remove(), 350);
  }

  notify.querySelector(".notify-close").addEventListener("click", dismiss);

  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch (error) {
    return;
  }
}

const workspace = document.getElementById("scrollWorkspace");
const percentLabel = document.getElementById("scrollPercent");

if (workspace && percentLabel) {
  workspace.addEventListener("scroll", () => {
    const scrollTop = workspace.scrollTop;
    const maxScroll = workspace.scrollHeight - workspace.clientHeight;

    if (maxScroll <= 0) {
      percentLabel.textContent = "100%";
      return;
    }

    const percentage = Math.round((scrollTop / maxScroll) * 100);

    if (percentage === 0) {
      percentLabel.textContent = "Top";
    } else if (percentage >= 99) {
      percentLabel.textContent = "Bot";
    } else {
      percentLabel.textContent = `${percentage}%`;
    }
  });
}

function initSidebarDrawer() {
  const menuToggle = document.getElementById("menuToggle");
  const sidebar = document.getElementById("sidebar");
  const sidebarBackdrop = document.getElementById("sidebarBackdrop");
  const sidebarClose = document.getElementById("sidebarClose");

  if (!menuToggle || !sidebar || !sidebarBackdrop) return;

  function closeDrawer() {
    sidebar.classList.remove("open");
    sidebarBackdrop.classList.remove("visible");
  }

  function toggleDrawer() {
    sidebar.classList.toggle("open");
    sidebarBackdrop.classList.toggle("visible");
  }

  menuToggle.addEventListener("click", toggleDrawer);
  sidebarBackdrop.addEventListener("click", closeDrawer);

  if (sidebarClose) {
    sidebarClose.addEventListener("click", closeDrawer);
  }

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });
}

function initTabClosers() {
  if (window.matchMedia("(max-width: 768px)").matches) return;

  const STORAGE_KEY = "closedTabsV2";
  const tabs = document.querySelectorAll(".tab");
  const sidebarLinks = document.querySelectorAll(".file-item a[data-tab]");

  function readClosed() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw === null) {
        const defaults = Array.from(tabs)
          .map((tab) => tab.dataset.tab)
          .filter((id) => id && id !== "home");
        writeClosed(defaults);
        return defaults;
      }

      const stored = JSON.parse(raw);
      return Array.isArray(stored) ? stored : [];
    } catch (error) {
      return [];
    }
  }

  function writeClosed(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      return;
    }
  }

  const activeTab = document.querySelector(".tab.active");
  const activeId = activeTab ? activeTab.dataset.tab : null;
  const closed = readClosed().filter((id) => id !== activeId);
  writeClosed(closed);

  tabs.forEach((tab) => {
    if (closed.includes(tab.dataset.tab)) {
      tab.style.display = "none";
    }
  });

  tabs.forEach((tab) => {
    const closer = tab.querySelector(".tab-close");
    if (!closer) return;

    closer.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const id = tab.dataset.tab;
      const isActive = tab.classList.contains("active");

      tab.classList.add("tab-closing");

      setTimeout(() => {
        tab.style.display = "none";
      }, 180);

      if (!isActive) {
        const list = readClosed();
        if (!list.includes(id)) {
          list.push(id);
          writeClosed(list);
        }
      }
    });
  });

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const id = link.dataset.tab;
      writeClosed(readClosed().filter((item) => item !== id));
    });
  });
}

/* ===== syntax highlighter (lua / python / json) ===== */
const CODE_HIGHLIGHT = (() => {
  const words = (text) => new Set(text.split(" "));
  const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const peek = (src, index) => {
    let i = index;
    while (i < src.length && (src[i] === " " || src[i] === "\t")) i += 1;
    return src.slice(i, i + 2);
  };

  const LUA_KEYWORDS = words("and break do else elseif end for function goto if in local not or repeat return then until while");
  const LUA_CONSTANTS = words("true false nil");
  const LUA_BUILTINS = words("vim wezterm require print pairs ipairs next select type tostring tonumber pcall xpcall error assert setmetatable getmetatable rawget rawset unpack string table math os io coroutine debug package");

  const PY_KEYWORDS = words("and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield");
  const PY_CONSTANTS = words("True False None");
  const PY_BUILTINS = words("print len range str int float bool list dict set tuple open isinstance type super self cls enumerate zip map filter sorted sum min max abs any all input");

  const LANGS = {
    lua: {
      rules: [
        [/--\[(=*)\[[\s\S]*?\]\1\]/y, "comment"],
        [/--[^\n]*/y, "comment"],
        [/\[(=*)\[[\s\S]*?\]\1\]/y, "string"],
        [/"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*'/y, "string"],
        [/0[xX][0-9a-fA-F]+|\d+\.?\d*(?:[eE][+-]?\d+)?/y, "number"],
        [/[A-Za-z_][A-Za-z0-9_]*/y, "ident"],
        [/\.\.\.?|[+\-*\/%^#=<>~&|]+/y, "operator"],
        [/[{}()\[\];:,.]/y, "punctuation"],
      ],
      classify(word, ctx, src, end) {
        if (LUA_KEYWORDS.has(word)) return "keyword";
        if (LUA_CONSTANTS.has(word)) return "boolean";
        const before = ctx.prev ? ctx.prev.text : "";
        const ahead = peek(src, end);
        const isCall = ahead[0] === "(";
        if (before === "function") return "function";
        if (before === "." || before === ":") return isCall ? "function" : "property";
        if (ctx.depth > 0 && (before === "{" || before === ",") && ahead[0] === "=" && ahead[1] !== "=") return "property";
        if (LUA_BUILTINS.has(word)) return "builtin";
        return isCall ? "function" : null;
      },
    },

    python: {
      rules: [
        [/[rRbBfFuU]{0,2}("""|''')[\s\S]*?\1/y, "string"],
        [/[rRbBfFuU]{0,2}(?:"(?:\\[\s\S]|[^"\\\n])*"|'(?:\\[\s\S]|[^'\\\n])*')/y, "string"],
        [/#[^\n]*/y, "comment"],
        [/@[A-Za-z_][\w.]*/y, "decorator"],
        [/0[xX][0-9a-fA-F_]+|\d[\d_]*\.?\d*(?:[eE][+-]?\d+)?/y, "number"],
        [/[A-Za-z_][A-Za-z0-9_]*/y, "ident"],
        [/[+\-*\/%=<>!&|^~]+/y, "operator"],
        [/[{}()\[\]:,.;]/y, "punctuation"],
      ],
      classify(word, ctx, src, end) {
        if (PY_KEYWORDS.has(word)) return "keyword";
        if (PY_CONSTANTS.has(word)) return "boolean";
        const before = ctx.prev ? ctx.prev.text : "";
        const isCall = peek(src, end)[0] === "(";
        if (before === "def") return "function";
        if (before === "class") return "class-name";
        if (before === ".") return isCall ? "function" : "property";
        if (PY_BUILTINS.has(word)) return "builtin";
        if (isCall) return /^[A-Z]/.test(word) ? "class-name" : "function";
        return null;
      },
    },

    json: {
      rules: [
        [/"(?:\\[\s\S]|[^"\\\n])*"/y, "jsonstr"],
        [/-?\d+\.?\d*(?:[eE][+-]?\d+)?/y, "number"],
        [/[A-Za-z_][A-Za-z0-9_]*/y, "ident"],
        [/[{}\[\]:,]/y, "punctuation"],
      ],
      classify(word, ctx, src, end, kind) {
        if (kind === "jsonstr") return peek(src, end)[0] === ":" ? "property" : "string";
        return /^(true|false|null)$/.test(word) ? "boolean" : null;
      },
    },
  };

  LANGS.py = LANGS.python;

  function tokenize(src, lang) {
    const tokens = [];
    const ctx = { prev: null, depth: 0 };
    const whitespace = /\s+/y;
    let pos = 0;

    while (pos < src.length) {
      let matched = false;

      for (const [re, kind] of lang.rules) {
        re.lastIndex = pos;
        const m = re.exec(src);
        if (!m) continue;

        const text = m[0];
        const end = pos + text.length;
        const type = kind === "ident" || kind === "jsonstr" ? lang.classify(text, ctx, src, end, kind) : kind;

        tokens.push({ text, type });
        if (type !== "comment") ctx.prev = { text, type };
        if (text === "{") ctx.depth += 1;
        if (text === "}") ctx.depth = Math.max(0, ctx.depth - 1);

        pos = end;
        matched = true;
        break;
      }

      if (matched) continue;

      whitespace.lastIndex = pos;
      const ws = whitespace.exec(src);
      if (ws) {
        tokens.push({ text: ws[0], type: null });
        pos += ws[0].length;
      } else {
        tokens.push({ text: src[pos], type: null });
        ctx.prev = { text: src[pos], type: null };
        pos += 1;
      }
    }

    return tokens;
  }

  function toLines(tokens) {
    const lines = [""];
    for (const { text, type } of tokens) {
      text.split("\n").forEach((part, index) => {
        if (index > 0) lines.push("");
        if (part === "") return;
        const safe = escapeHtml(part);
        lines[lines.length - 1] += type ? `<span class="${type}">${safe}</span>` : safe;
      });
    }
    return lines;
  }

  return {
    highlight(source, langName) {
      const lang = LANGS[String(langName || "").toLowerCase()];
      if (!lang) return null;
      const src = source.replace(/\r\n?/g, "\n").replace(/^\n/, "").replace(/\s+$/, "");
      return toLines(tokenize(src, lang));
    },
  };
})();
/* ===== end syntax highlighter ===== */

function createRng(seedText) {
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i += 1) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function initCodeLineInteraction() {
  const codeBlock = document.getElementById("codeBlock");
  const lineNumbers = document.getElementById("lineNumbers");
  const gitGutter = document.getElementById("gitGutter");

  if (!codeBlock || !lineNumbers) return;

  const langHost = codeBlock.closest("[data-lang]");
  const highlighted = langHost
    ? CODE_HIGHLIGHT.highlight(codeBlock.textContent, langHost.dataset.lang)
    : null;
  const lines = highlighted || codeBlock.innerHTML.split("\n");

  codeBlock.innerHTML = lines
    .map((line, idx) => `<span class="code-line-span" data-line="${idx + 1}">${line}</span>`)
    .join("");

  if (gitGutter) {
    // Seeded by page + length: the same marks and counts on every visit.
    const rng = createRng(`${window.location.pathname}|${lines.length}`);
    const between = (min, max) => rng() * (max - min) + min;
    const marks = new Array(lines.length).fill(null);
    const hunkCount = Math.max(2, Math.round(lines.length / 12));

    for (let hunk = 0; hunk < hunkCount; hunk += 1) {
      const roll = rng();
      const type = roll > 0.45 ? "add" : roll > 0.1 ? "mod" : "del";
      const blockLength = type === "add"
        ? Math.ceil(between(1, 5))
        : type === "mod"
          ? Math.ceil(between(1, 3))
          : 1;
      const maxStart = Math.max(0, lines.length - blockLength);
      const start = Math.floor(between(0, maxStart));

      for (let offset = 0; offset < blockLength; offset += 1) {
        const idx = start + offset;
        if (idx < lines.length) {
          marks[idx] = type;
        }
      }
    }

    const symbols = { add: "+", mod: "~", del: "-" };
    gitGutter.innerHTML = marks
      .map((mark) => (mark ? `<span class="git-${mark}">${symbols[mark]}</span>` : "<span></span>"))
      .join("");

    const count = (type) => marks.filter((mark) => mark === type).length;
    const diffAdd = document.querySelector(".diff-add");
    const diffMod = document.querySelector(".diff-mod");
    const diffDel = document.querySelector(".diff-del");

    if (diffAdd) diffAdd.textContent = `+${count("add")}`;
    if (diffMod) diffMod.textContent = `~${count("mod")}`;
    if (diffDel) diffDel.textContent = `-${count("del")}`;
  }

  lineNumbers.innerHTML = lines.map((_, idx) => `<span data-line="${idx + 1}">${idx + 1}</span>`).join("");

  const numberEls = lineNumbers.children;
  const lineEls = codeBlock.children;
  const statusPosition = document.getElementById("statusPosition");
  let activeLine = 0;

  function setActiveLine(lineNum) {
    const num = Math.min(Math.max(parseInt(lineNum, 10) || 1, 1), lines.length);

    for (let i = 0; i < numberEls.length; i += 1) {
      const el = numberEls[i];
      const isCurrent = i + 1 === num;
      el.textContent = isCurrent ? num : Math.abs(i + 1 - num);
      el.classList.toggle("current", isCurrent);
    }

    if (activeLine && lineEls[activeLine - 1]) lineEls[activeLine - 1].classList.remove("active-line");
    if (lineEls[num - 1]) lineEls[num - 1].classList.add("active-line");
    activeLine = num;

    if (statusPosition) statusPosition.textContent = `Ln ${num}, Col 1`;
  }

  function lineFromEvent(event) {
    const target = event.target.closest("[data-line]");
    return target ? target.getAttribute("data-line") : null;
  }

  lineNumbers.addEventListener("click", (event) => {
    const line = lineFromEvent(event);
    if (line) setActiveLine(line);
  });

  codeBlock.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const line = lineFromEvent(event);
    if (line) setActiveLine(line);
  });

  setActiveLine(1);
}

document.addEventListener("DOMContentLoaded", () => {
  initNotify();
  initSidebarDrawer();
  initTabClosers();
  initCodeLineInteraction();
});