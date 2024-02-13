// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title ECFToken
/// @dev Implements a basic ERC20 staking token with Access Control.
contract ECFToken is ERC20, AccessControl {
    /// @notice Role identifier for users with minter privileges.
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Deploys the contract, mints initial supply to deployer, and sets up roles.
    /// @param initialSupply Amount of tokens to mint upon deployment.
    constructor(uint256 initialSupply) ERC20("EcoFundChain", "ECF") {
        // Grant the contract deployer the default admin role: they can manage other roles.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        // Grant the contract deployer the minter role as well
        _grantRole(MINTER_ROLE, msg.sender);

        // Mint the initial supply to the deployer
        _mint(msg.sender, initialSupply);
    }

    /// @notice Allows users with the minter role to mint new tokens.
    /// @param to The address to receive the minted tokens.
    /// @param amount The amount of tokens to mint.
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        // Mint the amount of tokens to the specified address.
        _mint(to, amount);
    }
}
