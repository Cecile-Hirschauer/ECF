const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockDai Tests", function () {
    let mockDai;
    let owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const MockDai = await ethers.getContractFactory("MockDai");
        mockDai = await MockDai.deploy(ethers.parseEther("1000000"));
    });

    describe("Deployment", function () {
        it("Should deploy with the correct initial supply", async function () {
            const totalSupply = await mockDai.totalSupply();
            expect(totalSupply).to.equal(ethers.parseEther("1000000"));
        });

        it("Should set the right owner", async function () {
            expect(await mockDai.owner()).to.equal(owner.address);
        });
    });

    describe("Buy MockDai", function () {

        it("Should not allow buying MockDai with 0 Ether sent", async function () {
            await expect(
                mockDai.connect(addr2).buyMockDai({value: ethers.parseEther("0")})
            ).to.be.revertedWith("You need to send ether to buy MockDai");
        });

        it("Should allow buying MockDai with Ether", async function () {
            const buyAmount = ethers.parseEther("1"); // Ether envoyé

            // The expected amount of MockDai, assuming the conversion rate 1 Ether = 1000 MockDai
            const expectedMintAmount = buyAmount * BigInt(1000);

            // Buy MockDai
            await mockDai.connect(addr1).buyMockDai({value: ethers.parseEther("1")});

            // Check the final balance of the buyer
            const finalBalance = await mockDai.balanceOf(addr1.address);
            expect(finalBalance).to.equal(expectedMintAmount);
        });
    });


    describe("Sell MockDai", function () {
        it('Should revert if the user does not have enough MockDai', async function () {
            await expect(
                mockDai.connect(addr1).sellMockDai(ethers.parseEther("1000"))
            ).to.be.revertedWith("You don't have enough mDAI to sell");
        });


        it("Should allow selling MockDai for Ether", async function () {
            await mockDai.connect(addr1).buyMockDai({ value: ethers.parseEther("1") });
            const sellAmount = ethers.parseEther("1") * BigInt(1000);
            await mockDai.connect(addr1).approve(mockDai.target, sellAmount);
            const initialEtherBalance = await ethers.provider.getBalance(addr1.address);
            await mockDai.connect(addr1).sellMockDai(sellAmount);
            const finalEtherBalance = await ethers.provider.getBalance(addr1.address);

            expect(finalEtherBalance).to.be.above(initialEtherBalance);
        });
    });


    describe("Mint and Burn", function () {
        it("Owner can mint MockDai", async function () {
            const mintAmount = ethers.parseEther("500");
            await mockDai.mint(addr1.address, mintAmount);
            expect(await mockDai.balanceOf(addr1.address)).to.equal(mintAmount);
        });

        it("Owner can burn MockDai", async function () {
            const mintAmount = ethers.parseEther("500");
            await mockDai.mint(addr1.address, mintAmount);
            await mockDai.burn(addr1.address, mintAmount);
            expect(await mockDai.balanceOf(addr1.address)).to.equal(0);
        });

        it("Non-owner cannot mint MockDai", async function () {
            const mintAmount = ethers.parseEther("500");
            await expect(
                mockDai.connect(addr1).mint(addr1.address, mintAmount)
            ).revertedWithCustomError(
                mockDai,
                "OwnableUnauthorizedAccount"
            ).withArgs(
                addr1.address
            );
        });
    });
});
