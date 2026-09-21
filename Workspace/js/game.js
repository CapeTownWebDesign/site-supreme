/* ==========================================================================
   DEPLOY DASH
   A small canvas runner: jump the bugs, keep shipping. Purely for
   visitor delight — no dependencies, no build step. Score persists
   locally per browser so returning visitors can try to beat it.
   ========================================================================== */

(function () {
  var canvas = document.getElementById("game-canvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var overlay = document.getElementById("game-overlay");
  var overlayTitle = document.getElementById("game-overlay-title");
  var overlayHint = document.getElementById("game-overlay-hint");
  var scoreEl = document.getElementById("game-score");
  var bestEl = document.getElementById("game-best");

  // ---- Logical resolution (canvas is scaled to fit via CSS) ----
  var WIDTH = 640;
  var HEIGHT = 200;
  var GROUND_Y = HEIGHT - 34;

  // Handle high-DPI screens without blurring the canvas
  var dpr = window.devicePixelRatio || 1;
  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  ctx.scale(dpr, dpr);

  var COLORS = {
    bg: "#12151A",
    grid: "rgba(140, 160, 255, 0.12)",
    ground: "rgba(245, 244, 240, 0.25)",
    player: "#8CA0FF",
    playerGlow: "rgba(140, 160, 255, 0.35)",
    bugs: ["#F0A202", "#FF5D73", "#16C79A"],
    text: "#F5F4F0",
  };

  var BEST_KEY = "deployDashBest";
  var best = 0;
  try {
    best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0;
  } catch (e) {
    best = 0;
  }
  if (bestEl) bestEl.textContent = best;

  var state = "idle"; // idle | running | over
  var player, obstacles, speed, score, frame, spawnTimer;

  function resetState() {
    player = { x: 56, y: GROUND_Y - 22, w: 22, h: 22, vy: 0, grounded: true };
    obstacles = [];
    speed = 4.2;
    score = 0;
    frame = 0;
    spawnTimer = 60;
  }

  function jump() {
    if (state === "idle") {
      startGame();
      return;
    }
    if (state === "over") {
      startGame();
      return;
    }
    if (player.grounded) {
      player.vy = -8.6;
      player.grounded = false;
    }
  }

  function startGame() {
    resetState();
    state = "running";
    overlay.classList.add("u-hidden");
    requestAnimationFrame(loop);
  }

  function endGame() {
    state = "over";
    var isNewBest = score > best;
    if (isNewBest) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
    }
    if (bestEl) bestEl.textContent = best;

    if (isNewBest && score > 0) {
      overlayTitle.textContent = "New best! " + score + " \uD83C\uDF89";
      var panel = canvas.closest(".game-panel");
      if (panel) {
        panel.classList.add("game-panel--celebrate");
        setTimeout(function () { panel.classList.remove("game-panel--celebrate"); }, 900);
      }
    } else {
      overlayTitle.textContent = "Bug caught you. Score: " + score;
    }
    overlayHint.textContent = "Tap, click, or press Space to redeploy.";
    overlay.classList.remove("u-hidden");
  }

  function spawnObstacle() {
    var h = 16 + Math.random() * 14;
    var color = COLORS.bugs[Math.floor(Math.random() * COLORS.bugs.length)];
    obstacles.push({ x: WIDTH + 10, y: GROUND_Y - h, w: 14, h: h, color: color });
  }

  function update() {
    frame++;
    score = Math.floor(frame / 6);
    if (scoreEl) scoreEl.textContent = score;

    // gravity
    player.vy += 0.55;
    player.y += player.vy;
    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.grounded = true;
    }

    // difficulty ramp
    speed = 4.2 + score * 0.035;

    // obstacles
    spawnTimer--;
    if (spawnTimer <= 0) {
      spawnObstacle();
      spawnTimer = Math.max(38, 75 - score);
    }

    for (var i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x + obstacles[i].w < 0) obstacles.splice(i, 1);
    }

    // collision (small forgiving hitbox)
    for (var j = 0; j < obstacles.length; j++) {
      var o = obstacles[j];
      var hit =
        player.x + 4 < o.x + o.w - 4 &&
        player.x + player.w - 4 > o.x + 4 &&
        player.y + 4 < o.y + o.h &&
        player.y + player.h > o.y + 4;
      if (hit) {
        endGame();
        return;
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // background grid
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    var gridOffset = (frame * (state === "running" ? speed : 0)) % 32;
    for (var gx = -gridOffset; gx < WIDTH; gx += 32) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, HEIGHT);
      ctx.stroke();
    }

    // ground line
    ctx.strokeStyle = COLORS.ground;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 1);
    ctx.lineTo(WIDTH, GROUND_Y + 1);
    ctx.stroke();

    // player (rounded square with a glow, reads as a "cursor" block)
    ctx.fillStyle = COLORS.playerGlow;
    ctx.fillRect(player.x - 3, player.y - 3, player.w + 6, player.h + 6);
    ctx.fillStyle = COLORS.player;
    roundRect(player.x, player.y, player.w, player.h, 5);
    ctx.fill();

    // obstacles ("bugs" — small diamonds, cycling through accent colors)
    obstacles.forEach(function (o) {
      ctx.fillStyle = o.color;
      ctx.beginPath();
      var cx = o.x + o.w / 2;
      var cy = o.y + o.h / 2;
      ctx.moveTo(cx, o.y);
      ctx.lineTo(o.x + o.w, cy);
      ctx.lineTo(cx, o.y + o.h);
      ctx.lineTo(o.x, cy);
      ctx.closePath();
      ctx.fill();
    });
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loop() {
    if (state !== "running") return;
    update();
    draw();
    if (state === "running") requestAnimationFrame(loop);
  }

  // initial idle frame
  resetState();
  draw();

  // ---- Input ----
  canvas.addEventListener("click", jump);
  overlay.addEventListener("click", jump);

  document.addEventListener("keydown", function (e) {
    if (e.code !== "Space") return;
    // Only hijack spacebar when the game section is in view, so it
    // doesn't block normal page scrolling elsewhere on the site.
    var rect = canvas.getBoundingClientRect();
    var inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;
    e.preventDefault();
    jump();
  });
})();
