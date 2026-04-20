'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bodies,
  Body,
  Composite,
  Engine,
  Runner,
  World,
  type Body as MatterBody,
  type Engine as MatterEngine,
  type Runner as MatterRunner,
} from 'matter-js';

const DESKTOP_CANVAS_WIDTH = 960;
const DESKTOP_CANVAS_HEIGHT = 600;
/** 描画しているサミット画像の高さ（床ラインは画像上端）。下端は常にキャンバス下端に一致 */
const SUMMIT_VISUAL_HEIGHT = 88;
/** スマホ用キャンバス（積み上げエリア + サミット高さ） */
const MOBILE_CANVAS_WIDTH = 420;
const MOBILE_STACK_AREA_HEIGHT = 440;
const MOBILE_CANVAS_HEIGHT = MOBILE_STACK_AREA_HEIGHT + SUMMIT_VISUAL_HEIGHT;
const MOBILE_BREAKPOINT = 768;

const DESKTOP_STAGE_WIDTH = 520;
const MOBILE_STAGE_WIDTH = 360;
const STAGE_HEIGHT = 24;

type AnimalSprite = {
  image: HTMLImageElement;
  src: string;
};

type AnimalBody = {
  body: MatterBody;
  radius: number;
  sprite: AnimalSprite;
  createdAtMs: number;
};

type DropCandidate = {
  sprite: AnimalSprite;
  radius: number;
  x: number;
};

type PlayMode = 'solo' | 'pair';

const ANIMAL_SOURCES = [
  '/games/animals/01.png',
  '/games/animals/02.png',
  '/games/animals/03.png',
  '/games/animals/04.png',
  '/games/animals/05.png',
  '/games/animals/06.png',
  '/games/animals/07.png',
  '/games/animals/08.png',
  '/games/animals/09.png',
  '/games/animals/10.png',
] as const;

function loadSprite(src: string): Promise<AnimalSprite> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = src;
    image.onload = () => resolve({ image, src });
    image.onerror = () => reject(new Error(`画像の読み込みに失敗しました: ${src}`));
  });
}

