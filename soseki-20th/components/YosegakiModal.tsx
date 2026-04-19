"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import ModalFrame from "@/components/ModalFrame";
import type {
  BgColor,
  BgStyle,
  CardFont,
  Stamp,
  PostMessageInput,
} from "@/hooks/useMessages";

interface Props {
  onClose: () => void;
  onSubmit: (input: PostMessageInput) => Promise<void>;
}

const BG_COLORS: { value: BgColor; bg: string; ring: string }[] = [
  { value: "white", bg: "bg-white", ring: "ring-stone-400" },
  { value: "beige", bg: "bg-amber-100", ring: "ring-amber-400" },
  { value: "purple", bg: "bg-purple-200", ring: "ring-purple-400" },
];

const BG_STYLES: { value: BgStyle; label: string }[] = [
  { value: "normal", label: "無地" },
  { value: "line", label: "罫線" },
  { value: "grid", label: "方眼" },
];

const FONTS: { value: CardFont; label: string }[] = [
  { value: "noto-sans", label: "NotoSans" },
  { value: "tanuki", label: "たぬき油性マジック" },
  { value: "fude-ji", label: "ふい字" },
  { value: "fude", label: "筆書き" },
];

const STAMPS: { value: Stamp; label: string }[] = [
  { value: "dio", label: "ディオ" },
  { value: "joseph", label: "ジョセフ" },
  { value: "jotaro", label: "承太郎" },
  { value: "kakyoin", label: "花京院" },
  { value: "DIO", label: "DIO" },
  { value: "josuke", label: "仗助" },
  { value: "rohan", label: "露伴" },
  { value: "bucciarati", label: "ブチャラティ" },
  { value: "giorno", label: "ジョルノ" },
  { value: "diavolo", label: "ディアボロ" },
  { value: "jolyne", label: "徐倫" },
  { value: "anasui", label: "アナスイ" },
];

const FONT_FAMILY: Record<CardFont, string> = {
  "noto-sans": "var(--font-noto-sans-jp), sans-serif",
  tanuki: "var(--font-tanuki), sans-serif",
  "fude-ji": "var(--font-fude-ji), sans-serif",
  fude: "var(--font-yuji-syuku), serif",
};

const TEXT_COLOR: Record<BgColor, string> = {
  white: "text-stone-800",
  beige: "text-stone-700",
  purple: "text-stone-800",
};

const AUTHOR_COLOR: Record<BgColor, string> = {
  white: "text-stone-500",
  beige: "text-amber-700",
  purple: "text-purple-700",
};

const MAX_MESSAGE_LENGTH = 140;

function getPreviewSizeClass(text: string): string {
  const lines = (text.match(/\n/g) ?? []).length + 1;
  const effective = Math.max(text.length, lines * 25);
  if (effective <= 15) return 'text-xl leading-snug';
  if (effective <= 30) return 'text-base leading-snug';
  if (effective <= 50) return 'text-sm leading-relaxed';
  if (effective <= 80) return 'text-xs leading-relaxed';
  return 'text-[9px] leading-tight';
}

function bgImagePath(color: BgColor, style: BgStyle): string {
  return `/yosegaki/${color}${style === "normal" ? "" : `-${style}`}.png`;
}


