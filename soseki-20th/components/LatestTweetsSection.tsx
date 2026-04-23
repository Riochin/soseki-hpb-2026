'use client';

import { useCallback, useEffect, useState } from 'react';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

interface TweetItem {
  id: string;
  url: string;
}

interface LatestTweetsResponse {
  enabled: boolean;
  tweets: TweetItem[];
}

export default function LatestTweetsSection() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [tweets, setTweets] = useState<TweetItem[]>([]);

  const loadTweets = useCallback(async () => {
    try {
      const response = await fetch('/api/x/latest', { cache: 'no-store' });
      if (!response.ok) {
        setEnabled(false);
        return;
      }
      const payload = (await response.json()) as LatestTweetsResponse;
      setEnabled(payload.enabled);
      setTweets(payload.tweets ?? []);
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => {
    loadTweets();
    const timer = setInterval(loadTweets, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [loadTweets]);

  if (!enabled || tweets.length === 0) return null;

  return (
    <section className="section-padding is-visible" aria-labelledby="latest-tweets-heading">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— SHARE & PICKUP</p>
      <h2
        id="latest-tweets-heading"
        className="mb-6 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        ハッシュタグで参加しよう
      </h2>
      <p className="mb-4 text-sm text-stone-300">
        ハッシュタグ
        <a
          href="https://x.com/search?q=%23%E3%82%A2%E3%82%AF%E3%83%A1%E6%BC%B1%E7%9F%B3%E7%94%9F%E8%AA%95%E7%A5%AD2026&src=typed_query&f=live"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-1 font-bold text-accent underline-offset-2 hover:underline"
        >
          #アクメ漱石生誕祭2026
        </a>
        の投稿を表示しています。
      </p>
      <div className="mx-2 rounded-panel border-2 border-edge bg-background p-0 sm:mx-0">
        <div className="mx-auto h-[50vh] w-[70vw] min-w-[260px] max-w-[560px] overflow-y-auto">
          <div className="space-y-3">
          {tweets.map((tweet) => (
            <article key={tweet.id}>
              <iframe
                title={`tweet-${tweet.id}`}
                src={`https://platform.twitter.com/embed/Tweet.html?id=${tweet.id}&theme=dark&dnt=true`}
                className="h-[420px] w-full overflow-hidden border-0"
                loading="lazy"
                scrolling="no"
              />
            </article>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
}
