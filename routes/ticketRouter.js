const express = require('express');
const router = express.Router();
const config = require('../src/config');
const contract = require('../src/contract');

// 티켓 구매 API (from, to)
router.post('/api/ticket/buy', async function (req, res) {
    try {
        const from = req.body.from; // 이벤트 주최자 주소
        const to = req.body.to; // 구매자 주소
        const tokenUri = "test";

        await contract.mintTicket(from, to, tokenUri);

        console.log('--------- Ticket Buy ---------');
        console.log('from: ' + from + ', to: ' + to + ', tokenUri: ' + tokenUri);
        console.log('------------------------------\n');

        // TODO: 민트 성공 시, IPFS에 이벤트(티켓) 데이터 저장

        res.status(200).send('ticket bought successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to buy ticket');
    }
});

// 티켓 조회 API (memberAddress)
router.get('/api/ticket', async function (req, res) {
    try {
        const memberAddress = req.query.memberAddress;
        const ticketDetails = await contract.getTickets(memberAddress);

        let tokens = [];
        for (let i = 0; i < ticketDetails[0].length; i++) {
            tokens[i] = {
                tokenId: parseInt(ticketDetails[0][i]), // tokenId를 정수로 변환
                tokenUri: ticketDetails[1][i], // IPFS URI
                issuer: ticketDetails[2][i], // 이벤트 주최자 주소
                buyer: ticketDetails[3][i] // 구매자 주소
            }
        }

        console.log('--------- Personal Ticket Info ---------');
        console.log("Your Address: ", memberAddress);
        console.log('Tickets: ', tokens);
        console.log('----------------------------------------\n');

        // TODO: 가져온 tokenUri를 통해 IPFS에 저장된 이벤트(티켓) 데이터 가져오기

        res.status(200).send({
            tokens: tokens // ticketDetails[0]: tokenId, ticketDetails[1]: tokenUri
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to get ticket');
    }
})

// 그룹에 티켓 공유 API (memberAddress, tokenId)
router.post('/api/ticket/share', async function (req, res) {
   try {
       const memberAddress = req.body.memberAddress;
       const tokenId = req.body.tokenId;

       await contract.shareTicket(memberAddress, tokenId);

       res.status(200).send('ticket shared successfully');
   } catch (error) {
       console.log(error);
       res.status(500).send('failed to share ticket');
   }
});

// 티켓 공유 취소 API (memberAddress, tokenId)
router.post('/api/ticket/cancelShare', async function (req, res) {
   try {
       const memberAddress = req.body.memberAddress;
       const tokenId = req.body.tokenId;

       await contract.cancelShareTicket(memberAddress, tokenId);

       res.status(200).send('ticket share cancelled successfully');
   } catch (error) {
       console.log(error);
       res.status(500).send('failed to cancel ticket share');
   }
});

// TODO:    5. 티켓 환불 (소각)
// TODO:        5.1. Spring DB를 통해 회원 체크 (?)
// TODO:        5.2. 이벤트 주최자에게 환불 요청. (환불 요청 테이블?)
// TODO:        5.3. 요청 수락하면 address 가져오기. (IssuerOnly로 소각 권한 설정됨)
// TODO:        5.4. tokenURI(_tokenId) 컨트랙트를 통해 URI 가져오기
// TODO:        5.5. URI를 통해 IPFS에 저장된 이벤트(티켓) 데이터 삭제 & burnTicket(_from, _tokenId) 컨트랙트 수행

module.exports = router;