export default function YosegakiModal({ onClose, onSubmit }: Props) {
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState<BgColor>("white");
  const [bgStyle, setBgStyle] = useState<BgStyle>("normal");
  const [font, setFont] = useState<CardFont>("noto-sans");
  const [stamp, setStamp] = useState<Stamp | "">("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("本文を入力してください");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({
        author: author.trim() || "匿名",
        text: text.trim(),
        bgColor,
        bgStyle,
        font,
        stamp: stamp || undefined,
      });
      onClose();
    } catch (err) {
      setError(
        `エラー: ${err instanceof Error ? err.message : "送信に失敗しました"}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalFrame
      onBackdropClick={onClose}
      maxWidthClass="max-w-xl w-full"
      overlayVariant="heavy"
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b-2 border-edge px-5 py-3">
        <h2
          className="text-sm font-bold text-white"
          style={{ fontFamily: "var(--font-noto-serif-jp), serif" }}
        >
          漱石へのメッセージを書く
        </h2>
        <button
          onClick={onClose}
          className="rounded-control p-1 text-stone-400 hover:text-white"
          aria-label="閉じる"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3 p-5">
          {/* プレビュー行: 左マージン・カード・右マージン */}
          <div className="flex items-center justify-center gap-3">
            {/* 左: 色スウォッチ + フォント */}
            <div className="flex w-14 flex-col items-center gap-2">
              <p className="text-[8px] text-stone-600 tracking-wider">色</p>
              {BG_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setBgColor(c.value)}
                  className={`h-5 w-5 rounded-full border border-stone-400/40 transition-all ${c.bg} ${
                    bgColor === c.value
                      ? `ring-2 ring-offset-2 ring-offset-panel ${c.ring}`
                      : "opacity-70 hover:opacity-100"
                  }`}
                  aria-label={c.value}
                />
              ))}
              <div className="my-0.5 w-full border-t border-stone-700" />
              <p className="text-[8px] text-stone-600 tracking-wider">
                フォント
              </p>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value as CardFont)}
                className="w-full rounded border border-edge bg-panel px-1 py-1 text-[8px] text-white focus:border-accent focus:outline-none appearance-none cursor-pointer"
                style={{ fontFamily: FONT_FAMILY[font] }}
              >
                {FONTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* プレビューカード */}
            <div
              className="relative h-[160px] w-[160px] shrink-0 rounded-sm border border-stone-300/30 p-4 shadow-[2px_4px_12px_rgba(0,0,0,0.35)] overflow-hidden"
              style={{
                backgroundImage: `url(${bgImagePath(bgColor, bgStyle)})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                fontFamily: FONT_FAMILY[font],
              }}
            >
              <p className={`whitespace-pre-wrap break-words ${getPreviewSizeClass(text.trim())} ${TEXT_COLOR[bgColor]}`}>
                {text.trim() || "メッセージのプレビュー"}
              </p>
              <p
                className={`absolute bottom-3 left-3 text-[10px] ${AUTHOR_COLOR[bgColor]}`}
              >
                — {author.trim() || "匿名"}
              </p>
              {stamp && (
                <div className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[8px] text-stone-700 shadow-sm backdrop-blur-sm leading-tight text-center">
                  {STAMPS.find((s) => s.value === stamp)?.label}
                </div>
              )}
            </div>

            {/* 右: スタイル + スタンプ */}
            <div className="flex w-14 flex-col items-center gap-2">
              <p className="text-[8px] text-stone-600 tracking-wider">
                スタイル
              </p>
              {BG_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setBgStyle(s.value)}
                  className={`w-full rounded px-1 py-0.5 text-[9px] transition-colors ${
                    bgStyle === s.value
                      ? "bg-accent/20 text-accent"
                      : "text-stone-500 hover:text-stone-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
              <div className="my-0.5 w-full border-t border-stone-700" />
              <p className="text-[8px] text-stone-600 tracking-wider">
                スタンプ
              </p>
              <select
                value={stamp}
                onChange={(e) => setStamp(e.target.value as Stamp | "")}
                className="w-full rounded border border-edge bg-panel px-1 py-1 text-[8px] text-white focus:border-accent focus:outline-none appearance-none cursor-pointer"
              >
                <option value="">なし</option>
                {STAMPS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* お名前 */}
          <div>
            <label
              className="mb-1 block text-[10px] text-stone-400"
              htmlFor="yosegaki-author"
            >
              お名前（任意）
            </label>
            <input
              id="yosegaki-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="省略時: 匿名"
              maxLength={50}
              className="w-full rounded-control border-b-2 border-edge bg-transparent px-2 py-1.5 text-xs text-white placeholder-stone-600 focus:border-accent focus:outline-none"
            />
          </div>

          {/* メッセージ */}
          <div>
            <label
              className="mb-1 block text-[10px] text-stone-400"
              htmlFor="yosegaki-text"
            >
              メッセージ <span className="text-red-400">*</span>
            </label>
            <textarea
              id="yosegaki-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="漱石へのメッセージを書いてください"
              maxLength={MAX_MESSAGE_LENGTH}
              rows={3}
              className="w-full rounded-control border-b-2 border-edge bg-transparent px-2 py-1.5 text-xs leading-snug text-white placeholder-stone-600 focus:border-accent focus:outline-none resize-none"
            />
            <p className="text-right text-[10px] text-stone-600">
              {text.length} / {MAX_MESSAGE_LENGTH}
            </p>
          </div>
        </div>

        {error && <p className="px-5 pb-2 text-xs text-red-400">{error}</p>}

        {/* フッター */}
        <div className="flex gap-3 border-t-2 border-edge px-5 py-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-control bg-accent py-2 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-control border-2 border-stone-600 px-5 py-2 text-sm text-stone-400 transition-colors hover:bg-video-back"
          >
            キャンセル
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}
