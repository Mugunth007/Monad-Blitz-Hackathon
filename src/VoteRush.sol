// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title VoteRush
 * @notice A real-time voting dApp on Monad blockchain where users vote with money stakes
 * @dev Winners split the pool, losers lose their stake. Optimized for Monad's parallel execution
 * @author VoteRush Team
 */
contract VoteRush {
    /*//////////////////////////////////////////////////////////////
                                STRUCTURES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a poll
     * @param question The poll question
     * @param options Array of voting options (2-10 allowed)
     * @param stakeAmount Cost per vote in MON (0 for free demo mode)
     * @param endTime Unix timestamp when voting ends
     * @param winningOption Index of winning option (set after resolution)
     * @param resolved Whether the poll has been resolved
     * @param creator Address that created the poll
     * @param isDemoMode Whether this is a free demo poll
     */
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

    /**
     * @notice Structure representing a vote
     * @param voter Address of the voter
     * @param optionId Index of chosen option
     * @param amount Amount staked (MON)
     * @param timestamp When the vote was cast
     */
    struct Vote {
        address voter;
        uint256 optionId;
        uint256 amount;
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                                STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of poll ID to Poll struct
    mapping(uint256 => Poll) public polls;
    
    /// @notice Vote counts for each option: pollId => optionId => count
    mapping(uint256 => mapping(uint256 => uint256)) public voteCounts;
    
    /// @notice Total stake for each option: pollId => optionId => total staked
    mapping(uint256 => mapping(uint256 => uint256)) public optionPools;
    
    /// @notice User votes: pollId => user => vote
    mapping(uint256 => mapping(address => Vote)) public userVotes;
    
    /// @notice Track if user has voted: pollId => user => voted?
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    
    /// @notice Demo votes using temp IDs: pollId => tempId => vote
    mapping(uint256 => mapping(bytes32 => Vote)) public demoVotes;
    
    /// @notice Demo vote tracking: pollId => tempId => voted?
    mapping(uint256 => mapping(bytes32 => bool)) public hasDemoVoted;
    
    /// @notice Track if user has claimed winnings: pollId => user => claimed?
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    /// @notice Total number of polls created
    uint256 public pollCount;
    
    /// @notice House fee percentage (2%)
    uint256 public constant HOUSE_FEE_PERCENT = 2;
    
    /// @notice Accumulated house fees
    uint256 public houseBalance;
    
    /// @notice Contract owner (for house fee withdrawal)
    address public owner;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emitted when a new poll is created
     * @param pollId Unique poll identifier
     * @param question The poll question
     * @param stakeAmount Cost per vote
     * @param endTime When voting ends
     * @param isDemoMode Whether it's a demo poll
     */
    event PollCreated(
        uint256 indexed pollId,
        string question,
        uint256 stakeAmount,
        uint256 endTime,
        bool isDemoMode
    );

    /**
     * @notice Emitted when a vote is cast
     * @param pollId Poll identifier
     * @param voter Address of voter
     * @param optionId Chosen option
     * @param amount Amount staked
     * @param timestamp Vote timestamp
     */
    event VoteCast(
        uint256 indexed pollId,
        address indexed voter,
        uint256 optionId,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a demo vote is cast
     * @param pollId Poll identifier
     * @param tempVoterId Temporary voter ID
     * @param optionId Chosen option
     * @param timestamp Vote timestamp
     */
    event DemoVoteCast(
        uint256 indexed pollId,
        bytes32 indexed tempVoterId,
        uint256 optionId,
        uint256 timestamp
    );

    /**
     * @notice Emitted when a poll is resolved
     * @param pollId Poll identifier
     * @param winningOption Winning option index
     * @param totalPool Total stake amount
     * @param winnerCount Number of winners
     */
    event PollResolved(
        uint256 indexed pollId,
        uint256 winningOption,
        uint256 totalPool,
        uint256 winnerCount
    );

    /**
     * @notice Emitted when winnings are claimed
     * @param pollId Poll identifier
     * @param winner Address of winner
     * @param amount Payout amount
     */
    event WinningsClaimed(
        uint256 indexed pollId,
        address indexed winner,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error PollNotFound();
    error PollEnded();
    error PollNotEnded();
    error AlreadyVoted();
    error InvalidOption();
    error IncorrectStake();
    error PollNotResolved();
    error AlreadyResolved();
    error NoWinnings();
    error NotPollCreator();
    error InvalidOptionsCount();
    error InvalidDuration();
    error TransferFailed();
    error AlreadyClaimed();
    error NotOwner();
    error DemoModeOnly();

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier pollExists(uint256 pollId) {
        if (pollId >= pollCount) revert PollNotFound();
        _;
    }

    modifier pollActive(uint256 pollId) {
        if (block.timestamp >= polls[pollId].endTime) revert PollEnded();
        _;
    }

    modifier pollEnded(uint256 pollId) {
        if (block.timestamp < polls[pollId].endTime) revert PollNotEnded();
        _;
    }

    modifier pollResolved(uint256 pollId) {
        if (!polls[pollId].resolved) revert PollNotResolved();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                                CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                            POLL CREATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Create a new poll
     * @param question The poll question
     * @param options Array of voting options
     * @param stakeAmount Cost per vote in MON (0 for demo mode)
     * @param durationMinutes How long the poll runs
     * @param isDemoMode Whether this is a free demo poll
     * @return pollId The unique poll identifier
     */
    function createPoll(
        string calldata question,
        string[] calldata options,
        uint256 stakeAmount,
        uint256 durationMinutes,
        bool isDemoMode
    ) external returns (uint256 pollId) {
        // Validate options count (2-10 allowed)
        if (options.length < 2 || options.length > 10) {
            revert InvalidOptionsCount();
        }
        
        // Validate duration
        if (durationMinutes == 0) {
            revert InvalidDuration();
        }

        pollId = pollCount++;
        uint256 endTime = block.timestamp + (durationMinutes * 60);

        // Store poll data
        polls[pollId] = Poll({
            question: question,
            options: options,
            stakeAmount: stakeAmount,
            endTime: endTime,
            winningOption: 0,
            resolved: false,
            creator: msg.sender,
            isDemoMode: isDemoMode
        });

        emit PollCreated(pollId, question, stakeAmount, endTime, isDemoMode);
    }

    /*//////////////////////////////////////////////////////////////
                                VOTING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Vote on a poll with MON stake
     * @param pollId The poll to vote on
     * @param optionId The option to vote for (0-based index)
     */
    function vote(uint256 pollId, uint256 optionId) 
        external 
        payable 
        pollExists(pollId) 
        pollActive(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Check if already voted
        if (hasVoted[pollId][msg.sender]) {
            revert AlreadyVoted();
        }
        
        // Validate option
        if (optionId >= poll.options.length) {
            revert InvalidOption();
        }
        
        // Check stake amount
        if (msg.value != poll.stakeAmount) {
            revert IncorrectStake();
        }

        // Record vote
        hasVoted[pollId][msg.sender] = true;
        userVotes[pollId][msg.sender] = Vote({
            voter: msg.sender,
            optionId: optionId,
            amount: msg.value,
            timestamp: block.timestamp
        });

        // Update counts and pools
        voteCounts[pollId][optionId]++;
        optionPools[pollId][optionId] += msg.value;

        emit VoteCast(pollId, msg.sender, optionId, msg.value, block.timestamp);
    }

    /**
     * @notice Vote in demo mode (free, no wallet required)
     * @param pollId The poll to vote on
     * @param optionId The option to vote for
     * @param tempVoterId Temporary identifier for demo voter
     */
    function demoVote(
        uint256 pollId, 
        uint256 optionId, 
        bytes32 tempVoterId
    ) 
        external 
        pollExists(pollId) 
        pollActive(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Only allow demo votes in demo mode
        if (!poll.isDemoMode) {
            revert DemoModeOnly();
        }
        
        // Check if already voted with this temp ID
        if (hasDemoVoted[pollId][tempVoterId]) {
            revert AlreadyVoted();
        }
        
        // Validate option
        if (optionId >= poll.options.length) {
            revert InvalidOption();
        }

        // Record demo vote
        hasDemoVoted[pollId][tempVoterId] = true;
        demoVotes[pollId][tempVoterId] = Vote({
            voter: address(0), // No real address for demo
            optionId: optionId,
            amount: 0,
            timestamp: block.timestamp
        });

        // Update vote counts (but not pools since no money)
        voteCounts[pollId][optionId]++;

        emit DemoVoteCast(pollId, tempVoterId, optionId, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            POLL RESOLUTION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Resolve a poll and determine the winner
     * @param pollId The poll to resolve
     */
    function resolvePoll(uint256 pollId) 
        external 
        pollExists(pollId) 
        pollEnded(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Only creator or owner can resolve
        if (msg.sender != poll.creator && msg.sender != owner) {
            revert NotPollCreator();
        }
        
        // Check if already resolved
        if (poll.resolved) {
            revert AlreadyResolved();
        }

        // Find winning option (most votes)
        uint256 winningOption = 0;
        uint256 maxVotes = voteCounts[pollId][0];
        
        for (uint256 i = 1; i < poll.options.length; i++) {
            if (voteCounts[pollId][i] > maxVotes) {
                maxVotes = voteCounts[pollId][i];
                winningOption = i;
            }
        }

        // Mark as resolved
        poll.resolved = true;
        poll.winningOption = winningOption;

        // Calculate house fee for non-demo polls
        uint256 totalPool = getTotalPool(pollId);
        if (totalPool > 0 && !poll.isDemoMode) {
            uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
            houseBalance += houseFee;
        }

        emit PollResolved(pollId, winningOption, totalPool, maxVotes);
    }

    /*//////////////////////////////////////////////////////////////
                            CLAIMING WINNINGS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Claim winnings for a resolved poll
     * @param pollId The poll to claim winnings from
     */
    function claimWinnings(uint256 pollId) 
        external 
        pollExists(pollId) 
        pollResolved(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Demo mode polls have no winnings
        if (poll.isDemoMode) {
            revert NoWinnings();
        }
        
        // Check if user voted and voted for winning option
        if (!hasVoted[pollId][msg.sender]) {
            revert NoWinnings();
        }
        
        Vote storage userVote = userVotes[pollId][msg.sender];
        if (userVote.optionId != poll.winningOption) {
            revert NoWinnings();
        }
        
        // Check if already claimed
        if (hasClaimed[pollId][msg.sender]) {
            revert AlreadyClaimed();
        }

        // Mark as claimed
        hasClaimed[pollId][msg.sender] = true;

        // Calculate payout
        uint256 totalPool = getTotalPool(pollId);
        uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
        uint256 winnerPool = totalPool - houseFee;
        uint256 winnerCount = voteCounts[pollId][poll.winningOption];
        uint256 payout = winnerPool / winnerCount;

        // Transfer payout
        (bool success, ) = payable(msg.sender).call{value: payout}("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(pollId, msg.sender, payout);
    }

    /**
     * @notice Batch claim winnings for multiple winners (gas efficient)
     * @param pollId The poll to process payouts for
     * @param winners Array of winner addresses
     */
    function batchClaimWinnings(uint256 pollId, address[] calldata winners) 
        external 
        pollExists(pollId) 
        pollResolved(pollId) 
    {
        Poll storage poll = polls[pollId];
        
        // Only creator can batch claim
        if (msg.sender != poll.creator) {
            revert NotPollCreator();
        }
        
        // Demo mode polls have no winnings
        if (poll.isDemoMode) {
            revert NoWinnings();
        }

        // Calculate payout once
        uint256 totalPool = getTotalPool(pollId);
        uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
        uint256 winnerPool = totalPool - houseFee;
        uint256 winnerCount = voteCounts[pollId][poll.winningOption];
        uint256 payout = winnerPool / winnerCount;

        for (uint256 i = 0; i < winners.length; i++) {
            address winner = winners[i];
            
            // Validate winner
            if (!hasVoted[pollId][winner] || 
                hasClaimed[pollId][winner] ||
                userVotes[pollId][winner].optionId != poll.winningOption) {
                continue;
            }

            // Mark as claimed and transfer
            hasClaimed[pollId][winner] = true;
            (bool success, ) = payable(winner).call{value: payout}("");
            if (success) {
                emit WinningsClaimed(pollId, winner, payout);
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                                VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get complete poll data
     * @param pollId The poll to query
     * @return poll The poll struct
     */
    function getPoll(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (Poll memory poll) 
    {
        return polls[pollId];
    }

    /**
     * @notice Get vote counts for all options
     * @param pollId The poll to query
     * @return counts Array of vote counts per option
     */
    function getVoteCounts(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (uint256[] memory counts) 
    {
        uint256 optionCount = polls[pollId].options.length;
        counts = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            counts[i] = voteCounts[pollId][i];
        }
    }

    /**
     * @notice Get stake pools for all options
     * @param pollId The poll to query
     * @return pools Array of total stakes per option
     */
    function getOptionPools(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (uint256[] memory pools) 
    {
        uint256 optionCount = polls[pollId].options.length;
        pools = new uint256[](optionCount);
        
        for (uint256 i = 0; i < optionCount; i++) {
            pools[i] = optionPools[pollId][i];
        }
    }

    /**
     * @notice Get total pool size for a poll
     * @param pollId The poll to query
     * @return total Total stake across all options
     */
    function getTotalPool(uint256 pollId) 
        public 
        view 
        pollExists(pollId) 
        returns (uint256 total) 
    {
        uint256 optionCount = polls[pollId].options.length;
        
        for (uint256 i = 0; i < optionCount; i++) {
            total += optionPools[pollId][i];
        }
    }

    /**
     * @notice Calculate potential winnings if an option wins
     * @param pollId The poll to query
     * @param optionId The option to calculate for
     * @return payout Potential payout per vote
     */
    function calculatePotentialWinnings(uint256 pollId, uint256 optionId) 
        external 
        view 
        pollExists(pollId) 
        returns (uint256 payout) 
    {
        if (polls[pollId].isDemoMode || voteCounts[pollId][optionId] == 0) {
            return 0;
        }

        uint256 totalPool = getTotalPool(pollId);
        uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
        uint256 winnerPool = totalPool - houseFee;
        uint256 winnerCount = voteCounts[pollId][optionId];
        
        return winnerPool / winnerCount;
    }

    /**
     * @notice Get user's vote for a poll
     * @param pollId The poll to query
     * @param user The user to query
     * @return voted Whether user has voted
     * @return optionId The option they voted for
     * @return amount The amount they staked
     */
    function getUserVote(uint256 pollId, address user) 
        external 
        view 
        pollExists(pollId) 
        returns (bool voted, uint256 optionId, uint256 amount) 
    {
        voted = hasVoted[pollId][user];
        if (voted) {
            Vote storage userVote = userVotes[pollId][user];
            optionId = userVote.optionId;
            amount = userVote.amount;
        }
    }

    /**
     * @notice Check if a poll is currently active
     * @param pollId The poll to check
     * @return active Whether the poll is active
     */
    function isPollActive(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (bool active) 
    {
        return block.timestamp < polls[pollId].endTime;
    }

    /**
     * @notice Get time remaining for a poll
     * @param pollId The poll to check
     * @return timeLeft Seconds until poll ends (0 if ended)
     */
    function getTimeRemaining(uint256 pollId) 
        external 
        view 
        pollExists(pollId) 
        returns (uint256 timeLeft) 
    {
        uint256 endTime = polls[pollId].endTime;
        if (block.timestamp >= endTime) {
            return 0;
        }
        return endTime - block.timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                            OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraw accumulated house fees (owner only)
     */
    function withdrawHouseFees() external onlyOwner {
        uint256 amount = houseBalance;
        houseBalance = 0;
        
        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /**
     * @notice Transfer ownership (owner only)
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /*//////////////////////////////////////////////////////////////
                            EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Emergency function to resolve stuck polls (owner only)
     * @param pollId The poll to force resolve
     */
    function emergencyResolvePoll(uint256 pollId) external onlyOwner pollExists(pollId) {
        Poll storage poll = polls[pollId];
        
        if (poll.resolved) {
            revert AlreadyResolved();
        }

        // Find winning option
        uint256 winningOption = 0;
        uint256 maxVotes = voteCounts[pollId][0];
        
        for (uint256 i = 1; i < poll.options.length; i++) {
            if (voteCounts[pollId][i] > maxVotes) {
                maxVotes = voteCounts[pollId][i];
                winningOption = i;
            }
        }

        poll.resolved = true;
        poll.winningOption = winningOption;

        // Calculate house fee
        uint256 totalPool = getTotalPool(pollId);
        if (totalPool > 0 && !poll.isDemoMode) {
            uint256 houseFee = (totalPool * HOUSE_FEE_PERCENT) / 100;
            houseBalance += houseFee;
        }

        emit PollResolved(pollId, winningOption, totalPool, maxVotes);
    }

    /*//////////////////////////////////////////////////////////////
                                FALLBACK
    //////////////////////////////////////////////////////////////*/

    receive() external payable {
        // Allow contract to receive MON
    }
}