// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");


async function main() {
    let initialSupply;
    // Get signers
    const [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();


    console.log("Deploying contracts with the account:", owner.address);

    /****************** LEAF TOKEN ******************/
    const LeafToken = await hre.ethers.getContractFactory("LeafToken");
    initialSupply = hre.ethers.parseEther("1000000"); // 1 000 000 LEAF
    let leafToken = await LeafToken.connect(owner).deploy(initialSupply);
    await leafToken.waitForDeployment();
    let leafTokenAddress = leafToken.target;
    console.log("LeafToken deployed to:", leafTokenAddress);

    /******************* CROWDFUNDING *******************/
    const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
    let crowdfunding = await Crowdfunding.deploy(leafTokenAddress);
    await crowdfunding.waitForDeployment();
    let crowdfundingAddress = crowdfunding.target;
    console.log("Crowdfunding deployed to :", crowdfundingAddress);

    /******************* MOCK DAI *******************/
    const MockDai = await hre.ethers.getContractFactory("MockDai");
    initialSupply = hre.ethers.parseEther("1000000"); // 1 000 000 mDAI
    let mockDai = await MockDai.connect(owner).deploy(initialSupply);
    await mockDai.waitForDeployment();
    let mockDaiAddress = mockDai.target;
    console.log("MockDai deployed to :", mockDaiAddress);

    /******************* STAKING *******************/
    const Staking = await hre.ethers.getContractFactory("Staking");
    let staking = await Staking.deploy(mockDaiAddress, crowdfundingAddress);
    await staking.waitForDeployment();
    let stakingAddress = staking.target;
    console.log("Staking deployed to :", stakingAddress);

    const addresses = {
        leafToken: leafToken.target,
        mockDai: mockDai.target,
        crowdfunding: crowdfunding.target,
        staking: staking.target,
    };
    require('fs').writeFileSync('deployedAddresses.json', JSON.stringify(addresses));

   }


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});