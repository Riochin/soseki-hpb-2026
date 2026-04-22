'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import animalCollisionData from '@/data/games/animal-tower-collision.json';
import { apiFetch } from '@/lib/api';
import {
  Bodies,
  Body,
  Common,
  Composite,
  Engine,
  Runner,
  World,
  type Body as MatterBody,
  type Engine as MatterEngine,
  type Runner as MatterRunner,
} from 'matter-js';
import decomp from 'poly-decomp';

type AnimalCollisionEntry = {
  vertices: { x: number; y: number }[];
  halfExtent: number;
};

const collisionByFilename = animalCollisionData as Record<string, AnimalCollisionEntry>;

let matterDecompRegistered = false;

function ensureMatterDecomp() {
  if (matterDecompRegistered) return;
  Common.setDecomp(decomp);
  matterDecompRegistered = true;
}

function collisionKeyFromSrc(src: string): string {
  const i = src.lastIndexOf('/');
  return i >= 0 ? src.slice(i + 1) : src;
}

function getCollisionEntry(src: string): AnimalCollisionEntry | null {
  const key = collisionKeyFromSrc(src);
  const entry = collisionByFilename[key];
  if (!entry?.vertices?.length || entry.vertices.length < 3) return null;
  return entry;
}

const DESKTOP_CANVAS_WIDTH = 960;
/** 描画しているサミット画像の高さ（床ラインは画像上端）。下端は常にキャンバス下端に一致 */
const SUMMIT_VISUAL_HEIGHT = 88;
/** スマホ用キャンバス幅 */
const MOBILE_CANVAS_WIDTH = 540;
/** iframe 埋め込み時の積み上げエリア高さ */
const MOBILE_STACK_AREA_HEIGHT_IFRAME = 520;
/** 直開きページのみ：積み上げエリアをやや拡張 */
const MOBILE_STACK_AREA_HEIGHT_STANDALONE = 660;
const MOBILE_BREAKPOINT = 768;

const DESKTOP_STAGE_WIDTH = 520;
const MOBILE_STAGE_WIDTH = 468;
const DESKTOP_CANVAS_HEIGHT_IFRAME = 600;
/** 直開き時：デスクトップもプレイエリアを少し拡張 */
const DESKTOP_CANVAS_HEIGHT_STANDALONE = 740;
/** 下端からのゲームオーバー判定ライン（px） */
const DANGER_LINE_FROM_BOTTOM = 28;
/** サミット下の全幅の炎帯（🔥🔥🔥 行） */
const FIRE_BOTTOM_ROW_HEIGHT_MOBILE = 150;
const FIRE_BOTTOM_ROW_HEIGHT_DESKTOP = 120;
/** 炎をsummit下端より上にはみ出させるオフセット（summitが後描きで隠す） */
const FIRE_OVERLAP_PX = 64;
/** 炎ブロック全体を上方向にずらす量（サイズを変えず下端を上げる） */
const FIRE_RAISE_PX = 100;
const STAGE_HEIGHT = 24;

/** Matter 重力 scale（小さいほど加速が弱い） */
const ENGINE_GRAVITY_SCALE = 0.00112;
/** 1 未満でシミュレーション全体がゆったりする */
const ENGINE_TIME_SCALE = 0.9;
const ANIMAL_RESTITUTION = 0.01;
const ANIMAL_FRICTION = 3.5;
const ANIMAL_FRICTION_STATIC = 12.0;
const ANIMAL_FRICTION_AIR = 0.14;
const ANIMAL_DENSITY = 0.006;
const SPAWN_ANGULAR_VELOCITY_RANGE = 0;
const GROUND_RESTITUTION = 0.06;
const GROUND_FRICTION = 3.0;
/** 1 個置いた直後はこの時間（ms）再配置できない（連打抑制） */
const DROP_COOLDOWN_MS = 1000;
const BASE_DROP_Y = 46;
/** 床に接している個体の横ズレを抑えるための接地判定余白 */
const GROUND_LOCK_BAND_PX = 6;
/** 生成直後はロックせず、着地後にのみ横ズレ抑制を効かせる */
const GROUND_LOCK_MIN_AGE_MS = 180;
/** タワートップより何px上でスポーンするか（調整用） */
const SPAWN_ABOVE_TOWER_N = 150;
/** カメラ補間係数 */
const CAMERA_LERP = 0.08;
/** 生成直後の落下中オブジェクトをタワートップ計算から除外する時間（ms） */
const TOWER_TOP_STABLE_AGE_MS = 700;

