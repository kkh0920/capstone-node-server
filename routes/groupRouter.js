let express = require('express');
let router = express.Router();
let { ethers } = require('ethers');
const crypto = require('crypto');
const Safe = require('@safe-global/protocol-kit')
const config = require('../config');
const axios = require('axios');

const safeVersion = '1.4.1' // optional parameter

const provider = new ethers.JsonRpcProvider(config.RPC_URL);
const client = new ethers.Wallet(config.SIGNER_PRIVATE_KEY, provider);

// TODO: 그룹 탈퇴 기능 연동

// 그룹 조회 API
router.get('/api/group', async function (req, res, next) {
    const memberAddress = req.query.memberAddress
    console.log("Your Address: " + memberAddress);

    // TODO: web3.js를 통해 그룹 주소를 가져오는 것으로 수정한다. (요청 데이터: memberAddress)
    const safeWallet = await axios.get(config.SPRING_SERVER_URI + '/api/group/' + memberAddress);
    if(safeWallet.status !== 200) {
        console.error('Failed to fetch group info');
        res.status(500).send('Failed to fetch group info');
        return;
    }

    console.log("Group address: " + safeWallet.data);
    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        safeAddress: safeWallet.data
    });

    // TODO: 그룹의 정보(가입된 사람들, 해당 그룹에 보유하고 있는 티켓)을 가져온 후 프론트에 넘겨준다.
    // TODO: getTickets(_ticketOwner) 컨트랙트 수행
    // TODO: 가져온 tokenUri를 통해 IPFS에 저장된 이벤트(티켓) 데이터 가져오기
    const groupAddress = await protocolKit.getAddress()
    let owners = await protocolKit.getOwners();
    owners = owners.filter(owner => owner !== config.SIGNER_ADDRESS);
    console.log(owners);

    const result = {
        groupAddress: groupAddress,
        owners: owners,
    }

    res.status(200).send(result);
});

// 그룹 생성 API
router.post('/api/group', async function (req, res, next) {
    // 1. 그룹 생성을 위한 ProtocolKit 초기화
    const memberAddress = req.body.memberAddress;
    console.log("Member address: " + memberAddress);

    const safeAccountConfig = {
        owners: [memberAddress, config.SIGNER_ADDRESS],
        threshold: 1
    }
    const predictSafe = {
        safeAccountConfig,
        safeDeploymentConfig: {
            saltNonce: BigInt('0x' + crypto.randomBytes(8).toString('hex')),
            safeVersion: safeVersion
        }
    }
    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        predictedSafe: predictSafe
    })

    // 2. protocolKit를 통한 배포 트랜잭션 생성 및 전송
    const deploymentTransaction = await protocolKit.createSafeDeploymentTransaction()
    await client.sendTransaction({
        to: deploymentTransaction.to,
        value: BigInt(deploymentTransaction.value),
        data: deploymentTransaction.data
    })

    // TODO: Spring은 단순 회원인지만 체크하고, 그룹 가입 정보는 web3.js를 통해 진행한다. (요청 데이터: memberAddress, groupAddress)
    const groupAddress = await protocolKit.getAddress()
    console.log(groupAddress);
    const result = await axios.post(config.SPRING_SERVER_URI + '/api/group', {
        memberAddress: memberAddress,
        groupAddress: groupAddress
    }, {
        headers: { 'Content-Type': 'application/json' }
    })
    if (result.status !== 200) {
        console.error('Failed to save group info');
        res.status(500).send('Failed to save group info');
        return;
    }

    res.status(200).send('group created: ' + groupAddress);
});

// 그룹 구성원 가입 API (groupAddress, otherAddress 필요)
router.post('/api/group/add-owner', async function (req, res, next) {
    const groupAddress = req.body.groupAddress;
    const memberAddress = req.body.memberAddress;
    console.log("Group address: " + groupAddress + '\n' + "Your address: " + myAddress);
    // TODO: Spring DB의 그룹 초대 요청 테이블에 있는 초대 요청 데이터를 제거한다. (요청 데이터: groupAddress, memberAddress)
    // TODO: "요청이 없으면" 에러 리턴

    const protocolKit = await Safe.default.init({
        provider: config.RPC_URL,
        signer: config.SIGNER_PRIVATE_KEY, // executeTransaction을 통해 트랜잭션을 수행하기 위해서 signer가 필요함.
        safeAddress: groupAddress
    });
    const addOwnerTransaction = await protocolKit.createAddOwnerTx({
        ownerAddress: memberAddress,
        threshold: 1
    });
    await protocolKit.signTransaction(addOwnerTransaction);
    await protocolKit.executeTransaction(addOwnerTransaction);

    // TODO: "트랜잭션이 성공하였으면", web3.js를 통해 그룹 가입 메소드 수행 (요청 데이터: memberAddress, groupAddress)

    res.status(200);
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

    // TODO: 1. web3.js를 통해 그룹을 가져온다. (요청 데이터: memberAddress)
    // TODO:    1.1. 그룹 체크 1: memberAddress 사용자 그룹이 "존재하지 않으면" 에러
    // TODO:    1.2. 그룹 체크 2: otherAddress 사용자 그룹이 "존재하면" 에러

    // TODO: 2. Spring Database에 접근 (요청 데이터: memberAddress, otherAddress, groupAddress)
    // TODO:    2.1. 회원 체크 후 그룹 초대 요청 테이블 저장: (groupAddress, otherAddress)
    // TODO:    2.2. 이미 요청이 있으면 에러 리턴

    // 이후, 사용자가 초대 수락을 누르면 서명 후 그룹 구성원 가입 API를 호출하는 방식
});

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;