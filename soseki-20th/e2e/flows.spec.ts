import { test, expect, Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// API モックヘルパー
// ─────────────────────────────────────────────────────────────────────────────

const API_ORIGIN = 'http://localhost:8080';

/** モックプレイヤーデータ */
const MOCK_PLAYER = {
  name: 'テスト太郎',
  coins: 100,
  debt: 0,
  collection: [
    { itemId: 1, name: '伝説のメガネ', rarity: 'SSR', icon: '🕶️', acquired: false },
    { itemId: 2, name: '徹夜のコーヒー', rarity: 'N', icon: '☕', acquired: false },
    { itemId: 3, name: '黄金のキーボード', rarity: 'UR', icon: '⌨️', acquired: false },
    { itemId: 4, name: '謎の領収書', rarity: 'R', icon: '🧾', acquired: false },
  ],
};

/** モックメッセージ一覧 */
const MOCK_MESSAGES = [
  { id: 1, author: '先輩ファン', text: '漱石大好き！', createdAt: '2026-04-14T00:00:00Z' },
];

/** プレイヤー API をモックする */
async function mockPlayerAPI(page: Page, playerData = MOCK_PLAYER) {
  await page.route(`${API_ORIGIN}/api/players`, async (route) => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(playerData),
    });
  });
  await page.route(`${API_ORIGIN}/api/players/${encodeURIComponent(playerData.name)}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(playerData),
    });
  });
}

/** メッセージ API をモックする */
async function mockMessagesAPI(page: Page, messages = MOCK_MESSAGES) {
  await page.route(`${API_ORIGIN}/api/messages`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(messages),
      });
    } else {
      // POST: 新しいメッセージを返す
      const body = route.request().postDataJSON() as { author: string; text: string };
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          author: body.author,
          text: body.text,
          createdAt: new Date().toISOString(),
        }),
      });
    }
  });
}

/** カウンター API をモックする */
async function mockCounterAPI(page: Page, count = 42) {
  await page.route(`${API_ORIGIN}/api/counter`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ count }),
    });
  });
}

/** ガチャ API をモックする（コイン消費・アイテム取得） */
async function mockGachaAPI(page: Page) {
  await page.route(`${API_ORIGIN}/api/gacha`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        item: { itemId: 1, name: '伝説のメガネ', rarity: 'SSR', icon: '🕶️', acquired: true },
        isNew: true,
        newCoins: 0,
      }),
    });
  });
}

/** sessionStorage に age_verified=true をセットしてページを開く */
async function openAsVerified(page: Page) {
  // storageState で sessionStorage を直接設定はできないため、
  // まず init-storage ページ経由でセッションストレージを設定する
  await page.goto('/');
  await page.evaluate(() => {
    sessionStorage.setItem('age_verified', 'true');
  });
}

/** localStorage に playerName をセットする */
async function setPlayerName(page: Page, name: string) {
  await page.evaluate((n) => {
    localStorage.setItem('playerName', n);
  }, name);
}

// ─────────────────────────────────────────────────────────────────────────────
// テスト 1: 初回訪問フロー（年齢確認 → 名前入力 → コンテンツ表示）
// ─────────────────────────────────────────────────────────────────────────────

test.describe('初回訪問フロー', () => {
  test('年齢確認ゲートが表示され、「はい」をクリックすると名前入力モーダルが表示される', async ({ page }) => {
    // API モック設定（名前入力後のプレイヤー作成用）
    await mockPlayerAPI(page);
    await mockMessagesAPI(page);
    await mockCounterAPI(page);

    // ストレージをクリアして初回訪問状態にする
    await page.goto('/');
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    await page.reload();

    // 年齢確認ゲートが表示されること
    await expect(page.getByText('年齢確認')).toBeVisible();
    await expect(page.getByText('あなたは18歳以上ですか？')).toBeVisible();

    // 「はい」をクリック → 0.8秒グリッチ後に名前入力モーダルへ
    await page.getByRole('button', { name: 'はい' }).click();

    // 名前入力モーダルが表示されること
    await expect(page.getByText('お名前を入力してください')).toBeVisible({ timeout: 3000 });
  });

  test('名前を入力して決定するとメインコンテンツが表示される', async ({ page }) => {
    // API モック設定
    await mockPlayerAPI(page);
    await mockMessagesAPI(page);
    await mockCounterAPI(page);

    // age_verified を設定してからリロード（名前入力モーダルから開始）
    await openAsVerified(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 名前入力モーダルが表示されること
    await expect(page.getByPlaceholder('例: アクメ漱石ッズ')).toBeVisible({ timeout: 3000 });

    // 名前を入力して送信
    await page.getByPlaceholder('例: アクメ漱石ッズ').fill('テスト太郎');
    await page.getByRole('button', { name: '決定' }).click();

    // メインコンテンツ（ヒーローセクション）が表示されること
    await expect(page.getByText('HAPPY 20th', { exact: true })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('BIRTHDAY', { exact: true })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// テスト 2: メッセージ投稿フロー
// ─────────────────────────────────────────────────────────────────────────────

test.describe('メッセージ投稿フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 既訪問状態（age_verified + playerName セット済み）でページを開く
    await mockPlayerAPI(page);
    await mockMessagesAPI(page);
    await mockCounterAPI(page);

    await openAsVerified(page);
    await setPlayerName(page, 'テスト太郎');
    await page.reload();

    // メインコンテンツが表示されるまで待機
    await expect(page.getByText('HAPPY 20th', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('既存メッセージが一覧に表示される', async ({ page }) => {
    // モックで返した既存メッセージが表示されること
    await expect(page.getByText('先輩ファン')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('漱石大好き！')).toBeVisible();
  });

  test('「+ メッセージを書く」をクリックすると投稿フォームが表示される', async ({ page }) => {
    // メッセージセクションへスクロール
    const addButton = page.getByText('+ メッセージを書く');
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    // フォームが表示されること
    await expect(page.getByPlaceholder('お名前（省略可）')).toBeVisible({ timeout: 3000 });
    await expect(page.getByPlaceholder('漱石へのメッセージを書いてください')).toBeVisible();
  });

  test('フォームに入力して送信するとメッセージが一覧に追加される', async ({ page }) => {
    // フォームを開く
    const addButton = page.getByText('+ メッセージを書く');
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    // フォーム入力
    await page.getByPlaceholder('お名前（省略可）').fill('テスト太郎');
    await page.getByPlaceholder('漱石へのメッセージを書いてください').fill('誕生日おめでとう！');

    // 送信
    await page.getByRole('button', { name: '送信' }).click();

    // フォームが閉じられた後、新しいメッセージがカード一覧に表示されること
    await expect(page.getByRole('textbox', { name: '本文' })).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.getByRole('paragraph').filter({ hasText: '誕生日おめでとう！' }).first(),
    ).toBeVisible();
  });

  test('本文が空欄のまま送信するとバリデーションエラーが表示される', async ({ page }) => {
    const addButton = page.getByText('+ メッセージを書く');
    await addButton.scrollIntoViewIfNeeded();
    await addButton.click();

    // 本文を空欄のまま送信
    await page.getByPlaceholder('お名前（省略可）').fill('テスト太郎');
    await page.getByRole('button', { name: '送信' }).click();

    // バリデーションエラーが表示されること
    await expect(page.getByText('本文を入力してください')).toBeVisible({ timeout: 2000 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// テスト 3: ガチャフロー（コイン消費 → 演出 → コレクション反映）
// ─────────────────────────────────────────────────────────────────────────────

test.describe('ガチャフロー', () => {
  test.beforeEach(async ({ page }) => {
    await mockPlayerAPI(page);
    await mockMessagesAPI(page);
    await mockCounterAPI(page);
    await mockGachaAPI(page);

    await openAsVerified(page);
    await setPlayerName(page, 'テスト太郎');
    await page.reload();

    await expect(page.getByText('HAPPY 20th', { exact: true })).toBeVisible({ timeout: 5000 });
  });

  test('ヘッダーにクレ残高が表示される', async ({ page }) => {
    // GlobalHeader にクレ残高（1クレ）が表示されること
    await expect(page.locator('header').getByText('1', { exact: true })).toBeVisible({ timeout: 3000 });
  });

  test('「1回まわす」ボタンをクリックするとガチャ演出が実行される', async ({ page }) => {
    // ガチャ実行後にコイン消費でプレイヤーデータが更新される（newCoins=0）
    const updatedPlayer = { ...MOCK_PLAYER, coins: 0, collection: [
      { itemId: 1, name: '伝説のメガネ', rarity: 'SSR', icon: '🕶️', acquired: true },
      { itemId: 2, name: '徹夜のコーヒー', rarity: 'N', icon: '☕', acquired: false },
      { itemId: 3, name: '黄金のキーボード', rarity: 'UR', icon: '⌨️', acquired: false },
      { itemId: 4, name: '謎の領収書', rarity: 'R', icon: '🧾', acquired: false },
    ]};
    // ガチャ後の GET /api/players/:name を更新データで返すよう再モック
    await page.route(
      `http://localhost:8080/api/players/${encodeURIComponent('テスト太郎')}`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updatedPlayer),
        });
      },
    );

    // ガチャセクションへスクロール
    const gachaButton = page.getByRole('button', { name: /1回まわす/ });
    await gachaButton.scrollIntoViewIfNeeded();
    await gachaButton.click();

    // ガチャ結果メッセージが表示されること
    await expect(page.getByText('伝説のメガネ')).toBeVisible({ timeout: 5000 });
  });

  test('Credit不足時にメッセージが表示される', async ({ page }) => {
    // Credit 0 のプレイヤーでモック
    const brokePlayer = { ...MOCK_PLAYER, coins: 0 };
    await page.route(`http://localhost:8080/api/players`, async (route) => {
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(brokePlayer) });
    });
    await page.route(
      `http://localhost:8080/api/players/${encodeURIComponent('テスト太郎')}`,
      async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(brokePlayer) });
      },
    );
    await page.reload();
    await expect(page.getByText('HAPPY 20th', { exact: true })).toBeVisible({ timeout: 5000 });

    const gachaButton = page.getByRole('button', { name: /1回まわす/ });
    await gachaButton.scrollIntoViewIfNeeded();
    await gachaButton.click();

    // コイン不足メッセージが表示されること
    await expect(page.getByText('コインが不足しています')).toBeVisible({ timeout: 3000 });
  });
});