export default function AnimalTowerGame() {
  const [isMobile, setIsMobile] = useState(false);
  const [playMode, setPlayMode] = useState<PlayMode | null>(null);
  const [turnPlayer, setTurnPlayer] = useState<1 | 2>(1);
  const [pairLoser, setPairLoser] = useState<1 | 2 | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<MatterRunner | null>(null);
  const rafRef = useRef<number | null>(null);
  const groundRef = useRef<MatterBody | null>(null);
  const animalsRef = useRef<AnimalBody[]>([]);
  const spritesRef = useRef<AnimalSprite[]>([]);
  const summitImageRef = useRef<HTMLImageElement | null>(null);
  const currentDropRef = useRef<DropCandidate | null>(null);
  const nextDropRef = useRef<DropCandidate | null>(null);
  const moveDirRef = useRef<-1 | 0 | 1>(0);
  const turnPlayerRef = useRef<1 | 2>(1);
  const lastDropPlayerRef = useRef<1 | 2>(1);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const resultSentRef = useRef(false);

  const instruction = useMemo(
    () =>
      'ステージ上で漱石を積み上げろ。サミット地帯に落ちたらゲームオーバー。',
    [],
  );

  const canvasWidth = isMobile ? MOBILE_CANVAS_WIDTH : DESKTOP_CANVAS_WIDTH;
  const canvasHeight = isMobile ? MOBILE_CANVAS_HEIGHT : DESKTOP_CANVAS_HEIGHT;
  const stageWidth = isMobile ? MOBILE_STAGE_WIDTH : DESKTOP_STAGE_WIDTH;
  const stageTopY = canvasHeight - SUMMIT_VISUAL_HEIGHT;
  const dangerZoneTop = canvasHeight - 28;

  useEffect(() => {
    const syncViewport = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    turnPlayerRef.current = turnPlayer;
  }, [turnPlayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playMode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let disposed = false;

    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: 0.0018 },
    });
    engineRef.current = engine;

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    const ground = Bodies.rectangle(
      canvasWidth / 2,
      stageTopY + STAGE_HEIGHT / 2,
      stageWidth,
      STAGE_HEIGHT,
      {
        isStatic: true,
        friction: 0.92,
        restitution: 0.08,
        label: 'ground',
      },
    );
    groundRef.current = ground;
    World.add(engine.world, [ground]);

    const stageLeft = (canvasWidth - stageWidth) / 2;
    const stageRight = stageLeft + stageWidth;
    const dropY = 46;

    const createCandidate = (): DropCandidate | null => {
      const loadedSprites = spritesRef.current;
      if (loadedSprites.length === 0) return null;
      const radius = 42 + Math.random() * 9;
      const sprite = loadedSprites[Math.floor(Math.random() * loadedSprites.length)];
      return {
        sprite,
        radius,
        x: canvasWidth / 2,
      };
    };

    const resetGameState = () => {
      if (gameOverRef.current) {
        animalsRef.current = [];
        Composite.clear(engine.world, false, true);
        World.add(engine.world, [ground]);
        scoreRef.current = 0;
        gameOverRef.current = false;
        resultSentRef.current = false;
        setPairLoser(null);
        setTurnPlayer(1);
        turnPlayerRef.current = 1;
        lastDropPlayerRef.current = 1;
      }
      if (!currentDropRef.current) {
        currentDropRef.current = createCandidate();
      }
      if (!nextDropRef.current) {
        nextDropRef.current = createCandidate();
      }
    };

    const spawnAnimal = () => {
      resetGameState();
      const current = currentDropRef.current;
      if (!current) return;

      const radius = current.radius;
      const clampedX = Math.max(
        stageLeft + radius + 6,
        Math.min(stageRight - radius - 6, current.x),
      );
      const body = Bodies.circle(clampedX, dropY, radius, {
        restitution: 0.16,
        friction: 0.55,
        frictionAir: 0.01,
        density: 0.0014,
        label: 'animal',
      });

      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.12);
      animalsRef.current.push({
        body,
        radius,
        sprite: current.sprite,
        createdAtMs: performance.now(),
      });
      scoreRef.current += 1;
      lastDropPlayerRef.current = turnPlayerRef.current;
      World.add(engine.world, body);

      currentDropRef.current = nextDropRef.current;
      if (currentDropRef.current) {
        currentDropRef.current.x = clampedX;
      }
      nextDropRef.current = createCandidate();

      if (playMode === 'pair') {
        const nextPlayer: 1 | 2 = turnPlayerRef.current === 1 ? 2 : 1;
        turnPlayerRef.current = nextPlayer;
        setTurnPlayer(nextPlayer);
      }
    };

    const scoreToRank = (score: number): 'S' | 'A' | 'B' | 'C' | 'D' => {
      if (score >= 40) return 'S';
      if (score >= 28) return 'A';
      if (score >= 18) return 'B';
      if (score >= 10) return 'C';
      return 'D';
    };

    const sendResult = (score: number) => {
      if (resultSentRef.current) return;
      resultSentRef.current = true;
      if (window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'MINI_GAME_RESULT',
            payload: {
              gameType: 'animal_tower',
              rank: scoreToRank(score),
              score,
            },
          },
          '*',
        );
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvasWidth;
      const current = currentDropRef.current;
      if (!current || gameOverRef.current) return;
      current.x = Math.max(
        stageLeft + current.radius + 6,
        Math.min(stageRight - current.radius - 6, x),
      );
    };

    const handlePointerDown = () => {
      spawnAnimal();
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);

    const draw = () => {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
      backgroundGradient.addColorStop(0, '#66b7ff');
      backgroundGradient.addColorStop(0.55, '#8dd0ff');
      backgroundGradient.addColorStop(1, '#d4efff');
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      const cloudColor = 'rgba(255, 255, 255, 0.62)';
      ctx.fillStyle = cloudColor;
      if (isMobile) {
        ctx.beginPath();
        ctx.arc(56, 64, 18, 0, Math.PI * 2);
        ctx.arc(82, 58, 22, 0, Math.PI * 2);
        ctx.arc(108, 66, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(268, 58, 16, 0, Math.PI * 2);
        ctx.arc(292, 50, 20, 0, Math.PI * 2);
        ctx.arc(318, 58, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(120, 110, 32, 0, Math.PI * 2);
        ctx.arc(160, 102, 40, 0, Math.PI * 2);
        ctx.arc(205, 112, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(690, 98, 28, 0, Math.PI * 2);
        ctx.arc(724, 88, 36, 0, Math.PI * 2);
        ctx.arc(760, 98, 25, 0, Math.PI * 2);
        ctx.fill();
      }

      const summitImage = summitImageRef.current;
      if (summitImage) {
        ctx.drawImage(summitImage, stageLeft, stageTopY, stageWidth, SUMMIT_VISUAL_HEIGHT);
      } else {
        ctx.fillStyle = '#2ca028';
        ctx.fillRect(stageLeft, stageTopY, stageWidth, STAGE_HEIGHT + 12);
      }

      let escaped = false;
      animalsRef.current.forEach(({ body, radius, sprite, createdAtMs }) => {
        if (body.position.y - radius > canvasHeight + 120) return;
        if (!gameOverRef.current && performance.now() - createdAtMs > 300) {
          if (body.position.y + radius >= dangerZoneTop) escaped = true;
        }
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(sprite.image, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();
      });

      ctx.fillStyle = '#11283a';
      ctx.font = isMobile ? 'bold 20px sans-serif' : 'bold 28px sans-serif';
      ctx.textAlign = 'left';
      if (playMode === 'solo') {
        ctx.fillText(`SCORE: ${scoreRef.current}`, 14, isMobile ? 30 : 42);
      } else {
        ctx.fillText(`TURN: P${turnPlayerRef.current}`, 14, isMobile ? 30 : 42);
      }

      const current = currentDropRef.current;
      if (current && !gameOverRef.current) {
        const moveSpeed = 5;
        current.x = Math.max(
          stageLeft + current.radius + 6,
          Math.min(stageRight - current.radius - 6, current.x + moveDirRef.current * moveSpeed),
        );

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(current.x, dropY);
        ctx.drawImage(
          current.sprite.image,
          -current.radius,
          -current.radius,
          current.radius * 2,
          current.radius * 2,
        );
        ctx.restore();
      }

      const next = nextDropRef.current;
      if (next) {
        const previewRadius = isMobile ? 20 : 28;
        const box = isMobile ? 76 : 108;
        const uiX = canvasWidth - (isMobile ? 48 : 64);
        const uiY = isMobile ? 36 : 44;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(uiX - box / 2, uiY - 20, box, box);
        ctx.strokeStyle = 'rgba(17,40,58,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(uiX - box / 2, uiY - 20, box, box);
        ctx.fillStyle = '#11283a';
        ctx.font = isMobile ? 'bold 12px sans-serif' : 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', uiX, uiY - 4);
        ctx.drawImage(
          next.sprite.image,
          uiX - previewRadius,
          uiY + 8,
          previewRadius * 2,
          previewRadius * 2,
        );
      }

      if (escaped && !gameOverRef.current) {
        gameOverRef.current = true;
        if (playMode === 'solo') {
          sendResult(scoreRef.current);
        } else {
          setPairLoser(lastDropPlayerRef.current);
        }
      }

      if (gameOverRef.current) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = isMobile ? 'bold 36px sans-serif' : 'bold 58px sans-serif';
        ctx.fillText('GAME OVER', canvasWidth / 2, canvasHeight / 2 - 18);
        ctx.font = isMobile ? 'bold 22px sans-serif' : 'bold 34px sans-serif';
        if (playMode === 'solo') {
          ctx.fillText(
            `積み上げ数: ${scoreRef.current}`,
            canvasWidth / 2,
            canvasHeight / 2 + 36,
          );
        } else {
          const loserText = pairLoser ? `PLAYER ${pairLoser} の負け` : '判定中...';
          ctx.fillText(loserText, canvasWidth / 2, canvasHeight / 2 + 36);
        }
        ctx.font = isMobile ? 'bold 16px sans-serif' : 'bold 23px sans-serif';
        ctx.fillText(
          '画面をクリックしてリスタート',
          canvasWidth / 2,
          canvasHeight / 2 + (isMobile ? 64 : 86),
        );
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    Promise.allSettled(ANIMAL_SOURCES.map((src) => loadSprite(src)))
      .then((results) => {
        if (disposed) return;
        spritesRef.current = results
          .filter((r): r is PromiseFulfilledResult<AnimalSprite> => r.status === 'fulfilled')
          .map((r) => r.value);
        if (spritesRef.current.length === 0) {
          throw new Error('利用可能なスプライト画像がありません');
        }
        const summitImage = new Image();
        summitImage.src = '/summit.png';
        summitImage.onload = () => {
          summitImageRef.current = summitImage;
        };
        currentDropRef.current = createCandidate();
        nextDropRef.current = createCandidate();
        rafRef.current = requestAnimationFrame(draw);
      })
      .catch((error: unknown) => {
        console.error(error);
      });

    return () => {
      disposed = true;
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      if (runnerRef.current) {
        Runner.stop(runnerRef.current);
      }
      if (engineRef.current) {
        World.clear(engineRef.current.world, false);
        Engine.clear(engineRef.current);
      }
      Composite.clear(engine.world, false, true);
      animalsRef.current = [];
      spritesRef.current = [];
      summitImageRef.current = null;
      currentDropRef.current = null;
      nextDropRef.current = null;
      moveDirRef.current = 0;
      scoreRef.current = 0;
      gameOverRef.current = false;
      resultSentRef.current = false;
    };
  }, [canvasHeight, canvasWidth, dangerZoneTop, isMobile, pairLoser, playMode, stageTopY, stageWidth]);

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center bg-[#c9ebff] text-[#1b1b1b] ${
        playMode != null && isMobile
          ? 'justify-start gap-2 px-3 pb-3 pt-3'
          : 'justify-center gap-3 p-4'
      }`}
    >
      {playMode == null ? (
        <div
          className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fork-summit-start-title"
        >
          <div className="w-full max-w-[520px] rounded-lg border border-white/15 bg-black/35 px-6 py-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
            <h1
              id="fork-summit-start-title"
              className="text-2xl font-black tracking-tight text-[#facc15] md:text-3xl"
            >
              FORK サミットバトル
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-200">{instruction}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                className="rounded-md bg-[#1e3a55] px-6 py-3 text-lg font-black text-white transition hover:brightness-110"
                onClick={() => {
                  setPlayMode('solo');
                  setTurnPlayer(1);
                  setPairLoser(null);
                }}
              >
                ソロプレイ
              </button>
              <button
                type="button"
                className="rounded-md bg-[#ca2132] px-6 py-3 text-lg font-black text-white transition hover:brightness-110"
                onClick={() => {
                  setPlayMode('pair');
                  setTurnPlayer(1);
                  setPairLoser(null);
                }}
              >
                ペアプレイ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-stretch ${isMobile ? 'mx-auto w-full gap-2' : 'w-full max-w-[960px] gap-3'}`}
          style={isMobile ? { maxWidth: MOBILE_CANVAS_WIDTH } : undefined}
        >
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="h-auto w-full rounded-lg border border-[#4a6476] bg-[#8dd0ff] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
          />
          <div className="flex w-full shrink-0 items-stretch justify-center gap-2 md:hidden">
            <button
              type="button"
              className="min-h-12 flex-1 rounded-md bg-[#1e3a55] px-3 py-2.5 text-base font-black text-white active:scale-95"
              onPointerDown={() => {
                moveDirRef.current = -1;
              }}
              onPointerUp={() => {
                moveDirRef.current = 0;
              }}
              onPointerLeave={() => {
                moveDirRef.current = 0;
              }}
              onPointerCancel={() => {
                moveDirRef.current = 0;
              }}
            >
              ← 左
            </button>
            <button
              type="button"
              className="min-h-12 flex-1 rounded-md bg-[#1e3a55] px-3 py-2.5 text-base font-black text-white active:scale-95"
              onPointerDown={() => {
                moveDirRef.current = 1;
              }}
              onPointerUp={() => {
                moveDirRef.current = 0;
              }}
              onPointerLeave={() => {
                moveDirRef.current = 0;
              }}
              onPointerCancel={() => {
                moveDirRef.current = 0;
              }}
            >
              右 →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
