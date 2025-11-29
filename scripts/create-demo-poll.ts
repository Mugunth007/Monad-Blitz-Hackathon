#!/usr/bin/env node

/**
 * @title Create Demo Poll Script
 * @notice TypeScript script to create a demo poll using viem
 * @dev Interacts with deployed VoteRush contract on Monad testnet
 */

import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
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
    name: 'getPoll',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'question', type: 'string' },
          { name: 'options', type: 'string[]' },
          { name: 'stakeAmount', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'winningOption', type: 'uint256' },
          { name: 'resolved', type: 'bool' },
          { name: 'creator', type: 'address' },
          { name: 'isDemoMode', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'view',
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
    name: 'isPollActive',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [{ name: 'active', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getTimeRemaining',
    inputs: [{ name: 'pollId', type: 'uint256' }],
    outputs: [{ name: 'timeLeft', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'PollCreated',
    inputs: [
      { name: 'pollId', type: 'uint256', indexed: true },
      { name: 'question', type: 'string', indexed: false },
      { name: 'stakeAmount', type: 'uint256', indexed: false },
      { name: 'endTime', type: 'uint256', indexed: false },
      { name: 'isDemoMode', type: 'bool', indexed: false },
    ],
  },
] as const;

// Configuration
const config = {
  privateKey: process.env.PRIVATE_KEY as `0x${string}`,
  contractAddress: process.env.VOTE_RUSH_ADDRESS as `0x${string}`,
  rpcUrl: process.env.RPC_URL || 'https://testnet-rpc.monad.xyz',
  durationMinutes: parseInt(process.env.DEMO_DURATION_MINUTES || '60'),
  stakeAmount: parseEther(process.env.DEMO_STAKE_AMOUNT || '0'),
};

async function createDemoPooll() {
  console.log('🎯 VoteRush Demo Poll Creator');
  console.log('================================');

  // Validate environment
  if (!config.privateKey) {
    throw new Error('❌ PRIVATE_KEY not found in environment');
  }
  if (!config.contractAddress) {
    throw new Error('❌ VOTE_RUSH_ADDRESS not found in environment');
  }

  // Create account and clients
  const account = privateKeyToAccount(config.privateKey);
  
  const publicClient = createPublicClient({
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });
  
  const walletClient = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(config.rpcUrl),
  });

  console.log(`📍 Contract: ${config.contractAddress}`);
  console.log(`👤 Account: ${account.address}`);

  // Check account balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Balance: ${formatEther(balance)} MON`);

  if (balance === 0n) {
    console.log('⚠️  Warning: Account balance is 0. Get testnet MON from:');
    console.log('   🚰 Faucet: https://faucet.monad.xyz');
  }

  // Poll configuration
  const pollData = {
    question: 'Which project will win 1st place at Monad Blitz? 🏆',
    options: [
      'VoteRush 🚀',
      'DeFi Protocol 💎',
      'NFT Platform 🎨',
      'Gaming dApp 🎮',
      'Social Network 👥',
    ] as readonly string[],
    stakeAmount: config.stakeAmount,
    durationMinutes: BigInt(config.durationMinutes),
    isDemoMode: true,
  };

  console.log('\n📋 Poll Configuration:');
  console.log(`❓ Question: ${pollData.question}`);
  console.log(`📝 Options: ${pollData.options.length}`);
  pollData.options.forEach((option, index) => {
    console.log(`   ${index}: ${option}`);
  });
  console.log(`💰 Stake: ${formatEther(pollData.stakeAmount)} MON`);
  console.log(`⏱️  Duration: ${pollData.durationMinutes} minutes`);
  console.log(`🎮 Demo Mode: ${pollData.isDemoMode ? 'Yes' : 'No'}`);

  try {
    console.log('\n🚀 Creating poll...');
    
    // Estimate gas first
    const gasEstimate = await publicClient.estimateContractGas({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'createPoll',
      args: [
        pollData.question,
        pollData.options,
        pollData.stakeAmount,
        pollData.durationMinutes,
        pollData.isDemoMode,
      ],
      account: account.address,
    });

    console.log(`⛽ Estimated gas: ${gasEstimate.toLocaleString()}`);

    // Create the poll
    const txHash = await walletClient.writeContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'createPoll',
      args: [
        pollData.question,
        pollData.options,
        pollData.stakeAmount,
        pollData.durationMinutes,
        pollData.isDemoMode,
      ],
      gas: gasEstimate,
    });

    console.log(`📡 Transaction submitted: ${txHash}`);
    console.log(`🔗 Explorer: https://testnet.monadexplorer.com/tx/${txHash}`);

    // Wait for transaction confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    
    console.log(`✅ Transaction confirmed!`);
    console.log(`📦 Block: ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed.toLocaleString()}`);

    // Extract poll ID from events
    const pollCreatedEvent = receipt.logs.find(log => 
      log.address.toLowerCase() === config.contractAddress.toLowerCase()
    );
    
    if (!pollCreatedEvent) {
      throw new Error('PollCreated event not found');
    }

    // Parse the poll ID (first topic after event signature)
    const pollId = BigInt(pollCreatedEvent.topics[1] || '0');
    console.log(`🎯 Poll ID: ${pollId}`);

    // Fetch and display poll details
    console.log('\n📊 Poll Details:');
    const poll = await publicClient.readContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'getPoll',
      args: [pollId],
    });

    console.log(`❓ Question: ${poll.question}`);
    console.log(`📝 Options: ${poll.options.length}`);
    poll.options.forEach((option: string, index: number) => {
      console.log(`   ${index}: ${option}`);
    });
    console.log(`💰 Stake Amount: ${formatEther(poll.stakeAmount)} MON`);
    console.log(`📅 End Time: ${new Date(Number(poll.endTime) * 1000).toLocaleString()}`);
    console.log(`👤 Creator: ${poll.creator}`);
    console.log(`🎮 Demo Mode: ${poll.isDemoMode ? 'Yes' : 'No'}`);
    console.log(`✅ Resolved: ${poll.resolved ? 'Yes' : 'No'}`);

    // Check poll status
    const isActive = await publicClient.readContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'isPollActive',
      args: [pollId],
    });

    const timeRemaining = await publicClient.readContract({
      address: config.contractAddress,
      abi: voteRushABI,
      functionName: 'getTimeRemaining',
      args: [pollId],
    });

    console.log(`🟢 Active: ${isActive ? 'Yes' : 'No'}`);
    console.log(`⏱️  Time Remaining: ${Number(timeRemaining)} seconds`);

    // Save poll info to file
    const pollInfo = {
      pollId: pollId.toString(),
      contractAddress: config.contractAddress,
      transactionHash: txHash,
      blockNumber: receipt.blockNumber.toString(),
      question: poll.question,
      options: poll.options,
      stakeAmount: poll.stakeAmount.toString(),
      endTime: poll.endTime.toString(),
      isDemoMode: poll.isDemoMode,
      creator: poll.creator,
      chainId: monadTestnet.id,
      explorerUrl: `https://testnet.monadexplorer.com/tx/${txHash}`,
    };

    // Write to JSON file
    const fs = await import('fs');
    fs.writeFileSync('demo-poll-info.json', JSON.stringify(pollInfo, null, 2));
    
    console.log('\n💾 Poll info saved to: demo-poll-info.json');

    // Demo voting instructions
    console.log('\n🗳️  Demo Voting Instructions:');
    console.log('Since this is demo mode, anyone can vote for free!');
    console.log('Use these commands to vote:');
    console.log('');
    console.log('📱 Frontend Integration:');
    console.log(`   Poll ID: ${pollId}`);
    console.log(`   Contract: ${config.contractAddress}`);
    console.log(`   Chain ID: ${monadTestnet.id}`);
    console.log(`   RPC: ${config.rpcUrl}`);
    console.log('');
    console.log('🔧 Contract Interaction:');
    console.log(`   voteRush.demoVote(${pollId}, 0, keccak256("voter1")); // Vote for VoteRush`);
    console.log(`   voteRush.demoVote(${pollId}, 1, keccak256("voter2")); // Vote for DeFi Protocol`);
    console.log(`   voteRush.demoVote(${pollId}, 2, keccak256("voter3")); // Vote for NFT Platform`);

    console.log('\n🎯 Next Steps:');
    console.log('1. 🗳️  Cast demo votes using different voter IDs');
    console.log('2. 📊 Monitor vote counts in real-time');
    console.log('3. ⏰ Wait for poll to end or resolve manually');
    console.log('4. 🏆 Check winning option');
    console.log('5. 🚀 Run stress test: npm run stress-test');

    console.log('\n✅ Demo poll created successfully! 🎉');

  } catch (error: any) {
    console.error('\n❌ Error creating demo poll:');
    console.error(error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Get testnet MON from:');
      console.log('   🚰 Faucet: https://faucet.monad.xyz');
    } else if (error.message.includes('nonce too low')) {
      console.log('\n💡 Solution: Wait a moment and try again');
    } else if (error.message.includes('contract not deployed')) {
      console.log('\n💡 Solution: Deploy contract first:');
      console.log('   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast');
    }
    
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  createDemoPooll().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { createDemoPooll };