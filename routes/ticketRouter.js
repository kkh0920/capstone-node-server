import express from 'express';
const router = express.Router();

import config from '../src/config.js';
import contract from '../src/contract.js';

import { create } from "@web3-storage/w3up-client";
import { CID } from 'multiformats/cid'

const client = await create();
await client.login(config.WEB3_STORAGE_EMAIL);
const spaces = client.spaces();
const space = spaces.find(s => s.name === 'My First Project') || spaces[0];
await client.setCurrentSpace(space.did());

// 티켓 구매 API (from, to, details)
router.post('/api/ticket/buy', async function (req, res) {
    try {
        const from = req.body.from; // 이벤트 주최자 주소
        const to = req.body.to; // 구매자 주소
        const details = req.body.details; // 티켓 정보 (이벤트 이름, 날짜, 위치, 가격, 좌석 번호 등)
        // const details = {
        //     eventName: 'Event XYZ',
        //     eventDate: '2023-12-31',
        //     eventLocation: 'Seoul, South Korea',
        //     price: 100000,
        //     seatNumber: 'A1',
        //     additionalInfo: 'VIP access with backstage pass'
        // }

        console.log('--------- Ticket Buy ---------');
        console.log('from: ' + from);
        console.log('to: ' + to);
        console.log('details: ', details);

        // 티켓 데이터 업로드
        const file = new File(
            [ JSON.stringify(details) ],
            { type: 'application/json' }
        );
        const result = await client.uploadFile(file);
        const tokenUri = `https://${result}.ipfs.w3s.link`;
        console.log('tokenUri:', tokenUri);

        // 티켓 민팅
        await contract.mintTicket(from, to, tokenUri);
        console.log('------------------------------\n');

        res.status(200).send('ticket bought successfully');
    } catch (error) {
        console.log(error);
        console.log('------------------------------\n');
        res.status(500).send('failed to buy ticket');
    }
});

// 티켓 조회 API (memberAddress)
router.get('/api/ticket', async function (req, res) {
    try {
        const memberAddress = req.query.memberAddress;

        console.log('--------- Personal Ticket Info ---------');
        console.log("Your Address: ", memberAddress);

        const tickets = await contract.getTickets(memberAddress);

        console.log('Tickets: ', tickets);
        console.log('----------------------------------------\n');

        res.status(200).send({
            tokens: tickets // ticketDetails[0]: tokenId, ticketDetails[1]: tokenUri
        });
    } catch (error) {
        console.log(error);
        console.log('----------------------------------------\n');
        res.status(500).send('failed to get ticket');
    }
})

// 티켓 사용 API (memberAddress, tokenId)
router.post('/api/ticket/use', async function (req, res) {
    try {
        const memberAddress = req.body.memberAddress;
        const tokenId = req.body.tokenId;

        console.log('--------- Ticket Use ---------');
        console.log('Member Address: ' + memberAddress);
        console.log('Token ID: ' + tokenId);
        console.log('------------------------------\n');

        await contract.useTickets(memberAddress, tokenId);

        res.status(200).send('ticket used successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to use ticket');
    }
})

// 그룹에 티켓 공유 API (memberAddress, tokenId)
router.post('/api/ticket/share', async function (req, res) {
   try {
       const memberAddress = req.body.memberAddress;
       const tokenId = req.body.tokenId;

       console.log('--------- Personal Ticket Share ---------');
       console.log('Member Address: ' + memberAddress);
       console.log('Token ID: ' + tokenId);
       console.log('----------------------------------------\n');

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

       console.log('--------- Ticket Share Cancel ----------');
       console.log('Member Address: ' + memberAddress);
       console.log('Token ID: ' + tokenId);
       console.log('----------------------------------------\n');

       await contract.cancelShareTicket(memberAddress, tokenId);

       res.status(200).send('ticket share cancelled successfully');
   } catch (error) {
       console.log(error);
       res.status(500).send('failed to cancel ticket share');
   }
});

// 티켓 소각 API (issuerAddress, tokenId)
router.post('/api/ticket/burn', async function (req, res) {
    try {
        const issuerAddress = req.body.issuerAddress; // 이벤트 주최자 주소
        const tokenId = req.body.tokenId; // 티켓 ID

        console.log('--------- Ticket Burn ---------');
        console.log('Issuer Address: ' + issuerAddress);
        console.log('Token ID: ' + tokenId);

        // URI 에서 CID 추출
        const uri = await contract.tokenURI(tokenId);
        const cid = (uri.split('/')[2]).split('.')[0];
        console.log('Token URI: ' + uri);
        console.log('CID: ' + cid);

        // Web3 Storage 에서 티켓 데이터 삭제 & 컨트랙트에서 티켓 소각
        await client.remove(CID.parse(cid), { shards: false });
        await contract.burnTicket(issuerAddress, tokenId);
        console.log('-------------------------------\n');

        res.status(200).send('ticket burned successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to burn ticket');
    }
});

export default router;