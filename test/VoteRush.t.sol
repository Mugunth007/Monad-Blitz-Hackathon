// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {VoteRush} from "../src/VoteRush.sol";

/**
 * @title VoteRush Test Suite
 * @notice Comprehensive tests for VoteRush smart contract
 * @dev Tests all functions, error conditions, and parallel execution scenarios
 */
contract VoteRushTest is Test {
    VoteRush public voteRush;
    
    // Events (copied from VoteRush contract for testing)
    event VoteCast(
        uint256 indexed pollId,
        address indexed voter,
        uint256 optionId,
        uint256 amount,
        uint256 timestamp
    );
    
    event DemoVoteCast(
        uint256 indexed pollId,
        bytes32 indexed tempVoterId,
        uint256 optionId,
        uint256 timestamp
    );
    
    event PollResolved(
        uint256 indexed pollId,
        uint256 winningOption,
        uint256 totalPool,
        uint256 winnerCount
    );
    
    event WinningsClaimed(
        uint256 indexed pollId,
        address indexed winner,
        uint256 amount
    );
    
    // Test addresses
    address public owner;
    address public alice;
    address public bob;
    address public charlie;
    address public dana;
    address public eve;
    
    // Test constants
    uint256 constant STAKE_AMOUNT = 0.1 ether;
    uint256 constant DURATION_MINUTES = 60;
    string[] options;
    
    /*//////////////////////////////////////////////////////////////
                                SETUP
    //////////////////////////////////////////////////////////////*/
    
    function setUp() public {
        // Create test addresses with funding
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        charlie = makeAddr("charlie");
        dana = makeAddr("dana");
        eve = makeAddr("eve");
        
        // Fund test addresses with MON
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
        vm.deal(dana, 10 ether);
        vm.deal(eve, 10 ether);
        
        // Deploy VoteRush contract
        voteRush = new VoteRush();
        
        // Setup test options
        options.push("Option A");
        options.push("Option B");
        options.push("Option C");
        
        console.log("Test setup complete");
        console.log("Contract deployed at:", address(voteRush));
        console.log("Owner:", voteRush.owner());
    }
    
    /*//////////////////////////////////////////////////////////////
                            POLL CREATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testCreatePoll() public {
        string memory question = "Test Question?";
        
        uint256 pollId = voteRush.createPoll(
            question,
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        assertEq(pollId, 0);
        assertEq(voteRush.pollCount(), 1);
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertEq(poll.question, question);
        assertEq(poll.options.length, 3);
        assertEq(poll.stakeAmount, STAKE_AMOUNT);
        assertEq(poll.creator, address(this));
        assertFalse(poll.isDemoMode);
        assertFalse(poll.resolved);
    }
    
    function testCreateDemoPoll() public {
        uint256 pollId = voteRush.createPoll(
            "Demo Question?",
            options,
            0,
            DURATION_MINUTES,
            true
        );
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertTrue(poll.isDemoMode);
        assertEq(poll.stakeAmount, 0);
    }
    
    function testCreatePollInvalidOptionsCount() public {
        string[] memory invalidOptions = new string[](1);
        invalidOptions[0] = "Only One";
        
        vm.expectRevert(VoteRush.InvalidOptionsCount.selector);
        voteRush.createPoll(
            "Invalid?",
            invalidOptions,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        string[] memory tooManyOptions = new string[](11);
        for (uint i = 0; i < 11; i++) {
            tooManyOptions[i] = string(abi.encodePacked("Option ", vm.toString(i)));
        }
        
        vm.expectRevert(VoteRush.InvalidOptionsCount.selector);
        voteRush.createPoll(
            "Too Many?",
            tooManyOptions,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
    }
    
    function testCreatePollInvalidDuration() public {
        vm.expectRevert(VoteRush.InvalidDuration.selector);
        voteRush.createPoll(
            "No Duration?",
            options,
            STAKE_AMOUNT,
            0,
            false
        );
    }
    
    /*//////////////////////////////////////////////////////////////
                                VOTING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testVoteSuccess() public {
        // Create poll
        uint256 pollId = voteRush.createPoll(
            "Test Vote?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Alice votes for option 1
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit VoteCast(pollId, alice, 1, STAKE_AMOUNT, block.timestamp);
        
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        // Check vote recorded
        (bool hasVoted, uint256 optionId, uint256 amount) = voteRush.getUserVote(pollId, alice);
        assertTrue(hasVoted);
        assertEq(optionId, 1);
        assertEq(amount, STAKE_AMOUNT);
        
        // Check vote counts
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        assertEq(voteCounts[1], 1);
        
        // Check option pools
        uint256[] memory optionPools = voteRush.getOptionPools(pollId);
        assertEq(optionPools[1], STAKE_AMOUNT);
        
        // Check total pool
        assertEq(voteRush.getTotalPool(pollId), STAKE_AMOUNT);
    }
    
    function testVoteIncorrectStake() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.prank(alice);
        vm.expectRevert(VoteRush.IncorrectStake.selector);
        voteRush.vote{value: STAKE_AMOUNT / 2}(pollId, 0);
    }
    
    function testVoteInvalidOption() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.prank(alice);
        vm.expectRevert(VoteRush.InvalidOption.selector);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 5);
    }
    
    function testVoteAlreadyVoted() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.startPrank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.expectRevert(VoteRush.AlreadyVoted.selector);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        vm.stopPrank();
    }
    
    function testVotePollEnded() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Fast forward past end time
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        
        vm.prank(alice);
        vm.expectRevert(VoteRush.PollEnded.selector);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
    }
    
    function testVoteNonexistentPoll() public {
        vm.prank(alice);
        vm.expectRevert(VoteRush.PollNotFound.selector);
        voteRush.vote{value: STAKE_AMOUNT}(999, 0);
    }
    
    /*//////////////////////////////////////////////////////////////
                            DEMO VOTING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testDemoVoteSuccess() public {
        uint256 pollId = voteRush.createPoll(
            "Demo Test?",
            options,
            0,
            DURATION_MINUTES,
            true
        );
        
        bytes32 tempVoterId = keccak256("demo_voter_1");
        
        vm.expectEmit(true, true, true, true);
        emit DemoVoteCast(pollId, tempVoterId, 2, block.timestamp);
        
        voteRush.demoVote(pollId, 2, tempVoterId);
        
        // Check vote counts increased
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        assertEq(voteCounts[2], 1);
        
        // Check no money in pools (demo mode)
        uint256[] memory optionPools = voteRush.getOptionPools(pollId);
        assertEq(optionPools[2], 0);
    }
    
    function testDemoVoteNotDemoMode() public {
        uint256 pollId = voteRush.createPoll(
            "Regular Poll?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.expectRevert(VoteRush.DemoModeOnly.selector);
        voteRush.demoVote(pollId, 0, keccak256("voter"));
    }
    
    function testDemoVoteAlreadyVoted() public {
        uint256 pollId = voteRush.createPoll(
            "Demo?",
            options,
            0,
            DURATION_MINUTES,
            true
        );
        
        bytes32 tempVoterId = keccak256("voter");
        
        voteRush.demoVote(pollId, 0, tempVoterId);
        
        vm.expectRevert(VoteRush.AlreadyVoted.selector);
        voteRush.demoVote(pollId, 1, tempVoterId);
    }
    
    /*//////////////////////////////////////////////////////////////
                            PARALLEL VOTING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testParallelVoting() public {
        uint256 pollId = voteRush.createPoll(
            "Parallel Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Simulate parallel votes from multiple users
        address[] memory voters = new address[](5);
        voters[0] = alice;
        voters[1] = bob;
        voters[2] = charlie;
        voters[3] = dana;
        voters[4] = eve;
        
        // All vote for different options simultaneously
        for (uint i = 0; i < voters.length; i++) {
            vm.prank(voters[i]);
            voteRush.vote{value: STAKE_AMOUNT}(pollId, i % 3); // Distribute votes among 3 options
        }
        
        // Verify all votes recorded
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        assertEq(voteCounts[0], 2); // Option 0: alice, dana
        assertEq(voteCounts[1], 2); // Option 1: bob, eve  
        assertEq(voteCounts[2], 1); // Option 2: charlie
        
        assertEq(voteRush.getTotalPool(pollId), STAKE_AMOUNT * 5);
    }
    
    function testMassParallelDemoVoting() public {
        uint256 pollId = voteRush.createPoll(
            "Mass Demo?",
            options,
            0,
            DURATION_MINUTES,
            true
        );
        
        // Simulate 100 parallel demo votes
        for (uint i = 0; i < 100; i++) {
            bytes32 tempVoterId = keccak256(abi.encodePacked("voter_", i));
            voteRush.demoVote(pollId, i % 3, tempVoterId);
        }
        
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        assertEq(voteCounts[0], 34); // 0, 3, 6, ... (34 votes)
        assertEq(voteCounts[1], 33); // 1, 4, 7, ... (33 votes)  
        assertEq(voteCounts[2], 33); // 2, 5, 8, ... (33 votes)
    }
    
    /*//////////////////////////////////////////////////////////////
                            POLL RESOLUTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testResolvePoll() public {
        uint256 pollId = voteRush.createPoll(
            "Resolve Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Cast votes with option 1 winning
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.prank(bob);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.prank(charlie);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        // Fast forward past end time
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        
        vm.expectEmit(true, true, true, true);
        emit PollResolved(pollId, 1, STAKE_AMOUNT * 3, 2);
        
        voteRush.resolvePoll(pollId);
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertTrue(poll.resolved);
        assertEq(poll.winningOption, 1);
        
        // Check house fee accumulated
        uint256 expectedHouseFee = (STAKE_AMOUNT * 3 * 2) / 100;
        assertEq(voteRush.houseBalance(), expectedHouseFee);
    }
    
    function testResolvePollNotCreator() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        
        vm.prank(alice);
        vm.expectRevert(VoteRush.NotPollCreator.selector);
        voteRush.resolvePoll(pollId);
    }
    
    function testResolvePollNotEnded() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.expectRevert(VoteRush.PollNotEnded.selector);
        voteRush.resolvePoll(pollId);
    }
    
    function testResolvePollAlreadyResolved() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        vm.expectRevert(VoteRush.AlreadyResolved.selector);
        voteRush.resolvePoll(pollId);
    }
    
    /*//////////////////////////////////////////////////////////////
                        WINNINGS CLAIMING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testClaimWinnings() public {
        uint256 pollId = voteRush.createPoll(
            "Winnings Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Alice and Bob vote for option 1 (winners)
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.prank(bob);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        // Charlie votes for option 0 (loser)
        vm.prank(charlie);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        // Resolve poll
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        // Calculate expected payout
        uint256 totalPool = STAKE_AMOUNT * 3;
        uint256 houseFee = (totalPool * 2) / 100;
        uint256 winnerPool = totalPool - houseFee;
        uint256 expectedPayout = winnerPool / 2; // 2 winners
        
        // Alice claims winnings
        uint256 aliceBalanceBefore = alice.balance;
        
        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit WinningsClaimed(pollId, alice, expectedPayout);
        
        voteRush.claimWinnings(pollId);
        
        uint256 aliceBalanceAfter = alice.balance;
        assertEq(aliceBalanceAfter - aliceBalanceBefore, expectedPayout);
    }
    
    function testClaimWinningsNotWinner() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Alice votes for option 0
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        // Bob and Charlie both vote for option 1 to make it win
        vm.prank(bob);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.prank(charlie);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId); // Option 1 wins with 2 votes vs 1
        
        // Alice voted for losing option 0
        vm.prank(alice);
        vm.expectRevert(VoteRush.NoWinnings.selector);
        voteRush.claimWinnings(pollId);
    }
    
    function testClaimWinningsAlreadyClaimed() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        vm.startPrank(alice);
        voteRush.claimWinnings(pollId);
        
        vm.expectRevert(VoteRush.AlreadyClaimed.selector);
        voteRush.claimWinnings(pollId);
        vm.stopPrank();
    }
    
    function testClaimWinningsDemoMode() public {
        uint256 pollId = voteRush.createPoll(
            "Demo?",
            options,
            0,
            DURATION_MINUTES,
            true
        );
        
        voteRush.demoVote(pollId, 0, keccak256("voter"));
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        vm.expectRevert(VoteRush.NoWinnings.selector);
        voteRush.claimWinnings(pollId);
    }
    
    /*//////////////////////////////////////////////////////////////
                        BATCH CLAIMING TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testBatchClaimWinnings() public {
        uint256 pollId = voteRush.createPoll(
            "Batch Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        address[] memory winners = new address[](3);
        winners[0] = alice;
        winners[1] = bob;
        winners[2] = charlie;
        
        // All vote for option 0
        for (uint i = 0; i < winners.length; i++) {
            vm.prank(winners[i]);
            voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        }
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        // Batch claim
        voteRush.batchClaimWinnings(pollId, winners);
        
        // Verify all claimed
        uint256 totalPool = STAKE_AMOUNT * 3;
        uint256 houseFee = (totalPool * 2) / 100;
        uint256 winnerPool = totalPool - houseFee;
        uint256 expectedPayout = winnerPool / 3;
        
        for (uint i = 0; i < winners.length; i++) {
            // Can't claim again
            vm.prank(winners[i]);
            vm.expectRevert(VoteRush.AlreadyClaimed.selector);
            voteRush.claimWinnings(pollId);
        }
    }
    
    function testBatchClaimNotCreator() public {
        uint256 pollId = voteRush.createPoll(
            "Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        address[] memory winners = new address[](1);
        winners[0] = alice;
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        vm.prank(alice);
        vm.expectRevert(VoteRush.NotPollCreator.selector);
        voteRush.batchClaimWinnings(pollId, winners);
    }
    
    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testGetPoll() public {
        uint256 pollId = voteRush.createPoll(
            "View Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertEq(poll.question, "View Test?");
        assertEq(poll.options.length, 3);
        assertEq(poll.stakeAmount, STAKE_AMOUNT);
    }
    
    function testCalculatePotentialWinnings() public {
        uint256 pollId = voteRush.createPoll(
            "Potential Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Add some votes
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.prank(bob);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.prank(charlie);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        // Calculate potential for option 1 (2 votes)
        uint256 potential = voteRush.calculatePotentialWinnings(pollId, 1);
        
        uint256 totalPool = STAKE_AMOUNT * 3;
        uint256 houseFee = (totalPool * 2) / 100;
        uint256 expectedPayout = (totalPool - houseFee) / 2; // 2 votes for option 1
        
        assertEq(potential, expectedPayout);
    }
    
    function testTimeRemaining() public {
        uint256 pollId = voteRush.createPoll(
            "Time Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        uint256 remaining = voteRush.getTimeRemaining(pollId);
        assertEq(remaining, DURATION_MINUTES * 60);
        
        assertTrue(voteRush.isPollActive(pollId));
        
        // Fast forward
        vm.warp(block.timestamp + 30 * 60); // 30 minutes
        remaining = voteRush.getTimeRemaining(pollId);
        assertEq(remaining, 30 * 60);
        
        // Past end time
        vm.warp(block.timestamp + 31 * 60);
        remaining = voteRush.getTimeRemaining(pollId);
        assertEq(remaining, 0);
        
        assertFalse(voteRush.isPollActive(pollId));
    }
    
    /*//////////////////////////////////////////////////////////////
                            OWNER FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testWithdrawHouseFees() public {
        uint256 pollId = voteRush.createPoll(
            "Fee Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        uint256 expectedFee = (STAKE_AMOUNT * 2) / 100;
        assertEq(voteRush.houseBalance(), expectedFee);
        
        uint256 ownerBalanceBefore = address(this).balance;
        voteRush.withdrawHouseFees();
        uint256 ownerBalanceAfter = address(this).balance;
        
        assertEq(ownerBalanceAfter - ownerBalanceBefore, expectedFee);
        assertEq(voteRush.houseBalance(), 0);
    }
    
    function testTransferOwnership() public {
        assertEq(voteRush.owner(), address(this));
        
        voteRush.transferOwnership(alice);
        assertEq(voteRush.owner(), alice);
    }
    
    function testEmergencyResolvePoll() public {
        uint256 pollId = voteRush.createPoll(
            "Emergency Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        // Emergency resolve before end time
        voteRush.emergencyResolvePoll(pollId);
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertTrue(poll.resolved);
        assertEq(poll.winningOption, 1);
    }
    
    /*//////////////////////////////////////////////////////////////
                            EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testPollWithTiedVotes() public {
        uint256 pollId = voteRush.createPoll(
            "Tie Test?",
            options,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        // Create tie between options 0 and 1
        vm.prank(alice);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 0);
        
        vm.prank(bob);
        voteRush.vote{value: STAKE_AMOUNT}(pollId, 1);
        
        vm.warp(block.timestamp + DURATION_MINUTES * 60 + 1);
        voteRush.resolvePoll(pollId);
        
        // First option (0) should win in case of tie due to loop logic
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertEq(poll.winningOption, 0);
    }
    
    function testLargeNumberOfOptions() public {
        string[] memory manyOptions = new string[](10);
        for (uint i = 0; i < 10; i++) {
            manyOptions[i] = string(abi.encodePacked("Option ", vm.toString(i)));
        }
        
        uint256 pollId = voteRush.createPoll(
            "Many Options?",
            manyOptions,
            STAKE_AMOUNT,
            DURATION_MINUTES,
            false
        );
        
        VoteRush.Poll memory poll = voteRush.getPoll(pollId);
        assertEq(poll.options.length, 10);
    }
    
    /*//////////////////////////////////////////////////////////////
                            STRESS TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testHighVolumeVoting() public {
        uint256 pollId = voteRush.createPoll(
            "High Volume?",
            options,
            0.01 ether, // Lower stake for stress test
            DURATION_MINUTES,
            false
        );
        
        // Create 50 voters and fund them
        address[] memory voters = new address[](50);
        for (uint i = 0; i < 50; i++) {
            voters[i] = makeAddr(string(abi.encodePacked("voter", vm.toString(i))));
            vm.deal(voters[i], 1 ether);
        }
        
        // All vote simultaneously
        for (uint i = 0; i < 50; i++) {
            vm.prank(voters[i]);
            voteRush.vote{value: 0.01 ether}(pollId, i % 3);
        }
        
        // Verify all votes counted
        uint256[] memory voteCounts = voteRush.getVoteCounts(pollId);
        assertEq(voteCounts[0], 17); // 0, 3, 6, ...
        assertEq(voteCounts[1], 17); // 1, 4, 7, ...
        assertEq(voteCounts[2], 16); // 2, 5, 8, ...
        
        assertEq(voteRush.getTotalPool(pollId), 0.01 ether * 50);
    }
    
    /*//////////////////////////////////////////////////////////////
                            HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    // Allow contract to receive MON
    receive() external payable {}
    
    // Helper function to create funded address
    function createFundedAddress(string memory name) internal returns (address) {
        address addr = makeAddr(name);
        vm.deal(addr, 10 ether);
        return addr;
    }
}