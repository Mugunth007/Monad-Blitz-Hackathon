'use client';

import { useState, useEffect } from 'react';
import { Swords, Trophy, Timer, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface BattleArenaProps {
    battleId: number;
    title: string;
    optionA: string;
    optionB: string;
    votesA: number;
    votesB: number;
    endTime: number;
    isActive: boolean;
    onVote: (option: 'A' | 'B') => void;
    onMint: () => void;
    hasVoted: boolean;
    hasMinted: boolean;
}

export function BattleArena({
    battleId,
    title,
    optionA,
    optionB,
    votesA,
    votesB,
    endTime,
    isActive,
    onVote,
    onMint,
    hasVoted,
    hasMinted
}: BattleArenaProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const totalVotes = votesA + votesB;
    const percentA = totalVotes === 0 ? 50 : (votesA / totalVotes) * 100;
    const percentB = totalVotes === 0 ? 50 : (votesB / totalVotes) * 100;

    useEffect(() => {
        const timer = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = Math.max(0, endTime - now);
            setTimeLeft(remaining);
        }, 1000);
        return () => clearInterval(timer);
    }, [endTime]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleVote = (option: 'A' | 'B') => {
        onVote(option);
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: option === 'A' ? ['#3b82f6', '#60a5fa'] : ['#ef4444', '#f87171']
        });
    };

    const handleMint = () => {
        onMint();
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#eab308', '#facc15', '#ffffff']
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6">
            <div className="monad-glass rounded-[2rem] p-8 md:p-12 relative overflow-hidden border border-white/10 shadow-2xl">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-monad-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
                </div>

                {/* Header */}
                <div className="text-center mb-16 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center px-4 py-2 bg-white/5 rounded-full mb-6 backdrop-blur-md border border-white/10 shadow-lg"
                    >
                        <Swords className="w-5 h-5 text-monad-primary mr-2" />
                        <span className="text-monad-primary font-bold tracking-wider text-sm">LIVE BATTLE #{battleId}</span>
                    </motion.div>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        {title}
                    </h2>
                    <div className="flex items-center justify-center space-x-3 text-zinc-400 bg-black/20 inline-block px-6 py-2 rounded-full mx-auto backdrop-blur-sm border border-white/5">
                        <Timer className="w-5 h-5" />
                        <span className="font-mono text-xl tracking-widest">{isActive ? formatTime(timeLeft) : 'BATTLE ENDED'}</span>
                    </div>
                </div>

                {/* Battle Ground */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 relative z-10">
                    {/* Option A */}
                    <motion.div
                        whileHover={isActive && !hasVoted ? { scale: 1.02, translateY: -5, rotateY: 5 } : {}}
                        className={`relative group cursor-pointer rounded-3xl p-8 border transition-all duration-500 transform perspective-1000 ${hasVoted ? 'opacity-80 grayscale-[0.5]' : ''
                            } ${isActive
                                ? 'border-white/10 bg-gradient-to-br from-blue-500/10 to-transparent hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                                : 'border-white/5 bg-white/5'
                            }`}
                        onClick={() => isActive && !hasVoted && handleVote('A')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                        <div className="flex flex-col items-center relative z-10">
                            <div className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{optionA}</div>
                            <div className="text-blue-400 font-mono text-2xl mb-8 bg-blue-500/10 px-4 py-1 rounded-lg border border-blue-500/20">{votesA} Votes</div>
                            {isActive && !hasVoted && (
                                <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 border border-blue-400/20">
                                    VOTE {optionA}
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* VS Badge */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-20 h-20 bg-[#0a0a0f] rounded-full border-4 border-monad-primary shadow-[0_0_40px_rgba(108,84,248,0.4)]">
                        <span className="font-black text-2xl text-white italic bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">VS</span>
                    </div>

                    {/* Option B */}
                    <motion.div
                        whileHover={isActive && !hasVoted ? { scale: 1.02, translateY: -5, rotateY: -5 } : {}}
                        className={`relative group cursor-pointer rounded-3xl p-8 border transition-all duration-500 transform perspective-1000 ${hasVoted ? 'opacity-80 grayscale-[0.5]' : ''
                            } ${isActive
                                ? 'border-white/10 bg-gradient-to-bl from-red-500/10 to-transparent hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]'
                                : 'border-white/5 bg-white/5'
                            }`}
                        onClick={() => isActive && !hasVoted && handleVote('B')}
                    >
                        <div className="absolute inset-0 bg-gradient-to-bl from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
                        <div className="flex flex-col items-center relative z-10">
                            <div className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">{optionB}</div>
                            <div className="text-red-400 font-mono text-2xl mb-8 bg-red-500/10 px-4 py-1 rounded-lg border border-red-500/20">{votesB} Votes</div>
                            {isActive && !hasVoted && (
                                <button className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 border border-red-400/20">
                                    VOTE {optionB}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Progress Bar */}
                <div className="relative h-6 bg-black/40 rounded-full overflow-hidden mb-12 border border-white/5 shadow-inner">
                    <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${percentA}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                    />
                    <motion.div
                        initial={{ width: '50%' }}
                        animate={{ width: `${percentB}%` }}
                        transition={{ type: "spring", stiffness: 40, damping: 20 }}
                        className="absolute right-0 top-0 bottom-0 bg-gradient-to-l from-red-600 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-full bg-black/20 backdrop-blur-sm z-10" />
                        <div className="absolute inset-0 flex justify-between px-4 items-center text-xs font-bold text-white/80 mix-blend-overlay">
                            <span>{percentA.toFixed(1)}%</span>
                            <span>{percentB.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Winner / Mint Section */}
                {!isActive && (
                    <div className="text-center animate-fade-in">
                        <div className="inline-flex flex-col items-center justify-center mb-8 p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10">
                            <Trophy className="w-16 h-16 text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            <span className="text-3xl font-bold text-white mb-2">
                                WINNER
                            </span>
                            <span className={`text-5xl font-black ${votesA > votesB ? 'text-blue-400' : (votesB > votesA ? 'text-red-400' : 'text-gray-400')} drop-shadow-lg`}>
                                {votesA > votesB ? optionA : (votesB > votesA ? optionB : 'DRAW')}
                            </span>
                        </div>

                        {hasVoted && !hasMinted && (
                            <div className="flex flex-col items-center">
                                <button
                                    onClick={handleMint}
                                    className="group relative inline-flex items-center justify-center px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-300 text-black font-black text-lg rounded-2xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(250,204,21,0.3)] hover:shadow-[0_0_50px_rgba(250,204,21,0.5)]"
                                >
                                    <Medal className="w-6 h-6 mr-3" />
                                    Mint Battle Witness NFT
                                    <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 group-hover:ring-white/80 transition-all" />
                                </button>
                                <p className="mt-4 text-zinc-400 font-medium">Prove you were here.</p>
                            </div>
                        )}

                        {hasMinted && (
                            <div className="text-green-400 font-bold flex items-center justify-center space-x-3 bg-green-500/10 py-4 px-8 rounded-2xl inline-block border border-green-500/20">
                                <Medal className="w-6 h-6" />
                                <span className="text-lg">Witness NFT Minted!</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
