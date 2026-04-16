'use client';

import { useState, useEffect, useRef } from 'react';
import AgeVerificationGate from '@/components/AgeVerificationGate';
import NameInputModal, { Player } from '@/components/NameInputModal';
import GlobalHeader from '@/components/GlobalHeader';
import HeroSection from '@/components/HeroSection';
import VideoSection from '@/components/VideoSection';
import MessageSection from '@/components/MessageSection';
import MiniGameSection from '@/components/MiniGameSection';
import GachaSection from '@/components/GachaSection';
import FooterCounter from '@/components/FooterCounter';
import { usePlayer } from '@/hooks/usePlayer';

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { player } = usePlayer(playerName);
  const [pastHero, setPastHero] = useState(false);
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

  function handleInit(p: Player) {
    setPlayerName(p.name);
  }

  return (
    <div className="min-h-screen text-white">
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
