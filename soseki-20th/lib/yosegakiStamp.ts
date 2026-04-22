import type { Stamp } from '@/hooks/useMessages';

const STAMP_IMAGE_FILE: Record<Stamp, string> = {
  dio: 'dio-brando',
  joseph: 'joseph',
  jotaro: 'jotaro',
  kakyoin: 'kakyoin',
  DIO: 'dio',
  josuke: 'josuke',
  rohan: 'rohan',
  bucciarati: 'bucha',
  giorno: 'jorno',
  diavolo: 'diabolo',
  jolyne: 'jorine',
  anasui: 'annasui',
};

export function getStampImagePath(stamp: Stamp): string {
  return `/yosegaki/stamps/${STAMP_IMAGE_FILE[stamp]}.png`;
}
