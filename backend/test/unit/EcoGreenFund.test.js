const {expect} = require('chai');
const {ethers} = require('hardhat');

describe('EcoGreenFund Contract', function () {
    let ecoGreenFund;
    let mockGreenLeafToken;
    let owner, addr1, addr2, addr3, addr4;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

        mockGreenLeafToken = await ethers.getContractAt('IGreenLeafToken', owner);

        const EcoGreenFund = await ethers.getContractFactory('EcoGreenFund');
        ecoGreenFund = await EcoGreenFund.deploy(mockGreenLeafToken.target);
    });

    it('Should set the right owner', async function () {
        expect(await ecoGreenFund.owner()).to.equal(owner.address);
    });

    it("Should set the initial values correctly", async function () {
        // Assuming your contract has getter functions or public variables to access these values
        expect(await ecoGreenFund.greenLeafToken()).to.equal(mockGreenLeafToken.target);

    });

    describe('Project Registration', function () {
        it('Should revert if no validate parameters are not passed', async function () {
            await expect(ecoGreenFund.addProject(
                '0',
                'project test 1',
                'description test 1',
                'img uri test 1',
            )).to.be.revertedWith('Goal amount cannot be 0');

            await expect(ecoGreenFund.addProject(
                '1000',
                '',
                'description test 1',
                'img uri test 1',
            )).to.be.revertedWith('Name cannot be empty');

            await expect(ecoGreenFund.addProject(
                '1000',
                'project ',
                '',
                'img uri test 1',
            )).to.be.revertedWith('Description cannot be empty');

            await expect(ecoGreenFund.addProject(
                '1000',
                'project test 1',
                'description test 1',
                '',
            )).to.be.revertedWith('ImgURI cannot be empty');
        });

        it('Should add a project', async function () {
            await ecoGreenFund.connect(addr1).addProject(
                '1000',
                'project test 1',
                'description test 1',
                'img uri test 1',
            );

            const project = await ecoGreenFund.Projects(0);
            expect(project.goal).to.equal('1000');
            expect(project.name).to.equal('project test 1');
            expect(project.description).to.equal('description test 1');
            expect(project.imgURI).to.equal('img uri test 1');
            expect(project.raisedAmount).to.equal('0');
            expect(project.creator).to.equal(addr1.address);
        });

        it('Should emit ProjectAdded event', async function () {
            await expect(ecoGreenFund.connect(addr1).addProject(
                '1000',
                'project test 1',
                'description test 1',
                'img uri test 1',
            )).to.emit(ecoGreenFund, 'ProjectAdded')
                .withArgs(
                    0,
                    addr1.address,
                    'project test 1',
                   '1000'
                );
        });

        describe('Get and update project', function () {
            beforeEach(async function () {
                await ecoGreenFund.connect(addr1).addProject(
                    '1000',
                    'project test 1',
                    'description test 1',
                    'img uri test 1',
                );
            });

            it('Should revert if project does not exist', async function () {
                await expect(ecoGreenFund.connect(addr1).getProject(1)).to.be.revertedWith('Project does not exist');
            })

            it('Should revert if is not the creator of project or the owner', async function () {
                // L'ID du projet est probablement 0 car c'est le premier projet ajouté.
                const projectId = 0;

                // addr2 essaie de mettre à jour le projet que addr1 a créé.
                await expect(ecoGreenFund.connect(addr2).updateProject(
                    projectId,
                    '2000', // Nouveau montant de l'objectif, par exemple
                    'project test 1 updated',
                    'description test 1 updated',
                    'img uri test 1 updated',
                )).to.be.revertedWith('Caller is not the creator or the owner');
            });

            it('should update a project if is the creator', async function () {
                const projectId = 0;
                await ecoGreenFund.connect(addr1).updateProject(
                    projectId,
                    '2000', // Nouveau montant de l'objectif
                    'project test 1 updated',
                    'description test 1 updated',
                    'img uri test 1 updated',
                )

                // Vérifier que le projet a été mis à jour
                const project = await ecoGreenFund.getProject(projectId);
                expect(project.goal).to.equal('2000');
                expect(project.name).to.equal('project test 1 updated');
                expect(project.description).to.equal('description test 1 updated');
                expect(project.imgURI).to.equal('img uri test 1 updated');
            });

            it('should update a project if is the owner', async function () {
                const projectId = 0;
                await ecoGreenFund.connect(owner).updateProject(
                    projectId,
                    '3000', // Nouveau montant de l'objectif
                    'project test 1 owner update',
                    'description test 1 owner update',
                    'img uri test 1 owner update',
                );

                // Vérifier que le projet a été mis à jour
                const project = await ecoGreenFund.getProject(projectId);
                expect(project.goal).to.equal('3000');
                expect(project.name).to.equal('project test 1 owner update');
                expect(project.description).to.equal('description test 1 owner update');
                expect(project.imgURI).to.equal('img uri test 1 owner update');
            });

            it('Should emit ProjectUpdated event', async function () {
                const projectId = 0;
                await expect(ecoGreenFund.connect(addr1).updateProject(
                    projectId,
                    '2000', // Nouveau montant de l'objectif
                    'project test 1 updated',
                    'description test 1 updated',
                    'img uri test 1 updated',
                )).to.emit(ecoGreenFund, 'ProjectUpdated')
                    .withArgs(
                        projectId,
                        addr1.address,
                        'project test 1 updated',
                        '2000'
                    );
            });

            it('Should not modify project success status if not owner or creator of project', async function () {
                const projectId = 0;
                await expect(ecoGreenFund.connect(addr2).modifyProjectSuccessStatus(projectId, true))
                    .to.be.revertedWith('Caller is not the creator or the owner');
            })

            it('Should modify project success status if is creator', async function () {
                const projectId = 0;
                await ecoGreenFund.connect(addr1).modifyProjectSuccessStatus(projectId, true);
                const project = await ecoGreenFund.getProject(projectId);
                expect(project.isFunded).to.equal(true);
            });

            it('Should modify project success status if is owner', async function () {
                const projectId = 0;
                await ecoGreenFund.connect(owner).modifyProjectSuccessStatus(projectId, true);
                const project = await ecoGreenFund.getProject(projectId);
                expect(project.isFunded).to.equal(true);
            });

            it('Should emit ProjectSuccessStatusModified event', async function () {
                const projectId = 0;
                await expect(ecoGreenFund.connect(addr1).modifyProjectSuccessStatus(projectId, true)).to.emit(ecoGreenFund, 'ProjectSuccessStatusChanged')
                    .withArgs(
                        projectId,
                        true
                    );
            });
        });



    });

});
