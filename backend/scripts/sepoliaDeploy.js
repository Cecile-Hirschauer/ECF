const {ethers} = require("hardhat");

async function deploySepolia() {

    const [owner] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", owner.address);

    // LEAF TOKEN
    const initialSupply = ethers.parseEther("1"); // 1 000 000 LEAF
    const leaToken = await ethers.deployContract("LeafToken", [initialSupply]);
    await leaToken.waitForDeployment();
    console.log('leafToken', leaToken.target)


    // CROWDFUNDING
    const crowdfunding = await ethers.deployContract("Crowdfunding", [leaToken.target]);
    console.log("Crowdfunding deployed to:", crowdfunding.target);

    await crowdfunding.waitForDeployment();

    const contractAddresses = {
        leafToken: leaToken.target,
        crowdfunding: crowdfunding.target,
    };

    require('fs').writeFileSync('sepoliaDeployedAddresses.json', JSON.stringify(contractAddresses));

}

// and properly handle errors.
deploySepolia().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});