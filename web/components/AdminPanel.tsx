'use client';

import { useState } from 'react';
import { Plus, Clock, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminPanelProps {
    onCreateBattle: (title: string, optionA: string, optionB: string, duration: number) => void;
    isCreating: boolean;
}

export function AdminPanel({ onCreateBattle, isCreating }: AdminPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [duration, setDuration] = useState(60);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateBattle(title, optionA, optionB, duration);
        setIsOpen(false);
        // Reset form
        setTitle('');
        setOptionA('');
        setOptionB('');
        setDuration(60);
    };

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-8 right-8 p-5 bg-monad-primary hover:bg-monad-purple-light text-white rounded-full shadow-[0_0_30px_rgba(108,84,248,0.4)] transition-all hover:scale-110 z-50 group"
                    >
                        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="monad-glass w-full max-w-lg p-8 rounded-3xl shadow-2xl relative z-10 border border-white/10"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                            >
                                ✕
                            </button>

                            <div className="flex items-center space-x-3 mb-8">
                                <div className="p-3 bg-monad-primary/20 rounded-xl">
                                    <Swords className="w-6 h-6 text-monad-primary" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Create New Battle</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Battle Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Dog vs Cat"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-monad-primary focus:ring-1 focus:ring-monad-primary transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Option A</label>
                                        <input
                                            type="text"
                                            value={optionA}
                                            onChange={(e) => setOptionA(e.target.value)}
                                            placeholder="Dog"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Option B</label>
                                        <input
                                            type="text"
                                            value={optionB}
                                            onChange={(e) => setOptionB(e.target.value)}
                                            placeholder="Cat"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Duration (seconds)</label>
                                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                                        <div className="flex items-center space-x-4">
                                            <Clock className="w-5 h-5 text-zinc-500" />
                                            <input
                                                type="range"
                                                min="30"
                                                max="300"
                                                step="30"
                                                value={duration}
                                                onChange={(e) => setDuration(Number(e.target.value))}
                                                className="flex-1 accent-monad-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-white font-mono w-16 text-right bg-white/5 px-2 py-1 rounded-lg">{duration}s</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full py-4 bg-gradient-to-r from-monad-primary to-monad-purple-light text-white font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(108,84,248,0.4)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
                                >
                                    {isCreating ? (
                                        <span className="flex items-center justify-center">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                            Creating Battle...
                                        </span>
                                    ) : 'Start Battle'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
