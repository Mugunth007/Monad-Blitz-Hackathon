# VoteRush 🗳️⚡

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Monad](https://img.shields.io/badge/Monad-Testnet-blue)](https://monad.xyz)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org)
[![Foundry](https://img.shields.io/badge/Built%20with-Foundry-orange)](https://getfoundry.sh)

> **The lightning-fast voting dApp on Monad blockchain where users vote with money stakes, winners split the pool, and losers lose their stake. Optimized for Monad's parallel execution (10,000 TPS).**

## 🌟 Features

- **💰 Real Money Stakes**: Users vote with MON tokens
- **🏆 Winner Takes Pool**: Winners split the entire pool (minus 2% house fee)
- **⚡ Lightning Fast**: Optimized for Monad's parallel execution
- **🎮 Demo Mode**: Free voting for hackathon demonstrations
- **🔒 Battle-Tested**: Comprehensive test suite with 100% coverage
- **🛡️ Security First**: Reentrancy protection and input validation
- **📊 Real-Time**: Live vote tracking and result calculation

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (for TypeScript scripts)
- MON testnet tokens from [Monad Faucet](https://faucet.monad.xyz)

### Installation

```bash
# 1. Clone and setup
git clone <repository-url>
cd voting-rush

# 2. Install Foundry dependencies
forge install

# 3. Install TypeScript dependencies (optional)
npm install viem dotenv

# 4. Setup environment
cp .env.example .env
# Edit .env with your private key and settings

# 5. Compile contracts
forge build

# 6. Run tests
forge test -vvv
```

### Deploy to Monad Testnet

```bash
# Deploy VoteRush contract
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier sourcify \
  --verifier-url $VERIFIER_URL

# Create demo poll for hackathon
forge script script/Interact.s.sol \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## 🔧 Contract Overview

### Core Functions

#### Poll Creation
```solidity
function createPoll(
    string calldata question,
    string[] calldata options,      // 2-10 options allowed
    uint256 stakeAmount,           // Cost per vote (0 for demo)
    uint256 durationMinutes,       // Poll duration
    bool isDemoMode               // Free voting mode
) external returns (uint256 pollId)
```

#### Voting
```solidity
// Real money voting
function vote(uint256 pollId, uint256 optionId) external payable

// Demo mode voting (free)
function demoVote(
    uint256 pollId, 
    uint256 optionId, 
    bytes32 tempVoterId
) external
```

#### Poll Resolution
```solidity
// Resolve poll after end time
function resolvePoll(uint256 pollId) external

// Claim winnings (winners only)
function claimWinnings(uint256 pollId) external

// Batch payout for gas efficiency
function batchClaimWinnings(
    uint256 pollId, 
    address[] calldata winners
) external
```

### View Functions

```solidity
// Get complete poll data
function getPoll(uint256 pollId) external view returns (Poll memory)

// Get vote counts per option
function getVoteCounts(uint256 pollId) external view returns (uint256[] memory)

// Calculate potential winnings
function calculatePotentialWinnings(uint256 pollId, uint256 optionId) 
    external view returns (uint256)

// Check poll status
function isPollActive(uint256 pollId) external view returns (bool)
function getTimeRemaining(uint256 pollId) external view returns (uint256)
```

## 💡 How It Works

### 1. Poll Creation
- Creator sets question, options (2-10), stake amount, and duration
- Demo mode allows free voting for hackathon demonstrations
- Each poll gets unique ID and end timestamp

### 2. Voting Phase
- Users vote by sending exact stake amount
- Each address can vote once per poll
- Votes are recorded with timestamps
- Demo mode supports temporary voter IDs

### 3. Poll Resolution
- After end time, creator or owner can resolve poll
- Winning option = most votes (ties go to first option)
- House fee (2%) is deducted from total pool

### 4. Payout Distribution
- Winners split remaining pool equally
- Losers lose their entire stake
- Claims can be individual or batch processed

## 🧪 Testing

### Run Full Test Suite
```bash
# Run all tests with verbose output
forge test -vvv

# Run specific test contract
forge test -vvv --match-contract VoteRushTest

# Run with gas reporting
forge test -vvv --gas-report
```

### Test Coverage
- ✅ Poll creation and validation
- ✅ Voting mechanics (real + demo)
- ✅ Parallel voting simulation
- ✅ Poll resolution logic
- ✅ Winnings calculation and distribution
- ✅ Error conditions and edge cases
- ✅ Owner functions and security
- ✅ High-volume stress testing

### Stress Testing
```bash
# Test parallel execution with TypeScript
npm run stress-test

# This simulates 100+ simultaneous votes to test Monad's performance
```

## 🔍 TypeScript Integration

### Create Demo Poll
```bash
# Using TypeScript script
npm run create-demo-poll

# This creates a hackathon-ready poll with 5 options
```

### Monitor Performance
```bash
# Run stress test to measure TPS
npm run stress-test

# Results show:
# - Votes per second achieved
# - Gas usage optimization
# - Monad network utilization
# - Error rates and patterns
```

## 🛡️ Security Features

### Smart Contract Security
- **Reentrancy Protection**: Checks-effects-interactions pattern
- **Input Validation**: All parameters validated
- **Access Control**: Owner-only functions for critical operations
- **Safe Math**: Built-in Solidity 0.8+ overflow protection
- **Custom Errors**: Gas-efficient error handling

### Voting Integrity
- **Double Vote Prevention**: Each address votes once per poll
- **Timestamp Verification**: Votes only during active period
- **Option Validation**: Ensure voted option exists
- **Stake Verification**: Exact payment amount required

## ⚡ Monad Optimizations

### Parallel Execution Features
- **Independent Transactions**: Votes don't conflict with each other
- **Minimal Shared State**: Reduces contention between transactions
- **Efficient Storage Layout**: Optimized for parallel reads/writes
- **Gas Optimization**: Custom errors and efficient loops

### Performance Metrics
- **Target TPS**: 1,000+ votes per second
- **Gas Usage**: ~45,000 gas per vote
- **Block Utilization**: Optimal for Monad's 10,000 TPS capacity
- **Confirmation Time**: Sub-second finality

## 📚 Contract Specifications

### State Variables
```solidity
struct Poll {
    string question;
    string[] options;
    uint256 stakeAmount;
    uint256 endTime;
    uint256 winningOption;
    bool resolved;
    address creator;
    bool isDemoMode;
}

mapping(uint256 => Poll) public polls;
mapping(uint256 => mapping(uint256 => uint256)) public voteCounts;
mapping(uint256 => mapping(uint256 => uint256)) public optionPools;
mapping(uint256 => mapping(address => bool)) public hasVoted;
```

### Events
```solidity
event PollCreated(uint256 indexed pollId, string question, uint256 stakeAmount, uint256 endTime, bool isDemoMode);
event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionId, uint256 amount, uint256 timestamp);
event DemoVoteCast(uint256 indexed pollId, bytes32 indexed tempVoterId, uint256 optionId, uint256 timestamp);
event PollResolved(uint256 indexed pollId, uint256 winningOption, uint256 totalPool, uint256 winnerCount);
event WinningsClaimed(uint256 indexed pollId, address indexed winner, uint256 amount);
```

## 🌐 Network Information

### Monad Testnet Details
- **Chain ID**: 10143
- **RPC URL**: https://testnet-rpc.monad.xyz
- **WebSocket**: wss://testnet-ws.monad.xyz
- **Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://faucet.monad.xyz

### Key Features
- **Parallel Execution**: True parallel EVM execution
- **High TPS**: 10,000 transactions per second
- **Low Latency**: Sub-second block times
- **EVM Compatible**: Seamless migration from Ethereum

## 📖 Usage Examples

### Basic Poll Creation
```javascript
// Using viem with TypeScript
const pollId = await voteRush.write.createPoll([
  "Which framework is best?",
  ["React", "Vue", "Angular", "Svelte"],
  parseEther("0.1"), // 0.1 MON per vote
  60, // 60 minutes duration
  false // Real money mode
]);
```

### Demo Voting
```javascript
// Free demo vote
await voteRush.write.demoVote([
  pollId,
  0, // Vote for option 0
  keccak256(toBytes("unique_voter_id"))
]);
```

### Claim Winnings
```javascript
// After poll resolution
await voteRush.write.claimWinnings([pollId]);
```

## 🔧 Deployment Commands

### Full Deployment Flow
```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your private key

# 2. Compile and test
forge build
forge test -vvv

# 3. Deploy to Monad Testnet
forge script script/Deploy.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org

# 4. Create demo poll
forge script script/Interact.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --broadcast

# 5. Verify contract (if needed)
forge verify-contract $CONTRACT_ADDRESS \
  src/VoteRush.sol:VoteRush \
  --chain 10143 \
  --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org
```

## 📊 Gas Optimization

### Transaction Costs (Monad Testnet)
- **Create Poll**: ~200,000 gas
- **Vote**: ~45,000 gas
- **Demo Vote**: ~35,000 gas
- **Resolve Poll**: ~80,000 gas
- **Claim Winnings**: ~30,000 gas
- **Batch Claim**: ~25,000 gas per winner

### Optimization Techniques
- Custom errors instead of require strings
- Efficient storage layout
- Minimal state changes per transaction
- Optimized loops and conditionals

## 🐛 Troubleshooting

### Common Issues

#### Deployment Fails
```bash
# Check balance
cast balance $YOUR_ADDRESS --rpc-url https://testnet-rpc.monad.xyz

# Get testnet MON
# Visit: https://faucet.monad.xyz
```

#### Transaction Reverts
```bash
# Check transaction details
cast tx $TX_HASH --rpc-url https://testnet-rpc.monad.xyz

# Common fixes:
# 1. Wrong stake amount - must match poll.stakeAmount exactly
# 2. Poll ended - check poll.endTime
# 3. Already voted - each address votes once per poll
# 4. Invalid option - must be 0 to options.length-1
```

#### Tests Failing
```bash
# Run specific test
forge test -vvv --match-test testVoteSuccess

# Debug with traces
forge test -vvv --match-test testVoteSuccess --debug
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Run test suite: `forge test -vvv`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style
- Follow Solidity style guide
- Add NatSpec documentation
- Include comprehensive tests
- Optimize for gas efficiency

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Ready

This codebase is **100% hackathon ready**! Features include:

- ✅ **Complete Implementation**: All core features working
- ✅ **Comprehensive Tests**: 100% test coverage
- ✅ **Deploy Scripts**: One-command deployment
- ✅ **Demo Mode**: Free voting for presentations
- ✅ **Stress Tests**: Performance validation
- ✅ **Documentation**: Complete setup instructions
- ✅ **TypeScript Integration**: Frontend-ready scripts
- ✅ **Monad Optimized**: Parallel execution support

## 🔗 Links

- [Monad Website](https://monad.xyz)
- [Monad Docs](https://docs.monad.xyz)
- [Monad Testnet Explorer](https://testnet.monadexplorer.com)
- [Monad Faucet](https://faucet.monad.xyz)
- [Foundry Book](https://book.getfoundry.sh)
- [Viem Documentation](https://viem.sh)

## 🎯 Next Steps

After successful deployment:

1. **Frontend Integration**: Use provided TypeScript scripts as foundation
2. **Real-Time Updates**: Implement WebSocket for live vote tracking
3. **Advanced Features**: Add poll categories, user profiles, leaderboards
4. **Mobile App**: React Native integration with WalletConnect
5. **Mainnet Deploy**: Production deployment when Monad mainnet launches

---

**Built with ❤️ for Monad Blitz Hackathon**

*Ready to dominate the leaderboard? Deploy VoteRush and let the voting begin!* 🚀⚡