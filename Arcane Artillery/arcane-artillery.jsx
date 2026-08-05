import { useState, useEffect, useRef, useCallback } from "react";

const CANVAS_W = 900;
const CANVAS_H = 560;
const GRAVITY = 0.15;
const EXPLOSION_RADIUS = 28;
const WIZARD_W = 20;
const WIZARD_H = 30;
const MAX_HP = 100;
const PROJECTILE_SPEED_FACTOR = 0.126;
const WIND_MAX = 3;

const COLORS = {
  bg: "#0a0614",
  sky1: "#0d0b2e",
  sky2: "#1a0f3a",
  sky3: "#2d1458",
  terrain: "#2a1a4a",
  terrainEdge: "#5a3d8a",
  terrainGlow: "#7b52c7",
  wizard1: "#4af",
  wizard1glow: "#2af",
  wizard2: "#f54",
  wizard2glow: "#f32",
  projectile1: "#6cf",
  projectile2: "#f86",
  explosion: "#fff",
  text: "#e0d8f0",
  textDim: "#8878a8",
  ui: "#1a1030",
  uiBorder: "#3a2868",
  hp: "#4f8",
  hpLow: "#f54",
  star: "#ffffff",
};

const TERRAIN_PROFILES = [
  { name: "Rolling Meadows", freq: 0.008, amp: 80, octaves: 2, base: 0.55 },
  { name: "Craggy Peaks", freq: 0.012, amp: 140, octaves: 3, base: 0.45 },
  { name: "Jagged Abyss", freq: 0.018, amp: 180, octaves: 4, base: 0.40 },
];

function noise(x, seed) {
  const n = Math.sin(x * 127.1 + seed * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x, seed) {
  const ix = Math.floor(x);
  const fx = x - ix;
  const t = fx * fx * (3 - 2 * fx);
  return noise(ix, seed) * (1 - t) + noise(ix + 1, seed) * t;
}

function generateTerrain(profile, seed) {
  const heights = new Float32Array(CANVAS_W);
  for (let x = 0; x < CANVAS_W; x++) {
    let h = 0;
    for (let o = 0; o < profile.octaves; o++) {
      const f = profile.freq * Math.pow(2, o);
      const a = profile.amp / Math.pow(2, o);
      h += smoothNoise(x * f, seed + o * 100) * a;
    }
    heights[x] = CANVAS_H * profile.base - h + profile.amp * 0.5;
  }
  // Flatten edges slightly for wizard placement
  for (let x = 0; x < 60; x++) {
    const t = x / 60;
    heights[x] = heights[x] * t + heights[60] * (1 - t);
  }
  for (let x = CANVAS_W - 60; x < CANVAS_W; x++) {
    const t = (CANVAS_W - x) / 60;
    heights[x] = heights[x] * t + heights[CANVAS_W - 61] * (1 - t);
  }
  return heights;
}

function generateStars(count) {
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H * 0.6,
      size: Math.random() * 1.5 + 0.3,
      brightness: Math.random() * 0.6 + 0.4,
      twinkleSpeed: Math.random() * 0.03 + 0.01,
    });
  }
  return stars;
}

function cpuThink(cpuX, cpuY, playerX, playerY, wind) {
  const dx = playerX - cpuX;
  const dy = playerY - cpuY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Rough angle estimate
  let angle = Math.atan2(-dy, dx) * (180 / Math.PI);
  if (cpuX > playerX) {
    angle = 180 - angle;
  }
  angle = Math.max(10, Math.min(80, angle + (Math.random() - 0.5) * 20));

  // Rough power estimate
  let power = Math.min(95, Math.max(20, dist * 0.14 + (Math.random() - 0.5) * 15));

  // Slight wind compensation
  if (cpuX < playerX) {
    power -= wind * 2;
  } else {
    power += wind * 2;
  }
  power = Math.max(15, Math.min(100, power));

  return { angle, power };
}

