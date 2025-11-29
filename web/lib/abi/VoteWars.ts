export const VOTE_WARS_ABI = [
    {
        "type": "function",
        "name": "createBattle",
        "inputs": [
            { "name": "_title", "type": "string", "internalType": "string" },
            { "name": "_optionA", "type": "string", "internalType": "string" },
            { "name": "_optionB", "type": "string", "internalType": "string" },
            { "name": "_duration", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "vote",
        "inputs": [
            { "name": "_battleId", "type": "uint256", "internalType": "uint256" },
            { "name": "_forOptionA", "type": "bool", "internalType": "bool" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "endBattle",
        "inputs": [
            { "name": "_battleId", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "mintWitness",
        "inputs": [
            { "name": "_battleId", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "battles",
        "inputs": [
            { "name": "", "type": "uint256", "internalType": "uint256" }
        ],
        "outputs": [
            { "name": "id", "type": "uint256", "internalType": "uint256" },
            { "name": "title", "type": "string", "internalType": "string" },
            { "name": "optionA", "type": "string", "internalType": "string" },
            { "name": "optionB", "type": "string", "internalType": "string" },
            { "name": "votesA", "type": "uint256", "internalType": "uint256" },
            { "name": "votesB", "type": "uint256", "internalType": "uint256" },
            { "name": "startTime", "type": "uint256", "internalType": "uint256" },
            { "name": "duration", "type": "uint256", "internalType": "uint256" },
            { "name": "active", "type": "bool", "internalType": "bool" },
            { "name": "creator", "type": "address", "internalType": "address" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "battleCount",
        "inputs": [],
        "outputs": [
            { "name": "", "type": "uint256", "internalType": "uint256" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasVoted",
        "inputs": [
            { "name": "", "type": "uint256", "internalType": "uint256" },
            { "name": "", "type": "address", "internalType": "address" }
        ],
        "outputs": [
            { "name": "", "type": "bool", "internalType": "bool" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasMintedWitness",
        "inputs": [
            { "name": "", "type": "uint256", "internalType": "uint256" },
            { "name": "", "type": "address", "internalType": "address" }
        ],
        "outputs": [
            { "name": "", "type": "bool", "internalType": "bool" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "BattleCreated",
        "inputs": [
            { "name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256" },
            { "name": "title", "type": "string", "indexed": false, "internalType": "string" },
            { "name": "optionA", "type": "string", "indexed": false, "internalType": "string" },
            { "name": "optionB", "type": "string", "indexed": false, "internalType": "string" },
            { "name": "endTime", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VoteCast",
        "inputs": [
            { "name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256" },
            { "name": "voter", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "forOptionA", "type": "bool", "indexed": false, "internalType": "bool" },
            { "name": "newVotesA", "type": "uint256", "indexed": false, "internalType": "uint256" },
            { "name": "newVotesB", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "BattleEnded",
        "inputs": [
            { "name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256" },
            { "name": "winner", "type": "string", "indexed": false, "internalType": "string" }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "WitnessMinted",
        "inputs": [
            { "name": "battleId", "type": "uint256", "indexed": true, "internalType": "uint256" },
            { "name": "user", "type": "address", "indexed": true, "internalType": "address" },
            { "name": "tokenId", "type": "uint256", "indexed": false, "internalType": "uint256" }
        ],
        "anonymous": false
    }
] as const;
