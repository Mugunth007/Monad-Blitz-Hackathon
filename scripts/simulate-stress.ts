#!/usr/bin/env node

/**
 * @title Stress Test Script for VoteRush
 * @notice Simulates parallel voting to test Monad's parallel execution
 * @dev Tests 100+ simultaneous votes and measures performance
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther, Hex } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem/utils';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define Monad Testnet chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
      webSocket: ['wss://testnet-ws.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://testnet.monadexplorer.com' },
  },
});

// VoteRush contract ABI (only functions we need)
const voteRushABI = [
  {
    type: 'function',
    name: 'createPoll',
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'options', type: 'string[]' },
      { name: 'stakeAmount', type: 'uint256' },
      { name: 'durationMinutes', type: 'uint256' },
      { name: 'isDemoMode', type: 'bool' },
    ],
    outputs: [{ name: 'pollId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'demoVote',
    inputs: [
      { name: 'pollId', type: 'uint256' },
      { name: 'optionId', type: 'uint256' },
      { name: 'tempVoterId', type: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'vote',
    inputs: [
      { name: 'pollId', type: 'uint256' },
      { name: 'optionId', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getVoteCounts',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [{ name: 'counts', type: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTotalPool',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [{ name: 'total', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isPollActive',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [{ name: 'active', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// Configuration
const config = {
  contractAddress: process.env.VOTE_RUSH_ADDRESS as `0x${string}`,
  rpcUrl: process.env.RPC_URL || 'https://testnet-rpc.monad.xyz',
  pollId: BigInt(process.env.POLL_ID || '0'),
  stressTestVotes: parseInt(process.env.STRESS_TEST_VOTES || '100'),
  parallelBatches: parseInt(process.env.PARALLEL_BATCHES || '10'),
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '20'),
  testDuration: parseInt(process.env.STRESS_TEST_DURATION || '30'),
  enableRealVotes: process.env.ENABLE_REAL_VOTES === 'true',
  fundingPrivateKey: process.env.PRIVATE_KEY as `0x${string}`,
};

interface StressTestResults {
  totalVotes: number;
  successfulVotes: number;
  failedVotes: number;
  duration: number;
  votesPerSecond: number;
  averageGasUsed: bigint;
  totalGasUsed: bigint;
  errors: string[];
  blockNumbers: bigint[];
  transactionHashes: string[];
}

// Utility functions
function generateTempVoterId(index: number): Hex {
  const encoder = new TextEncoder();
  const data = encoder.encode(`stress_voter_${index}_${Date.now()}`);
  const hash = Array.from(data).reduce((a, b) => a + b, 0);
  return `0x${hash.toString(16).padStart(64, '0')}` as Hex;
}

function generateRandomOption(optionCount: number): number {
  return Math.floor(Math.random() * optionCount);
}

async function createStressTestAccount() {
  const privateKey = generatePrivateKey();
  const account = privateKeyToAccount(privateKey);
  return { privateKey, account };
}

async function fundAccount(account: `0x${string}`, amount: bigint) {
  if (!config.fundingPrivateKey) {
    throw new Error('PRIVATE_KEY required for funding test accounts');
  }

  const fundingAccount = privateKeyToAccount(config.fundingPrivateKey);
  const walletClient = createWalletClient({
    account: fundingAccount,
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  const txHash = await walletClient.sendTransaction({
    to: account,
    value: amount,
  });

  return txHash;
}

async function runDemoVoteStressTest(): Promise<StressTestResults> {
  console.log('🔥 Demo Vote Stress Test (Free votes)');
  console.log('=====================================');

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  const account = privateKeyToAccount(config.fundingPrivateKey);
  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  const results: StressTestResults = {
    totalVotes: config.stressTestVotes,
    successfulVotes: 0,
    failedVotes: 0,
    duration: 0,
    votesPerSecond: 0,
    averageGasUsed: 0n,
    totalGasUsed: 0n,
    errors: [],
    blockNumbers: [],
    transactionHashes: [],
  };

  console.log(`📊 Testing ${config.stressTestVotes} demo votes`);
  console.log(`📍 Contract: ${config.contractAddress}`);
  console.log(`🎯 Poll ID: ${config.pollId}`);
  console.log(`⚡ Max concurrency: ${config.maxConcurrency}`);

  // Check poll is active
  const isActive = await publicClient.readContract({
    address: config.contractAddress,
    abi: voteRushABI,
    functionName: 'isPollActive',
    args: [config.pollId],
  });

  if (!isActive) {
    throw new Error('❌ Poll is not active');
  }

  const startTime = Date.now();

  // Create vote promises
  const votePromises: Promise<void>[] = [];
  
  for (let i = 0; i < config.stressTestVotes; i++) {
    const votePromise = (async (index: number) => {
      try {
        const tempVoterId = generateTempVoterId(index);
        const optionId = generateRandomOption(5); // Assuming 5 options

        const txHash = await walletClient.writeContract({
          address: config.contractAddress,
          abi: voteRushABI,
          functionName: 'demoVote',
          args: [config.pollId, BigInt(optionId), tempVoterId],
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        results.successfulVotes++;
        results.totalGasUsed += receipt.gasUsed;
        results.blockNumbers.push(receipt.blockNumber);
        results.transactionHashes.push(txHash);

        if (index % 10 === 0) {
          console.log(`✅ Vote ${index + 1}/${config.stressTestVotes} completed`);
        }

      } catch (error: any) {
        results.failedVotes++;
        results.errors.push(`Vote ${index}: ${error.message}`);
        
        if (index % 10 === 0) {
          console.log(`❌ Vote ${index + 1}/${config.stressTestVotes} failed: ${error.message}`);
        }
      }
    })(i);

    votePromises.push(votePromise);

    // Limit concurrency
    if (votePromises.length >= config.maxConcurrency) {
      await Promise.allSettled(votePromises.splice(0, config.maxConcurrency));
    }
  }

  // Wait for remaining votes
  if (votePromises.length > 0) {
    await Promise.allSettled(votePromises);
  }

  const endTime = Date.now();
  results.duration = endTime - startTime;
  results.votesPerSecond = (results.successfulVotes / (results.duration / 1000));
  results.averageGasUsed = results.successfulVotes > 0 ? results.totalGasUsed / BigInt(results.successfulVotes) : 0n;

  return results;
}

async function runRealVoteStressTest(): Promise<StressTestResults> {
  console.log('💰 Real Vote Stress Test (With MON stakes)');
  console.log('==========================================');

  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  const results: StressTestResults = {
    totalVotes: config.stressTestVotes,
    successfulVotes: 0,
    failedVotes: 0,
    duration: 0,
    votesPerSecond: 0,
    averageGasUsed: 0n,
    totalGasUsed: 0n,
    errors: [],
    blockNumbers: [],
    transactionHashes: [],
  };

  // Create multiple funded accounts for parallel voting
  console.log('🏗️  Creating and funding test accounts...');
  const testAccounts: { privateKey: Hex; account: ReturnType<typeof privateKeyToAccount> }[] = [];
  
  for (let i = 0; i < Math.min(config.stressTestVotes, 50); i++) {
    const { privateKey, account } = await createStressTestAccount();
    testAccounts.push({ privateKey, account });
    
    // Fund each account
    if (config.fundingPrivateKey) {
      try {
        await fundAccount(account.address, parseEther('0.1')); // 0.1 MON each
        console.log(`💰 Funded account ${i + 1}/${Math.min(config.stressTestVotes, 50)}`);
      } catch (error) {
        console.warn(`⚠️  Failed to fund account ${i + 1}: ${error}`);
      }
    }
  }

  console.log(`📊 Testing ${config.stressTestVotes} real votes with ${testAccounts.length} accounts`);

  const startTime = Date.now();

  // Create vote promises
  const votePromises: Promise<void>[] = [];
  
  for (let i = 0; i < config.stressTestVotes; i++) {
    const accountIndex = i % testAccounts.length;
    const { privateKey } = testAccounts[accountIndex];
    
    const votePromise = (async (index: number, pk: Hex) => {
      try {
        const account = privateKeyToAccount(pk);
        const walletClient = createWalletClient({
          account,
          chain: monadTestnet,
          transport: http(config.rpcUrl),
        });

        const optionId = generateRandomOption(5);
        const stakeAmount = parseEther('0.01'); // 0.01 MON per vote

        const txHash = await walletClient.writeContract({
          address: config.contractAddress,
          abi: voteRushABI,
          functionName: 'vote',
          args: [config.pollId, BigInt(optionId)],
          value: stakeAmount,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        
        results.successfulVotes++;
        results.totalGasUsed += receipt.gasUsed;
        results.blockNumbers.push(receipt.blockNumber);
        results.transactionHashes.push(txHash);

        if (index % 10 === 0) {
          console.log(`✅ Real vote ${index + 1}/${config.stressTestVotes} completed`);
        }

      } catch (error: any) {
        results.failedVotes++;
        results.errors.push(`Vote ${index}: ${error.message}`);
        
        if (index % 10 === 0) {
          console.log(`❌ Real vote ${index + 1}/${config.stressTestVotes} failed: ${error.message}`);
        }
      }
    })(i, privateKey);

    votePromises.push(votePromise);

    // Limit concurrency
    if (votePromises.length >= config.maxConcurrency) {
      await Promise.allSettled(votePromises.splice(0, config.maxConcurrency));
    }
  }

  // Wait for remaining votes
  if (votePromises.length > 0) {
    await Promise.allSettled(votePromises);
  }

  const endTime = Date.now();
  results.duration = endTime - startTime;
  results.votesPerSecond = (results.successfulVotes / (results.duration / 1000));
  results.averageGasUsed = results.successfulVotes > 0 ? results.totalGasUsed / BigInt(results.successfulVotes) : 0n;

  return results;
}

async function displayResults(results: StressTestResults, testType: string) {
  console.log(`\n📊 ${testType} Results:`);
  console.log('========================');
  console.log(`✅ Successful votes: ${results.successfulVotes}/${results.totalVotes}`);
  console.log(`❌ Failed votes: ${results.failedVotes}`);
  console.log(`⏱️  Duration: ${(results.duration / 1000).toFixed(2)}s`);
  console.log(`🚀 Votes per second: ${results.votesPerSecond.toFixed(2)}`);
  console.log(`⛽ Average gas: ${results.averageGasUsed.toLocaleString()}`);
  console.log(`🔥 Total gas: ${results.totalGasUsed.toLocaleString()}`);
  console.log(`🎯 Success rate: ${((results.successfulVotes / results.totalVotes) * 100).toFixed(2)}%`);

  if (results.blockNumbers.length > 0) {
    const uniqueBlocks = new Set(results.blockNumbers.map(bn => bn.toString()));
    console.log(`📦 Blocks used: ${uniqueBlocks.size}`);
    console.log(`🔗 Block range: ${Math.min(...Array.from(uniqueBlocks).map(Number))} - ${Math.max(...Array.from(uniqueBlocks).map(Number))}`);
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (first 5):`);
    results.errors.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
}

async function checkFinalState() {
  console.log('\n🔍 Checking final poll state...');
  
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  try {
    const voteCounts = await publicClient.readContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'getVoteCounts',
      args: [config.pollId],
    });

    const totalPool = await publicClient.readContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'getTotalPool',
      args: [config.pollId],
    });

    console.log('📊 Final Vote Counts:');
    voteCounts.forEach((count: bigint, index: number) => {
      console.log(`   Option ${index}: ${count.toString()} votes`);
    });

    const totalVotes = voteCounts.reduce((sum: bigint, count: bigint) => sum + count, 0n);
    console.log(`🗳️  Total votes: ${totalVotes.toString()}`);
    console.log(`💰 Total pool: ${formatEther(totalPool)} MON`);

    const winningOption = voteCounts.indexOf(Math.max(...voteCounts.map(c => Number(c))));
    console.log(`🏆 Leading option: ${winningOption} (${voteCounts[winningOption]} votes)`);

  } catch (error) {
    console.error('❌ Error checking final state:', error);
  }
}

async function runStressTest() {
  console.log('🎯 VoteRush Stress Test Suite');
  console.log('==============================');
  
  // Validate environment
  if (!config.contractAddress) {
    throw new Error('❌ VOTE_RUSH_ADDRESS not found in environment');
  }
  
  console.log(`📍 Contract: ${config.contractAddress}`);
  console.log(`🎯 Poll ID: ${config.pollId}`);
  console.log(`🔥 Vote count: ${config.stressTestVotes}`);
  console.log(`⚡ Concurrency: ${config.maxConcurrency}`);
  console.log(`💰 Real votes: ${config.enableRealVotes ? 'Enabled' : 'Disabled'}`);

  try {
    // Run demo vote stress test
    const demoResults = await runDemoVoteStressTest();
    await displayResults(demoResults, 'Demo Vote Stress Test');

    // Save results
    const resultsSummary = {
      timestamp: new Date().toISOString(),
      config: {
        totalVotes: config.stressTestVotes,
        maxConcurrency: config.maxConcurrency,
        contractAddress: config.contractAddress,
        pollId: config.pollId.toString(),
      },
      demoTest: {
        successRate: (demoResults.successfulVotes / demoResults.totalVotes) * 100,
        votesPerSecond: demoResults.votesPerSecond,
        averageGasUsed: demoResults.averageGasUsed.toString(),
        duration: demoResults.duration,
        errors: demoResults.errors.length,
      },
    };

    // Run real vote stress test if enabled and funded
    if (config.enableRealVotes && config.fundingPrivateKey) {
      console.log('\n⏳ Starting real vote stress test...');
      const realResults = await runRealVoteStressTest();
      await displayResults(realResults, 'Real Vote Stress Test');
      
      // @ts-ignore
      resultsSummary.realTest = {
        successRate: (realResults.successfulVotes / realResults.totalVotes) * 100,
        votesPerSecond: realResults.votesPerSecond,
        averageGasUsed: realResults.averageGasUsed.toString(),
        duration: realResults.duration,
        errors: realResults.errors.length,
      };
    }

    // Check final state
    await checkFinalState();

    // Save results to file
    const fs = await import('fs');
    fs.writeFileSync('stress-test-results.json', JSON.stringify(resultsSummary, null, 2));
    
    console.log('\n💾 Results saved to: stress-test-results.json');

    // Performance analysis
    console.log('\n🎯 Monad Performance Analysis:');
    console.log('==============================');
    console.log(`🔥 Peak TPS achieved: ${demoResults.votesPerSecond.toFixed(2)}`);
    console.log(`⚡ Monad's theoretical TPS: 10,000`);
    console.log(`📊 Utilization: ${((demoResults.votesPerSecond / 10000) * 100).toFixed(4)}%`);
    
    if (demoResults.votesPerSecond > 100) {
      console.log('✅ Excellent performance! Ready for production scale');
    } else if (demoResults.votesPerSecond > 50) {
      console.log('🟡 Good performance, consider optimization for higher load');
    } else {
      console.log('🔴 Performance below expectations, check network conditions');
    }

    console.log('\n🎉 Stress test completed successfully!');

  } catch (error: any) {
    console.error('\n❌ Stress test failed:');
    console.error(error.message);
    
    if (error.message.includes('Poll is not active')) {
      console.log('\n💡 Solution: Create an active poll first:');
      console.log('   npm run create-demo-poll');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Fund your account from faucet:');
      console.log('   🚰 https://faucet.monad.xyz');
    }
    
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  runStressTest().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { runStressTest, runDemoVoteStressTest, runRealVoteStressTest };