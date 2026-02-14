const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const SCALE = 4;
const WORLD_W = canvas.width / SCALE;
const WORLD_H = canvas.height / SCALE;

const colors = {
  bg: "#1c2633",
  hallway: "#253446",
  floor: "#2f465a",
  trim: "#83d9cf",
  wall: "#1f2f40",
  danger: "#e26f6f",
  player: "#f0f5f2",
  tie: "#6cd6c9",
  text: "#d9fff8",
  accent: "#b8ff9f"
};

const state = {
  time: 0,
  distance: 0,
  score: 0,
  best: 0,
  speed: 44,
  running: true,
  spawnTimer: 1.2,
  obstacles: [],
  pickups: [],
  particles: []
};

const player = {
  x: 24,
  y: 0,
  w: 6,
  h: 13,
  vy: 0,
  onGround: true
};

const groundY = WORLD_H - 14;
player.y = groundY - player.h;

const keys = new Set();
addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());

  if ((event.key === " " || event.key === "ArrowUp") && player.onGround && state.running) {
    player.vy = -74;
    player.onGround = false;
    createDust(player.x + 1, player.y + player.h);
  }

  if (event.key.toLowerCase() === "r" && !state.running) {
    reset();
  }
});

addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

function reset() {
  state.time = 0;
  state.distance = 0;
  state.score = 0;
  state.speed = 44;
  state.running = true;
  state.spawnTimer = 1.2;
  state.obstacles.length = 0;
  state.pickups.length = 0;
  state.particles.length = 0;
  player.y = groundY - player.h;
  player.vy = 0;
  player.onGround = true;
}

function spawnObstacle() {
  const type = Math.random() < 0.5 ? "cart" : "plant";
  const obstacle = {
    x: WORLD_W + 8,
    type,
    w: type === "cart" ? 9 : 7,
    h: type === "cart" ? 8 : 10,
    y: groundY
  };
  obstacle.y -= obstacle.h;
  state.obstacles.push(obstacle);

  if (Math.random() < 0.35) {
    state.pickups.push({ x: obstacle.x + 2, y: groundY - 17, w: 4, h: 4, taken: false });
  }
}

function createDust(x, y) {
  for (let i = 0; i < 5; i += 1) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 20,
      life: 0.35 + Math.random() * 0.2
    });
  }
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (!state.running) {
    return;
  }

  state.time += dt;
  state.distance += state.speed * dt;
  state.speed = Math.min(74, state.speed + dt * 0.7);
  state.spawnTimer -= dt;

  if (state.spawnTimer <= 0) {
    spawnObstacle();
    state.spawnTimer = 0.85 + Math.random() * 0.85 - state.speed * 0.004;
  }

  player.vy += 180 * dt;
  player.y += player.vy * dt;

  if (player.y >= groundY - player.h) {
    if (!player.onGround) {
      createDust(player.x + 2, groundY - 1);
    }
    player.y = groundY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  for (const obstacle of state.obstacles) {
    obstacle.x -= state.speed * dt;
    if (intersects(player, obstacle)) {
      state.running = false;
      state.best = Math.max(state.best, Math.floor(state.distance));
    }
  }
  state.obstacles = state.obstacles.filter((o) => o.x + o.w > -10);

  for (const pickup of state.pickups) {
    pickup.x -= state.speed * dt;
    if (!pickup.taken && intersects(player, pickup)) {
      pickup.taken = true;
      state.score += 10;
      createDust(pickup.x + 2, pickup.y + 2);
    }
  }
  state.pickups = state.pickups.filter((p) => !p.taken && p.x + p.w > -10);

  for (const p of state.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 50 * dt;
  }
  state.particles = state.particles.filter((p) => p.life > 0);
}

function drawPixelRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) * SCALE, Math.round(y) * SCALE, Math.round(w) * SCALE, Math.round(h) * SCALE);
}

function drawBackground() {
  drawPixelRect(0, 0, WORLD_W, WORLD_H, colors.bg);
  drawPixelRect(0, 10, WORLD_W, 48, colors.hallway);
  drawPixelRect(0, groundY, WORLD_W, WORLD_H - groundY, colors.floor);

  const offset = (state.distance * 0.3) % 24;
  for (let i = -1; i < 11; i += 1) {
    const x = i * 24 - offset;
    drawPixelRect(x, 16, 20, 14, colors.wall);
    drawPixelRect(x + 1, 17, 18, 1, colors.trim);
    drawPixelRect(x + 3, 23, 14, 5, "#182532");
    drawPixelRect(x + 6, 19, 8, 2, "#94fff0");
  }

  for (let i = 0; i < 20; i += 1) {
    const x = (i * 10 - (state.distance * 0.7) % 10);
    drawPixelRect(x, groundY + 2, 1, 1, "#41596e");
  }
}

function drawPlayer() {
  drawPixelRect(player.x + 2, player.y, 2, 2, "#694d37");
  drawPixelRect(player.x + 1, player.y + 2, 4, 4, colors.player);
  drawPixelRect(player.x, player.y + 6, 6, 5, "#dce4e0");
  drawPixelRect(player.x + 2, player.y + 6, 1, 5, colors.tie);
  drawPixelRect(player.x, player.y + 11, 2, 2, "#1d2d3d");
  drawPixelRect(player.x + 4, player.y + 11, 2, 2, "#1d2d3d");
}

function drawObstacle(obstacle) {
  if (obstacle.type === "cart") {
    drawPixelRect(obstacle.x, obstacle.y + 2, obstacle.w, 6, "#7894a5");
    drawPixelRect(obstacle.x + 1, obstacle.y + 1, obstacle.w - 2, 1, "#b2c2ce");
    drawPixelRect(obstacle.x + 1, obstacle.y + 7, 2, 1, "#111");
    drawPixelRect(obstacle.x + obstacle.w - 3, obstacle.y + 7, 2, 1, "#111");
  } else {
    drawPixelRect(obstacle.x + 1, obstacle.y + 6, 5, 4, "#7b4f3c");
    drawPixelRect(obstacle.x, obstacle.y, 7, 7, "#5acb95");
  }
}

function drawPickup(pickup) {
  drawPixelRect(pickup.x, pickup.y, 4, 4, colors.accent);
  drawPixelRect(pickup.x + 1, pickup.y + 1, 2, 2, "#193b2f");
}

function drawHud() {
  ctx.fillStyle = colors.text;
  ctx.font = `${4 * SCALE}px "Courier New", monospace`;
  ctx.fillText(`DIST ${Math.floor(state.distance)}m`, 4 * SCALE, 7 * SCALE);
  ctx.fillText(`MORALE ${state.score}`, 52 * SCALE, 7 * SCALE);

  if (!state.running) {
    ctx.fillStyle = "rgba(6,10,18,0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = colors.text;
    ctx.fillText("OUTIE FATIGUE DETECTED", 23 * SCALE, 30 * SCALE);
    ctx.fillText(`BEST DIST ${state.best}m`, 30 * SCALE, 38 * SCALE);
    ctx.fillText("PRESS R TO RESTART", 29 * SCALE, 46 * SCALE);
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  drawBackground();

  for (const pickup of state.pickups) drawPickup(pickup);
  for (const obstacle of state.obstacles) drawObstacle(obstacle);

  drawPlayer();

  for (const p of state.particles) {
    drawPixelRect(p.x, p.y, 1, 1, "#b9fff6");
  }

  drawHud();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
