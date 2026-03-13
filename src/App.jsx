import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Circle, RotateCcw, Trophy, Terminal, Volume2, VolumeX, Cpu, User, Zap } from 'lucide-react';

// === ЛОГИКА ПРОВЕРКИ ПОБЕДЫ ===
const calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // горизонтали
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // вертикали
    [0, 4, 8], [2, 4, 6]             // диагонали
  ];
  for (let [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] };
    }
  }
  return null;
};

// === ИИ АЛГОРИТМ (MINIMAX) ===
const minimax = (board, depth, isMax) => {
  const res = calculateWinner(board);
  if (res?.winner === 'O') return 10 - depth;
  if (res?.winner === 'X') return depth - 10;
  if (board.every(s => s !== null)) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        best = Math.max(best, minimax(board, depth + 1, false));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        best = Math.min(best, minimax(board, depth + 1, true));
        board[i] = null;
      }
    }
    return best;
  }
};

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [difficulty, setDifficulty] = useState('insane'); 
  const [scores, setScores] = useState({ x: 0, o: 0 });
  const [isSoundOn, setIsSoundOn] = useState(true);

  // === НАСТРОЙКА ЗВУКА ПОД ТВОИ ФАЙЛЫ ===
  // Убедись, что переименовал файлы в sounds/click.wav и sounds/win.wav
  const clickSnd = useRef(new Audio('/sounds/click.wav'));
  const winSnd = useRef(new Audio('/sounds/win.wav'));

  const play = (type) => {
    if (!isSoundOn) return;
    const s = type === 'click' ? clickSnd.current : winSnd.current;
    s.currentTime = 0;
    s.volume = 0.7; // Чуть громче
    s.play().catch(() => console.log("Нажми на экран, чтобы активировать звук")); 
  };

  const winInfo = calculateWinner(board);
  const winner = winInfo?.winner;

  // Логика бота (Ход О)
  useEffect(() => {
    if (!xIsNext && !winner && board.includes(null)) {
      const timer = setTimeout(() => {
        let move;
        const avail = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        
        const getBest = () => {
          let bestScore = -Infinity, bestMove;
          for (let i = 0; i < 9; i++) {
            if (!board[i]) {
              board[i] = 'O';
              let score = minimax(board, 0, false);
              board[i] = null;
              if (score > bestScore) { bestScore = score; bestMove = i; }
            }
          }
          return bestMove;
        };

        if (difficulty === 'easy') move = avail[Math.floor(Math.random() * avail.length)];
        else if (difficulty === 'medium') move = Math.random() > 0.5 ? getBest() : avail[Math.floor(Math.random() * avail.length)];
        else if (difficulty === 'hard') move = Math.random() > 0.2 ? getBest() : avail[Math.floor(Math.random() * avail.length)];
        else move = getBest();

        if (move !== undefined) handleMove(move);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [xIsNext, winner, board, difficulty]);

  const handleMove = (i) => {
    if (board[i] || winner) return;
    play('click');
    const newBoard = [...board];
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);

    const check = calculateWinner(newBoard);
    if (check) {
      play('win');
      setScores(p => ({ ...p, [check.winner.toLowerCase()]: p[check.winner.toLowerCase()] + 1 }));
    }
  };

  const levels = {
    easy: { n: 'Легко', c: 'bg-green-500' },
    medium: { n: 'Средне', c: 'bg-yellow-500' },
    hard: { n: 'Сложно', c: 'bg-orange-500' },
    insane: { n: 'AI God', c: 'bg-red-600' }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center p-6 font-mono relative overflow-hidden">
      {/* Фоновое свечение (Glassmorphism) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-500/10 rounded-full blur-[120px]" />

      <div className="z-10 w-full max-w-md">
        <header className="flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Terminal className="text-cyan-400" size={18} />
            <h1 className="text-xs font-black tracking-widest uppercase">My Node Models</h1>
          </div>
          <button onClick={() => setIsSoundOn(!isSoundOn)} className="text-slate-500 hover:text-white transition-colors">
            {isSoundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </header>

        {/* Выбор сложности */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Object.entries(levels).map(([k, v]) => (
            <button key={k} onClick={() => { setDifficulty(k); setBoard(Array(9).fill(null)); setXIsNext(true); }}
              className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${difficulty === k ? `${v.c} text-black border-transparent shadow-lg shadow-white/10` : 'bg-slate-900/50 text-slate-500 border-white/5 hover:border-white/20'}`}>
              {v.n}
            </button>
          ))}
        </div>

        {/* Табло счета */}
        <div className="flex justify-around bg-white/5 p-5 rounded-3xl border border-white/10 mb-8 backdrop-blur-sm shadow-inner">
          <div className="text-center">
            <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 uppercase justify-center"><User size={10}/> Player</div>
            <div className="text-3xl font-black text-cyan-400">{scores.x}</div>
          </div>
          <div className="w-px h-10 bg-slate-800" />
          <div className="text-center">
            <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 uppercase justify-center"><Cpu size={10}/> Bot</div>
            <div className="text-3xl font-black text-rose-500">{scores.o}</div>
          </div>
        </div>

        {/* Игровое поле */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-900/40 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl relative">
          {board.map((s, i) => (
            <button key={i} onClick={() => xIsNext && handleMove(i)}
              className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all border-2 active:scale-95
              ${winInfo?.line.includes(i) ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'bg-slate-800/40 border-white/5 hover:border-white/20'}`}>
              <AnimatePresence mode="wait">
                {s === 'X' && (
                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }}>
                    <X size={50} className="text-cyan-400" strokeWidth={3} />
                  </motion.div>
                )}
                {s === 'O' && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <Circle size={44} className="text-rose-500" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Кнопка сброса */}
        <button onClick={() => { setBoard(Array(9).fill(null)); setXIsNext(true); }}
          className="w-full mt-10 flex items-center justify-center gap-3 bg-white text-black font-black py-4 rounded-2xl hover:bg-cyan-400 transition-all uppercase text-xs tracking-[0.2em] shadow-xl shadow-white/5">
          <RotateCcw size={16} /> Перестроить систему
        </button>
      </div>
    </div>
  );
}