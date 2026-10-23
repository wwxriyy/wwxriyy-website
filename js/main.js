const canvas = document.querySelector("#starfield");
const ctx = canvas.getContext("2d");

const STAR_COLORS = [
  [255, 93, 143],
  [108, 92, 231],
  [56, 182, 255],
  [255, 159, 67],
  [34, 181, 115],
];

let stars = [];
let shootingStars = [];
let nebulaBlobs = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function initNebula() {
  const palette = [
    { r: 255, g: 154, b: 196 },
    { r: 167, g: 139, b: 250 },
    { r: 110, g: 207, b: 255 },
    { r: 255, g: 209, b: 102 },
    { r: 120, g: 230, b: 190 },
    { r: 255, g: 160, b: 122 },
  ];

  const shortSide = Math.min(width, height);
  const count = width < 700 ? 4 : 6;

  nebulaBlobs = Array.from({ length: count }, (_, index) => {
    const color = palette[index % palette.length];
    return {
      baseX: randomBetween(width * 0.08, width * 0.92),
      baseY: randomBetween(height * 0.08, height * 0.92),
      radius: randomBetween(shortSide * 0.32, shortSide * 0.52),
      color,
      driftX: randomBetween(26, 60),
      driftY: randomBetween(20, 48),
      speedX: randomBetween(0.00009, 0.00022),
      speedY: randomBetween(0.00011, 0.00026),
      phaseX: randomBetween(0, Math.PI * 2),
      phaseY: randomBetween(0, Math.PI * 2),
      pulseSpeed: randomBetween(0.00015, 0.0003),
      pulsePhase: randomBetween(0, Math.PI * 2),
    };
  });
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = Math.min(180, Math.max(80, Math.floor((width * height) / 8500)));
  stars = Array.from({ length: count }, () => ({
    x: randomBetween(0, width),
    y: randomBetween(0, height),
    radius: randomBetween(0.8, 2.6),
    phase: randomBetween(0, Math.PI * 2),
    speed: randomBetween(0.008, 0.024),
    drift: randomBetween(0.03, 0.11),
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
  }));

  initNebula();
}

function spawnShootingStar() {
  const maxShootingStars = width < 700 ? 2 : 5;

  if (shootingStars.length >= maxShootingStars) {
    return;
  }

  const freeSlots = maxShootingStars - shootingStars.length;
  const burstCount = width < 700 ? 1 : Math.min(freeSlots, Math.random() > 0.55 ? 2 : 1);

  for (let index = 0; index < burstCount; index += 1) {
    shootingStars.push({
      x: randomBetween(width * 0.18, width * 0.92),
      y: randomBetween(-20, height * 0.4),
      vx: randomBetween(-6.2, -3.4),
      vy: randomBetween(2.4, 4.5),
      life: 1,
      decay: randomBetween(0.01, 0.017),
      length: randomBetween(94, 168),
    });
  }
}

function drawNebula(time) {
  ctx.save();
  for (const blob of nebulaBlobs) {
    const x = blob.baseX + Math.sin(time * blob.speedX + blob.phaseX) * blob.driftX;
    const y = blob.baseY + Math.cos(time * blob.speedY + blob.phaseY) * blob.driftY;
    const pulse = 0.85 + Math.sin(time * blob.pulseSpeed + blob.pulsePhase) * 0.15;
    const radius = blob.radius * pulse;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.34)`);
    gradient.addColorStop(0.45, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.15)`);
    gradient.addColorStop(1, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function draw(time) {
  ctx.clearRect(0, 0, width, height);
  ctx.shadowBlur = 0;

  drawNebula(time || 0);

  for (const star of stars) {
    star.phase += star.speed;
    star.y += star.drift;

    if (star.y > height + 8) {
      star.y = -8;
      star.x = randomBetween(0, width);
    }

    const alpha = 0.28 + Math.abs(Math.sin(star.phase)) * 0.5;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${star.color[0]}, ${star.color[1]}, ${star.color[2]}, ${alpha})`;
    ctx.shadowColor = `rgba(${star.color[0]}, ${star.color[1]}, ${star.color[2]}, 0.35)`;
    ctx.shadowBlur = 6;
    ctx.fill();
  }

  for (const comet of shootingStars) {
    comet.x += comet.vx;
    comet.y += comet.vy;
    comet.life -= comet.decay;

    const gradient = ctx.createLinearGradient(
      comet.x,
      comet.y,
      comet.x - comet.vx * comet.length * 0.12,
      comet.y - comet.vy * comet.length * 0.12
    );
    gradient.addColorStop(0, `rgba(255, 93, 143, ${Math.max(comet.life * 0.85, 0)})`);
    gradient.addColorStop(1, "rgba(108, 92, 231, 0)");

    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(comet.x - comet.vx * comet.length * 0.12, comet.y - comet.vy * comet.length * 0.12);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "rgba(255, 93, 143, 0.35)";
    ctx.shadowBlur = 10;
    ctx.stroke();
  }

  shootingStars = shootingStars.filter((comet) => comet.life > 0);

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(draw);
setTimeout(spawnShootingStar, 500);
setInterval(spawnShootingStar, 1700);

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

  function updateRelativeLineNumbers(activeIdx) {
    lineNumbers.innerHTML = lines
      .map((_, idx) => {
        const lineNum = idx + 1;
        if (lineNum === activeIdx) {
          return `<span class="current" data-line="${lineNum}">${lineNum}</span>`;
        } else {
          const relNum = Math.abs(lineNum - activeIdx);
          return `<span data-line="${lineNum}">${relNum}</span>`;
        }
      })
      .join("");

    document.querySelectorAll(".line-numbers span").forEach((el) => {
      el.addEventListener("click", () => {
        const targetLine = parseInt(el.getAttribute("data-line"), 10);
        setActiveLine(targetLine);
      });
    });
  }

  function setActiveLine(lineNum) {
    const num = parseInt(lineNum, 10);
    updateRelativeLineNumbers(num);

    document.querySelectorAll(".code-line-span").forEach((el) => {
      el.classList.toggle("active-line", el.getAttribute("data-line") === String(num));
    });

    const statusPosition = document.getElementById("statusPosition");
    if (statusPosition) {
      statusPosition.textContent = `Ln ${num}, Col 1`;
    }
  }

  setActiveLine(1);

  document.querySelectorAll(".code-line-span").forEach((el) => {
    el.addEventListener("click", () => {
      const lineNum = el.getAttribute("data-line");
      setActiveLine(lineNum);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNotify();
  initSidebarDrawer();
  initTabClosers();
  initCodeLineInteraction();
});