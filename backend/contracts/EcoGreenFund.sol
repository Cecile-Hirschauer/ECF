// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./GreenLeafToken.sol";
import "./interfaces/IGreenLeafToken.sol";

contract EcoGreenFund is Ownable, ReentrancyGuard {
    IERC20 public StakingToken;

    IGreenLeafToken public greenLeafToken;

    struct ProjectData {
        address creator;
        uint256 goal;
        uint256 raisedAmount;
        bool isFunded;
        bool isActive;
        string name;
        string description;
        string imgURI;
    }


    mapping(uint256 => ProjectData) public Projects;


    uint256 public nextProjectId;


    event ProjectAdded(uint256 projectId, address indexed creator, string name, uint256 goal);
    event ProjectUpdated(uint256 projectId, address indexed creator, string name, uint256 goal);
    event ProjectSuccessStatusChanged(uint256 projectId, bool status);


    constructor(address _GLTAddress) Ownable(msg.sender) {
        greenLeafToken = IGreenLeafToken(_GLTAddress);
    }
    // ************* project MANAGEMENT ************* //

    function _validateProjectParameters(
        uint256 _goal,
        string memory _name,
        string memory _description,
        string memory _imgURI
    ) internal pure {
        require(_goal > 0, "Goal amount cannot be 0");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_imgURI).length > 0, "ImgURI cannot be empty");
    }

    function addProject(uint256 _goal, string calldata _name, string calldata _description, string calldata _imgURI) external {
        _validateProjectParameters(_goal, _name, _description, _imgURI);

        Projects[nextProjectId] = ProjectData({
            creator: msg.sender,
            goal: _goal,
            raisedAmount: 0,
            isFunded: false,
            isActive: true,
            name: _name,
            description: _description,
            imgURI: _imgURI
        });

        emit ProjectAdded(nextProjectId, msg.sender, _name, _goal);
        nextProjectId++;
    }

    function updateProject(uint256 _projectId, uint256 _goal, string calldata _name, string calldata _description, string calldata _imgURI) external {
        require(Projects[_projectId].isActive, "Project does not exist");
        require(msg.sender == Projects[_projectId].creator || msg.sender == owner(), "Caller is not the creator or the owner");

        _validateProjectParameters(_goal, _name, _description, _imgURI);

        Projects[_projectId].goal = _goal;
        Projects[_projectId].name = _name;
        Projects[_projectId].description = _description;
        Projects[_projectId].imgURI = _imgURI;

        emit ProjectUpdated(_projectId, msg.sender, _name, _goal);
    }

    function modifyProjectSuccessStatus(uint256 _projectId, bool _status) external {
        require(msg.sender == owner() || msg.sender == Projects[_projectId].creator, "Caller is not the creator or the owner");
        require(Projects[_projectId].isActive, "project does not exist");

        Projects[_projectId].isFunded = _status;

        emit ProjectSuccessStatusChanged(_projectId, _status);
    }


    function getProject(uint256 _projectId) external view returns (
        address creator,
        uint256 goal,
        uint256 raisedAmount,
        bool isFunded,
        bool isActive,
        string memory name,
        string memory description,
        string memory imgURI
    ) {
        require(Projects[_projectId].isActive, "Project does not exist");
        ProjectData storage project = Projects[_projectId];
        return (
                project.creator,
                project.goal,
                raisedAmount,
                project.isFunded,
                project.isActive,
                project.name,
                project.description,
                project.imgURI
        );
    }


}
