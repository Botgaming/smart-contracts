pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol';
import './Bankroll.sol';

contract SlotGame is Ownable {

	event GameCreated(uint gameId);
	event GameClosed(uint gameId);
	event CashIn(uint gameId, uint amount);

	address public bankrollAddress;
	address public tokenAddress;
	mapping (uint => Game) games;
	uint gameIdSequence;

	struct Game {
		uint id;
		string publicKey;
		bool isFinished;
		string secretKey;
		address player;
		uint[] cashins;
		uint bankrollWin;
		uint playerWin;
	}

	function SlotGame(address _token, address _bankroll) public {
		bankrollAddress = _bankroll;
		tokenAddress = _token;
	}

	function createGame(address _player, uint _cashin, string _publicKey) onlyOwner public {
		require(_player != address(0));
		require(_cashin > 0);
		bytes memory publicKey = bytes(_publicKey);
		require(publicKey.length != 0);

		uint gameId = ++gameIdSequence;

		games[gameId].id = gameId;
		games[gameId].publicKey = _publicKey;
		games[gameId].isFinished = false;
		games[gameId].player = _player;
		games[gameId].cashins.push(_cashin);

		GameCreated(gameId);
	}

	function cashIn(uint _gameId, uint _cashin) onlyOwner onlyExistedOpenedGame(_gameId) public {
		require(_cashin > 0);
		games[_gameId].cashins.push(_cashin);

		CashIn(_gameId, _cashin);
	}

	function close(uint _gameId, uint _playerWin, string _secretKey, uint _bankrollWin) onlyOwner onlyExistedOpenedGame(_gameId) public {
		uint cashinSum = 0;
		for (uint index = 0; index < games[_gameId].cashins.length; index++) {
			cashinSum += games[_gameId].cashins[index];
		}
		uint bankrollWin = 0;
		if(_playerWin < cashinSum){
			bankrollWin = cashinSum - _playerWin;
		}
		require(_bankrollWin == bankrollWin);

		games[_gameId].isFinished = true;
		games[_gameId].secretKey = _secretKey;
		games[_gameId].playerWin = _playerWin;
		games[_gameId].bankrollWin = _bankrollWin;

		if(_playerWin > 0) {
			Bankroll bankroll = Bankroll(bankrollAddress);
			bankroll.transferWin(games[_gameId].player, _playerWin);
		}

		ERC20Basic token = ERC20Basic(tokenAddress);
		token.transfer(bankrollAddress, cashinSum);

		GameClosed(_gameId);
	}

	function getGameInfo(uint _gameId) public constant
	returns(uint id, bool isFinished, string publicKey, string secretKey, address player, uint[] cashins, uint playerWin, uint bankrollWin) {

		publicKey = games[_gameId].publicKey;
		secretKey = games[_gameId].secretKey;
		isFinished = games[_gameId].isFinished;
		player = games[_gameId].player;
		cashins = games[_gameId].cashins;
		playerWin = games[_gameId].playerWin;
		bankrollWin = games[_gameId].bankrollWin;

		return (_gameId, isFinished, publicKey, secretKey, player, cashins, playerWin, bankrollWin);
	}

	modifier onlyExistedOpenedGame(uint _gameId) {
		require(games[_gameId].id != 0);
		require(!games[_gameId].isFinished);
		_;
	}


	// TODO : TESTNET ONLY
	function destroy() onlyOwner public {
		selfdestruct(owner);
	}

}
