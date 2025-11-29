// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VoteRush} from "../src/VoteRush.sol";

/**
 * @title Deploy Script for VoteRush
 * @notice Deploy VoteRush contract to Monad testnet
 * @dev Run with: forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --verifier sourcify --verifier-url $VERIFIER_URL
 */
contract DeployScript is Script {
    /**
     * @notice Main deployment function
     */
    function run() external {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying VoteRush contract...");
        console.log("Deployer address:", deployer);
        console.log("Deployer balance:", deployer.balance);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy VoteRush contract
        VoteRush voteRush = new VoteRush();
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Log deployment information
        console.log("VoteRush deployed successfully!");
        console.log("Contract address:", address(voteRush));
        console.log("Chain ID:", block.chainid);
        console.log("Gas price:", tx.gasprice);
        
        // Save deployment address to file for later use
        string memory contractAddress = vm.toString(address(voteRush));
        vm.writeFile("deployment-address.txt", contractAddress);
        
        console.log("\nNEXT STEPS:");
        console.log("1. Verify contract on block explorer");
        console.log("2. Create demo poll: forge script script/Interact.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast");
        console.log("3. Update .env with VOTE_RUSH_ADDRESS =", contractAddress);
        console.log("4. Test with: forge test -vvv");
        console.log("\nCopy this address for your .env:");
        console.log("VOTE_RUSH_ADDRESS=%s", contractAddress);
        
        // Additional deployment info
        console.log("\nContract Details:");
        console.log("- Owner:", voteRush.owner());
        console.log("- Poll count:", voteRush.pollCount());
        console.log("- House fee:", voteRush.HOUSE_FEE_PERCENT(), "%");
        
        // Monad-specific information
        console.log("\nMonad Blockchain Info:");
        console.log("- Network: Monad Testnet");
        console.log("- RPC: https://testnet-rpc.monad.xyz");
        console.log("- Explorer: https://testnet.monadexplorer.com");
        console.log("- Features: Parallel execution (10,000 TPS)");
        
        // Verification command reminder
        console.log("\nManual verification command:");
        console.log("forge verify-contract %s src/VoteRush.sol:VoteRush --chain 10143 --verifier sourcify --verifier-url $VERIFIER_URL", contractAddress);
    }
}