pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol';
import 'zeppelin-solidity/contracts/token/ERC20/PausableToken.sol';
import 'zeppelin-solidity/contracts/ownership/HasNoEther.sol';
import 'zeppelin-solidity/contracts/ownership/HasNoTokens.sol';

/**
 * @title BotCoin token smart contract
 */

contract BotCoin is StandardToken, BurnableToken, PausableToken, HasNoEther, HasNoTokens {

  string public constant name = "BotCoin";
  string public constant symbol = "BOT";
  uint8 public constant decimals = 9;

  uint256 public constant INITIAL_SUPPLY = 3625000000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives msg.sender all of existing tokens.
   */
  function BotCoin() public {
    totalSupply_ = INITIAL_SUPPLY;
    balances[msg.sender] = INITIAL_SUPPLY;
    Transfer(address(0), msg.sender, INITIAL_SUPPLY);
  }

  /**
  * @dev Transfer tokens to multiple addresses
  * @param _addresses Array of addresses to transfer to
  * @param _amounts Array of token amounts to transfer
  */
  function transferMultiple(address[] _addresses, uint256[] _amounts) public {
    require(_addresses.length == _amounts.length);

    for (uint256 i = 0; i < _addresses.length; i++) {
      transfer(_addresses[i], _amounts[i]);
    }
  }

}
