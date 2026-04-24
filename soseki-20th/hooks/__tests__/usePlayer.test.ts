import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayer } from '@/hooks/usePlayer';

const mockMutate = vi.fn();

vi.mock('swr', () => ({
  default: vi.fn(() => ({
    data: { name: 'テスト', coins: 200, debt: 0, collection: [] },
    error: null,
    isLoading: false,
    mutate: mockMutate,
  })),
}));

const mockPlayer = { name: 'テスト', coins: 200, debt: 0, collection: [] };

function mockFetchOk(body: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  });
}

function mockFetchError(status: number, message: string) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => message,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  mockMutate.mockResolvedValue(undefined);
});

describe('usePlayer: 基本データ', () => {
  it('player データを返す', () => {
    const { result } = renderHook(() => usePlayer('テスト'));
    expect(result.current.player).toEqual(mockPlayer);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('name が null のとき player は null', async () => {
    const swr = await import('swr');
    vi.mocked(swr.default).mockReturnValueOnce({
      data: undefined,
      error: null,
      isLoading: false,
      mutate: mockMutate,
    } as never);

    const { result } = renderHook(() => usePlayer(null));
    expect(result.current.player).toBeNull();
  });
});

describe('usePlayer: spinGacha', () => {
  it('POST /api/gacha を正しいリクエストボディで呼び出す', async () => {
    const gachaResult = { item: { itemId: 1, name: 'test', rarity: 'N', icon: '🎯', acquired: true }, isNew: false, newCoins: 100 };
    mockFetchOk(gachaResult);

    const { result } = renderHook(() => usePlayer('テスト'));

    let returnValue: Awaited<ReturnType<typeof result.current.spinGacha>> | undefined;
    await act(async () => {
      returnValue = await result.current.spinGacha();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/gacha'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ player_name: 'テスト' }),
      }),
    );
    expect(returnValue?.isNew).toBe(false);
    expect(returnValue?.newCoins).toBe(100);
    expect(mockMutate).toHaveBeenCalled();
  });

  it('API エラー時は Error をスローする', async () => {
    mockFetchError(402, 'コイン不足');

    const { result } = renderHook(() => usePlayer('テスト'));

    await expect(
      act(async () => {
        await result.current.spinGacha();
      }),
    ).rejects.toThrow('API error 402');
  });

  it('name が null のとき Error をスローする', async () => {
    const { result } = renderHook(() => usePlayer(null));
    await expect(act(() => result.current.spinGacha())).rejects.toThrow('プレイヤー名が未設定です');
  });
});

describe('usePlayer: borrowCoins', () => {
  it('POST /api/players/:name/borrow を呼び出す', async () => {
    mockFetchOk({ coins: 300, debt: 100 });

    const { result } = renderHook(() => usePlayer('テスト'));

    await act(async () => {
      await result.current.borrowCoins(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/players/%E3%83%86%E3%82%B9%E3%83%88/borrow'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ amount: 1 }),
      }),
    );
    expect(mockMutate).toHaveBeenCalled();
  });

  it('name が null のとき Error をスローする', async () => {
    const { result } = renderHook(() => usePlayer(null));
    await expect(act(() => result.current.borrowCoins(1))).rejects.toThrow('プレイヤー名が未設定です');
  });
});

describe('usePlayer: earnCoins', () => {
  it('POST /api/players/:name/game-reward を呼び出す', async () => {
    const earnResult = { coinsEarned: 500, newCoins: 700, resultId: 42 };
    mockFetchOk(earnResult);

    const { result } = renderHook(() => usePlayer('テスト'));

    let returned: Awaited<ReturnType<typeof result.current.earnCoins>> | undefined;
    await act(async () => {
      returned = await result.current.earnCoins('typing', { score: 9999 }, 'session-abc');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game-reward'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ gameType: 'typing', score: 9999, sessionId: 'session-abc' }),
      }),
    );
    expect(returned?.coinsEarned).toBe(500);
    expect(mockMutate).toHaveBeenCalled();
  });
});

describe('usePlayer: consumeItem', () => {
  it('POST /api/players/:name/items/:id/consume を呼び出す', async () => {
    mockFetchOk({ consumed: true });

    const { result } = renderHook(() => usePlayer('テスト'));

    await act(async () => {
      await result.current.consumeItem(3);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/3/consume'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(mockMutate).toHaveBeenCalled();
  });

  it('name が null のとき Error をスローする', async () => {
    const { result } = renderHook(() => usePlayer(null));
    await expect(act(() => result.current.consumeItem(1))).rejects.toThrow('プレイヤー名が未設定です');
  });
});
