const CREDITS = [
  { role: "原案・サイト開発", names: ["マルハット"] },
  {
    role: "世界からのサプライズ動画支援部",
    names: ["肩幅", "からてん", "小滝えき", "むぷん", "SBG", "K", "マルハット"],
  },
  {
    role: "名言提供",
    names: ["ぬま", "らりほー", "トッテン", "肩幅", "しゆう", "マルハット"],
  },
  {
    role: "ミニゲーム制作協力",
    names: [
      "ANNA",
      "ぬま",
      "しゆう",
      "トッテン",
      "らりほー",
      "肩幅",
      "マルハット",
    ],
  },
  {
    role: "ガチャアイテム提供",
    names: [
      "しゆう",
      "帝王",
      "ぬま",
      "SBG",
      "トッテン",
      "ANNA",
      "K",
      "肩幅",
      "らりほー",
      "小滝えき",
      "オーガスト",
      "ねぎとろ",
      "からてん",
      "むぷん",
      "マルハット",
    ],
  },
  { role: "ガチャ演出提供", names: ["オーガスト"] },
  { role: "連帯保証人", names: ["肩幅", "食べろちゃん"] },
  { role: "バグ報告・アドバイス", names: ["小滝えき", "ANNA", "トッテン"] },
] as const;

export default function CreditsSection() {
  return (
    <section className="section-reveal section-padding" aria-labelledby="credits-section-heading">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— CREDITS</p>
      <h2
        id="credits-section-heading"
        className="mb-10 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        サイト作成協力者
      </h2>

      <dl className="space-y-6">
        {CREDITS.map(({ role, names }) => (
          <div key={role} className="flex flex-col gap-1 border-b border-edge pb-6 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
            <dt className="w-full shrink-0 font-mono text-[10px] tracking-[0.2em] text-accent/50 sm:w-48">
              {role}
            </dt>
            <dd className="flex flex-wrap items-center gap-x-1 text-sm text-stone-200">
              {names.map((name, i) => (
                <span key={name} className="flex items-center gap-x-1">
                  <span>{name}</span>
                  {i < names.length - 1 && (
                    <span className="text-accent/25 select-none">|</span>
                  )}
                </span>
              ))}
            </dd>
          </div>
        ))}

        <div className="pt-2">
          <dt className="sr-only">Special Thanks</dt>
          <dd className="font-mono text-xs tracking-widest text-stone-500">
            Special Thanks — ほか、遊んでくれた皆様
          </dd>
        </div>
      </dl>
    </section>
  );
}
