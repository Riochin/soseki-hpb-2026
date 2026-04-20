declare module 'poly-decomp' {
  const decomp: {
    quickDecomp: (polygon: number[][]) => number[][][];
    decomp: (polygon: number[][]) => number[][][];
    isSimple: (polygon: number[][]) => boolean;
    removeCollinearPoints: (polygon: number[][], threshold: number) => void;
    removeDuplicatePoints?: (polygon: number[][], threshold: number) => void;
    makeCCW: (polygon: number[][]) => void;
  };
  export default decomp;
}
