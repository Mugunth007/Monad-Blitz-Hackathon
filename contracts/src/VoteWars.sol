// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/// @title VoteWars: On-Chain Battle Rounds
/// @notice A real-time voting battle contract on Monad.
contract VoteWars {
    struct Battle {
        uint256 id;
        string title;
        string optionA;
        string optionB;
        uint256 votesA;
        uint256 votesB;
        uint256 startTime;
        uint256 duration;
        bool active;
        address creator;
    }

    uint256 public battleCount;
    mapping(uint256 => Battle) public battles;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public hasMintedWitness;

    // Minimal ERC721 Storage
    string public name = "VoteWars Witness";
    string public symbol = "VWW";
    mapping(uint256 => address) public ownerOf;
    mapping(address => uint256) public balanceOf;
    uint256 public totalSupply;

    event BattleCreated(uint256 indexed battleId, string title, string optionA, string optionB, uint256 endTime);
    event VoteCast(uint256 indexed battleId, address indexed voter, bool forOptionA, uint256 newVotesA, uint256 newVotesB);
    event BattleEnded(uint256 indexed battleId, string winner);
    event WitnessMinted(uint256 indexed battleId, address indexed user, uint256 tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    function createBattle(string memory _title, string memory _optionA, string memory _optionB, uint256 _duration) public {
        require(_duration >= 30, "Duration too short"); // Minimum 30 seconds
        
        battleCount++;
        battles[battleCount] = Battle({
            id: battleCount,
            title: _title,
            optionA: _optionA,
            optionB: _optionB,
            votesA: 0,
            votesB: 0,
            startTime: block.timestamp,
            duration: _duration,
            active: true,
            creator: msg.sender
        });

        emit BattleCreated(battleCount, _title, _optionA, _optionB, block.timestamp + _duration);
    }

    function vote(uint256 _battleId, bool _forOptionA) public {
        Battle storage battle = battles[_battleId];
        require(battle.active, "Battle not active");
        require(block.timestamp < battle.startTime + battle.duration, "Battle ended");
        require(!hasVoted[_battleId][msg.sender], "Already voted");

        hasVoted[_battleId][msg.sender] = true;

        if (_forOptionA) {
            battle.votesA++;
        } else {
            battle.votesB++;
        }

        emit VoteCast(_battleId, msg.sender, _forOptionA, battle.votesA, battle.votesB);
    }

    function endBattle(uint256 _battleId) public {
        Battle storage battle = battles[_battleId];
        require(battle.active, "Battle not active");
        require(block.timestamp >= battle.startTime + battle.duration, "Battle still ongoing");

        battle.active = false;
        string memory winner = battle.votesA > battle.votesB ? battle.optionA : (battle.votesB > battle.votesA ? battle.optionB : "Draw");
        
        emit BattleEnded(_battleId, winner);
    }

    function mintWitness(uint256 _battleId) public {
        require(hasVoted[_battleId][msg.sender], "Must vote to witness");
        require(!hasMintedWitness[_battleId][msg.sender], "Already minted witness");
        
        hasMintedWitness[_battleId][msg.sender] = true;
        
        totalSupply++;
        uint256 tokenId = totalSupply;
        
        _mint(msg.sender, tokenId);
        
        emit WitnessMinted(_battleId, msg.sender, tokenId);
    }

    // Minimal ERC721 Internal
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "Invalid recipient");
        require(ownerOf[tokenId] == address(0), "Token already exists");

        balanceOf[to]++;
        ownerOf[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    // View functions for frontend
    function getBattle(uint256 _battleId) public view returns (Battle memory) {
        return battles[_battleId];
    }
    
    function getTimeLeft(uint256 _battleId) public view returns (uint256) {
        Battle storage battle = battles[_battleId];
        if (block.timestamp >= battle.startTime + battle.duration) return 0;
        return (battle.startTime + battle.duration) - block.timestamp;
    }
}
