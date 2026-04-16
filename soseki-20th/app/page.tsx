'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AgeVerificationGate from '@/components/AgeVerificationGate';
import NameInputModal, { Player } from '@/components/NameInputModal';
import GlobalHeader from '@/components/GlobalHeader';
import HeroSection from '@/components/HeroSection';
import VideoSection from '@/components/VideoSection';
import MessageSection from '@/components/MessageSection';
import MiniGameSection from '@/components/MiniGameSection';
import GachaSection from '@/components/GachaSection';
import FooterCounter from '@/components/FooterCounter';
import IntroOverlay from '@/components/IntroOverlay';
import { usePlayer } from '@/hooks/usePlayer';

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { player } = usePlayer(playerName);
  const [pastHero, setPastHero] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [playerName]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.section-reveal'));
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.45, rootMargin: '0px 0px -20% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [playerName]);

  const handleInit = useCallback((p: Player) => {
    setPlayerName(p.name);
    setShowIntro(true);
  }, []);

  return (
    <div className="min-h-screen text-white">
      {/* イントロオーバーレイ: ログイン完了後に毎回再生 */}
      {showIntro && (
        <IntroOverlay onDone={() => setShowIntro(false)} />
      )}

      <AgeVerificationGate>
        <NameInputModal onInit={handleInit} />
        {playerName && (
          <>
            <GlobalHeader coins={player?.coins ?? 0} debt={player?.debt ?? 0} visible={pastHero} />
            <main>
              <div ref={heroRef}>
                <HeroSection />
              </div>
              <VideoSection />
              <MessageSection />
              <MiniGameSection playerName={playerName} />
              <GachaSection playerName={playerName} />
            </main>
            <FooterCounter />
          </>
        )}
      </AgeVerificationGate>
    </div>
  );
}