export default function ArcaneArtillery() {
  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState("menu"); // menu, playing, gameOver
  const [terrainProfile, setTerrainProfile] = useState(0);
  const [terrain, setTerrain] = useState(null);
  const [stars] = useState(() => generateStars(80));
  const [players, setPlayers] = useState(null);
  const [turn, setTurn] = useState(0); // 0 = player, 1 = cpu
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [wind, setWind] = useState(0);
  const [projectile, setProjectile] = useState(null);
  const [explosions, setExplosions] = useState([]);
  const [message, setMessage] = useState("");
  const [winner, setWinner] = useState(null);
  const [seed, setSeed] = useState(() => Math.random() * 10000);
  const [turnCount, setTurnCount] = useState(0);

  const animRef = useRef(null);
  const projRef = useRef(null);
  const terrainRef = useRef(null);

  terrainRef.current = terrain;

  const startGame = useCallback((profileIdx) => {
    const newSeed = Math.random() * 10000;
    setSeed(newSeed);
    const prof = TERRAIN_PROFILES[profileIdx];
    const t = generateTerrain(prof, newSeed);
    setTerrain(t);
    setTerrainProfile(profileIdx);

    const p1x = 40 + Math.random() * 60;
    const p2x = CANVAS_W - 100 + Math.random() * 60;

    setPlayers([
      { x: Math.floor(p1x), y: t[Math.floor(p1x)], hp: MAX_HP, name: "You" },
      { x: Math.floor(p2x), y: t[Math.floor(p2x)], hp: MAX_HP, name: "Rival" },
    ]);
    setTurn(0);
    setAngle(45);
    setPower(50);
    setWind((Math.random() - 0.5) * WIND_MAX * 2);
    setProjectile(null);
    setExplosions([]);
    setMessage("");
    setWinner(null);
    setGameState("playing");
    setTurnCount(0);
  }, []);

  // Destroy terrain in a radius
  const destroyTerrain = useCallback((cx, cy, radius) => {
    setTerrain((prev) => {
      const t = new Float32Array(prev);
      for (let x = Math.max(0, Math.floor(cx - radius)); x < Math.min(CANVAS_W, Math.ceil(cx + radius)); x++) {
        const dx = x - cx;
        const maxDepth = Math.sqrt(Math.max(0, radius * radius - dx * dx));
        const craterBottom = cy + maxDepth;
        if (t[x] < craterBottom) {
          t[x] = Math.min(CANVAS_H + 10, craterBottom);
        }
      }
      return t;
    });
  }, []);

  // Fire projectile
  const fire = useCallback(() => {
    if (projectile || gameState !== "playing") return;

    const p = players[turn];
    const dir = turn === 0 ? 1 : -1;
    const angRad = (angle * Math.PI) / 180;
    const v = power * PROJECTILE_SPEED_FACTOR;

    setProjectile({
      x: p.x,
      y: p.y - WIZARD_H,
      vx: Math.cos(angRad) * v * dir,
      vy: -Math.sin(angRad) * v,
      owner: turn,
      trail: [],
    });
  }, [projectile, gameState, players, turn, angle, power]);

  // Projectile physics
  useEffect(() => {
    if (!projectile || !terrain) return;

    const interval = setInterval(() => {
      setProjectile((prev) => {
        if (!prev) return null;
        const nx = prev.x + prev.vx;
        const ny = prev.y + prev.vy;
        const nvx = prev.vx + wind * 0.008;
        const nvy = prev.vy + GRAVITY;

        const trail = [...prev.trail, { x: prev.x, y: prev.y }].slice(-40);

        // Out of bounds
        if (nx < -20 || nx > CANVAS_W + 20 || ny > CANVAS_H + 20) {
          setTimeout(() => {
            setProjectile(null);
            setMessage("Shot missed!");
            // Next turn
            setTimeout(() => {
              setWind((Math.random() - 0.5) * WIND_MAX * 2);
              setTurn((t) => 1 - t);
              setTurnCount((c) => c + 1);
              setMessage("");
            }, 800);
          }, 50);
          return null;
        }

        // Direct wizard hit check
        const currentPlayers = players;
        if (currentPlayers) {
          for (let pi = 0; pi < currentPlayers.length; pi++) {
            if (currentPlayers[pi].hp <= 0) continue;
            const pl = currentPlayers[pi];
            const dx = nx - pl.x;
            const dy = ny - (pl.y - 20); // center of wizard body
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 14) {
              const hitX = nx;
              const hitY = ny;
              setTimeout(() => {
                destroyTerrain(hitX, hitY, EXPLOSION_RADIUS);
                setExplosions((e) => [...e, { x: hitX, y: hitY, r: 0, maxR: EXPLOSION_RADIUS, alpha: 1 }]);
                setMessage("DIRECT HIT!");
                setPlayers((pls) => {
                  const updated = pls.map((p, i) => {
                    if (i === pi) return { ...p, hp: Math.max(0, p.hp - 45) }; // direct hit = big damage
                    const ddx = p.x - hitX;
                    const ddy = p.y - hitY;
                    const d = Math.sqrt(ddx * ddx + ddy * ddy);
                    if (d < EXPLOSION_RADIUS + 15) {
                      return { ...p, hp: Math.max(0, p.hp - Math.floor(Math.max(5, 40 - d))) };
                    }
                    return p;
                  });
                  setTimeout(() => {
                    const dead = updated.findIndex((p) => p.hp <= 0);
                    if (dead !== -1) {
                      setWinner(dead === 0 ? 1 : 0);
                      setGameState("gameOver");
                      setMessage(dead === 0 ? "The rival wizard wins!" : "You win!");
                    } else {
                      setMessage("");
                      setWind((Math.random() - 0.5) * WIND_MAX * 2);
                      setTurn((t) => 1 - t);
                      setTurnCount((c) => c + 1);
                    }
                  }, 600);
                  return updated;
                });
                setProjectile(null);
                setTimeout(() => {
                  setPlayers((pls) =>
                    pls.map((p) => {
                      const ct = terrainRef.current;
                      if (ct) {
                        const txi = Math.floor(Math.max(0, Math.min(CANVAS_W - 1, p.x)));
                        if (p.y < ct[txi]) return { ...p, y: ct[txi] };
                      }
                      return p;
                    })
                  );
                }, 100);
              }, 20);
              return null;
            }
          }
        }

        // Hit terrain
        const tx = Math.floor(Math.max(0, Math.min(CANVAS_W - 1, nx)));
        const currentTerrain = terrainRef.current;
        if (currentTerrain && ny >= currentTerrain[tx]) {
          // Explode
          const hitX = nx;
          const hitY = ny;
          setTimeout(() => {
            destroyTerrain(hitX, hitY, EXPLOSION_RADIUS);
            setExplosions((e) => [...e, { x: hitX, y: hitY, r: 0, maxR: EXPLOSION_RADIUS, alpha: 1 }]);

            // Check hits on players
            setPlayers((pls) => {
              const updated = pls.map((pl, i) => {
                const dx = pl.x - hitX;
                const dy = pl.y - hitY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < EXPLOSION_RADIUS + 15) {
                  const dmg = Math.floor(Math.max(5, 40 - dist));
                  return { ...pl, hp: Math.max(0, pl.hp - dmg) };
                }
                return pl;
              });

              // Check for game over
              setTimeout(() => {
                const dead = updated.findIndex((p) => p.hp <= 0);
                if (dead !== -1) {
                  setWinner(dead === 0 ? 1 : 0);
                  setGameState("gameOver");
                  setMessage(dead === 0 ? "The rival wizard wins!" : "You win!");
                } else {
                  setMessage("");
                  setWind((Math.random() - 0.5) * WIND_MAX * 2);
                  setTurn((t) => 1 - t);
                  setTurnCount((c) => c + 1);
                }
              }, 600);

              return updated;
            });

            setProjectile(null);

            // Update player positions (gravity after terrain destruction)
            setTimeout(() => {
              setPlayers((pls) =>
                pls.map((pl) => {
                  const currentT = terrainRef.current;
                  if (currentT) {
                    const tx2 = Math.floor(Math.max(0, Math.min(CANVAS_W - 1, pl.x)));
                    if (pl.y < currentT[tx2]) {
                      return { ...pl, y: currentT[tx2] };
                    }
                  }
                  return pl;
                })
              );
            }, 100);
          }, 20);
          return null;
        }

        return { ...prev, x: nx, y: ny, vx: nvx, vy: nvy, trail };
      });
    }, 16);

    return () => clearInterval(interval);
  }, [projectile, terrain, wind, destroyTerrain]);

  // CPU turn
  useEffect(() => {
    if (turn === 1 && !projectile && gameState === "playing" && players) {
      const timer = setTimeout(() => {
        const cpu = cpuThink(players[1].x, players[1].y, players[0].x, players[0].y, wind);
        setAngle(cpu.angle);
        setPower(cpu.power);
        setTimeout(() => {
          const p = players[1];
          const angRad = (cpu.angle * Math.PI) / 180;
          const v = cpu.power * PROJECTILE_SPEED_FACTOR;
          setProjectile({
            x: p.x,
            y: p.y - WIZARD_H,
            vx: -Math.cos(angRad) * v,
            vy: -Math.sin(angRad) * v,
            owner: 1,
            trail: [],
          });
        }, 500);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [turn, projectile, gameState, players, wind]);

  // Explosion animation
  useEffect(() => {
    if (explosions.length === 0) return;
    const interval = setInterval(() => {
      setExplosions((exps) =>
        exps
          .map((e) => ({ ...e, r: e.r + 2, alpha: Math.max(0, e.alpha - 0.04) }))
          .filter((e) => e.alpha > 0)
      );
    }, 16);
    return () => clearInterval(interval);
  }, [explosions.length]);

  // Canvas render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const render = () => {
      const time = Date.now() * 0.001;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      skyGrad.addColorStop(0, COLORS.sky1);
      skyGrad.addColorStop(0.5, COLORS.sky2);
      skyGrad.addColorStop(1, COLORS.sky3);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      stars.forEach((s) => {
        const twinkle = 0.5 + 0.5 * Math.sin(time * s.twinkleSpeed * 60);
        ctx.globalAlpha = s.brightness * twinkle;
        ctx.fillStyle = COLORS.star;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Terrain
      if (terrain) {
        // Main terrain fill
        ctx.beginPath();
        ctx.moveTo(0, CANVAS_H);
        for (let x = 0; x < CANVAS_W; x++) {
          ctx.lineTo(x, terrain[x]);
        }
        ctx.lineTo(CANVAS_W, CANVAS_H);
        ctx.closePath();

        const terrainGrad = ctx.createLinearGradient(0, 100, 0, CANVAS_H);
        terrainGrad.addColorStop(0, COLORS.terrainEdge);
        terrainGrad.addColorStop(0.3, COLORS.terrain);
        terrainGrad.addColorStop(1, "#150d28");
        ctx.fillStyle = terrainGrad;
        ctx.fill();

        // Terrain edge glow
        ctx.beginPath();
        ctx.moveTo(0, terrain[0]);
        for (let x = 1; x < CANVAS_W; x++) {
          ctx.lineTo(x, terrain[x]);
        }
        ctx.strokeStyle = COLORS.terrainGlow;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = COLORS.terrainGlow;
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Wizards
      if (players) {
        players.forEach((p, i) => {
          if (p.hp <= 0) return;
          const color = i === 0 ? COLORS.wizard1 : COLORS.wizard2;
          const glow = i === 0 ? COLORS.wizard1glow : COLORS.wizard2glow;

          // Glow
          ctx.shadowColor = glow;
          ctx.shadowBlur = 12;
          ctx.fillStyle = color;

          // Body (robe shape)
          ctx.beginPath();
          ctx.moveTo(p.x - 8, p.y);
          ctx.lineTo(p.x - 4, p.y - 22);
          ctx.lineTo(p.x + 4, p.y - 22);
          ctx.lineTo(p.x + 8, p.y);
          ctx.closePath();
          ctx.fill();

          // Head
          ctx.beginPath();
          ctx.arc(p.x, p.y - 26, 5, 0, Math.PI * 2);
          ctx.fill();

          // Hat
          ctx.beginPath();
          ctx.moveTo(p.x - 7, p.y - 29);
          ctx.lineTo(p.x, p.y - 42);
          ctx.lineTo(p.x + 7, p.y - 29);
          ctx.closePath();
          ctx.fill();

          // Staff
          const staffDir = i === 0 ? 1 : -1;
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(p.x + 6 * staffDir, p.y - 5);
          ctx.lineTo(p.x + 14 * staffDir, p.y - 35);
          ctx.stroke();

          // Staff orb
          const orbPulse = 3 + Math.sin(time * 3) * 1;
          ctx.beginPath();
          ctx.arc(p.x + 14 * staffDir, p.y - 37, orbPulse, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();

          ctx.shadowBlur = 0;

          // HP bar
          const hpW = 30;
          const hpH = 3;
          const hpX = p.x - hpW / 2;
          const hpY = p.y - 50;
          ctx.fillStyle = "#111";
          ctx.fillRect(hpX, hpY, hpW, hpH);
          const hpFrac = p.hp / MAX_HP;
          ctx.fillStyle = hpFrac > 0.3 ? COLORS.hp : COLORS.hpLow;
          ctx.fillRect(hpX, hpY, hpW * hpFrac, hpH);
        });
      }

      // Aiming line for current player
      if (players && turn === 0 && !projectile && gameState === "playing") {
        const p = players[0];
        const angRad = (angle * Math.PI) / 180;
        const len = 30 + power * 0.3;
        const dir = 1;
        ctx.strokeStyle = COLORS.wizard1;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - WIZARD_H);
        ctx.lineTo(
          p.x + Math.cos(angRad) * len * dir,
          p.y - WIZARD_H - Math.sin(angRad) * len
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Projectile
      if (projectile) {
        // Trail
        projectile.trail.forEach((t, i) => {
          const a = i / projectile.trail.length;
          ctx.globalAlpha = a * 0.5;
          ctx.fillStyle = projectile.owner === 0 ? COLORS.projectile1 : COLORS.projectile2;
          ctx.beginPath();
          ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Projectile ball
        const pColor = projectile.owner === 0 ? COLORS.projectile1 : COLORS.projectile2;
        ctx.shadowColor = pColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Explosions
      explosions.forEach((e) => {
        ctx.globalAlpha = e.alpha;
        const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
        grad.addColorStop(0, "#fff");
        grad.addColorStop(0.3, "#fc8");
        grad.addColorStop(0.6, "#f64");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Wind indicator
      if (gameState === "playing") {
        const windX = CANVAS_W / 2;
        const windY = 20;
        ctx.fillStyle = COLORS.textDim;
        ctx.font = "11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("WIND", windX, windY - 2);
        // Arrow
        const windLen = Math.abs(wind) * 18;
        const windDir = wind > 0 ? 1 : -1;
        ctx.strokeStyle = Math.abs(wind) > 1.5 ? "#f86" : COLORS.textDim;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(windX - windLen * windDir, windY + 8);
        ctx.lineTo(windX + windLen * windDir, windY + 8);
        ctx.lineTo(windX + windLen * windDir - 5 * windDir, windY + 4);
        ctx.moveTo(windX + windLen * windDir, windY + 8);
        ctx.lineTo(windX + windLen * windDir - 5 * windDir, windY + 12);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [terrain, players, projectile, explosions, stars, angle, power, turn, gameState, wind]);

  const handleKeyDown = useCallback(
    (e) => {
      if (turn !== 0 || projectile || gameState !== "playing") return;
      if (e.key === "ArrowUp") setAngle((a) => Math.min(85, a + 2));
      if (e.key === "ArrowDown") setAngle((a) => Math.max(5, a - 2));
      if (e.key === "ArrowRight") setPower((p) => Math.min(100, p + 2));
      if (e.key === "ArrowLeft") setPower((p) => Math.max(5, p - 2));
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        fire();
      }
    },
    [turn, projectile, gameState, fire]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: COLORS.bg,
    minHeight: "100vh",
    padding: "16px",
    fontFamily: "'Courier New', monospace",
    color: COLORS.text,
  };

  const canvasContainerStyle = {
    border: `1px solid ${COLORS.uiBorder}`,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    boxShadow: `0 0 30px ${COLORS.uiBorder}40`,
  };

  if (gameState === "menu") {
    return (
      <div style={containerStyle}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: 8,
            color: COLORS.terrainGlow,
            textShadow: `0 0 20px ${COLORS.terrainGlow}60`,
            marginBottom: 4,
          }}
        >
          ARCANE ARTILLERY
        </h1>
        <p style={{ color: COLORS.textDim, marginBottom: 32, fontSize: 13, letterSpacing: 3 }}>
          RIVAL WIZARDS • DESTRUCTIBLE TERRAIN
        </p>

        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <p style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 12 }}>SELECT TERRAIN</p>
          <div style={{ display: "flex", gap: 12 }}>
            {TERRAIN_PROFILES.map((prof, i) => (
              <button
                key={i}
                onClick={() => startGame(i)}
                style={{
                  background: COLORS.ui,
                  border: `1px solid ${COLORS.uiBorder}`,
                  color: COLORS.text,
                  padding: "14px 22px",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = COLORS.terrainGlow;
                  e.target.style.boxShadow = `0 0 12px ${COLORS.terrainGlow}40`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = COLORS.uiBorder;
                  e.target.style.boxShadow = "none";
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>{prof.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textDim }}>
                  {["Gentle", "Moderate", "Extreme"][i]} elevation
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ color: COLORS.textDim, fontSize: 11, lineHeight: 1.8, textAlign: "center" }}>
          <p>↑↓ Adjust angle • ←→ Adjust power • SPACE to fire</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 8, width: CANVAS_W, justifyContent: "space-between" }}>
        <div style={{ fontSize: 14, letterSpacing: 3, color: COLORS.terrainGlow }}>ARCANE ARTILLERY</div>
        <div style={{ fontSize: 11, color: COLORS.textDim }}>
          Turn {Math.floor(turnCount / 2) + 1} • {TERRAIN_PROFILES[terrainProfile].name}
        </div>
      </div>

      <div style={canvasContainerStyle}>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ display: "block" }} />

        {/* Overlay messages */}
        {message && gameState !== "gameOver" && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "#fff",
              fontSize: 18,
              letterSpacing: 3,
              textShadow: "0 0 20px rgba(0,0,0,0.8)",
              pointerEvents: "none",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginTop: 10,
          width: CANVAS_W,
          background: COLORS.ui,
          border: `1px solid ${COLORS.uiBorder}`,
          borderRadius: 4,
          padding: "10px 16px",
        }}
      >
        {/* Player HP */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: COLORS.wizard1, marginBottom: 3 }}>YOU</div>
          <div style={{ background: "#111", height: 6, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${players ? (players[0].hp / MAX_HP) * 100 : 100}%`,
                height: "100%",
                background: players && players[0].hp / MAX_HP > 0.3 ? COLORS.hp : COLORS.hpLow,
                transition: "width 0.3s",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{players ? players[0].hp : MAX_HP} HP</div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 2 }}>ANGLE</div>
            <input
              type="range"
              min={5}
              max={85}
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              disabled={turn !== 0 || !!projectile || gameState !== "playing"}
              style={{ width: 100, accentColor: COLORS.wizard1 }}
            />
            <div style={{ fontSize: 12 }}>{angle}°</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 2 }}>POWER</div>
            <input
              type="range"
              min={5}
              max={100}
              value={power}
              onChange={(e) => setPower(Number(e.target.value))}
              disabled={turn !== 0 || !!projectile || gameState !== "playing"}
              style={{ width: 100, accentColor: COLORS.wizard1 }}
            />
            <div style={{ fontSize: 12 }}>{power}%</div>
          </div>
          <button
            onClick={fire}
            disabled={turn !== 0 || !!projectile || gameState !== "playing"}
            style={{
              background: turn === 0 && !projectile ? COLORS.terrainGlow : COLORS.uiBorder,
              color: "#fff",
              border: "none",
              padding: "8px 20px",
              borderRadius: 4,
              cursor: turn === 0 && !projectile ? "pointer" : "default",
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              letterSpacing: 2,
              opacity: turn === 0 && !projectile && gameState === "playing" ? 1 : 0.4,
            }}
          >
            {turn === 1 ? "RIVAL'S TURN" : "CAST"}
          </button>
        </div>

        {/* CPU HP */}
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 11, color: COLORS.wizard2, marginBottom: 3 }}>RIVAL</div>
          <div style={{ background: "#111", height: 6, borderRadius: 3, overflow: "hidden" }}>
            <div
              style={{
                width: `${players ? (players[1].hp / MAX_HP) * 100 : 100}%`,
                height: "100%",
                background: players && players[1].hp / MAX_HP > 0.3 ? COLORS.hp : COLORS.hpLow,
                transition: "width 0.3s",
                marginLeft: "auto",
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginTop: 2 }}>{players ? players[1].hp : MAX_HP} HP</div>
        </div>
      </div>

      {/* Game over */}
      {gameState === "gameOver" && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              color: winner === 0 ? COLORS.wizard1 : COLORS.wizard2,
              textShadow: `0 0 20px ${winner === 0 ? COLORS.wizard1 : COLORS.wizard2}60`,
              marginBottom: 12,
            }}
          >
            {winner === 0 ? "VICTORY" : "DEFEAT"}
          </div>
          <button
            onClick={() => setGameState("menu")}
            style={{
              background: COLORS.ui,
              border: `1px solid ${COLORS.uiBorder}`,
              color: COLORS.text,
              padding: "10px 28px",
              borderRadius: 4,
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: 12,
              letterSpacing: 2,
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
