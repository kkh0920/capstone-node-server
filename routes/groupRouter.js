const express = require('express');
const router = express.Router();
const axios = require('axios');
const config = require('../src/config');
const contract = require('../src/contract');
const safe = require('../src/safe');

// 그룹 조회 API
router.get('/api/group', async function (req, res, next) {
    try {
        const memberAddress = req.query.memberAddress
        const groupAddress = await contract.getGroup(memberAddress);

        // TODO: 가져온 tokenUri를 통해 IPFS에 저장된 이벤트(티켓) 데이터 가져오기
        const owners = await contract.getOwners(groupAddress); // 1. 그룹 구성원
        const ticketDetails = await contract.getTickets(groupAddress);  // 2. 그룹 티켓 (tokenId, ipfsUri)

        let tokens = [];
        for (let i = 0; i < ticketDetails[0].length; i++) {
            tokens[i] = {
                tokenId: parseInt(ticketDetails[0][i]), // tokenId를 정수로 변환
                tokenUri: ticketDetails[1][i], // IPFS URI
                issuer: ticketDetails[2][i], // 이벤트 주최자 주소
                buyer: ticketDetails[3][i] // 구매자 주소
            }
        }
        console.log('-------------- Group Info --------------');
        console.log("Your Address: ", memberAddress);
        console.log("Group Address: ", groupAddress);
        console.log('Owners: ', owners);
        console.log('Tokens: ', tokens);
        console.log('----------------------------------------\n');

        res.status(200).send({
            groupAddress: groupAddress,
            owners: owners,
            tokens: tokens
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to get group');
    }
});

// 그룹 생성 API
router.post('/api/group', async function (req, res, next) {
    try {
        const memberAddress = req.body.memberAddress;

        console.log("-------------- Group Create --------------");
        console.log("Member address: " + memberAddress);
        // 회원 체크 & 그룹 유무 체크
        await axios.get(config.SPRING_SERVER_URI + '/api/user/validate/' + memberAddress);
        if (await contract.isGroupMember(memberAddress)) {
            console.log("Already group member");
            res.status(400).send('Already group member');
            return;
        }
        // 그룹 생성 (Safe Wallet 트랜잭션) & 블록체인에 그룹 정보 저장
        const groupAddress = await safe.createGroup();
        const transactionHash = await contract.joinGroup(memberAddress, groupAddress);

        console.log('Group Address: ' + groupAddress);
        console.log('----------------------------------------\n');

        res.status(200).send({
            groupAddress: groupAddress,
            transactionHash: transactionHash
        });
    } catch (error) {
        console.log(error);
        console.log('----------------------------------------\n');
        res.status(500).send('failed to create group');
    }
});

// 그룹 탈퇴 API
router.post('/api/group/leave', async function (req, res, next) {
    try {
        const memberAddress = req.body.memberAddress;
        console.log("Member address: " + memberAddress);
        await contract.leaveGroup(memberAddress);
        res.status(200).send('Group left successfully');
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to leave group');
    }
})

// 그룹 구성원 가입 API (groupAddress, otherAddress 필요)
router.post('/api/group/join', async function (req, res, next) {
    try {
        const groupAddress = req.body.groupAddress;
        const memberAddress = req.body.memberAddress;
        console.log("Group address: " + groupAddress + '\n' + "Your address: " + memberAddress);

        // TODO: Spring DB의 그룹 초대 요청 테이블에 있는 초대 요청 데이터를 제거한다. (요청 데이터: groupAddress, memberAddress)
        // TODO: "요청이 없으면" 에러 리턴

        await contract.joinGroup(memberAddress, groupAddress);

        res.status(200).send("Group joined successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send('failed to add owner');
    }
});

// 그룹 초대 요청 조회 API (memberAddress)
router.get('/api/group/request', async function (req, res, next) {
    const memberAddress = req.query.memberAddress;

    // TODO: 1. Spring Database에 접근하여 회원 체크: memberAddress
    // TODO: 2. memberAddress로 그룹 초대 요청 테이블 값을 가져오고 프론트에 전달
})

// 그룹 초대 요청 API (memberAddress, otherAddress)
router.post('/api/group/request', async function (req, res, next) {
    const memberAddress = req.body.memberAddress;
    const otherAddress = req.body.otherAddress;
    console.log("Member address: " + memberAddress + '\n' + "Other address: " + otherAddress);

    if (await contract.isGroupMember(otherAddress)) {
        console.log(otherAddress + "is already group member");
        res.status(400).send("This member is already group member");
        return;
    }

    const groupAddress = await contract.getGroup(memberAddress);
    console.log("Group address: " + groupAddress);

    // TODO: Spring Database에 접근 (요청 데이터: memberAddress, otherAddress, groupAddress)
    // TODO:    1. 회원 체크 후 그룹 초대 요청 테이블 저장: (groupAddress, otherAddress)
    // TODO:    2. 이미 요청이 있으면 에러 리턴

    // 이후, 사용자가 초대 수락을 누르면 서명 후 그룹 구성원 가입 API를 호출하는 방식
    res.status(200).send('Request sent successfully');
});

module.exports = router;