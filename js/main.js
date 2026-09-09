const canvas = document.querySelector("#starfield");
const ctx = canvas.getContext("2d");

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
    { r: 76, g: 92, b: 168 },
    { r: 130, g: 96, b: 176 },
    { r: 56, g: 132, b: 156 },
    { r: 176, g: 100, b: 164 },
    { r: 46, g: 66, b: 132 },
    { r: 98, g: 78, b: 150 },
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
    radius: randomBetween(0.45, 1.75),
    phase: randomBetween(0, Math.PI * 2),
    speed: randomBetween(0.008, 0.024),
    drift: randomBetween(0.03, 0.11),
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
    gradient.addColorStop(0, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.16)`);
    gradient.addColorStop(0.45, `rgba(${blob.color.r}, ${blob.color.g}, ${blob.color.b}, 0.07)`);
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

  drawNebula(time || 0);

  for (const star of stars) {
    star.phase += star.speed;
    star.y += star.drift;

    if (star.y > height + 8) {
      star.y = -8;
      star.x = randomBetween(0, width);
    }

    const alpha = 0.16 + Math.abs(Math.sin(star.phase)) * 0.42;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(198, 212, 222, ${alpha})`;
    ctx.shadowColor = "rgba(89, 201, 238, 0.3)";
    ctx.shadowBlur = 7;
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
    gradient.addColorStop(0, `rgba(198, 212, 222, ${Math.max(comet.life * 0.72, 0)})`);
    gradient.addColorStop(1, "rgba(89, 201, 238, 0)");

    ctx.beginPath();
    ctx.moveTo(comet.x, comet.y);
    ctx.lineTo(comet.x - comet.vx * comet.length * 0.12, comet.y - comet.vy * comet.length * 0.12);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.35;
    ctx.shadowColor = "rgba(89, 201, 238, 0.24)";
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

function initCodeLineInteraction() {
  const codeBlock = document.getElementById("codeBlock");
  const lineNumbers = document.getElementById("lineNumbers");
  const gitGutter = document.getElementById("gitGutter");

  if (!codeBlock || !lineNumbers) return;

  const htmlContent = codeBlock.innerHTML;
  const lines = htmlContent.split("\n");

  codeBlock.innerHTML = lines
    .map((line, idx) => `<span class="code-line-span" data-line="${idx + 1}">${line}</span>`)
    .join("");

  if (gitGutter) {
    const marks = new Array(lines.length).fill(null);
    const hunkCount = Math.max(2, Math.round(lines.length / 12));

    for (let hunk = 0; hunk < hunkCount; hunk += 1) {
      const type = Math.random() > 0.35 ? "add" : "mod";
      const blockLength = type === "add"
        ? Math.ceil(randomBetween(1, 5))
        : Math.ceil(randomBetween(1, 3));
      const maxStart = Math.max(0, lines.length - blockLength);
      const start = Math.floor(randomBetween(0, maxStart));

      for (let offset = 0; offset < blockLength; offset += 1) {
        const idx = start + offset;
        if (idx < lines.length) {
          marks[idx] = type;
        }
      }
    }

    gitGutter.innerHTML = lines
      .map((_, idx) => {
        if (marks[idx] === "add") return `<span class="git-add">+</span>`;
        if (marks[idx] === "mod") return `<span class="git-mod">~</span>`;
        return `<span></span>`;
      })
      .join("");

    const totalAdds = gitGutter.querySelectorAll(".git-add").length;
    const totalMods = gitGutter.querySelectorAll(".git-mod").length;

    const diffAdd = document.querySelector(".diff-add");
    const diffMod = document.querySelector(".diff-mod");
    const diffDel = document.querySelector(".diff-del");

    if (diffAdd) diffAdd.textContent = `+${totalAdds}`;
    if (diffMod) diffMod.textContent = `~${totalMods}`;
    if (diffDel) diffDel.textContent = `-0`;
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