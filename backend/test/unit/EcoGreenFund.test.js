const {expect} = require('chai');
const {ethers} = require('hardhat');
const {parseEther} = require("ethers");

describe('EcoGreenFund Contract', function () {
    let leafToken, ecoGreenFund;
    let owner, addr1, addr2, addr3;
    let leafTokenAddress;
    let name, description, targetAmount, startDate, endDate, image;

    before(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        const LeafToken = await ethers.getContractFactory("LeafToken");
        leafToken = await LeafToken.deploy(parseEther("1000000"));
        leafTokenAddress = leafToken.target;
        const EcoGreenFund = await ethers.getContractFactory("EcoGreenFund");
        ecoGreenFund = await EcoGreenFund.deploy(leafTokenAddress);
    });

    describe('Deployment', function () {

        it('Should set the initial values', async function () {
            expect(await ecoGreenFund.leafToken()).to.equal(leafTokenAddress);
        });
    });

    describe('Campaigns', function () {
        let campaignsCount;
        beforeEach(async function () {
            campaignsCount = await ecoGreenFund.getCampaignsCount();

        })

        it('Should start campaigns count at 0', async function () {
            expect(await ecoGreenFund.getCampaignsCount()).to.equal(0);
        });

        it('Should revert if start date is after end date', async function () {
            name = "Test Campaign";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            const now = (await ethers.provider.getBlock('latest')).timestamp;
            startDate = now - 100; // Assurez-vous que startDate est dans le passé pour éviter l'erreur "Start date cannot be in the future"
            endDate = startDate - 1; // endDate avant startDate
            image = "https://example.com/campaign.jpg";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("End date should be after start date"); // Assurez-vous que ceci correspond au message dans le contrat
        });


        it('Should revert if name is empty', async function () {
            name = "";
            description = "This is a test campaign";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = (await ethers.provider.getBlock('latest')).timestamp
            endDate = startDate + 100; // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Name cannot be empty");
        });

        it('Should revert if description is empty', async function () {
            name = "Campaign test";
            description = "";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = (await ethers.provider.getBlock('latest')).timestamp
            endDate = startDate + 100; // Date de fin avant la date de début
            image = "https://example.com/campaign.jpg";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Description cannot be empty");
        });

        it('Should revert if image URI is empty', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10"); // 10 ETH
            startDate = (await ethers.provider.getBlock('latest')).timestamp
            endDate = startDate + 100; // Date de fin avant la date de début
            image = "";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Image URL cannot be empty");
        });

        it('Should revert if target amount is 0', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("0");
            startDate = (await ethers.provider.getBlock('latest')).timestamp
            endDate = startDate + 100; // Date de fin avant la date de début
            image = "Image URI";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.be.revertedWith("Target amount should be greater than zero");
        })

        it('Should create a campaign with good data', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp + 1; // Date de début dans le passé
            endDate = startDate + 2630016; // Date de fin après la date de début
            image = "Image URI";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            const campaign = await ecoGreenFund.campaigns(0);
            expect(campaign.name).to.equal(name);
            expect(campaign.description).to.equal(description);
            expect(campaign.targetAmount.toString()).to.equal(targetAmount.toString());
            expect(campaign.startAt.toString()).to.equal(startDate.toString());
            expect(campaign.endAt.toString()).to.equal(endDate.toString());
            expect(campaign.image).to.equal(image);
            expect(campaign.creator).to.equal(addr1.address);
            expect(campaign.id.toString()).to.equal("0");
        });

        it('Should update campaign counters', async function () {
            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp
            let endDate = startDate + 2630016; // Fin après le début
            let image = "Image URI 1";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            let newCampaignsCount = await ecoGreenFund.getCampaignsCount();
            expect(newCampaignsCount).to.equal(2);

            name = "Campaign test 2";
            description = "Description test 2";
            image = "Image URI 2";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            newCampaignsCount = await ecoGreenFund.getCampaignsCount();
            expect(newCampaignsCount).to.equal(3);
        });

        it('Should emit CampaignCreated event', async function () {
            name = "Campaign test";
            description = "Description test";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp + 1; // Date de début dans le passé
            endDate = startDate + 2630016; // Date de fin après la date de début
            image = "Image URI";

            await expect(ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image))
                .to.emit(ecoGreenFund, 'CampaignCreated')
                .withArgs(3, addr1.address, targetAmount, startDate, endDate);
        });

        it('Should revert if trying to toggle campaign status by non-creator', async function () {
            // Création d'une campagne par addr1 pour garantir que la campagne existe.
            name = "Valid Campaign";
            description = "A valid description";
            targetAmount = ethers.parseEther("1");
            startDate = (await ethers.provider.getBlock('latest')).timestamp + 1;
            endDate = startDate + 10000;
            image = "https://example.com/image.jpg";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            // Tentative de modification du statut de la campagne par addr2, qui n'est pas le créateur.
            // Utilisez le bon ID de campagne ici. Si c'est le premier test à créer une campagne, l'ID devrait être 0.
            await expect(ecoGreenFund.connect(addr2).toggleCampaignStatus(0))
                .to.be.revertedWith('Only the campaign creator can call this function.');
        });


        it('Should toggle campaign status', async function () {
            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp + 1;
            let endDate = startDate + 2630016; // Fin après le début
            let image = "Image URI 1";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            let campaign = await ecoGreenFund.campaigns(0);
            expect(campaign.isActive).to.equal(true);

            await ecoGreenFund.connect(addr1).toggleCampaignStatus(0);

            campaign = await ecoGreenFund.campaigns(0);
            expect(campaign.isActive).to.equal(false);

            await ecoGreenFund.connect(addr1).toggleCampaignStatus(0);

            campaign = await ecoGreenFund.campaigns(0);
            expect(campaign.isActive).to.equal(true);
        });
    });

    describe('Contributions', function () {
        beforeEach(async function () {
            name = "Campaign test 1";
            description = "Description test 1";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp + 1;
            endDate = startDate + 2630016; // Fin après le début
            image = "Image URI 1";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);

            name = "Campaign test 2";
            description = "Description test 2";
            targetAmount = ethers.parseEther("10");
            startDate = (await ethers.provider.getBlock('latest')).timestamp - 10000;
            endDate = startDate + 10000 // Fin après le début
            image = "Image URI 2";

            await ecoGreenFund.connect(addr1).createCampaign(name, description, targetAmount, startDate, endDate, image);
        });

        it('Should revert if amount is 0', async function () {
            await expect(ecoGreenFund.connect(addr2).fundCampaign(0, {value: 0}))
                .to.be.revertedWith("Amount must be greater than zero");
        });

        it('Should revert if campaign is not active', async function () {
            await ecoGreenFund.connect(addr1).toggleCampaignStatus(0);
            await expect(ecoGreenFund.connect(addr2).fundCampaign(0, {value: ethers.parseEther("1")}))
                .to.be.revertedWith("Campaign is not active");
        });


        describe('Funding campaign expired', function () {
            it('Should revert if campaign is expired', async function () {
                await ethers.provider.send("evm_increaseTime", [2630017]);
                await ecoGreenFund.connect(addr1).toggleCampaignStatus(0);
                await expect(ecoGreenFund.connect(addr2).fundCampaign(0, {value: ethers.parseEther("1")}))
                    .to.be.revertedWith("Campaign is expired");

                //await ethers.provider.send("evm_decreaseTime", [2630017]);
            });
        });

        it('Should revert if campaign is funded', async function () {
            await ecoGreenFund.connect(addr2).fundCampaign(1, { value: ethers.parseEther("1.0") });

            await ecoGreenFund.connect(addr1).withdraw(1);

            // Étape 4: Tenter de financer à nouveau la campagne
            await expect(ecoGreenFund.connect(addr3).fundCampaign(1))
                .to.be.revertedWith("Campaign already funded");
        });

    });

});
