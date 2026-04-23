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
import LatestTweetsSection from '@/components/LatestTweetsSection';
import PersonalTweetSection from '@/components/PersonalTweetSection';
import CreditsSection from '@/components/CreditsSection';
import FooterCounter from '@/components/FooterCounter';
import IntroOverlay from '@/components/IntroOverlay';
import { usePlayer } from '@/hooks/usePlayer';

const EVENT_DATE_JST = '2026-04-23';
const CONFETTI_CONTAINER_ID = 'site-confetti-particles';

function isTodayEventJst() {
  const todayJst = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return todayJst === EVENT_DATE_JST;
}

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { player } = usePlayer(playerName);
  const [pastHero, setPastHero] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isEventDay, setIsEventDay] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const urAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    setIsEventDay(isTodayEventJst());
  }, []);

  useEffect(() => {
    if (!isEventDay) return;

    let cancelled = false;

    const initParticles = async () => {
      await import('particles.js');
      if (cancelled || !window.particlesJS) return;
      window.particlesJS(CONFETTI_CONTAINER_ID, {
        particles: {
          number: { value: 26, density: { enable: true, value_area: 900 } },
          color: { value: ['#facc15', '#f87171', '#c084fc', '#34d399'] },
          shape: { type: 'edge' },
          opacity: { value: 0.28, random: true },
          size: { value: 3, random: true },
          line_linked: { enable: false },
          move: {
            enable: true,
            speed: 2.2,
            direction: 'bottom',
            random: true,
            straight: false,
            out_mode: 'out',
            bounce: false,
          },
        },
        interactivity: {
          detect_on: 'canvas',
          events: {
            onhover: { enable: false, mode: 'repulse' },
            onclick: { enable: false, mode: 'push' },
            resize: true,
          },
        },
        retina_detect: true,
      });
    };

    initParticles().catch(() => {});

    return () => {
      cancelled = true;
      if (window.pJSDom?.length) {
        window.pJSDom.forEach((instance) => instance.pJS.fn.vendors.destroypJS());
        window.pJSDom = [];
      }
      const node = document.getElementById(CONFETTI_CONTAINER_ID);
      if (node) node.innerHTML = '';
    };
  }, [isEventDay]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = 0.2;
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

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      // ミュート解除時に urAudio をunlockしてAutoplay制限を回避
      if (prev && urAudioRef.current) {
        urAudioRef.current.play().then(() => urAudioRef.current?.pause()).catch(() => {});
      }
      return !prev;
    });
  }, []);

  const handleInit = useCallback((p: Player) => {
    setPlayerName(p.name);
    setShowIntro(true);
  }, []);

  return (
    <div className="relative min-h-screen text-white">
      {isEventDay && (
        <div
          id={CONFETTI_CONTAINER_ID}
          className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
          aria-hidden="true"
          data-testid="site-confetti"
        />
      )}
      <div className="relative z-10">
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
                  <HeroSection isMuted={isMuted} onToggleMute={handleToggleMute} isEventDay={isEventDay} />
                </div>
                <VideoSection />
                <OverviewSection />
                <MessageSection playerName={playerName} />
                <MiniGameSection playerName={playerName} />
                <GachaSection playerName={playerName} onUrStart={handleUrStart} onUrEnd={handleUrEnd} />
                <PersonalTweetSection />
              <LatestTweetsSection />
                <CreditsSection />
              </main>
              <FooterCounter />
            </>
          )}
        </AgeVerificationGate>
      </div>
    </div>
  );
}
