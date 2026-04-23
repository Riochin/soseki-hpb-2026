export default function HashtagSection() {
  return (
    <section className="section-reveal section-padding" aria-labelledby="hashtag-section-heading">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— SHARE</p>
      <h2
        id="hashtag-section-heading"
        className="mb-6 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        ハッシュタグで参加しよう
      </h2>

      <p className="mb-3 text-sm text-stone-300">
        投稿するときは
        <span className="mx-1 font-bold text-accent">#アクメ漱石生誕祭2026</span>
        をつけてください。
      </p>
    </section>
  );
}
