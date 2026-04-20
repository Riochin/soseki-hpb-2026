/**
 * UIモック用のスタブデータ
 * NEXT_PUBLIC_UI_MOCK=true のとき、バックエンド呼び出しの代わりに使用される
 */

import type {
  Player,
  GachaResult,
  MultiGachaResult,
  CollectionItem,
  EarnCoinsResult,
} from '@/hooks/usePlayer';
import type { Message } from '@/hooks/useMessages';

export const IS_UI_MOCK = process.env.NEXT_PUBLIC_UI_MOCK === 'true';

export const MOCK_COLLECTION: CollectionItem[] = [
  { itemId: 1, name: '吾輩は猫である', rarity: 'UR',  icon: '🐱', acquired: true,  is_giftable: true,  proposed_by: '正岡子規',   is_consumed: false },
  { itemId: 2, name: '坊っちゃん',     rarity: 'SSR', icon: '🏔️', acquired: true,  is_giftable: true,  proposed_by: '寺田寅彦',   is_consumed: true  },
  { itemId: 3, name: 'こころ',         rarity: 'SSR', icon: '💙', acquired: false, is_giftable: false, proposed_by: null,          is_consumed: false },
  { itemId: 4, name: '三四郎',         rarity: 'R',   icon: '📚', acquired: true,  is_giftable: false, proposed_by: '鏡子',       is_consumed: false },
  { itemId: 5, name: 'それから',       rarity: 'R',   icon: '🍋', acquired: false, is_giftable: false, proposed_by: null,          is_consumed: false },
  { itemId: 6, name: '門',             rarity: 'R',   icon: '🚪', acquired: false, is_giftable: false, proposed_by: null,          is_consumed: false },
  { itemId: 7, name: '草枕',           rarity: 'N',   icon: '🎨', acquired: true,  is_giftable: false, proposed_by: null,          is_consumed: false },
  { itemId: 8, name: '虞美人草',       rarity: 'N',   icon: '🌸', acquired: false, is_giftable: false, proposed_by: null,          is_consumed: false },
];

export const MOCK_PLAYER: Player = {
  name: 'UIモックユーザー',
  coins: 1500,
  debt: 10000,
  collection: MOCK_COLLECTION,
};

export const MOCK_GACHA_RESULT: GachaResult = {
  item: MOCK_COLLECTION[0],
  isNew: false,
  newCoins: 400,
};

export const MOCK_MULTI_GACHA_RESULT: MultiGachaResult = {
  results: Array.from({ length: 10 }, (_, i) => ({
    item: MOCK_COLLECTION[i % MOCK_COLLECTION.length],
    isNew: i === 0,
    newCoins: 0,
  })),
  newCoins: 0,
};

export const MOCK_EARN_COINS_RESULT: EarnCoinsResult = {
  coinsEarned: 30,
  newCoins: 530,
  resultId: 1,
};

/** ミニゲームランキング（UIモック用）。生データは同一プレイヤー複数行を含みうるが、useGameResults が本番APIと同様に集約する */
export const MOCK_GAME_RESULTS_TYPING = [
  {
    rank: 1,
    playerName: '正岡子規',
    score: 12500,
    gradeRank: 'S',
    createdAt: '2026-04-20T12:00:00.000Z',
  },
  {
    rank: 2,
    playerName: '匿名',
    score: 9800,
    gradeRank: 'A',
    createdAt: '2026-04-21T08:30:00.000Z',
  },
  {
    rank: 3,
    playerName: 'UIモックユーザー',
    score: 8000,
    gradeRank: 'A',
    createdAt: '2026-04-22T10:00:00.000Z',
  },
  {
    rank: 4,
    playerName: 'UIモックユーザー',
    score: 4200,
    gradeRank: 'B',
    createdAt: '2026-04-22T15:00:00.000Z',
  },
];

export const MOCK_GAME_RESULTS_FACE_MEMORY = [
  {
    rank: 1,
    playerName: '鏡子',
    score: 52000,
    gradeRank: 'S',
    createdAt: '2026-04-20T10:00:00.000Z',
  },
  {
    rank: 2,
    playerName: 'UIモックユーザー',
    score: 41000,
    gradeRank: 'A',
    createdAt: '2026-04-21T09:00:00.000Z',
  },
  {
    rank: 3,
    playerName: '匿名',
    score: 25000,
    gradeRank: 'B',
    createdAt: '2026-04-22T14:00:00.000Z',
  },
];

export const MOCK_GAME_RESULTS_SHOOTING = [
  {
    rank: 1,
    playerName: '花京院',
    score: 99999,
    gradeRank: 'S',
    createdAt: '2026-04-20T10:00:00.000Z',
  },
  {
    rank: 2,
    playerName: 'UIモックユーザー',
    score: 50000,
    gradeRank: 'S',
    createdAt: '2026-04-21T09:00:00.000Z',
  },
  {
    rank: 3,
    playerName: '匿名',
    score: 12000,
    gradeRank: 'A',
    createdAt: '2026-04-21T14:00:00.000Z',
  },
  {
    rank: 4,
    playerName: 'UIモックユーザー',
    score: 3000,
    gradeRank: 'C',
    createdAt: '2026-04-22T11:00:00.000Z',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    author: '夏目鏡子',
    username: 'UIモックユーザー',
    text: '漱石さん、20歳のお誕生日おめでとうございます！',
    bgColor: 'beige',
    bgStyle: 'normal',
    font: 'fude',
    stamp: 'jolyne',
    createdAt: '2026-04-23T09:00:00Z',
  },
  {
    id: 2,
    author: '正岡子規',
    text: 'おめでとう！これからも良い俳句を詠んでくれ。',
    bgColor: 'white',
    bgStyle: 'line',
    font: 'noto-sans',
    stamp: 'jotaro',
    createdAt: '2026-04-23T10:00:00Z',
  },
  {
    id: 3,
    author: '寺田寅彦',
    text: '先生、20歳おめでとうございます。科学と文学の両立、尊敬しています。',
    bgColor: 'purple',
    bgStyle: 'grid',
    font: 'tanuki',
    createdAt: '2026-04-23T11:00:00Z',
  },
];

export const MOCK_COUNTER_COUNT = 777;
