'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent, usePublicClient } from 'wagmi';
import { Header } from '@/components/layout/Header';
import { BattleArena } from '@/components/BattleArena';
import { AdminPanel } from '@/components/AdminPanel';
import { VOTE_WARS_ABI } from '@/lib/abi/VoteWars';
import { toast } from 'react-hot-toast';

// REPLACE WITH YOUR DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

export default function Home() {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const publicClient = usePublicClient();

  // State
  const [currentBattleId, setCurrentBattleId] = useState<number>(0);
  const [battleData, setBattleData] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [hasMinted, setHasMinted] = useState(false);

  // Read Battle Count
  const { data: battleCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    functionName: 'battleCount',
  });

  // Update current battle ID when count changes
  useEffect(() => {
    if (battleCount) {
      setCurrentBattleId(Number(battleCount));
    }
  }, [battleCount]);

  // Read Current Battle Data
  const { data: battle, refetch: refetchBattle } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    functionName: 'battles',
    args: [BigInt(currentBattleId)],
    query: {
      enabled: currentBattleId > 0,
    }
  });

  // Check if user has voted
  const { data: userVoted, refetch: refetchVoted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    functionName: 'hasVoted',
    args: [BigInt(currentBattleId), address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!address && currentBattleId > 0,
    }
  });

  // Check if user has minted witness
  const { data: userMinted, refetch: refetchMinted } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    functionName: 'hasMintedWitness',
    args: [BigInt(currentBattleId), address || '0x0000000000000000000000000000000000000000'],
    query: {
      enabled: !!address && currentBattleId > 0,
    }
  });

  // Update local state
  useEffect(() => {
    if (battle) {
      setBattleData(battle);
    }
    if (userVoted !== undefined) setHasVoted(userVoted);
    if (userMinted !== undefined) setHasMinted(userMinted);
  }, [battle, userVoted, userMinted]);

  // Event Listeners
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    eventName: 'VoteCast',
    onLogs(logs) {
      const log = logs[0];
      // Only update if it's the current battle
      if (log.args.battleId === BigInt(currentBattleId)) {
        refetchBattle();
        toast.success('New Vote Cast!', { icon: '🗳️' });
      }
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    eventName: 'BattleCreated',
    onLogs(logs) {
      const log = logs[0];
      setCurrentBattleId(Number(log.args.battleId));
      toast.success('New Battle Started!', { icon: '⚔️' });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: VOTE_WARS_ABI,
    eventName: 'BattleEnded',
    onLogs(logs) {
      if (logs[0].args.battleId === BigInt(currentBattleId)) {
        refetchBattle();
        toast('Battle Ended!', { icon: '🏁' });
      }
    },
  });

  // Actions
  const handleCreateBattle = (title: string, opA: string, opB: string, duration: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: VOTE_WARS_ABI,
      functionName: 'createBattle',
      args: [title, opA, opB, BigInt(duration)],
    }, {
      onSuccess: () => toast.success('Creating Battle...'),
      onError: (err) => toast.error(err.message),
    });
  };

  const handleVote = (option: 'A' | 'B') => {
    if (!address) return toast.error('Connect Wallet first!');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: VOTE_WARS_ABI,
      functionName: 'vote',
      args: [BigInt(currentBattleId), option === 'A'],
    }, {
      onSuccess: () => {
        toast.success('Vote Submitted!');
        setHasVoted(true); // Optimistic update
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleMint = () => {
    if (!address) return toast.error('Connect Wallet first!');

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: VOTE_WARS_ABI,
      functionName: 'mintWitness',
      args: [BigInt(currentBattleId)],
    }, {
      onSuccess: () => {
        toast.success('Minting Witness NFT...');
        setHasMinted(true); // Optimistic update
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-h-screen monad-pattern relative pb-20">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {currentBattleId > 0 && battleData ? (
          <BattleArena
            battleId={currentBattleId}
            title={battleData[1]} // title
            optionA={battleData[2]} // optionA
            optionB={battleData[3]} // optionB
            votesA={Number(battleData[4])} // votesA
            votesB={Number(battleData[5])} // votesB
            endTime={Number(battleData[6]) + Number(battleData[7])} // startTime + duration
            isActive={battleData[8]} // active
            onVote={handleVote}
            onMint={handleMint}
            hasVoted={hasVoted}
            hasMinted={hasMinted}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <h2 className="text-4xl font-bold text-white mb-4">No Active Battles</h2>
            <p className="text-gray-400 mb-8">Be the first to start a war.</p>
            <div className="p-8 monad-glass rounded-2xl animate-pulse">
              <span className="text-2xl">Waiting for battles...</span>
            </div>
          </div>
        )}

        <AdminPanel onCreateBattle={handleCreateBattle} isCreating={isPending} />
      </main>
    </div>
  );
}
