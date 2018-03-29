pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol';

contract Bankroll is Ownable {

	address public tokenAddress;

	address[] confidentsIndex;
	mapping(address => bool) confidents;

	function Bankroll(address _token) public {
		tokenAddress = _token;
	}

	function addConfident(address _confident) onlyOwner public{
		bool existed = confidents[_confident];
		if(!existed){
			confidentsIndex.push(_confident);
			confidents[_confident] = true;
		}
	}

	function removeConfident(address _confident) onlyOwner public{
		bool existed = confidents[_confident];
		if(existed){
			for (uint i = 0; i < confidentsIndex.length; i++){
				if(confidentsIndex[i] == _confident){
					remove(i);
					delete confidents[_confident];
					break;
				}
			}
		}
	}

	function isConfident(address _confident) constant public returns (bool){
		bool existed = confidents[_confident];
		return existed;
	}

	function transferWin(address winner, uint amount) onlyConfident public {
		ERC20Basic token = ERC20Basic(tokenAddress);
		token.transfer(winner, amount);
	}

	function remove(uint index) private {
		if (index >= confidentsIndex.length) return;

		for (uint i = index; i < confidentsIndex.length - 1; i++){
			confidentsIndex[i] = confidentsIndex[i+1];
		}
		delete confidentsIndex[confidentsIndex.length - 1];
		confidentsIndex.length--;
	}

	modifier onlyConfident() {
		require(confidents[msg.sender]);
		_;
	}


	// TODO : TESTNET ONLY
	function destroy() onlyOwner public {
		selfdestruct(owner);
	}

}
