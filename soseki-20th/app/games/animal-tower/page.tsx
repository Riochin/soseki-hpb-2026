import { Suspense } from 'react';
import AnimalTowerGame from '@/components/games/AnimalTowerGame';

export default function AnimalTowerPage() {
  return (
    <Suspense>
      <AnimalTowerGame />
    </Suspense>
  );
}
