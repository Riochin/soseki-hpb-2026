'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useSosekiName } from '@/hooks/useU18Mode';

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

const PERSONAL_TWEET_URL = 'https://twitter.com/Asou999/status/2046967363195814110';

export default function PersonalTweetSection() {
  const sosekiName = useSosekiName();
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && window.twttr?.widgets?.load) {
      window.twttr.widgets.load(embedRef.current);
    }
  }, []);

  return (
    <section className="section-reveal section-padding" aria-labelledby="personal-tweet-heading">
      <p className="mb-4 font-mono text-xs tracking-widest text-accent/60">— SOSEKI TWEET</p>
      <h2
        id="personal-tweet-heading"
        className="mb-6 text-xl font-black tracking-tight text-white md:text-3xl"
        style={{ fontFamily: 'var(--font-noto-serif-jp), serif' }}
      >
        {sosekiName}のツイート
      </h2>

      <div ref={embedRef} className="mx-auto w-full max-w-[420px] origin-top scale-95 overflow-hidden">
        <blockquote className="twitter-tweet" data-theme="dark" data-dnt="true" data-width="420">
          <a href={PERSONAL_TWEET_URL}>本人の告知投稿</a>
        </blockquote>
      </div>

      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => {
          if (embedRef.current && window.twttr?.widgets?.load) {
            window.twttr.widgets.load(embedRef.current);
          }
        }}
      />
    </section>
  );
}
