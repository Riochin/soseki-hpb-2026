import { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

/**
 * NameInputModal の各 UI 状態を表示するストーリー。
 * 内部 state を直接制御できないため、各状態の JSX を切り出して描画する。
 */

function SpinnerView() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="mb-8 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-yellow-400" />
      <p className="font-noto-serif-jp text-lg text-yellow-400">サーバー接続中{dots}</p>
      <p className="mt-2 text-sm text-zinc-500">初回起動に少々お時間がかかる場合があります。ぶっちゃけ俺悪くなくね！？</p>
    </div>
  );
}

function ModalView({
  loading = false,
  error = "",
}: {
  loading?: boolean;
  error?: string;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-sm border-2 border-yellow-400/30 bg-zinc-900 p-8">
        <h2 className="mb-2 text-center text-xl font-bold text-yellow-400">
          お名前を入力してください
        </h2>
        <p className="mb-6 text-center text-sm text-gray-400">
          名前はCreditやコレクションに紐付けられます
        </p>
        <form noValidate>
          <input
            type="text"
            defaultValue=""
            maxLength={50}
            placeholder="例: アクメ漱石ッズ"
            className="mb-3 w-full border-b-2 border-zinc-600 bg-transparent px-2 py-2 text-white placeholder-zinc-500 focus:border-yellow-400 focus:outline-none"
          />
          {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 py-2 font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "処理中..." : "決定"}
          </button>
        </form>
      </div>
    </div>
  );
}

const meta: Meta = {
  title: "Components/NameInputModal",
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj;

/** サーバー接続中のスピナー表示 */
export const Connecting: Story = {
  render: () => <SpinnerView />,
};

/** 名前入力フォーム（初期状態） */
export const Default: Story = {
  render: () => <ModalView />,
};

/** 送信中（ボタン無効化） */
export const Submitting: Story = {
  render: () => <ModalView loading />,
};

/** バリデーションエラー */
export const WithError: Story = {
  render: () => <ModalView error="エラーが発生しました: 接続できません" />,
};
