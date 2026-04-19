import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useRef } from "react";

// ── Constants (game と同値) ─────────────────────────────────────────────────
const SCALE = 2;
const CANVAS_W = 360 * SCALE;
const CANVAS_H = 80 * SCALE;

// ── Enemy HP pip drawing (game の drawEnemy と同ロジック) ──────────────────
function drawEnemyPips(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number
) {
  const totalW = 48 * SCALE;
  const pipCount = maxHp;
  const pipGap = Math.min(2 * SCALE, (totalW / pipCount) * 0.2);
  const pipW = (totalW - pipGap * (pipCount - 1)) / pipCount;
  let px = x - totalW / 2;
  for (let i = 0; i < pipCount; i++) {
    ctx.fillStyle = i < hp ? "#ffcc00" : "#333";
    ctx.fillRect(px, y - 24 * SCALE, pipW, 3 * SCALE);
    px += pipW + pipGap;
  }
}

// ── enemyHp の計算式 (game と同値) ──────────────────────────────────────────
function calcEnemyHp(score: number) {
  return 5 + Math.floor(score / 500);
}

// ── Storybook 用コンポーネント ────────────────────────────────────────────
interface EnemyCanvasProps {
  score: number;
  /** 現在の残HP（0 = 全損, maxHp = フル） */
  currentHpRatio: number;
}

function EnemyCanvas({ score, currentHpRatio }: EnemyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maxHp = calcEnemyHp(score);
  const hp = Math.round(maxHp * currentHpRatio);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    // background
    ctx.fillStyle = "#0d0d00";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const cx = CANVAS_W / 2;
    const cy = CANVAS_H / 2;

    // enemy sprite placeholder (game では enemyImg を drawImage)
    ctx.fillStyle = "#facc15";
    ctx.font = `bold ${24 * SCALE}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("漱", cx, cy + 2 * SCALE);

    drawEnemyPips(ctx, cx, cy + 20 * SCALE, hp, maxHp);

    // HP label
    ctx.fillStyle = "#aaa";
    ctx.font = `${9 * SCALE}px "Courier New", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(`HP ${hp} / ${maxHp}`, cx, cy + 32 * SCALE);
  }, [score, hp, maxHp]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          imageRendering: "pixelated",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      />
      <p style={{ color: "#a8a29e", fontFamily: "Courier New", fontSize: 12, margin: 0 }}>
        score: {score} → maxHp: {maxHp}（スコア500ごとに+1）
      </p>
    </div>
  );
}

// ── スコア別比較パネル ────────────────────────────────────────────────────
const SCORE_STEPS = [0, 500, 1000, 1500, 2000, 2500];

function EnemyProgressPanel({ currentHpRatio }: { currentHpRatio: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 24,
        background: "#0c0a08",
        minHeight: "100vh",
      }}
    >
      <p style={{ color: "#facc15", fontFamily: "Courier New", fontSize: 14, margin: 0 }}>
        ■ スコア別 enemy 体力ピップ比較
      </p>
      {SCORE_STEPS.map((s) => (
        <EnemyCanvas key={s} score={s} currentHpRatio={currentHpRatio} />
      ))}
    </div>
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────
const meta: Meta<typeof EnemyCanvas> = {
  title: "Games/ShootingGame/Enemy HP",
  component: EnemyCanvas,
  parameters: { layout: "fullscreen" },
  argTypes: {
    score: { control: { type: "range", min: 0, max: 3000, step: 100 } },
    currentHpRatio: {
      name: "残HP割合",
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EnemyCanvas>;

// 単体: スコアとHPをコントロールで操作
export const Interactive: Story = {
  args: {
    score: 0,
    currentHpRatio: 1,
  },
};

// スコア別比較パネル（全段階を縦に並べる）
export const ScoreProgression: StoryObj = {
  args: { currentHpRatio: 1 },
  argTypes: {
    currentHpRatio: {
      name: "残HP割合",
      control: { type: "range", min: 0, max: 1, step: 0.1 },
    },
  },
  render: (args) => <EnemyProgressPanel currentHpRatio={(args as { currentHpRatio: number }).currentHpRatio} />,
};

// ダメージ状態のサンプル
export const HalfHP: Story = {
  args: { score: 1000, currentHpRatio: 0.5 },
};

export const Critical: Story = {
  args: { score: 2000, currentHpRatio: 0.1 },
};
