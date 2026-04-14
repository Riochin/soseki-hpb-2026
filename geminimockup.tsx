import React, { useState, useEffect } from 'react';
import { Play, MessageCircle, Gamepad2, Sparkles, Coins, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function App() {
  // 年齢確認（サイト入場）の状態
  const [isVerified, setIsVerified] = useState(false);
  // グリッチエフェクト用の状態
  const [showGlitch, setShowGlitch] = useState(false);

  // モック用の状態管理
  const [coins, setCoins] = useState(150);
  const [debt, setDebt] = useState(0);

  // モックデータ
  const messages = [
    { id: 1, author: 'Kくん', text: '二十歳おめでとう！動画見てくれた？最高の1年にしようぜ！' },
    { id: 2, author: 'Aちゃん', text: 'ついに迎えた4月23日！またみんなで集まろうね！' },
    { id: 3, author: '名無し', text: '借金しすぎないように気をつけろよな！おめ！' },
  ];

  const collections = [
    { id: 1, name: '伝説のメガネ', rarity: 'SSR', acquired: true, icon: '👓' },
    { id: 2, name: '徹夜のコーヒー', rarity: 'N', acquired: true, icon: '☕' },
    { id: 3, name: '黄金のキーボード', rarity: 'UR', acquired: false, icon: '⌨️' },
    { id: 4, name: '謎の領収書', rarity: 'R', acquired: false, icon: '🧾' },
  ];

  const handleVerify = () => {
    setShowGlitch(true);
    setTimeout(() => {
      setIsVerified(true);
      setShowGlitch(false);
    }, 800); // 0.8秒間グリッチエフェクトを見せてから入場
  };

  // --- 年齢確認オーバーレイ ---
  if (!isVerified) {
    return (
      <div className={`min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center font-sans ${showGlitch ? 'animate-glitch' : ''}`}>
        <div className="border-4 border-red-600 p-8 max-w-sm w-full bg-neutral-900 rounded-lg shadow-[0_0_50px_rgba(220,38,38,0.3)]">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-extrabold text-red-500 mb-2 tracking-widest">WARNING</h1>
          <p className="text-white font-bold mb-6 text-lg">
            あなたは20歳以上、<br/>
            または「漱石」本人ですか？
          </p>
          <p className="text-neutral-400 text-xs mb-8">
            ※当サイトには飲酒・借金・過度なガチャなどの成人向けコンテンツが含まれている可能性があります。
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleVerify}
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xl rounded transition-colors"
            >
              はい (ENTER)
            </button>
            <button 
              onClick={() => alert('10年後に出直してこい！')}
              className="w-full py-3 bg-neutral-800 text-neutral-500 font-bold rounded hover:bg-neutral-700 transition-colors"
            >
              いいえ (LEAVE)
            </button>
          </div>
        </div>
        
        {/* グリッチ用CSS */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes glitch {
            0% { transform: translate(0) }
            20% { transform: translate(-5px, 5px) }
            40% { transform: translate(-5px, -5px) }
            60% { transform: translate(5px, 5px) }
            80% { transform: translate(5px, -5px) }
            100% { transform: translate(0) }
          }
          .animate-glitch {
            animation: glitch 0.1s infinite;
            filter: invert(1) hue-rotate(180deg);
          }
        `}} />
      </div>
    );
  }

  // --- メイン画面 ---
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans pb-10">
      
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-neutral-900/90 backdrop-blur-md z-50 border-b border-neutral-800">
        <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
          <div className="font-bold text-yellow-400 tracking-wider">SOSEKI 20th</div>
          <div className="flex gap-4 text-sm font-bold">
            <div className="flex items-center gap-1 text-yellow-400">
              <Coins size={16} />
              <span>{coins}</span>
            </div>
            {debt > 0 && (
              <div className="flex items-center gap-1 text-red-400">
                <AlertTriangle size={16} />
                <span>-{debt}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* ティッカー（流れるお知らせ） */}
        <div className="bg-yellow-400 text-black font-bold text-xs py-1 overflow-hidden whitespace-nowrap border-b border-yellow-500">
          <div className="animate-ticker inline-block">
            <span className="mx-4">【速報】漱石氏、ついに20歳到達。酒類・タバコの解禁が承認されました。</span>
            <span className="mx-4">◆</span>
            <span className="mx-4">【警告】名無しさんの借金が1000コインを突破しました。ご利用は計画的に。</span>
            <span className="mx-4">◆</span>
            <span className="mx-4">【ピックアップガチャ】UR『黄金のキーボード』排出率UP中！</span>
            <span className="mx-4">◆</span>
            <span className="mx-4">【速報】漱石氏、ついに20歳到達。酒類・タバコの解禁が承認されました。（ループ）</span>
          </div>
        </div>
      </header>

      {/* ヘッダー＋ティッカー分の余白を広げる */}
      <main className="max-w-md mx-auto pt-24">
        
        {/* 1. メインセクション (動画・タイトル・名言) */}
        <section className="px-4 py-8 flex flex-col items-center justify-center min-h-[70vh] border-b border-neutral-800 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="text-yellow-400 font-bold tracking-widest mb-2 animate-pulse">
            2026.04.23
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-8 leading-tight">
            HAPPY <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
              BIRTHDAY
            </span><br/>
            SOSEKI!
          </h1>

          {/* 動画プレースホルダー */}
          <div className="w-full aspect-video bg-neutral-800 rounded-xl flex flex-col items-center justify-center mb-8 border border-neutral-700 shadow-[0_0_15px_rgba(250,204,21,0.1)] relative overflow-hidden group cursor-pointer">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
            <Play className="text-yellow-400 z-20 mb-2" size={48} />
            <span className="text-neutral-400 text-sm z-20 font-bold">K制作: スペシャルお祝い動画</span>
          </div>

          <div className="relative p-6 bg-neutral-900 rounded-lg border-l-4 border-yellow-400 italic text-neutral-300 shadow-lg w-full">
            <p className="text-lg">「吾輩は漱石である。<br/>二十歳はすでに来た。」</p>
            <p className="text-right text-sm text-neutral-500 mt-2">- Soseki (2006-2026)</p>
          </div>
        </section>

        {/* 2. 寄せ書きコーナー */}
        <section className="py-10 border-b border-neutral-800">
          <div className="px-4 flex items-center gap-2 mb-6">
            <MessageCircle className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Messages</h2>
          </div>
          
          <div className="flex overflow-x-auto pb-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className="min-w-[280px] bg-neutral-900 p-6 rounded-xl border border-neutral-800 snap-center flex flex-col justify-between">
                <p className="text-neutral-200 mb-4">{msg.text}</p>
                <p className="text-yellow-400 font-bold text-sm text-right">From: {msg.author}</p>
              </div>
            ))}
            <div className="min-w-[280px] bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 border-dashed flex items-center justify-center snap-center cursor-pointer hover:bg-neutral-800 transition">
              <span className="text-neutral-400 font-bold">+ メッセージを書く</span>
            </div>
          </div>
        </section>

        {/* 3. ミニゲームコーナー */}
        <section className="px-4 py-10 border-b border-neutral-800">
          <div className="flex items-center gap-2 mb-6">
            <Gamepad2 className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Mini Games</h2>
          </div>
          
          <div className="bg-gradient-to-br from-neutral-900 to-black p-1 rounded-xl border border-neutral-800">
            <div className="bg-neutral-950 p-6 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">漱石タイピング</h3>
                  <p className="text-sm text-neutral-400">名言を打ってコインを稼ごう！</p>
                </div>
                <div className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-2 py-1 rounded">
                  +100 Coins
                </div>
              </div>
              
              <div className="w-full h-40 bg-neutral-900 rounded-lg border border-neutral-800 flex items-center justify-center mb-4">
                <span className="text-neutral-600 font-bold">Game Screen Area</span>
              </div>
              
              <button className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold rounded-lg flex items-center justify-center gap-2 active:scale-95">
                <Play fill="currentColor" size={18} />
                PLAY NOW
              </button>
            </div>
          </div>
        </section>

        {/* 4. ガチャ＆コレクションコーナー */}
        <section className="px-4 py-10 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Gacha & Collection</h2>
            </div>
            <div className="text-sm text-neutral-400">
              所持: <span className="text-yellow-400 font-bold">{coins} C</span>
            </div>
          </div>

          <div className="bg-neutral-900 p-6 rounded-xl border border-neutral-800 text-center mb-8">
            <div className="w-32 h-32 mx-auto bg-black rounded-full border-4 border-yellow-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
              <span className="text-4xl">🎁</span>
            </div>
            <button 
              className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-extrabold text-lg rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 mb-4"
              onClick={() => alert('ガチャ演出！')}
            >
              1回まわす (100 C)
            </button>
            
            <button 
              className="w-full py-3 bg-neutral-950 text-red-400 border border-red-900/50 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-950/30 transition-colors"
              onClick={() => {
                setCoins(coins + 100);
                setDebt(debt + 100);
              }}
            >
              <AlertTriangle size={16} />
              コインが足りない？（借金する）
            </button>
          </div>

          <h3 className="font-bold text-lg mb-4 text-neutral-300">Your Collection</h3>
          <div className="grid grid-cols-2 gap-3">
            {collections.map((item) => (
              <div 
                key={item.id} 
                className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center relative overflow-hidden ${
                  item.acquired ? 'bg-neutral-900 border-yellow-500/30' : 'bg-neutral-900/50 border-neutral-800 grayscale opacity-50'
                }`}
              >
                {!item.acquired && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                    <Lock className="text-neutral-400" />
                  </div>
                )}
                <div className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.rarity === 'UR' ? 'bg-purple-500 text-white' :
                  item.rarity === 'SSR' ? 'bg-yellow-400 text-black' :
                  item.rarity === 'R' ? 'bg-blue-400 text-black' : 'bg-neutral-600 text-white'
                }`}>
                  {item.rarity}
                </div>
                <div className="text-3xl mb-2 mt-2">{item.icon}</div>
                <div className="text-xs font-bold text-neutral-200 line-clamp-2">{item.name}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. レトロなアクセスカウンター (フッター) */}
        <footer className="py-12 px-4 flex flex-col items-center justify-center text-center opacity-80">
          <p className="text-neutral-400 text-sm mb-2 font-bold">あなたは</p>
          <div className="flex gap-1 mb-2 bg-neutral-900 p-2 rounded border-2 border-neutral-700 shadow-inner">
            {/* キリ番を演出する777 */}
            {['0', '0', '0', '7', '7', '7'].map((digit, index) => (
              <div key={index} className="w-6 h-8 bg-black text-red-500 font-mono text-xl font-bold flex items-center justify-center border border-neutral-800">
                {digit}
              </div>
            ))}
          </div>
          <p className="text-neutral-400 text-sm font-bold mb-4">人目の訪問者です</p>
          <p className="text-xs text-yellow-400 animate-pulse font-bold">★☆ LUCKY NUMBER! ☆★</p>
          
          <div className="mt-8 text-xs text-neutral-600">
            © 2026 Soseki's Friends Project. All rights reserved.
          </div>
        </footer>

      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 20s linear infinite;
          padding-left: 100%;
        }
      `}} />
    </div>
  );
}