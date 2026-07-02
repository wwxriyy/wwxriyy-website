const canvas = document.querySelector("#starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let shootingStars = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
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

function draw() {
  ctx.clearRect(0, 0, width, height);

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
draw();
setTimeout(spawnShootingStar, 500);
setInterval(spawnShootingStar, 1700);
