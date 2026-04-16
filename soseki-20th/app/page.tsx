'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
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

const INTRO_DURATION = 4000;

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
    setTimeout(() => setShowIntro(false), INTRO_DURATION);
  }, []);

  return (
    <div className="min-h-screen text-white">
      {/* イントロオーバーレイ: ログイン完了後に毎回再生 */}
      {showIntro && (
        <div className="animate-intro-overlay fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-black">
          <div className="animate-intro-image relative w-64 sm:w-80 md:w-96">
            <Image
              src="/yoyu2024.png"
              alt="yoyu2024"
              width={400}
              height={400}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
          <p
            className="animate-intro-image text-4xl tracking-widest text-amber-100 sm:text-5xl md:text-6xl"
            style={{ fontFamily: "var(--font-yuji-syuku), serif" }}
          >
            まあ、余裕っすね
          </p>
        </div>
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
