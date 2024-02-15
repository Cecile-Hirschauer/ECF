// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./mocks/ChainlinkPricesOracleMock.sol";

/// @title A token contract for GreenLeafToken (GLT) with ERC20, Ownable, and ReentrancyGuard functionalities.
/// @dev This contract includes functionalities for minting tokens, buying, selling, locking, and unlocking GLT tokens.
contract GreenLeafToken is ERC20, Ownable, ReentrancyGuard {
    ChainlinkPricesOracleMock private chainlinkPricesOracleMock;

    uint256 public lastMintEvent;
    uint256 public minLockTime = 60; // 1 minute
    uint256 public minLockAmount = 1 * 10 ** decimals();
    uint256 public maxSupply = 21_000 * 10 ** decimals();
    uint256 public maxBalance = 100 * 10 ** decimals();

    mapping(address => uint256) public greenLeafTokenLocked;

    event BuyGreenLeafTokenEvent(address indexed userAddress, uint256 greenLeafTokenAmount, uint256 ethAmount);
    event LockGreenLeafTokenEvent(address indexed userAddress);
    event UnlockGreenLeafTokenEvent(address indexed userAddress);
    event SellGreenLeafTokenEvent(address indexed userAddress, uint256 greenLeafTokenAmount, uint256 ethAmount);

    /// @notice Initializes the contract with the Chainlink Price Oracle Mock address.
    /// @param _chainlinkPricesOracleMock The address of the Chainlink Prices Oracle Mock.
    constructor(ChainlinkPricesOracleMock _chainlinkPricesOracleMock) ERC20("GreenLeafToken", "GLT") Ownable(msg.sender) {
        chainlinkPricesOracleMock = _chainlinkPricesOracleMock;
        _mint(address(this), 1_000 * 10 ** decimals());
    }

    /// @notice Returns the token balance of the contract.
    /// @return The token balance of the contract.
    function getSmartContractTokenBalance() external view returns (uint) {
        return balanceOf(address(this));
    }

    /// @notice Returns the Ether balance of the contract.
    /// @return The Ether balance of the contract.
    function getSmartContractEthBalance() external view returns (uint) {
        return address(this).balance;
    }

    /// @notice Checks if a user has locked GreenLeafToken.
    /// @param user The address of the user to check.
    /// @return True if the user has locked GreenLeafToken, false otherwise.
    function hasLockedGreenLeafToken(address user) external view returns (bool) {
        return greenLeafTokenLocked[user] != 0;
    }

    /// @notice Mints tokens to the contract address if the conditions are met.
    /// @dev This function can only be called by the owner and if 30 days have passed since the last mint event.
    function mintMonthly() public onlyOwner {
        require(block.timestamp >= lastMintEvent + 30 days, "Minting not yet allowed");
        require(totalSupply() + 100 * 10 ** decimals() <= maxSupply, "Max supply exceeded");

        _mint(address(this), 100 * 10 ** decimals());
        lastMintEvent = block.timestamp;
    }

    /// @notice Allows users to buy GreenLeafToken with ETH.
    /// @param _greenLeafTokenAmount The amount of GreenLeafToken to buy.
    function buyGreenLeafToken(uint256 _greenLeafTokenAmount) public payable nonReentrant {
        require(_greenLeafTokenAmount > 0, "Amount must be greater than 0");
        uint256 ethRate = chainlinkPricesOracleMock.getLatestGreenLeafTokenPriceInEth();
        uint256 requiredEth = (_greenLeafTokenAmount * ethRate) / 10 ** 18;
        require(msg.value >= requiredEth, "Incorrect ETH amount");

        uint256 excessEth = msg.value - requiredEth;
        _transfer(address(this), msg.sender, _greenLeafTokenAmount);
        if (excessEth > 0) {
            payable(msg.sender).transfer(excessEth);
        }

        emit BuyGreenLeafTokenEvent(msg.sender, _greenLeafTokenAmount, msg.value);
    }

    /// @notice Allows users to lock their GreenLeafToken.
    /// @dev Users must have a minimum amount of GLT and cannot lock if already locked.
    function lockGreenLeafToken() public {
        require(balanceOf(msg.sender) >= minLockAmount, "Insufficient GLT to lock");
        require(greenLeafTokenLocked[msg.sender] == 0, "GLT already locked");

        greenLeafTokenLocked[msg.sender] = block.timestamp;
        emit LockGreenLeafTokenEvent(msg.sender);
    }

    /// @notice Allows users to unlock their GreenLeafToken after the lock period.
    function unlockGreenLeafToken() public {
        require(greenLeafTokenLocked[msg.sender] != 0, "No GLT locked");
        require(block.timestamp - greenLeafTokenLocked[msg.sender] >= minLockTime, "Lock period not over");

        greenLeafTokenLocked[msg.sender] = 0;
        emit UnlockGreenLeafTokenEvent(msg.sender);
    }

    /// @notice Allows users to sell their GreenLeafToken back to the contract for ETH.
    /// @param _greenLeafTokenAmountInWei The amount of GreenLeafToken to sell in wei units.
    function sellGreenLeafToken(uint256 _greenLeafTokenAmountInWei) public nonReentrant {
        require(_greenLeafTokenAmountInWei > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= _greenLeafTokenAmountInWei, "Insufficient GLT balance");
        require(allowance(msg.sender, address(this)) >= _greenLeafTokenAmountInWei, "Insufficient allowance");

        uint256 ethRate = chainlinkPricesOracleMock.getLatestEthPriceInGreenLeafToken();
        uint256 ethAmount = _greenLeafTokenAmountInWei / ethRate;

        require(address(this).balance >= ethAmount, "Insufficient ETH balance in contract");

        _transfer(msg.sender, address(this), _greenLeafTokenAmountInWei);
        (bool success, ) = payable(msg.sender).call{value: ethAmount}("");
        require(success, "Failed to send Ether");

        emit SellGreenLeafTokenEvent(msg.sender, _greenLeafTokenAmountInWei, ethAmount);
    }

    /// @notice Sets the minimum lock time for GreenLeafToken.
    /// @param _minLockTime The new minimum lock time in seconds.
    function setMinLockTime(uint256 _minLockTime) public onlyOwner {
        require(_minLockTime > 0, "Lock time must be > 0");
        minLockTime = _minLockTime;
    }

    /// @notice Sets the minimum amount of GreenLeafToken required to lock.
    /// @param _minLockAmount The new minimum lock amount in GLT.
    function setMinLockAmount(uint256 _minLockAmount) public onlyOwner {
        require(_minLockAmount > 0, "Lock amount must be > 0");
        minLockAmount = _minLockAmount * 10 ** decimals();
    }

    /// @notice Sets the maximum supply of GreenLeafToken.
    /// @param _maxSupply The new maximum supply in GLT.
    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply * 10 ** decimals();
    }

    /// @notice Allows the owner to withdraw ETH from the contract.
    /// @param _amount The amount of ETH to withdraw.
    /// @param _recipient The recipient of the withdrawn ETH.
    function withdrawEthers(uint256 _amount, address payable _recipient) public onlyOwner {
        require(_amount <= address(this).balance, "Insufficient ETH balance");
        require(_recipient != address(0), "Invalid recipient");

        _recipient.transfer(_amount);
    }

    receive() external payable {}
}
