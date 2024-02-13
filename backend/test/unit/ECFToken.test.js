const {ethers} = require('hardhat')
const {expect} = require('chai')

describe('ECFToken Tests', function () {
    let ECFToken;
    let owner, addr1, addr2;


    beforeEach(async function () {
        const ECFTokenContract = await ethers.getContractFactory("ECFToken");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        ECFToken = await ECFTokenContract.deploy(ethers.parseUnits("1000000", 18));
    });

    it("Should not allow minting by an address without the minter role", async function () {
        const mintAmount = ethers.parseUnits("100", 18);

        // Essayer de mint par addr1, qui n'a pas le rôle de minter, devrait échouer
        await expect(ECFToken.connect(addr1).mint(addr2.address, mintAmount)).to.be.reverted;
    });


    it("Should allow minting by an address with the minter role", async function () {
        const mintAmount = ethers.parseUnits("100", 18);
        await ECFToken.mint(addr1.address, mintAmount);

        const addr1Balance = await ECFToken.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(mintAmount);
    });

    it("Should allow granting the minter role and minting by the new minter", async function () {
        const mintAmount = ethers.parseUnits("100", 18);
        // Accorder le rôle de minter à addr1
        const MINTER_ROLE = await ECFToken.MINTER_ROLE();
        await ECFToken.grantRole(MINTER_ROLE, addr1.address);

        // Maintenant addr1, avec le rôle de minter, peut mint des tokens
        await ECFToken.connect(addr1).mint(addr2.address, mintAmount);

        const addr2Balance = await ECFToken.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(mintAmount);
    });



    it("Should mint the initial supply to the owner", async function () {
        const ownerBalance = await ECFToken.balanceOf(owner.address);
        expect(await ECFToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should transfer tokens between accounts", async function () {
        await ECFToken.transfer(addr1.address, ethers.parseUnits("50", 18));
        const addr1Balance = await ECFToken.balanceOf(addr1.address);
        expect(addr1Balance).to.equal(ethers.parseUnits("50", 18));

        await ECFToken.connect(addr1).transfer(addr2.address, ethers.parseUnits("50", 18));
        const addr2Balance = await ECFToken.balanceOf(addr2.address);
        expect(addr2Balance).to.equal(ethers.parseUnits("50", 18));
    });

    it("Should handle allowances and transfers correctly", async function () {
        const transferAmount = ethers.parseUnits("100", 18);
        await ECFToken.approve(addr1.address, transferAmount);
        await ECFToken.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

        const balance = await ECFToken.balanceOf(addr2.address);
        expect(balance).to.equal(transferAmount);
    });


})