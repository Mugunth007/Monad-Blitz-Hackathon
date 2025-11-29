// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {VoteRush} from "../src/VoteRush.sol";

/**
 * @title Interaction Script for VoteRush
 * @notice Create demo poll for hackathon demonstration
 * @dev Run after deployment: forge script script/Interact.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
contract InteractScript is Script {
    /**
     * @notice Create hackathon demo poll
     */
    function run() external {
        // Get deployed contract address from environment
        address payable voteRushAddress = payable(vm.envAddress("VOTE_RUSH_ADDRESS"));
        VoteRush voteRush = VoteRush(voteRushAddress);
        
        // Get private key for transactions
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address creator = vm.addr(privateKey);
        
        console.log("Creating demo poll on VoteRush...");
        console.log("Contract address:", voteRushAddress);
        console.log("Creator address:", creator);
        
        // Poll details for hackathon
        string memory question = "Which project will win 1st place at Monad Blitz?";
        string[] memory options = new string[](5);
        options[0] = "VoteRush";
        options[1] = "Project A";
        options[2] = "Project B"; 
        options[3] = "Project C";
        options[4] = "Project D";
        
        uint256 stakeAmount = 0; // Free voting
        uint256 durationMinutes = 60; // 1 hour
        bool isDemoMode = true; // Demo mode for hackathon
        
        // Start broadcasting
        vm.startBroadcast(privateKey);
        
        // Create the demo poll
        uint256 pollId = voteRush.createPoll(
            question,
            options,
            stakeAmount,
            durationMinutes,
            isDemoMode
        );
        
        // Stop broadcasting
        vm.stopBroadcast();
        
        // Display results
        console.log("\nDemo poll created successfully!");
        console.log("Poll ID:", pollId);
        console.log("Question:", question);
        console.log("Stake amount:", stakeAmount, "MON (Free)");
        console.log("Duration:", durationMinutes, "minutes");
        console.log("Demo mode:", isDemoMode ? "Enabled" : "Disabled");
        
        // Show options
        console.log("\nVoting Options:");
        for (uint i = 0; i < options.length; i++) {
            console.log("   %d. %s", i, options[i]);
        }
        
        // Get poll details from contract
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        console.log("\nPoll Details from Contract:");
        console.log("- Question:", poll.question);
        console.log("- Options count:", poll.options.length);
        console.log("- Stake amount:", poll.stakeAmount);
        console.log("- End time:", poll.endTime);
        console.log("- Creator:", poll.creator);
        console.log("- Demo mode:", poll.isDemoMode);
        console.log("- Resolved:", poll.resolved);
        
        // Calculate end time
        uint256 currentTime = block.timestamp;
        uint256 timeRemaining = voteRush.getTimeRemaining(pollId);
        console.log("\nTiming Info:");
        console.log("- Current time:", currentTime);
        console.log("- End time:", poll.endTime);
        console.log("- Time remaining:", timeRemaining, "seconds");
        console.log("- Is active:", voteRush.isPollActive(pollId));
        
        // Demo voting instructions
        console.log("\nDemo Voting Instructions:");
        console.log("Since this is demo mode, anyone can vote for free!");
        console.log("Use the demoVote function with a unique tempVoterId");
        console.log("");
        console.log("Example votes you can cast:");
        console.log("voteRush.demoVote(%d, 0, keccak256('voter1')); // Vote for VoteRush", pollId);
        console.log("voteRush.demoVote(%d, 1, keccak256('voter2')); // Vote for Project A", pollId);
        console.log("voteRush.demoVote(%d, 2, keccak256('voter3')); // Vote for Project B", pollId);
        
        // Stress testing info
        console.log("\nFor Stress Testing:");
        console.log("Run: npm run stress-test (after setting up TypeScript scripts)");
        console.log("This will simulate 100 parallel votes to test Monad's performance");
        
        // Frontend integration
        console.log("\nFrontend Integration:");
        console.log("Poll ID to display: %d", pollId);
        console.log("Contract address: %s", voteRushAddress);
        console.log("Chain ID: 10143 (Monad Testnet)");
        
        // Save poll info for frontend/scripts
        string memory pollInfo = string(abi.encodePacked(
            "POLL_ID=", vm.toString(pollId), "\n",
            "CONTRACT_ADDRESS=", vm.toString(voteRushAddress), "\n",
            "QUESTION=", question, "\n",
            "OPTIONS_COUNT=", vm.toString(options.length), "\n",
            "IS_DEMO=true\n",
            "DURATION_MINUTES=", vm.toString(durationMinutes)
        ));
        
        vm.writeFile("demo-poll-info.txt", pollInfo);
        console.log("\nPoll info saved to: demo-poll-info.txt");
        
        // Next steps
        console.log("\nNEXT STEPS:");
        console.log("1. Test demo voting with different tempVoterIds");
        console.log("2. Wait for poll to end (60 minutes)");
        console.log("3. Resolve poll: voteRush.resolvePoll(%d)", pollId);
        console.log("4. Check results: voteRush.getVoteCounts(%d)", pollId);
        console.log("5. Run stress test: npm run stress-test");
    }
    
    /**
     * @notice Cast some demo votes for testing (optional)
     */
    function castDemoVotes() external {
        address payable voteRushAddress = payable(vm.envAddress("VOTE_RUSH_ADDRESS"));
        VoteRush voteRush = VoteRush(voteRushAddress);
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        
        // Assume poll ID 0 for first demo poll
        uint256 pollId = 0;
        
        console.log("Casting demo votes...");
        
        vm.startBroadcast(privateKey);
        
        // Cast several demo votes
        voteRush.demoVote(pollId, 0, keccak256("demo_voter_1")); // VoteRush
        voteRush.demoVote(pollId, 0, keccak256("demo_voter_2")); // VoteRush
        voteRush.demoVote(pollId, 1, keccak256("demo_voter_3")); // Project A
        voteRush.demoVote(pollId, 2, keccak256("demo_voter_4")); // Project B
        voteRush.demoVote(pollId, 0, keccak256("demo_voter_5")); // VoteRush
        
        vm.stopBroadcast();
        
        console.log("Demo votes cast successfully!");
        
        // Show vote counts
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        console.log("\nCurrent Vote Counts:");
        for (uint i = 0; i < voteCounts.length; i++) {
            console.log("   Option %d: %d votes", i, voteCounts[i]);
        }
    }
}