const PAIR_PLAYER_NAME: Record<1 | 2, string> = {
  1: 'しゆう',
  2: 'オーガスト',
};

/** ペアモードのターン表示色（しゆう＝黄、オーガスト＝ピンク） */
const PAIR_TURN_TEXT_COLOR: Record<1 | 2, string> = {
  1: '#facc15',
  2: '#f472b6',
};

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
  /** JSON の halfExtent（画像正規化空間）。ステージクランプは radius * halfExtent */
  halfExtent: number;
  x: number;
  angle: number;
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
  const fireImageRef = useRef<HTMLImageElement | null>(null);
  const currentDropRef = useRef<DropCandidate | null>(null);
  const nextDropRef = useRef<DropCandidate | null>(null);
  const moveDirRef = useRef<-1 | 0 | 1>(0);
  const rotateDirRef = useRef<-1 | 0 | 1>(0);
  const turnPlayerRef = useRef<1 | 2>(1);
  const lastDropPlayerRef = useRef<1 | 2>(1);
  const pairLoserRef = useRef<1 | 2 | null>(null);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const resultSentRef = useRef(false);
  const placeCooldownUntilRef = useRef(0);
  const playerNameRef = useRef<string | null>(null);
  const cameraOffsetYRef = useRef(0);
  const maxCameraOffsetYRef = useRef(0);
  const dynamicDropYRef = useRef(BASE_DROP_Y);
  const stableTowerTopYRef = useRef(0);

  const searchParams = useSearchParams();
  useEffect(() => {
    playerNameRef.current = searchParams.get('player');
  }, [searchParams]);

  const instruction = useMemo(
    () =>
      '限界までアクメ漱石を積み上げろ。',
    [],
  );

  const isEmbedded = useSyncExternalStore(
    () => () => {},
    () => typeof window !== 'undefined' && window.parent !== window,
    () => false,
  );

  const fireBottomRowHeight = useMemo(() => {
    return isMobile ? FIRE_BOTTOM_ROW_HEIGHT_MOBILE : FIRE_BOTTOM_ROW_HEIGHT_DESKTOP;
  }, [isMobile]);

  const canvasWidth = isMobile ? MOBILE_CANVAS_WIDTH : DESKTOP_CANVAS_WIDTH;
  const canvasHeight = useMemo(() => {
    if (isMobile) {
      const stack = isEmbedded ? MOBILE_STACK_AREA_HEIGHT_IFRAME : MOBILE_STACK_AREA_HEIGHT_STANDALONE;
      return stack + SUMMIT_VISUAL_HEIGHT + fireBottomRowHeight;
    }
    return (isEmbedded ? DESKTOP_CANVAS_HEIGHT_IFRAME : DESKTOP_CANVAS_HEIGHT_STANDALONE) + fireBottomRowHeight;
  }, [isMobile, isEmbedded, fireBottomRowHeight]);

  const stageWidth = isMobile ? MOBILE_STAGE_WIDTH : DESKTOP_STAGE_WIDTH;
  const stageTopY = useMemo(
    () => canvasHeight - fireBottomRowHeight - SUMMIT_VISUAL_HEIGHT,
    [canvasHeight, fireBottomRowHeight],
  );
  const dangerZoneTop = canvasHeight - DANGER_LINE_FROM_BOTTOM;

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
    pairLoserRef.current = pairLoser;
  }, [pairLoser]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !playMode) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let disposed = false;

    ensureMatterDecomp();

    const engine = Engine.create({
      gravity: { x: 0, y: 1, scale: ENGINE_GRAVITY_SCALE },
    });
    engine.timing.timeScale = ENGINE_TIME_SCALE;
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
        friction: GROUND_FRICTION,
        restitution: GROUND_RESTITUTION,
        label: 'ground',
      },
    );
    groundRef.current = ground;
    World.add(engine.world, [ground]);

    const stageLeft = (canvasWidth - stageWidth) / 2;
    const stageRight = stageLeft + stageWidth;
    stableTowerTopYRef.current = stageTopY;

    const createCandidate = (): DropCandidate | null => {
      const loadedSprites = spritesRef.current;
      if (loadedSprites.length === 0) return null;
      const radius = 62 + Math.random() * 14;
      const sprite = loadedSprites[Math.floor(Math.random() * loadedSprites.length)];
      const entry = getCollisionEntry(sprite.src);
      const halfExtent = entry?.halfExtent ?? 1;
      return {
        sprite,
        radius,
        halfExtent,
        x: canvasWidth / 2,
        angle: 0,
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
        placeCooldownUntilRef.current = 0;
        cameraOffsetYRef.current = 0;
        maxCameraOffsetYRef.current = 0;
        stableTowerTopYRef.current = stageTopY;
        dynamicDropYRef.current = stageTopY - SPAWN_ABOVE_TOWER_N;
        pairLoserRef.current = null;
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
      if (performance.now() < placeCooldownUntilRef.current) return;
      const current = currentDropRef.current;
      if (!current) return;

      const radius = current.radius;
      const edge = radius * current.halfExtent;
      const clampedX = Math.max(
        stageLeft + edge + 6,
        Math.min(stageRight - edge - 6, current.x),
      );
      const entry = getCollisionEntry(current.sprite.src);
      const bodyOptions = {
        restitution: ANIMAL_RESTITUTION,
        friction: ANIMAL_FRICTION,
        frictionStatic: ANIMAL_FRICTION_STATIC,
        frictionAir: ANIMAL_FRICTION_AIR,
        density: ANIMAL_DENSITY,
        label: 'animal',
        minimumArea: 0,
      } as const;
      const body =
        entry != null
          ? Bodies.fromVertices(
              clampedX,
              dynamicDropYRef.current,
              [
                entry.vertices.map((v) => ({
                  x: clampedX + v.x * radius,
                  y: dynamicDropYRef.current + v.y * radius,
                })),
              ],
              { ...bodyOptions },
            )
          : Bodies.circle(clampedX, dynamicDropYRef.current, radius, { ...bodyOptions });

      Body.setAngle(body, current.angle);
      Body.setAngularVelocity(body, (Math.random() - 0.5) * SPAWN_ANGULAR_VELOCITY_RANGE);
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

      placeCooldownUntilRef.current = performance.now() + DROP_COOLDOWN_MS;
    };

    const scoreToRank = (score: number): 'S' | 'A' | 'B' | 'C' | 'D' => {
      if (score >= 30) return 'S';
      if (score >= 20) return 'A';
      if (score >= 10) return 'B';
      if (score >= 5) return 'C';
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
      } else {
        const name = playerNameRef.current;
        if (name) {
          apiFetch(`/api/players/${encodeURIComponent(name)}/game-reward`, {
            method: 'POST',
            body: JSON.stringify({
              gameType: 'animal_tower',
              rank: scoreToRank(score),
              score,
              sessionId: crypto.randomUUID(),
            }),
          }).catch(console.error);
        }
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * canvasWidth;
      const current = currentDropRef.current;
      if (!current || gameOverRef.current) return;
      const edge = current.radius * current.halfExtent;
      current.x = Math.max(
        stageLeft + edge + 6,
        Math.min(stageRight - edge - 6, x),
      );
    };

    const handlePointerAction = () => {
      if (gameOverRef.current) {
        setPlayMode(null);
        return;
      }
      spawnAnimal();
    };

    canvas.addEventListener('pointermove', handlePointerMove);
    if (isMobile) {
      canvas.addEventListener('pointerup', handlePointerAction);
    } else {
      canvas.addEventListener('pointerdown', handlePointerAction);
    }

    const draw = () => {
      // タワートップ（世界座標）とスポーン位置（世界座標）を先に更新
      // 生成直後の落下中オブジェクトに引っ張られてカメラが戻るのを防ぐため、
      // 一定時間経過した個体を優先してタワートップを算出する。
      const now = performance.now();
      let stableTopWorldY = stageTopY;
      let stableCount = 0;
      animalsRef.current.forEach(({ body, createdAtMs }) => {
        const ageMs = now - createdAtMs;
        const isSettled = ageMs >= TOWER_TOP_STABLE_AGE_MS && Math.abs(body.velocity.y) < 0.6;
        if (isSettled) {
          stableTopWorldY = Math.min(stableTopWorldY, body.bounds.min.y);
          stableCount += 1;
        }
      });
      if (stableCount > 0) {
        stableTowerTopYRef.current = stableTopWorldY;
      }
      const towerTopWorldY =
        animalsRef.current.length === 0 ? stageTopY : stableTowerTopYRef.current;
      if (animalsRef.current.length === 0) {
        dynamicDropYRef.current = stageTopY - SPAWN_ABOVE_TOWER_N;
      } else {
        dynamicDropYRef.current = towerTopWorldY - SPAWN_ABOVE_TOWER_N;
      }
      const rawTargetCameraOffset = Math.max(0, BASE_DROP_Y - dynamicDropYRef.current);
      maxCameraOffsetYRef.current = Math.max(maxCameraOffsetYRef.current, rawTargetCameraOffset);
      const targetCameraOffset = maxCameraOffsetYRef.current;
      cameraOffsetYRef.current += (targetCameraOffset - cameraOffsetYRef.current) * CAMERA_LERP;

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

      let escaped = false;
      // ワールド空間
      ctx.save();
      ctx.translate(0, cameraOffsetYRef.current);

      // 炎はsummitより下の位置に先に描く（summitが手前になるよう summit は後で描く）
      const fireImg = fireImageRef.current;
      if (fireImg?.complete && fireImg.naturalWidth > 0) {
        const hb = fireBottomRowHeight;
        const fireTop = stageTopY + SUMMIT_VISUAL_HEIGHT - FIRE_OVERLAP_PX - FIRE_RAISE_PX;
        ctx.drawImage(fireImg, 0, fireTop, canvasWidth, hb + FIRE_OVERLAP_PX);
      }

      // summitは炎より後（手前）に描く
      const summitImage = summitImageRef.current;
      if (summitImage) {
        ctx.drawImage(summitImage, stageLeft, stageTopY, stageWidth, SUMMIT_VISUAL_HEIGHT);
      } else {
        ctx.fillStyle = '#2ca028';
        ctx.fillRect(stageLeft, stageTopY, stageWidth, STAGE_HEIGHT + 12);
      }

      animalsRef.current.forEach(({ body, radius, sprite, createdAtMs }) => {
        if (body.bounds.min.y > canvasHeight + 120) return;

        // 床に接地している個体は、衝突で左右に押されないよう横速度と回転を抑える。
        const ageMs = performance.now() - createdAtMs;
        const isGrounded = body.bounds.max.y >= stageTopY - GROUND_LOCK_BAND_PX;
        if (ageMs >= GROUND_LOCK_MIN_AGE_MS && isGrounded) {
          if (Math.abs(body.velocity.x) > 0.001) {
            Body.setVelocity(body, { x: 0, y: body.velocity.y });
          }
          if (Math.abs(body.angularVelocity) > 0.001) {
            Body.setAngularVelocity(body, 0);
          }
        }

        if (!gameOverRef.current && performance.now() - createdAtMs > 300 && body.bounds.max.y >= dangerZoneTop) {
          escaped = true;
        }
        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);
        ctx.drawImage(sprite.image, -radius, -radius, radius * 2, radius * 2);
        ctx.restore();
      });

      const current = currentDropRef.current;
      if (current && !gameOverRef.current) {
        const moveSpeed = 5;
        const rotateSpeed = 0.04;
        const edge = current.radius * current.halfExtent;
        current.x = Math.max(
          stageLeft + edge + 6,
          Math.min(stageRight - edge - 6, current.x + moveDirRef.current * moveSpeed),
        );
        current.angle += rotateDirRef.current * rotateSpeed;

        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.translate(current.x, dynamicDropYRef.current);
        ctx.rotate(current.angle);
        ctx.drawImage(
          current.sprite.image,
          -current.radius,
          -current.radius,
          current.radius * 2,
          current.radius * 2,
        );
        ctx.restore();
      }

      ctx.restore();

      if (escaped && !gameOverRef.current) {
        gameOverRef.current = true;
        if (playMode === 'solo') {
          sendResult(scoreRef.current);
        } else {
          setPairLoser(lastDropPlayerRef.current);
        }
      }

      // スクリーン空間UI
      ctx.textAlign = 'left';
      if (playMode === 'solo') {
        ctx.fillStyle = '#11283a';
        ctx.font = isMobile ? 'bold 20px sans-serif' : 'bold 28px sans-serif';
        ctx.fillText(`SCORE: ${scoreRef.current}`, 14, isMobile ? 30 : 42);
      } else {
        const p = turnPlayerRef.current;
        const turnLabel = `TURN: ${PAIR_PLAYER_NAME[p]}`;
        const turnY = isMobile ? 30 : 42;
        ctx.font = isMobile ? 'bold 20px sans-serif' : 'bold 28px sans-serif';
        ctx.strokeStyle = 'rgba(17, 40, 58, 0.55)';
        ctx.lineWidth = isMobile ? 4 : 5;
        ctx.lineJoin = 'round';
        ctx.strokeText(turnLabel, 14, turnY);
        ctx.fillStyle = PAIR_TURN_TEXT_COLOR[p];
        ctx.fillText(turnLabel, 14, turnY);
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
          const loserText = pairLoserRef.current ? `${PAIR_PLAYER_NAME[pairLoserRef.current]} の負け` : '判定中...';
          if (pairLoserRef.current) {
            ctx.fillStyle = PAIR_TURN_TEXT_COLOR[pairLoserRef.current];
          }
          ctx.fillText(loserText, canvasWidth / 2, canvasHeight / 2 + 36);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = isMobile ? 'bold 16px sans-serif' : 'bold 23px sans-serif';
        ctx.fillText(
          'タイトルに戻る',
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
        const fireImage = new Image();
        fireImage.src = '/games/fire.png';
        fireImage.onload = () => {
          fireImageRef.current = fireImage;
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
      if (isMobile) {
        canvas.removeEventListener('pointerup', handlePointerAction);
      } else {
        canvas.removeEventListener('pointerdown', handlePointerAction);
      }
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
      fireImageRef.current = null;
      currentDropRef.current = null;
      nextDropRef.current = null;
      cameraOffsetYRef.current = 0;
      maxCameraOffsetYRef.current = 0;
      stableTowerTopYRef.current = stageTopY;
      dynamicDropYRef.current = stageTopY - SPAWN_ABOVE_TOWER_N;
      moveDirRef.current = 0;
      scoreRef.current = 0;
      gameOverRef.current = false;
      resultSentRef.current = false;
      placeCooldownUntilRef.current = 0;
    };
  }, [
    canvasHeight,
    canvasWidth,
    dangerZoneTop,
    fireBottomRowHeight,
    isEmbedded,
    isMobile,
    playMode,
    stageTopY,
    stageWidth,
  ]);

  return (
    <main
      className={`relative flex min-h-0 flex-1 flex-col bg-[#c9ebff] text-[#1b1b1b] ${
        playMode != null && isMobile
          ? 'w-full items-stretch justify-start gap-0 px-0 pb-0 pt-3'
          : 'items-center justify-center gap-3 p-4'
      }`}
    >
      {playMode == null ? (
        <div
          className="fixed inset-0 z-10 flex flex-col items-center justify-center bg-black/50 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fork-summit-start-title"
        >
          <div className="w-full max-w-xs rounded-xl border border-white/15 bg-black/45 px-8 py-9 text-center shadow-[0_16px_48px_rgba(0,0,0,0.55)]">
            <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-[#facc15]/60 uppercase">Mini Game</p>
            <h1
              id="fork-summit-start-title"
              className="text-2xl font-black tracking-tight text-[#facc15]"
            >
              FORK サミットバトル
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">{instruction}</p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                className="w-full select-none rounded-lg bg-[#facc15] py-3 text-base font-black text-[#1a1a1a] transition hover:brightness-105 active:scale-95"
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
                className="w-full select-none rounded-lg bg-[#facc15] py-3 text-base font-black text-[#1a1a1a] transition hover:brightness-105 active:scale-95"
                onClick={() => {
                  setPlayMode('pair');
                  setTurnPlayer(1);
                  setPairLoser(null);
                }}
              >
                対戦プレイ
              </button>
            </div>
            <p className="mt-7 border-t border-white/10 pt-4 text-[10px] tracking-widest text-stone-400">
              原案: しゆう　／　開発: マルハット
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-col items-stretch ${isMobile ? 'min-h-0 w-full flex-1 gap-0' : 'w-full max-w-[960px] gap-3'}`}
        >
          {isMobile ? (
            <div className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="block max-h-full max-w-full bg-[#8dd0ff] object-contain"
              />
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="block h-auto w-full rounded-lg border border-[#4a6476] bg-[#8dd0ff] shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            />
          )}
          <div className="flex shrink-0 items-stretch gap-3 px-4 pb-3 md:hidden">
            <button
              type="button"
              className="min-h-12 flex-1 select-none rounded-md bg-[#1e3a55] px-3 py-2.5 text-base font-black text-white active:scale-95"
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
              className="min-h-12 flex-1 select-none rounded-md bg-[#1e3a55] px-3 py-2.5 text-base font-black text-white active:scale-95"
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
            <button
              type="button"
              className="min-h-12 flex-1 select-none rounded-md bg-[#1e3a55] px-3 py-2.5 text-base font-black text-white active:scale-95"
              onPointerDown={() => {
                rotateDirRef.current = 1;
              }}
              onPointerUp={() => {
                rotateDirRef.current = 0;
              }}
              onPointerLeave={() => {
                rotateDirRef.current = 0;
              }}
              onPointerCancel={() => {
                rotateDirRef.current = 0;
              }}
            >
              ↻
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
