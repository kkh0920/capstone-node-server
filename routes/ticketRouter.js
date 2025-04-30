// TODO: web3.js 를 통해 컨트랙트 연동

// TODO:    1. 티켓 구매 (발행) "payable 설정"
// TODO:        1.1. Spring DB를 통해 회원 체크 (?)
// TODO:        1.2. 이벤트(티켓) 데이터, 이벤트 주최자 address 가져오고 mintTicket(from, to, tokenURI) 컨트랙트 수행
// TODO:        1.3. 민트 성공 시, IPFS에 이벤트(티켓) 데이터 저장

// TODO:    2. 개인 티켓 조회 (그룹 티켓은 groupRouter.js 에서 처리)
// TODO:        3.1. getTickets(_ticketOwner) 컨트랙트 수행
// TODO:        3.2. 가져온 tokenUri를 통해 IPFS에 저장된 이벤트(티켓) 데이터 가져오기

// TODO:    3. 그룹에 티켓 공유
// TODO:        4.1. shareTicket(address _from, uint256 _tokenId)

// TODO:    4. 그룹 티켓 공유 취소
// TODO:        5.1. cancelShareTicket(address _from, uint256 _tokenId)

// TODO:    5. 티켓 환불 (소각)
// TODO:        2.1. Spring DB를 통해 회원 체크 (?)
// TODO:        2.2. 이벤트 주최자에게 환불 요청. (환불 요청 테이블?)
// TODO:        2.3. 요청 수락하면 address 가져오기. (IssuerOnly로 소각 권한 설정됨)
// TODO:        2.4. tokenURI(_tokenId) 컨트랙트를 통해 URI 가져오기
// TODO:        2.4. URI를 통해 IPFS에 저장된 이벤트(티켓) 데이터 삭제 & burnTicket(_from, _tokenId) 컨트랙트 수행

