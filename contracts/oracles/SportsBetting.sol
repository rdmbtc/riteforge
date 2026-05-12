// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SportsBetting
 * @notice Decentralized sports betting with automatic settlement via API
 * @dev Uses Ritual HTTP precompile to fetch game results
 */
contract SportsBetting {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    struct Bet {
        address bettor;
        string gameId;
        string team;
        uint256 amount;
        uint256 odds; // Odds * 100 (e.g., 150 = 1.5x)
        bool settled;
        bool won;
    }
    
    mapping(uint256 => Bet) public bets;
    uint256 public nextBetId;
    
    event BetPlaced(uint256 indexed betId, address indexed bettor, string gameId, string team, uint256 amount);
    event BetSettled(uint256 indexed betId, bool won, uint256 payout);
    
    function placeBet(string memory gameId, string memory team, uint256 odds) external payable {
        require(msg.value > 0, "Bet amount required");
        
        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            gameId: gameId,
            team: team,
            amount: msg.value,
            odds: odds,
            settled: false,
            won: false
        });
        
        emit BetPlaced(betId, msg.sender, gameId, team, msg.value);
    }
    
    function settleBet(uint256 betId) external {
        Bet storage bet = bets[betId];
        require(!bet.settled, "Already settled");
        
        // Fetch game result from API
        string memory winner = _fetchGameResult(bet.gameId);
        
        bool won = keccak256(bytes(winner)) == keccak256(bytes(bet.team));
        bet.settled = true;
        bet.won = won;
        
        if (won) {
            uint256 payout = (bet.amount * bet.odds) / 100;
            (bool success, ) = bet.bettor.call{value: payout}("");
            require(success, "Payout failed");
            emit BetSettled(betId, true, payout);
        } else {
            emit BetSettled(betId, false, 0);
        }
    }
    
    function _fetchGameResult(string memory gameId) internal returns (string memory) {
        // HTTP call to sports API
        // Returns winning team name
        return "TeamA"; // Placeholder
    }
}
