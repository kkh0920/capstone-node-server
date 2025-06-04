// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

interface IERC5484 {
    // Both Issuer and Buyer can allow burning the tokens
    enum BurnAuth {
        IssuerOnly,
        BuyerOnly,
        Both,
        Neither
    }

    event Issued (
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        BurnAuth burnAuth
    );

    function burnAuth(uint256 tokenId) external view returns (BurnAuth);
}

contract Ticket is ERC721Enumerable, IERC5484 {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    struct TicketDetails {
        string tokenURI;
        address issuer;
        address buyer;
        BurnAuth burnAuth;
    }

    mapping(uint256 => TicketDetails) private ticketDetails;
    mapping(address => address) private groups;
    mapping(address => address[]) owners;

    constructor() ERC721("EventTicket", "ticketSBT") {} // string memory _name, string memory _symbol

    /* --------------------- Ticket method ------------------ */

    function tokenURI(uint256 _tokenId) override view public returns (string memory) {
        return ticketDetails[_tokenId].tokenURI;
    }

    function mintTicket(address _from, address _to, string memory _tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();
        BurnAuth auth = BurnAuth.IssuerOnly; // only issuer can burn ticket

        _safeMint(_to, tokenId);

        ticketDetails[tokenId] = TicketDetails(
            _tokenURI,
            _from,
            _to,
            auth
        );

        emit Issued(_from, _to, tokenId, auth);

        return tokenId;
    }

    function getTickets(address _ticketOwner) view public returns (uint256[] memory, string[] memory, address[] memory, address[] memory) {
        uint256 balance = balanceOf(_ticketOwner);
        uint256[] memory tokenId = new uint256[](balance);
        string[] memory tokenUri = new string[](balance);
        address[] memory issuer = new address[](balance);
        address[] memory buyer = new address[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenId[i] = tokenOfOwnerByIndex(_ticketOwner, i);
            tokenUri[i] = tokenURI(tokenId[i]);
            issuer[i] = ticketDetails[tokenId[i]].issuer;
            buyer[i] = ticketDetails[tokenId[i]].buyer;
        }

        // return (tokenId, tokenUri);
        return (tokenId, tokenUri, issuer, buyer);
    }

    function shareTicket(address _from, uint256 _tokenId) public {
        require(groups[_from] != address(0x0), "This member has no group");
        require(_from == ticketDetails[_tokenId].buyer, "Ticket is not yours");
        require(_ownerOf(_tokenId) == _from, "Ticket is not exist in your wallet");
        _safeTransfer(_from, groups[_from], _tokenId);
    }

    function cancelShareTicket(address _from, uint256 _tokenId) public {
        require(groups[_from] != address(0x0), "This member has no group");
        require(_from == ticketDetails[_tokenId].buyer, "Ticket is not yours");
        require(_ownerOf(_tokenId) == groups[_from], "Ticket is not exist in your group");
        _safeTransfer(groups[_from], _from, _tokenId);
    }

    function burnTicket(address _from, uint256 _tokenId) external {
        BurnAuth auth = ticketDetails[_tokenId].burnAuth;

        address issuer = ticketDetails[_tokenId].issuer;
        address buyer = ticketDetails[_tokenId].buyer;

        if (auth == BurnAuth.IssuerOnly) {
            require(_from == issuer, "Only issuer can burn");
        } else if (auth == BurnAuth.BuyerOnly) {
            require(_from == buyer, "Only buyer can burn");
        } else if (auth == BurnAuth.Both) {
            require(_from == issuer || _from == buyer, "Only issuer or buyer can burn");
        } else if (auth == BurnAuth.Neither) {
            revert("This token is not burnable");
        }

        _burn(_tokenId);

        delete ticketDetails[_tokenId]; //clean up
    }

    function burnAuth(uint256 _tokenId) external view override returns (BurnAuth) {
        return ticketDetails[_tokenId].burnAuth;
    }

    /* --------------------- Group method ------------------ */

    function joinGroup(address _member, address _group) public {
        require(groups[_member] == address(0x0), "This member is already in the group");
        groups[_member] = _group;
        owners[_group].push(_member);
    }

    function leaveGroup(address _member) public {
        require(groups[_member] != address(0x0), "This member has no group");

        // 그룹 탈퇴 시, 그룹에 공유 중인 티켓을 본인 지갑으로 옮긴다.
        (uint256[] memory id, , , ) = getTickets(groups[_member]);
        for (uint256 i = 0; i < id.length; i++) {
            if (_member == ticketDetails[id[i]].buyer) {
                cancelShareTicket(_member, id[i]);
            }
        }

        // 그룹 구성원 정보 제거
        address[] storage owner = owners[groups[_member]];
        for (uint256 i = 0; i < owner.length; i++) {
            if (_member == owner[i]) {
                for (uint256 j = i; j < owner.length - 1; j++) {
                    owner[j] = owner[j + 1];
                }
                owner.pop();
                break;
            }
        }

        delete groups[_member];
    }

    function getGroup(address _member) public view returns(address) {
        require(groups[_member] != address(0x0), "This member has no group");
        return groups[_member];
    }

    function getOwners(address _group) public view returns(address[] memory) {
        return owners[_group];
    }

    function isGroupMember(address _member) public view returns (bool) {
        if (groups[_member] == address(0x0)) {
            return false;
        }
        return true;
    }

    /* --------------------- Transfer disabled (Soul Bound Token) ------------------ */

    function transferFrom(address, address, uint256) public pure override(ERC721, IERC721) { revert("Transfers of Soul Bound Token are disabled"); }
    function safeTransferFrom(address, address, uint256, bytes memory) public pure override(ERC721, IERC721) { revert("Transfers of Soul Bound Token are disabled"); }
}