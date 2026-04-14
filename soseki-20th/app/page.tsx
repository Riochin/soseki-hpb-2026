'use client';

import { useState } from 'react';
import AgeVerificationGate from '@/components/AgeVerificationGate';
import NameInputModal, { Player } from '@/components/NameInputModal';
import GlobalHeader from '@/components/GlobalHeader';
import HeroSection from '@/components/HeroSection';
import MessageSection from '@/components/MessageSection';
import MiniGameSection from '@/components/MiniGameSection';
import GachaSection from '@/components/GachaSection';
import FooterCounter from '@/components/FooterCounter';
import { usePlayer } from '@/hooks/usePlayer';

export default function Home() {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const { player } = usePlayer(playerName);

  function handleInit(p: Player) {
    setPlayerName(p.name);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <AgeVerificationGate>
        <NameInputModal onInit={handleInit} />
        {playerName && (
          <>
            <GlobalHeader coins={player?.coins ?? 0} debt={player?.debt ?? 0} />
            <main>
              <HeroSection />
              <MessageSection />
              <MiniGameSection />
              <GachaSection playerName={playerName} />
            </main>
            <FooterCounter />
          </>
        )}
      </AgeVerificationGate>
    </div>
  );
}
