
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const livesText = document.getElementById("lives");
const levelText = document.getElementById("level");
const overlay = document.getElementById("overlay");
const message = document.getElementById("message");
const instructions = document.getElementById("instructions");
const startButton = document.getElementById("start");

const keys = {};
let player, bullets, enemies, stars;
let score = 0;
let lives = 3;
let level = 1;
let running = false;
let paused = false;
let lastShot = 0;
let animationId = null;

function resetGame() {
  score = 0;
  lives = 3;
  level = 1;

  player = { x: 380, y: 435, width: 40, height: 35, speed: 5 };
  bullets = [];
  enemies = [];

  stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 1.5 + 0.4
  }));

  updateHUD();
}

function updateHUD() {
  scoreText.textContent = score;
  livesText.textContent = lives;
  levelText.textContent = level;
}

function drawStars() {
  ctx.fillStyle = "#080817";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const star of stars) {
    ctx.fillStyle = "#b9c5ff";
    ctx.globalAlpha = 0.4 + Math.random() * 0.6;
    ctx.fillRect(star.x, star.y, star.size, star.size);
    ctx.globalAlpha = 1;

    if (running && !paused) {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    }
  }
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

  // Propulsor
  ctx.fillStyle = "#ff9e45";
  ctx.beginPath();
  ctx.moveTo(-8, 12);
  ctx.lineTo(0, 27 + Math.random() * 7);
  ctx.lineTo(8, 12);
  ctx.fill();

  // Nave
  ctx.fillStyle = "#54f5ff";
  ctx.shadowColor = "#54f5ff";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.lineTo(19, 15);
  ctx.lineTo(5, 10);
  ctx.lineTo(0, 15);
  ctx.lineTo(-5, 10);
  ctx.lineTo(-19, 15);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

function spawnEnemy() {
  const size = 24 + Math.random() * 14;
  enemies.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 1.2 + level * 0.45 + Math.random()
  });
}

function drawEnemies() {
  for (const enemy of enemies) {
    ctx.save();
    ctx.fillStyle = "#ff4f81";
    ctx.shadowColor = "#ff2468";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(enemy.x + enemy.size / 2, enemy.y + enemy.size);
    ctx.lineTo(enemy.x, enemy.y + 5);
    ctx.lineTo(enemy.x + enemy.size, enemy.y + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillRect(enemy.x + enemy.size * 0.25, enemy.y + 9, 4, 4);
    ctx.fillRect(enemy.x + enemy.size * 0.65, enemy.y + 9, 4, 4);

    ctx.restore();

    if (running && !paused) enemy.y += enemy.speed;
  }
}

function drawBullets() {
  ctx.fillStyle = "#54f5ff";
  ctx.shadowColor = "#54f5ff";
  ctx.shadowBlur = 12;

  for (const bullet of bullets) {
    ctx.fillRect(bullet.x, bullet.y, 4, 13);
    if (running && !paused) bullet.y -= 8;
  }

  ctx.shadowBlur = 0;
}

function shoot() {
  const now = Date.now();

  if (keys[" "] && now - lastShot > 220) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y
    });
    lastShot = now;
  }
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function checkCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    const enemyBox = {
      x: enemy.x,
      y: enemy.y,
      width: enemy.size,
      height: enemy.size
    };

    const playerBox = {
      x: player.x,
      y: player.y,
      width: player.width,
      height: player.height
    };

    let destroyed = false;

    for (let j = bullets.length - 1; j >= 0; j--) {
      const bulletBox = {
        x: bullets[j].x,
        y: bullets[j].y,
        width: 4,
        height: 13
      };

      if (overlaps(enemyBox, bulletBox)) {
        enemies.splice(i, 1);
        bullets.splice(j, 1);
        score += 10;
        destroyed = true;

        const newLevel = Math.floor(score / 100) + 1;
        if (newLevel > level) level = newLevel;

        updateHUD();
        break;
      }
    }

    if (destroyed) continue;

    if (overlaps(enemyBox, playerBox) || enemy.y > canvas.height) {
      enemies.splice(i, 1);
      lives--;
      updateHUD();

      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }
}

function draw() {
  drawStars();
  drawBullets();
  drawEnemies();
  drawPlayer();
}

function loop() {
  draw();

  if (running && !paused) {
    if (keys["ArrowLeft"] || keys["a"]) {
      player.x -= player.speed;
    }

    if (keys["ArrowRight"] || keys["d"]) {
      player.x += player.speed;
    }

    player.x = Math.max(
      0,
      Math.min(canvas.width - player.width, player.x)
    );

    shoot();

    bullets = bullets.filter(bullet => bullet.y > -20);

    if (Math.random() < 0.018 + level * 0.003) {
      spawnEnemy();
    }

    checkCollisions();
  }

  animationId = requestAnimationFrame(loop);
}

function startGame() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  resetGame();
  running = true;
  paused = false;
  overlay.classList.add("hidden");
  loop();
}

function endGame() {
  running = false;
  paused = false;

  message.textContent = "GAME OVER";
  instructions.textContent = `Has conseguido ${score} puntos. ¿Lo intentas otra vez?`;
  startButton.textContent = "VOLVER A JUGAR";
  overlay.classList.remove("hidden");
}

function togglePause() {
  if (!running) return;

  paused = !paused;

  if (paused) {
    message.textContent = "PAUSA";
    instructions.textContent = "Respira, piloto. La galaxia te espera.";
    startButton.textContent = "CONTINUAR";
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

startButton.addEventListener("click", () => {
  if (running && paused) {
    paused = false;
    overlay.classList.add("hidden");
  } else {
    startGame();
  }
});

document.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
    event.preventDefault();
  }

  keys[event.key] = true;

  if (event.key === "Escape") {
    togglePause();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

resetGame();
draw();
