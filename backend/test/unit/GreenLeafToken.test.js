const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GreenLeafToken contract", function () {
    let greenLeafToken;
    let owner, addr1, addr2;
    let chainlinkPricesOracleMock;
    let greenLeafTokenAddress;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const ChainlinkPricesOracleMock = await ethers.getContractFactory(
            "ChainlinkPricesOracleMock"
        );
        chainlinkPricesOracleMock = await ChainlinkPricesOracleMock.deploy();
        await chainlinkPricesOracleMock.waitForDeployment();
        const chainlinkPricesOracleMockSmartContractAddress =
            await chainlinkPricesOracleMock.getAddress();

        const GreenLeafToken = await ethers.getContractFactory("GreenLeafToken");
        greenLeafToken = await GreenLeafToken.deploy(chainlinkPricesOracleMockSmartContractAddress);
        await greenLeafToken.waitForDeployment();
        greenLeafTokenAddress = await greenLeafToken.getAddress();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await greenLeafToken.owner()).to.equal(owner.address);
        });

        it("Should deploy with initial supply", async function () {
            expect(await greenLeafToken.totalSupply()).to.equal(ethers.parseEther("1000"));
        });

        it('Should get smart contract token balance', async function () {
            expect(await greenLeafToken.getSmartContractTokenBalance()).to.equal(ethers.parseEther("1000"));
        });

        it('Should get smart contract ether balance', async function () {
            expect(await greenLeafToken.getSmartContractEthBalance()).to.equal(ethers.parseEther("0"));
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint monthly", async function () {
            await greenLeafToken.mintMonthly();
            expect(await greenLeafToken.totalSupply()).to.equal(ethers.parseEther("1100"));
        });

        it("Should prevent non-owner from minting", async function () {
            await expect(greenLeafToken.connect(addr1).mintMonthly()).to.be.reverted;
        });

        it("Should not allow minting more than once a month", async function () {
            await greenLeafToken.mintMonthly();
            await expect(greenLeafToken.mintMonthly()).to.be.reverted;
        });

    });

    describe("Buying GreenLeafToken", function () {
        it("Should allow users to buy GreenLeafToken", async function () {
            // Example assumes the mock oracle is set up to return a specific rate.
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("1"),
            });
            expect(await greenLeafToken.balanceOf(addr1.address)).to.equal(
                ethers.parseEther("10")
            );
        });

        it("Should emit BuyGreenLeafTokenEvent on purchase", async function () {
            await expect(
                greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                    value: ethers.parseEther("1"),
                })
            )
                .to.emit(greenLeafToken, "BuyGreenLeafTokenEvent")
                .withArgs(
                    addr1.address,
                    ethers.parseEther("10"),
                    ethers.parseEther("1")
                );
        });

        it("Should not allow users to buy GreenLeafToken with insufficient ETH", async function () {
            const greenLeafTokenAmount = ethers.parseEther("10"); // Attempting to buy 10 GreenLeafToken
            const insufficientEthAmount = ethers.parseEther("0.01"); // Insufficient ETH
            await expect(
                greenLeafToken
                    .connect(addr1)
                    .buyGreenLeafToken(greenLeafTokenAmount, { value: insufficientEthAmount })
            ).to.be.revertedWith("Incorrect ETH amount");
        });
    });

    describe("Locking GreenLeafToken", function () {
        beforeEach(async function () {
            // Setting up by buying GreenLeafToken for addr1
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("1"),
            });
        });

        it("Should allow users to lock their GreenLeafToken", async function () {
            await greenLeafToken.connect(addr1).lockGreenLeafToken();
            expect(await greenLeafToken.hasLockedGreenLeafToken(addr1.address)).to.equal(true);
        });

        it("Should emit LockGreenLeafTokenEvent on locking", async function () {
            await expect(greenLeafToken.connect(addr1).lockGreenLeafToken())
                .to.emit(greenLeafToken, "LockGreenLeafTokenEvent")
                .withArgs(addr1.address);
        });

        it("Should not allow users to lock GreenLeafToken when it's already locked", async function () {
            await greenLeafToken.connect(addr1).lockGreenLeafToken();
            await expect(greenLeafToken.connect(addr1).lockGreenLeafToken()).to.be.revertedWith(
                "GLT already locked"
            );
        });
    });

    describe("Locking GreenLeafToken without GreenLeafToken in balance", function () {
        it("Should not allow users to lock GreenLeafToken without enough balance", async function () {
            await expect(greenLeafToken.connect(addr1).lockGreenLeafToken()).to.be.revertedWith(
                "Insufficient GLT to lock"
            );
        });
    });

    describe("Unlocking GreenLeafToken", function () {
        beforeEach(async function () {
            // Setting up by buying and locking GreenLeafToken for addr1
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("1"),
            });
            await greenLeafToken.connect(addr1).lockGreenLeafToken();
        });

        it("Should not allow users to unlock GreenLeafToken before the lock period", async function () {
            // Assuming addr1 has locked their GreenLeafToken
            await expect(greenLeafToken.connect(addr1).unlockGreenLeafToken()).to.be.revertedWith(
                "Lock period not over"
            );
        });

        it("Should allow users to unlock their GreenLeafToken after the lock period", async function () {
            // Fast-forward time to simulate lock period passing
            await ethers.provider.send("evm_increaseTime", [60]); // Increase time by 60 seconds
            await ethers.provider.send("evm_mine");

            await greenLeafToken.connect(addr1).unlockGreenLeafToken();
            expect(await greenLeafToken.hasLockedGreenLeafToken(addr1.address)).to.equal(false);
        });

        it("Should emit UnlockGreenLeafTokenEvent on unlocking", async function () {
            await ethers.provider.send("evm_increaseTime", [60]); // Increase time by 60 seconds
            await ethers.provider.send("evm_mine");

            await expect(greenLeafToken.connect(addr1).unlockGreenLeafToken())
                .to.emit(greenLeafToken, "UnlockGreenLeafTokenEvent")
                .withArgs(addr1.address);
        });
    });

    describe("Unlocking GreenLeafToken without having lock any", function () {
        it("Should not allow users to unlock GreenLeafToken if none is locked", async function () {
            await expect(greenLeafToken.connect(addr2).unlockGreenLeafToken()).to.be.revertedWith(
                "No GLT locked"
            );
        });
    });

    describe("Selling GreenLeafToken", function () {
        beforeEach(async function () {
            // Setting up by buying GreenLeafToken for addr1
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("1"),
            });
            // Approving the contract to spend GreenLeafToken on behalf of addr1
            await greenLeafToken.connect(addr1).approve(greenLeafTokenAddress, ethers.parseEther("10"));
        });

        it("Should allow users to sell GreenLeafToken back to the contract", async function () {
            const initialEthBalance = await ethers.provider.getBalance(addr1.address);
            await greenLeafToken.connect(addr1).sellGreenLeafToken(ethers.parseEther("5"));
            const finalEthBalance = await ethers.provider.getBalance(addr1.address);
            expect(finalEthBalance).to.be.gt(initialEthBalance); // User should have more ETH after the sale
        });

        it("Should emit SellGreenLeafTokenEvent on sale", async function () {
            await expect(
                greenLeafToken.connect(addr1).sellGreenLeafToken(ethers.parseEther("5"))
            ).to.emit(greenLeafToken, "SellGreenLeafTokenEvent");
        });

        it("Should not allow users to sell more GreenLeafToken than they hold", async function () {
            const excessiveGreenLeafTokenAmount = ethers.parseEther("100"); // More than the user has
            await expect(
                greenLeafToken.connect(addr1).sellGreenLeafToken(excessiveGreenLeafTokenAmount)
            ).to.be.revertedWith("Insufficient GLT balance");
        });
    });

    describe("Selling GreenLeafToken without Approval", function () {
        beforeEach(async function () {
            // Setting up by buying GreenLeafToken for addr1
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("1"),
            });
        });

        it("Should not allow users to sell GreenLeafToken without approval", async function () {
            const greenLeafTokenAmount = ethers.parseEther("1");
            await expect(greenLeafToken.connect(addr1).sellGreenLeafToken(greenLeafTokenAmount)).to.be.revertedWith(
                "Insufficient allowance"
            );
        });
    });

    describe("Selling GreenLeafToken without enough Approval", function () {
        beforeEach(async function () {
            // Setting up by buying GreenLeafToken for addr1
            await greenLeafToken.connect(addr1).buyGreenLeafToken(ethers.parseEther("10"), {
                value: ethers.parseEther("10"),
            });
            // Approving the contract to spend GreenLeafToken on behalf of addr1
            await greenLeafToken.connect(addr1).approve(greenLeafTokenAddress, ethers.parseEther("1"));
        });

        it("Should not allow users to sell GreenLeafToken without approval", async function () {
            const greenLeafTokenAmount = ethers.parseEther("10");
            await expect(greenLeafToken.connect(addr1).sellGreenLeafToken(greenLeafTokenAmount)).to.be.revertedWith(
                "Insufficient allowance"
            );
        });
    });

    describe("Contract Settings by Owner", function () {
        it("Should allow the owner to set minimum lock time", async function () {
            const newMinLockTime = 120; // 2 minutes
            await greenLeafToken.setMinLockTime(newMinLockTime);
            expect(await greenLeafToken.minLockTime()).to.equal(newMinLockTime);
        });

        it("Should allow the owner to set minimum lock amount", async function () {
            const newMinLockAmount = ethers.parseEther("2");
            await greenLeafToken.setMinLockAmount(2); // Setting 2 GLT as the new minimum
            expect(await greenLeafToken.minLockAmount()).to.equal(newMinLockAmount);
        });

        it("Should allow the owner to set maximum supply", async function () {
            const newMaxSupply = ethers.parseEther("25000");
            await greenLeafToken.setMaxSupply(25000); // Setting 25,000 GLT as the new maximum supply
            expect(await greenLeafToken.maxSupply()).to.equal(newMaxSupply);
        });

        it("Should prevent non-owners from changing contract settings", async function () {
            await expect(greenLeafToken.connect(addr1).setMinLockTime(120)).to.be.reverted;
            await expect(greenLeafToken.connect(addr1).setMinLockAmount(2)).to.be.reverted;
            await expect(greenLeafToken.connect(addr1).setMaxSupply(25000)).to.be.reverted;
        });

    });

    describe("Owner Operations", function () {
        it("Should allow the owner to withdraw ETH", async function () {
            // Ensure the contract has some ETH by simulating a purchase.
            await greenLeafToken.connect(addr2).buyGreenLeafToken(ethers.parseEther("1"), {
                value: ethers.parseEther("0.1"),
            });

            const initialOwnerBalance = await ethers.provider.getBalance(
                owner.address
            );

            const txResponse = await greenLeafToken.withdrawEthers(
                ethers.parseEther("0.05"),
                owner.address
            );
            const txReceipt = await txResponse.wait(); // Wait for the transaction to be mined.

            const finalOwnerBalance = await ethers.provider.getBalance(owner.address);

            expect(finalOwnerBalance).to.be.closeTo(
                initialOwnerBalance + ethers.parseEther("0.05"),
                ethers.parseEther("0.01")
            );
        });

        it("Should prevent non-owners from withdrawing ETH", async function () {
            await expect(
                greenLeafToken.connect(addr1).withdrawEthers(ethers.parseEther("1"), addr1.address)
            ).to.be.reverted;
        });

        it("Should not allow the owner to withdraw more ETH than the contract balance", async function () {
            const excessiveEthAmount = ethers.parseEther("10000");
            await expect(
                greenLeafToken.withdrawEthers(excessiveEthAmount, owner.address)
            ).to.be.revertedWith("Insufficient ETH balance");
        });


    });

    // Additional tests can include edge cases, stress testing, and integration tests with other contracts or oracles.
});