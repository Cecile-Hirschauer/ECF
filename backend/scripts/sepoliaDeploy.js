const {ethers} = require("hardhat");
const hre = require("hardhat");

async function deploySepolia() {
    let initialSupply;
    let leafTokenContract, crowdfundingContract;
    const [owner] = await ethers.getSigners();

    console.log("Deploying contracts with the account:", owner.address);

    /****************** LEAF TOKEN ******************/
    const LeafToken = await ethers.getContractFactory("LeafToken");
    initialSupply = ethers.parseEther("1000000"); // 1 000 000 LEAF
    leafTokenContract = await LeafToken.connect(owner).deploy(initialSupply);
    await leafTokenContract.waitForDeployment();
    let leafTokenAddress = leafTokenContract.target;
    console.log("LeafToken deployed to:", leafTokenAddress);

    /******************* CROWDFUNDING *******************/
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfundingContract = await Crowdfunding.deploy(leafTokenAddress);
    await crowdfundingContract.waitForDeployment();
    let crowdfundingAddress = crowdfundingContract.target;
    console.log("Crowdfunding deployed to :", crowdfundingAddress);

    const contractAddresses = {
        leafToken: leafTokenContract.target,
        crowdfunding: crowdfundingContract.target,
    };

    require('fs').writeFileSync('sepoliaDeployedAddresses.json', JSON.stringify(contractAddresses));

    /********************** CREATE ADDITIONAL CAMPAIGNS **********************/
    const campaignsDetails = [
        {
            name: "Water Conservation Project",
            description: "This project focuses on reducing water waste.",
            targetAmount: hre.ethers.parseEther("200"), // 200 ETH
            duration: 30, // 1 month
            image: "/images/water_conservation.png"
        },
        {
            name: "Renewable Energy Initiative",
            description: "A project to increase the use of renewable energy sources.",
            targetAmount: hre.ethers.parseEther("300"), // 300 ETH
            duration: 90, // 3 months
            image: "/images/renewable_energy.png"
        },
        {
            name: "Community Recycling Program",
            description: "Promoting recycling in communities to reduce waste.",
            targetAmount: hre.ethers.parseEther("150"), // 150 ETH
            duration: 180, // 6 months
            image: "/images/recycling_program.png"
        }
    ];

    for (const campaignDetail of campaignsDetails) {
        const startAt = Math.floor(Date.now() / 1000);
        const endAt = startAt + 604800 * campaignDetail.duration;

        console.log(`Creating campaign: ${campaignDetail.name}`);
        let tx = await crowdfundingContract.connect(owner).createCampaign(
            campaignDetail.name,
            campaignDetail.description,
            campaignDetail.targetAmount,
            startAt,
            endAt,
            campaignDetail.image
        );
        await tx.wait();

        campaignId = await crowdfundingContract.getCampaignsCount() - BigInt(1); // Récupérer l'ID de la nouvelle campagne
        console.log(`Campaign ${campaignDetail.name} created with ID: ${campaignId}`);
    }


    // Console log pour confirmer le succès de l'opération
    console.log("Interactions avec les contrats effectuées avec succès.");


}

// and properly handle errors.
deploySepolia().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});