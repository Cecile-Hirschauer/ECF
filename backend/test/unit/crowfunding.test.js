const {expect} = require('chai');
const {ethers} = require('hardhat');

const dateToUNIX = (date) => {
    return Math.round(new Date(date).getTime() / 1000).toString()
}

describe('Crowdfunding Contract', function () {
    let leafToken, crowdfunding;
    let owner, addr1, addr2, addr3;
    let leafTokenAddress;
    let name, description, targetAmount, startDate, endDate, image;

    before(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const LeafToken = await ethers.getContractFactory("LeafToken");
        leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
        leafTokenAddress = leafToken.target;
        const CrowdfundingContract = await ethers.getContractFactory("Crowdfunding");
        crowdfunding = await CrowdfundingContract.deploy(leafTokenAddress);
    });


    describe('Deployment', function () {

        it('Should set the initial values', async function () {
            expect(await crowdfunding.leafToken()).to.equal(leafTokenAddress);
        });
    });

    describe('Campaigns', function () {
        let campaignsCount;
        beforeEach(async function () {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const LeafToken = await ethers.getContractFactory("LeafToken");
            leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
            leafTokenAddress = leafToken.target;
            const EcoGreenFund = await ethers.getContractFactory("Crowdfunding");
            crowdfunding = await EcoGreenFund.deploy(leafTokenAddress);

            campaignsCount = await crowdfunding.getCampaignsCount();

        })

        it('Should start campaigns count at 0', async function () {
            expect(await crowdfunding.getCampaignsCount()).to.equal(0);
        });

        it('Should revert if start date is after end date', async function () {
            name = "Test Campaign";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            const now = dateToUNIX('2024-01-10');
            startDate = dateToUNIX('2024-01-09');// Assurez-vous que startDate est dans le passé pour éviter l'erreur "Start date cannot be in the future"
            endDate = startDate - 1; // endDate avant startDate
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("End date should be after start date"); // Assurez-vous que ceci correspond au message dans le contrat
        });


        it('Should revert if name is empty', async function () {
            name = "";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30'); // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Name cannot be empty");
        });

        it('Should revert if description is empty', async function () {
            name = "Campaign test";
            description = "";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Description cannot be empty");
        });

        it('Should revert if image URI is empty', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Image URL cannot be empty");
        });

        it('Should revert if target amount is 0', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("0");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "Image URI";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Target amount should be greater than zero");
        })

        it('Should create a campaign with good data', async function () {
            name = "Campaign test1";
            description = "Description test";
            targetAmount = ethers.parseEther("10");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "Image URI";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            const campaign = await crowdfunding.getCampaign(0);
            expect(campaign.name).to.equal(name);
            expect(campaign.description).to.equal(description);
            expect(campaign.targetAmount.toString()).to.equal(targetAmount.toString());
            expect(campaign.startAt.toString()).to.equal(startDate.toString());
            expect(campaign.endAt.toString()).to.equal(endDate.toString());
            expect(campaign.image).to.equal(image);
            expect(campaign.creator).to.equal(addr1.address);
            expect(campaign.id.toString()).to.equal("0");
            expect(campaign.isActive).to.equal(true);
            expect(campaign.claimedByOwner).to.equal(false);
        });

        it('Should update campaign counters', async function () {
            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("10");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            let image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            let newCampaignsCount = await crowdfunding.getCampaignsCount();
            expect(newCampaignsCount).to.equal(1);

            name = "Campaign test 2";
            description = "Description test 2";
            image = "Image URI 2";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            newCampaignsCount = await crowdfunding.getCampaignsCount();
            expect(newCampaignsCount).to.equal(2);
        });

        it('Should emit CampaignCreated event', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "Image URI";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.emit(crowdfunding, 'CampaignCreated')
                .withArgs(0, addr1.address, targetAmount, startDate, endDate);
        });

        it('Should revert if camapaign does not exist', async function () {
            expect(crowdfunding.connect(addr1).getCampaign(0)).revertedWith("Invalid campaign id");
        });

        it('Should return the correct campaign', async function () {
            name = "Campaign valid";
            description = "Description valid";
            targetAmount = ethers.parseEther("20");
            startDate = dateToUNIX('2024-01-10');// Date de fin avant la date de début
            image = "Image URI";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            const campaign = await crowdfunding.getCampaign(0);
            expect(campaign.name).to.equal(name);
            expect(campaign.description).to.equal(description);
            expect(campaign.targetAmount.toString()).to.equal(targetAmount.toString());
            expect(campaign.startAt.toString()).to.equal(startDate.toString());
            expect(campaign.endAt.toString()).to.equal(endDate.toString());
            expect(campaign.image).to.equal(image);
            expect(campaign.creator).to.equal(addr1.address);
            expect(campaign.id.toString()).to.equal("0");
            expect(campaign.isActive).to.equal(true);
            expect(campaign.claimedByOwner).to.equal(false);
        });

        it('Should revert if trying to toggle campaign status by non-creator', async function () {
            // Création d'une campagne par addr1 pour garantir que la campagne existe.
            name = "Valid Campaign";
            description = "A valid description";
            targetAmount = ethers.parseEther("1");
            startDate = dateToUNIX('2024-01-10')
            endDate = dateToUNIX('2024-02-25'); // Fin après le début
            image = "https://example.com/image.jpg";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            await expect(crowdfunding.connect(addr2).toggleCampaignStatus(0))
                .to.be.revertedWith('Only the campaign creator can call this function.');
        });


        it('Should toggle campaign status', async function () {
            name = "Toggle test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("10");
            startDate = dateToUNIX('2024-01-10')
            let endDate = dateToUNIX('2024-02-25'); // Fin après le début
            let image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            let campaign = await crowdfunding.campaigns(0);
            expect(campaign.isActive).to.equal(true);

            // Toggle the status off
            await crowdfunding.connect(addr1).toggleCampaignStatus(0);
            campaign = await crowdfunding.campaigns(0); // Fetch the updated state
            expect(campaign.isActive).to.equal(false);

            // Toggle the status on again
            await crowdfunding.connect(addr1).toggleCampaignStatus(0);
            campaign = await crowdfunding.campaigns(0); // Fetch the updated state again
            expect(campaign.isActive).to.equal(true);
        });
    });

    describe('Update Campaign', function () {
        beforeEach(async function () {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const LeafToken = await ethers.getContractFactory("LeafToken");
            leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
            leafTokenAddress = leafToken.target;
            const EcoGreenFund = await ethers.getContractFactory("Crowdfunding");
            crowdfunding = await EcoGreenFund.deploy(leafTokenAddress);

            name = "Campaign name 1";
            description = "Description 1";
            targetAmount = ethers.parseEther("15");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-02-25'); // Fin après le début
            image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);
        });

        it('Should revert for non-existing campaign ID', async function () {
            const invalidCampaignId = await crowdfunding.getCampaignsCount(); // This ID does not exist
            await expect(crowdfunding.connect(addr1).checkCampaignExists(invalidCampaignId))
                .to.be.revertedWith("Invalid campaign id");
        });

        it('Should revert if caller is not the creator', async function () {
            await expect(crowdfunding.connect(addr2).updateCampaign(0, "New name", "New description", ethers.parseEther("10"), dateToUNIX('2024-01-10'), dateToUNIX('2024-02-25'), "New image"))
                .to.be.revertedWith("Only the campaign creator can call this function.");
        });

        it('Should revert if start date is after end date', async function () {
            name = "Test Campaign";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            const now = dateToUNIX('2024-01-10');
            startDate = dateToUNIX('2024-01-09');// Assurez-vous que startDate est dans le passé pour éviter l'erreur "Start date cannot be in the future"
            endDate = startDate - 1; // endDate avant startDate
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("End date should be after start date"); // Assurez-vous que ceci correspond au message dans le contrat
        });


        it('Should revert if name is empty', async function () {
            name = "";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30'); // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Name cannot be empty");
        });

        it('Should revert if description is empty', async function () {
            name = "Campaign test";
            description = "";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Description cannot be empty");
        });

        it('Should revert if image URI is empty', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Image URL cannot be empty");
        });

        it('Should revert if target amount is 0', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("0");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-30') // Date de fin avant la date de début
            image = "Image URI";

            await expect(crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Target amount should be greater than zero");
        });

        it('Should update the campaign', async function () {
            const newStartDate = dateToUNIX('2024-01-15');
            const newEndDate = dateToUNIX('2024-03-01');
            const newName = "New name";
            const newDescription = "New description";
            const newTargetAmount = ethers.parseEther("20");
            const newImage = "New image";

            await crowdfunding.connect(addr1).updateCampaign(0, newName, newDescription, newTargetAmount, newStartDate, newEndDate, newImage);

            const campaign = await crowdfunding.getCampaign(0);
            expect(campaign.name).to.equal(newName);
            expect(campaign.description).to.equal(newDescription);
            expect(campaign.targetAmount.toString()).to.equal(newTargetAmount.toString());
            expect(campaign.startAt.toString()).to.equal(newStartDate.toString());
            expect(campaign.endAt.toString()).to.equal(newEndDate.toString());
            expect(campaign.image).to.equal(newImage);
        });

        it('Should emit CampaignUpdated event', async function () {
            const newStartDate = dateToUNIX('2024-01-15');
            const newEndDate = dateToUNIX('2024-03-01');
            const newName = "New name";
            const newDescription = "New description";
            const newTargetAmount = ethers.parseEther("20");
            const newImage = "New image";

            await expect(crowdfunding.connect(addr1).updateCampaign(0, newName, newDescription, newTargetAmount, newStartDate, newEndDate, newImage))
                .to.emit(crowdfunding, 'CampaignUpdated')
                .withArgs(0, addr1.address, newTargetAmount, newStartDate, newEndDate);
        });

    });


    describe('Contributions', function () {
        beforeEach(async function () {
            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const LeafToken = await ethers.getContractFactory("LeafToken");
            leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
            leafTokenAddress = leafToken.target;
            const EcoGreenFund = await ethers.getContractFactory("Crowdfunding");
            crowdfunding = await EcoGreenFund.deploy(leafTokenAddress);

            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("20");
            startDate = dateToUNIX('2024-03-10');
            endDate = dateToUNIX('2024-06-01'); // Fin après le début
            image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            name = "Campaign test 2";
            description = "Description test 2";
            targetAmount = ethers.parseEther("1");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-03-01'); // Fin après le début
            image = "Image URI 2";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            name = "Campaign test 3";
            description = "Description test 3";
            targetAmount = ethers.parseEther("10");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-05-01'); // Fin après le début
            image = "Image URI 3";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

        });

        it('Should revert if amount is 0', async function () {
            await expect(crowdfunding.connect(addr2).fundCampaign(0, {value: 0}))
                .to.be.revertedWith("Amount must be greater than zero");
        });

        it('Should revert if campaign is not active', async function () {

            await crowdfunding.connect(addr1).toggleCampaignStatus(0);
            await expect(crowdfunding.connect(addr2).fundCampaign(0, {value: ethers.parseEther("1")}))
                .to.be.revertedWith("Campaign is not active");
        });

        it('Should revert if campaign is expired', async function () {
            name = "Campaign expired";
            description = "Description expired";
            targetAmount = ethers.parseEther("5");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-01-15'); // Fin après le début
            image = "Image URI expired";

            await crowdfunding.connect(addr1).updateCampaign(0, name, description, targetAmount, startDate, endDate, image);

            await expect(crowdfunding.connect(addr2).fundCampaign(0, {value: ethers.parseEther("1")}))
                .to.be.revertedWith("Campaign is expired");

        });

        it('Should revert if campaign is funded', async function () {
            await crowdfunding.connect(addr2).fundCampaign(0, {value: ethers.parseEther("10")});
            await expect(crowdfunding.connect(addr2).fundCampaign(1, {value: ethers.parseEther("10")}))
                .to.be.revertedWith("Campaign already funded");

        });

        it('Should emit CampaignFunded event', async function () {
            await expect(crowdfunding.connect(addr3).fundCampaign(2, {value: ethers.parseEther("1")}))
                .to.emit(crowdfunding, 'CampaignFunded')
                .withArgs(2, addr3.address, ethers.parseEther("1"));
        });

        it('Should fail to refund if the campaign has not ended', async function () {
            await crowdfunding.connect(addr1).createCampaign(
                "Failed Campaign",
                "Description for a campaign that will fail",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-05-28'),
                "https://example.com/image.jpg"
            );
            await crowdfunding.connect(addr2).fundCampaign(3, {value: ethers.parseEther("1")});

            await expect(crowdfunding.connect(addr2).refund(3))
                .to.be.revertedWith('Campaign is not ended');
        });

        it('Should fail to refund if the caller did not contribute', async function () {
            await expect(crowdfunding.connect(addr2).refund(0))
                .to.be.revertedWith("Not a contributor");
        });

        it('Should allow refund for a failed campaign', async function () {

            // Step 1: Create a campaign
            await crowdfunding.connect(addr1).createCampaign(
                "Failed Campaign",
                "Description for a campaign that will fail",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-05-28'),
                "https://example.com/image.jpg"
            );
            // Step 2: Contribute to the campaign
            const contributionAmount = ethers.parseEther("10");
            await crowdfunding.connect(addr2).fundCampaign(3, {value: contributionAmount});

            // Step 3: updateCampaign to ensure the campaign has ended
            await crowdfunding.connect(addr1).updateCampaign(
                3,
                "Failed Campaign",
                "Description for a campaign that will fail",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-02-10'),
                "https://example.com/image.jpg"
            );

            // Attempt to refund from the campaign
            // Here, we directly check for the transaction to succeed rather than balance changes
            // due to the simplified nature of this example
            await expect(crowdfunding.connect(addr2).refund(3))
                .to.emit(crowdfunding, 'RefundIssued')
                .withArgs(3, addr2.address, contributionAmount);
        });


    });


    describe('Withdrawals', function () {
        beforeEach(async function () {

            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const LeafToken = await ethers.getContractFactory("LeafToken");
            leafToken = await LeafToken.deploy(ethers.parseEther("1000000"));
            leafTokenAddress = leafToken.target;
            const EcoGreenFund = await ethers.getContractFactory("Crowdfunding");
            crowdfunding = await EcoGreenFund.deploy(leafTokenAddress);

            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("20");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-05-01'); // Fin après le début
            image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            await crowdfunding.connect(addr2).fundCampaign(0, {value: ethers.parseEther("15")})

            name = "Campaign test 2";
            description = "Description test 3";
            targetAmount = ethers.parseEther("5");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-05-01'); // Fin après le début
            image = "Image URI 3";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);
            crowdfunding.connect(addr2).fundCampaign(1, {value: ethers.parseEther("1")});


        });

        it('Should revert if a non-creator tries to withdraw', async function () {
            await expect(crowdfunding.connect(addr3).withdraw(0)) // addr2 is not the creator
                .to.be.revertedWith('Only the campaign creator can call this function.');
        });


        it('Should revert if campaign is not ended', async function () {
            name = "Campaign ended";
            description = "Description ended";
            targetAmount = ethers.parseEther("5");
            startDate = dateToUNIX('2024-01-10')
            endDate = dateToUNIX('2024-05-15'); // Fin après le début
            image = "Image URI ended";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);
            await crowdfunding.connect(addr2).fundCampaign(2, {value: ethers.parseEther("2")});
            await expect(crowdfunding.connect(addr1).withdraw(2))
                .to.be.revertedWith("Campaign is not ended");
        });


        it('Should revert if caller is not the creator', async function () {
            await expect(crowdfunding.connect(addr2).withdraw(1))
                .to.be.revertedWith("Only the campaign creator can call this function.");
        });

        it('Should emit CampaignWithdrawn event', async function () {
            await crowdfunding.connect(addr1).updateCampaign(
                1,
                "Campaign ended",
                "Description ended",
                ethers.parseEther("1"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-03-08'), // Fin après le début
                "Image URI ended"
            );

            const campaign = await crowdfunding.getCampaign(1);


            const tx = await crowdfunding.connect(addr1).withdraw(1);
            await expect(tx).to.emit(crowdfunding, 'WithdrawSuccessful')
                .withArgs(1, addr1.address, campaign.targetAmount);
        });

        it('Should successfully withdraw funds after campaign ends', async function () {
            // Assurez-vous que la campagne est terminée en ajustant sa date de fin
            await crowdfunding.connect(addr1).updateCampaign(
                0, // ID de la campagne
                name,
                description,
                targetAmount,
                startDate,
                dateToUNIX('2024-02-08'), // Mettez une date passée pour simuler la fin
                image
            );

            const initialBalance = await ethers.provider.getBalance(addr1.address);

            const tx = await crowdfunding.connect(addr1).withdraw(0);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalance = await ethers.provider.getBalance(addr1.address);

            const expectedBalance = initialBalance + ethers.parseEther("15") - gasUsed;
            expect(finalBalance).to.be.closeTo(expectedBalance, ethers.parseUnits('0.01', 'ether'));

            const campaign = await crowdfunding.getCampaign(0);
            expect(campaign.claimedByOwner).to.equal(true);
        });


        it('Should revert if campaign already withdrawn', async function () {
            await crowdfunding.connect(addr1).createCampaign(
                "Campaign ended",
                "Description ended",
                ethers.parseEther("10"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-04-25'), // Fin après le début
                "Image URI ended"
            );

            await crowdfunding.connect(addr2).fundCampaign(2, {value: ethers.parseEther("5")});

            await crowdfunding.connect(addr1).updateCampaign(
                2,
                "Campaign ended",
                "Description ended",
                ethers.parseEther("1"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-02-08'), // Fin après le début
                "Image URI ended"
            );

            await crowdfunding.connect(addr1).withdraw(2);
            // Second withdrawal attempt should fail
            await expect(crowdfunding.connect(addr1).withdraw(2))
                .to.be.revertedWith("Amount already withdrawn");
        });


    });

    describe('Rewards and Claims', function () {
        beforeEach(async function () {

            [owner, addr1, addr2, addr3] = await ethers.getSigners();
            const LeafToken = await ethers.getContractFactory("LeafToken");
            const amount = ethers.parseEther("1000000");
            leafToken = await LeafToken.deploy(amount);
            leafTokenAddress = leafToken.target;
            const EcoGreenFund = await ethers.getContractFactory("Crowdfunding");
            crowdfunding = await EcoGreenFund.deploy(leafTokenAddress);

            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("300");
            startDate = dateToUNIX('2024-01-10');
            endDate = dateToUNIX('2024-05-01'); // Fin après le début
            image = "Image URI 1";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            await crowdfunding.connect(addr2).fundCampaign(0, {value: ethers.parseEther("150")})

            name = "Campaign test 2";
            description = "Description test 3";
            targetAmount = ethers.parseEther("100");
            startDate = dateToUNIX('2024-02-10');
            endDate = dateToUNIX('2024-06-01'); // Fin après le début
            image = "Image URI 3";

            await crowdfunding.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            crowdfunding.connect(addr2).fundCampaign(1, {value: ethers.parseEther("1")});

            // Mint ou transférez suffisamment de tokens LEAF au contrat Crowdfunding ou directement aux utilisateurs
            const amountToMint = ethers.parseEther("100000"); // Un exemple de montant
            await leafToken.transfer(crowdfunding.target, amountToMint); // Assurez-vous que le compte exécutant cette opération a suffisamment de tokens
        });


        it('Should calculate reward', async function () {
            // Assuming the RATE is 100 LEAF for 1 ETH, and addr2 funded 20 ETH in total (15 ETH to campaign 0 and 5 ETH to campaign 1).
            const expectedRewardForAddr2Campaign0 = BigInt('15000'); // Directement en LEAF tokens, sans conversion en wei

            // Update the campaigns to ensure they have ended
            await crowdfunding.connect(addr1).updateCampaign(
                0,
                "Campaign ended",
                "Description ended",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-02-08'), // Fin après le début
                "Image URI ended"
            );
            // Claim rewards for addr2 for both campaigns
            await crowdfunding.connect(addr2).claimReward(0);

            // Check rewards for addr2
            const RewardForAddr2Campaign0 = await leafToken.balanceOf(addr2.address);

            // Since we're testing the reward for a single contribution in each campaign,
            // we'll assert that the sum of expected rewards equals the actual LEAF token balance of addr2.
            expect(RewardForAddr2Campaign0).to.equal(expectedRewardForAddr2Campaign0);
        });

        it('Should emit RewardClaimed event', async function () {
            expect (await leafToken.balanceOf(addr2.address)).to.equal(0);

            await crowdfunding.connect(addr1).updateCampaign(
                0,
                "Campaign ended",
                "Description ended",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-02-08'), // Fin après le début
                "Image URI ended"
            );

            expect(await crowdfunding.connect(addr2).claimReward(0)).to.emit(crowdfunding, 'RewardClaimed');
        });


        it('Should revert if campaign is not ended', async function () {
            await expect(crowdfunding.connect(addr2).claimReward(1))
                .to.be.revertedWith("Campaign is not ended");
        });

        it('Should revert if reward already claimed', async function () {
            await crowdfunding.connect(addr1).updateCampaign(
                1,
                "Campaign ended",
                "Description ended",
                ethers.parseEther("15"),
                dateToUNIX('2024-01-10'),
                dateToUNIX('2024-03-08'), // Fin après le début
                "Image URI ended"
            );

            await crowdfunding.connect(addr2).claimReward(1);
            await expect(crowdfunding.connect(addr2).claimReward(1))
                .to.be.revertedWith("Reward already claimed");
        });

        // it("Should fail to withdraw if contract has insufficient balance", async function () {
        //     // Créez une campagne et financez-la.
        //     const fundAmount = ethers.parseEther("1");
        //     await ecoGreenFund.connect(addr1).fundCampaign(1, { value: fundAmount });
        //
        //     // Mettez à jour la campagne pour qu'elle se termine.
        //     await ecoGreenFund.connect(addr1).updateCampaign(
        //         1,
        //         "Campaign ended",
        //         "Description ended",
        //         fundAmount,
        //         dateToUNIX('2024-01-10'),
        //         dateToUNIX('2024-02-08'), // Utilisez une date dans le passé pour terminer la campagne
        //         "Image URI ended"
        //     );
        //
        //     // Essayez de retirer plus d'Ether que le contrat n'en contient.
        //     const contractBalance = await ethers.provider.getBalance(ecoGreenFund.target);
        //     console.log('contractBalance', contractBalance.toString())
        //     const excessiveAmount = contractBalance + ethers.parseEther("1000");
        //     console.log('excessiveAmount', excessiveAmount.toString())
        //     await owner.sendTransaction({ to: ecoGreenFund.target, value: excessiveAmount });
        //
        //     // Le retrait devrait échouer car le contrat n'a pas suffisamment d'Ether.
        //     await expect(ecoGreenFund.connect(addr1).withdraw(1))
        //         .to.be.revertedWithCustomError(ecoGreenFund, "CrowdFunding__WithdrawFailed");
        // });

    });

});
