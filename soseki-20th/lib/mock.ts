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
export const YOSEGAKI_BOARD_ENABLED = process.env.NEXT_PUBLIC_YOSEGAKI_BOARD === 'true';

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
  debt: 50000,
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

export const MOCK_GAME_RESULTS_QUIZ = [
  {
    rank: 1,
    playerName: '正岡子規',
    score: 1000,
    gradeRank: 'S',
    createdAt: '2026-04-20T12:00:00.000Z',
  },
  {
    rank: 2,
    playerName: 'UIモックユーザー',
    score: 900,
    gradeRank: 'A',
    createdAt: '2026-04-21T08:30:00.000Z',
  },
  {
    rank: 3,
    playerName: '匿名',
    score: 600,
    gradeRank: 'B',
    createdAt: '2026-04-22T10:00:00.000Z',
  },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    author: '夏目鏡子',
    username: 'UIモックユーザー',
    text: 'おめでとう',
    bgColor: 'beige',
    bgStyle: 'normal',
    font: 'fude',
    stamp: 'jolyne',
    createdAt: '2026-04-23T09:00:00Z',
  },
  {
    id: 2,
    author: '正岡子規',
    text: 'はたちおめでとう！',
    bgColor: 'white',
    bgStyle: 'line',
    font: 'noto-sans',
    stamp: 'jotaro',
    createdAt: '2026-04-23T10:00:00Z',
  },
  {
    id: 3,
    author: '寺田寅彦',
    text: '二十歳おめでとう！これからもよろしく。',
    bgColor: 'purple',
    bgStyle: 'grid',
    font: 'tanuki',
    createdAt: '2026-04-23T11:00:00Z',
  },
  {
    id: 4,
    author: '森鴎外',
    text: '漱石さん、20歳のお誕生日おめでとうございます！',
    bgColor: 'white',
    bgStyle: 'normal',
    font: 'fude',
    stamp: 'dio',
    createdAt: '2026-04-23T12:00:00Z',
  },
  {
    id: 5,
    author: '高浜虚子',
    text: '先生、二十歳おめでとうございます。科学と文学の両立、尊敬しています。',
    bgColor: 'beige',
    bgStyle: 'line',
    font: 'noto-sans',
    stamp: 'joseph',
    createdAt: '2026-04-23T13:00:00Z',
  },
  {
    id: 6,
    author: '鈴木三重吉',
    text: 'おめでとうございます！これからも先生の作品を楽しみにしています。どうかお体に気をつけて。',
    bgColor: 'purple',
    bgStyle: 'normal',
    font: 'fude-ji',
    createdAt: '2026-04-23T14:00:00Z',
  },
  {
    id: 7,
    author: '小宮豊隆',
    text: '先生、ご誕生日おめでとうございます。先生の文章はいつも心に響きます。二十歳という節目に、これからもすばらしい作品を生み出されることを願っております。どうかご健康に気をつけて、長くご活躍ください！',
    bgColor: 'white',
    bgStyle: 'grid',
    font: 'tanuki',
    stamp: 'rohan',
    createdAt: '2026-04-23T15:00:00Z',
  },
  {
    id: 8,
    author: '野上弥生子',
    text: '二十路',
    bgColor: 'beige',
    bgStyle: 'grid',
    font: 'fude',
    stamp: 'jolyne',
    createdAt: '2026-04-23T16:00:00Z',
  },
  {
    id: 9,
    author: '匿名',
    text: '漱石先生、二十歳のお誕生日を心よりお祝い申し上げます。先生のご健康とご多幸を祈っています。これからも名作を書き続けてください！吾輩は猫である、坊っちゃん、どちらも大好きです。本当におめでとうございます！',
    bgColor: 'white',
    bgStyle: 'line',
    font: 'noto-sans',
    createdAt: '2026-04-23T17:00:00Z',
  },
  {
    id: 10,
    author: '内田百閒',
    text: '20歳おめ！！',
    bgColor: 'purple',
    bgStyle: 'line',
    font: 'fude-ji',
    stamp: 'giorno',
    createdAt: '2026-04-23T18:00:00Z',
  },
  {
    id: 11,
    author: '芥川龍之介',
    text: 'お誕生日おめでとうございます。先生のご活躍をいつも陰ながら応援しています。',
    bgColor: 'beige',
    bgStyle: 'normal',
    font: 'noto-sans',
    stamp: 'kakyoin',
    createdAt: '2026-04-23T19:00:00Z',
  },
  {
    id: 12,
    author: '菅虎雄',
    text: 'ハッピーバースデー！！！',
    bgColor: 'white',
    bgStyle: 'normal',
    font: 'fude',
    createdAt: '2026-04-23T20:00:00Z',
  },
  {
    id: 13,
    author: '匿名',
    text: '先生、ご誕生日おめでとうございます。吾輩は猫である、拝読しました。笑いながら何度も読み返しています。これからも面白い作品をよろしくお願いします！！先生のような文章が書けるよう、私も精進いたします。',
    bgColor: 'purple',
    bgStyle: 'grid',
    font: 'tanuki',
    stamp: 'josuke',
    createdAt: '2026-04-23T21:00:00Z',
  },
  {
    id: 14,
    author: '橋口五葉',
    text: 'おめでとうございます。益々のご発展を。',
    bgColor: 'beige',
    bgStyle: 'line',
    font: 'fude-ji',
    stamp: 'anasui',
    createdAt: '2026-04-23T22:00:00Z',
  },
  {
    id: 15,
    author: '松根東洋城',
    text: 'ご誕生日おめでとう！',
    bgColor: 'white',
    bgStyle: 'grid',
    font: 'fude',
    stamp: 'bucciarati',
    createdAt: '2026-04-23T23:00:00Z',
  },
];

export const MOCK_COUNTER_COUNT = 777;
