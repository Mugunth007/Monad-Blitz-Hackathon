# 🗳️ VoteWars – On-Chain Battle Voting System
Real-time blockchain voting battles powered by **Monad**.

## 📌 Overview
**VoteWars** is a real-time, on-chain voting battle where users vote between two opponents (Team A vs Team B).  
Every vote is an actual blockchain transaction recorded on the **Monad** network.  
The UI updates instantly using smart contract events, creating a fast, interactive battle experience.

This project demonstrates **Monad’s ultra-fast performance**, real-time UX, and on-chain event streaming — ideal for hackathons, demos, and decentralized social apps.

---

## 🚀 Features
- ⚡ Real-time on-chain voting  
- 👥 Two-sided battles (e.g., Cat vs Dog, Messi vs Ronaldo)  
- 📡 Live vote updates via contract events  
- 🧾 Battle creation with title, images, and duration  
- 🏆 Battle results with visual animations  
- 🎖️ Optional: Mintable Witness NFT  
- 🔐 Wallet connection (MetaMask / Monad-compatible)  
- 🖥️ Modern animated UI  

---

## 🏗️ Tech Stack

### **Frontend**
- React / Next.js  
- Wagmi / Viem  
- TailwindCSS  

### **Smart Contracts**
- Solidity  
- Hardhat / Foundry  
- Monad Testnet  

### **Infrastructure**
- WebSocket RPC for real-time updates  
- Optional: IPFS for image hosting  

---

## 📦 Project Structure

```
/contracts        → Solidity smart contracts  
/frontend         → React/Next.js frontend  
/scripts          → Deployment scripts  
/assets           → Images / logos for battles  
```

---

## ⚙️ Smart Contract Summary

### **BattleManager.sol**
Handles creation and management of battles.

#### Key Functions
- `createBattle(string teamA, string teamB, uint duration)`  
- `vote(uint battleId, uint8 teamId)`  
- `getBattle(uint battleId)`  
- `getVotes(uint battleId)`

#### Events
- `BattleCreated(uint battleId)`  
- `VoteCast(uint battleId, address voter, uint8 team)`

#### Optional Enhancements
- NFT reward contract  
- Weighted voting via tokens  
- Anti-spam vote limits  

---

## 🧩 How It Works

1. Admin creates a battle choosing team names + images.  
2. Users join and connect their wallet.  
3. Voting triggers an **on-chain transaction**.  
4. Contract emits a `VoteCast` event.  
5. Frontend listens and updates bars in real-time.  
6. Timer ends → winner determined.  
7. Users can mint a “Battle Witness NFT” (optional).  

---

## 🧪 Running Locally

### 1. Clone the repository
```bash
git clone https://github.com/your-username/votewars.git
cd votewars
```

### 2. Install frontend dependencies
```bash
cd frontend
npm install
```

### 3. Configure environment variables
Create a `.env.local` file:
```
NEXT_PUBLIC_RPC_URL=<monad-testnet-rpc>
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-contract-address>
```

### 4. Start the frontend
```bash
npm run dev
```

### 5. Deploy smart contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network monad
```

---

## 🧭 UI Screens

### **Home Page**
- List of active battles  
- Create new battle (admin)

### **Battle Room**
- Team A vs Team B  
- Real-time vote bars  
- Countdown timer  
- Vote buttons  

### **Result Screen**
- Highlight winner  
- Final vote percentages  
- Share result  
- Mint Witness NFT button (optional)

---

## 🧯 Troubleshooting

### Votes not updating?
- Check WebSocket RPC URL  
- Ensure `VoteCast` event is emitted  
- Verify frontend listener subscription  

### Contract deployment fails?
- Check Hardhat network config  
- Ensure your Monad testnet wallet has funds  

---

## 🏆 Built for Hackathons
VoteWars is designed to:
- Demonstrate **Monad’s speed**  
- Deliver **fun, interactive, live** on-chain UX  
- Impress judges in under **one minute**  

---

## 📜 License
MIT License
```

---

If you want, I can also generate **Architecture Diagram**, **Contracts.md**, **Pitch Deck**, or **UI mockups** in `.md` format.