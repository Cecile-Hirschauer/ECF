// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title EcoFundChain Token
/// @dev This contract implements an ERC20 token for EcoFundChain.
contract ECFToken is ERC20 {
    /// @notice Creates and assigns the initial total supply of tokens to the contract creator's address.
    /// @dev Calls the ERC20 constructor from OpenZeppelin to set the token's name and symbol.
    /// @param initialSupply The initial total supply of tokens to be minted (created and assigned).
    constructor(uint256 initialSupply) ERC20("EcoFundChain", "ECF") {
        // Mint the initial supply of tokens to the owner (the one deploying the contract)
        _mint(msg.sender, initialSupply);
    }
}
