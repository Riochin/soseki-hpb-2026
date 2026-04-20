'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AgeVerificationGate from '@/components/AgeVerificationGate';
import NameInputModal, { Player } from '@/components/NameInputModal';
import GlobalHeader from '@/components/GlobalHeader';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import HeroSection from '@/components/HeroSection';
import VideoSection from '@/components/VideoSection';
import OverviewSection from '@/components/OverviewSection';
import MessageSection from '@/components/MessageSection';
import MiniGameSection from '@/components/MiniGameSection';
import GachaSection from '@/components/GachaSection';
import CreditsSection from '@/components/CreditsSection';
import FooterCounter from '@/components/FooterCounter';
import IntroOverlay from '@/components/IntroOverlay';
import { usePlayer } from '@/hooks/usePlayer';

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { player } = usePlayer(playerName);
  const [pastHero, setPastHero] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const urAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.15;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [isMuted]);

  const handleUrStart = useCallback(() => {
    if (isMuted) return;
    audioRef.current?.pause();
    const urAudio = urAudioRef.current;
    if (urAudio) {
      urAudio.currentTime = 0;
      urAudio.play().catch(() => {});
    }
  }, [isMuted]);

  const handleUrEnd = useCallback(() => {
    const urAudio = urAudioRef.current;
    if (urAudio) {
      urAudio.pause();
      urAudio.currentTime = 0;
    }
    if (!isMuted) {
      audioRef.current?.play().catch(() => {});
    }
  }, [isMuted]);

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
      { threshold: 0.1, rootMargin: '0px 0px -5% 0px' }
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
      <audio ref={audioRef} src="/musics/krasnoshchok-happy-birthday-404431.mp3" loop />
      <audio ref={urAudioRef} src="/musics/ur-confirmed.mp3" />
      {/* イントロオーバーレイ: ログイン完了後に毎回再生 */}
      {showIntro && (
        <IntroOverlay onDone={() => setShowIntro(false)} />
      )}

      <AgeVerificationGate>
        <NameInputModal onInit={handleInit} />
        {playerName && (
          <>
            <GlobalHeader coins={player?.coins ?? 0} debt={player?.debt ?? 0} visible={pastHero} />
            <ScrollToTopButton visible={pastHero} />
            <main>
              <div ref={heroRef}>
                <HeroSection isMuted={isMuted} onToggleMute={() => setIsMuted((v) => !v)} />
              </div>
              <VideoSection />
              <OverviewSection />
              <MessageSection playerName={playerName} />
              <MiniGameSection playerName={playerName} />
              <GachaSection playerName={playerName} onUrStart={handleUrStart} onUrEnd={handleUrEnd} />
              <CreditsSection />
            </main>
            <FooterCounter />
          </>
        )}
      </AgeVerificationGate>
    </div>
  );
}
