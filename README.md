# TraceBack - Tower Defence Remaster Project

## 📖 팀 노션

### [TraceBack](https://teamsparta.notion.site/TraceBack-68151bcd33104026b353fa51ed6f9b2c)

## 🎯 게임 주소

### 웹 주소 : [Tower Defence Remaster](https://towerdefence.shop/)

## 💡 팀 소개

- **TraceBack**은 번역하자면 **역추적**, 반대로 추적을 하는 것 입니다.
- 저희는 지금까지 걸어온 개발의 길을 다시 한번 경험하면서 걸어온 길이 잘못 되지는 않았는지, 
  이 길은 조금 더 좋게 바꿀 수 있는지 확인하면서 발전하고자 이러한 팀 명을 지었습니다.

## 👨‍👨‍👦‍👦팀원 소개

<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/xxooxx99"><img src="https://avatars.githubusercontent.com/u/142870523?v=4" width="100px;" alt=""/><br /><sub><b> 팀장 : 김태현 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/rhwjdgns"><img src="https://avatars.githubusercontent.com/u/167050760?v=4" width="100px;" alt=""/><br /><sub><b> 부팀장 : 고정훈 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/wjdrbsgkrry"><img src="https://avatars.githubusercontent.com/u/67831170?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 박정균 </b></sub></a><br /></td>
      <td align="center"><a href="https://github.com/Poison6251"><img src="https://avatars.githubusercontent.com/u/101390131?v=4" width="100px;" alt=""/><br /><sub><b> 팀원 : 손창환 </b></sub></a><br /></td>
    </tr>
  </tbody>
</table>

## 📄 프로젝트 소개

- 저희 프로젝트는 **WebSocket을 이용한 2D 타워 디펜스 게임** 입니다.

## 🔲서비스 아키텍쳐

![서비스 아키텍쳐](https://github.com/user-attachments/assets/7fc75a4c-f9ce-43d3-9714-8ef118f97f98)


## 🎰프로젝트 주요 기능

1. 🎮**게임 접속**

   - 웹 주소에 접속 시 회원가입을 진행합니다. 회원가입에는 아이디, 비밀번호, 휴대폰 번호가 필요합니다.
   - 아이디와 휴대폰 번호는 다른 유저들의 정보와 중복될 수 없습니다. (폰 번호당 1개의 아이디만 가입 가능합니다.)
   - 가입을 누르면 coolsms를 통해 휴대폰 번호로 발송 된 번호를 입력해주셔야만 회원가입이 완료됩니다.

2. 🥊**능력**

   - 게임을 플레이하는 동안 추가적으로 능력을 발동 할 수 있습니다.
   - 현재는 2가지 능력이 있고 1가지의 능력만 장착 가능합니다.
   - 능력의 설명, 업그레이드 비용 등 능력에 대한 값은 DB에 저장하여 불러오고 있습니다.

3. 👥**매칭**

   - "다른 사람과 게임하기" 버튼을 누르면 client는 userId를 server로 보냅니다.
   - server는 userId를 받아 매칭 대기열에 추가하며, 신호를 받을 때 마다 매칭 대기열에 있는 유저들을 검사합니다.
   - userId를 기반으로 유저 데이터 DB에서 가져온 승,패 데이터를 기반으로 승률에 따른 매치메이킹을 합니다.
   - 자신의 승률과 비슷한 상대방을 매칭 시켜줍니다.
   - 일정 시간이 지날 때 마다 매칭 되는 상대방의 승률의 폭이 넓어집니다.
   - 매칭이 된 두 유저에게 매칭 신호를 보냅니다.

4. 🏹**타워**

   - json을 기반으로 타워의 정보를 server에 입력해놓았습니다.
   - client에서 tower버튼의 index, 마우스의 좌표를 받아 지정 좌표에 index에 맞는 tower를 설치합니다.
   - 각 tower는 본인의 Data에 맞게 공격을 실시합니다. (ex. attackCycle,range,etc...)
   - 몬스터의 길과 다른 타워의 일정거리 내에서는 설치가 불가능합니다.
  
5. 👻**몬스터**

   - server로부터 monster의 index를 받아 그에 맞는 monster를 소환합니다.
   - 정해진 길을 따라 몬스터는 움직입니다.
   - 스테이지마다 정해진 몬스터의 수만큼 스폰됩니다.
   - 몬스터 사냥 시 server로 pakcet을 보내 몬스터의 사망을 알립니다.

6. 🥇🥈🥉**스테이지**

   - 정해진 몬스터의 수만큼 packet을 받으면 다음 스테이지로 넘어갑니다.
   - 3 스테이지마다 보스가 소환됩니다.
  
7. 😈**보스**

   - 3 스테이지마다 각기 다른 보스가 소환됩니다.
   - 보스의 정보는 server에서 가지고 있습니다.
   - 보스 사망 시 다음 스테이지로 넘어갑니다.
   - 각기 다른 보스들은 각기 다른 스텟 및 스킬을 가지고 있습니다. (이는 플레이 하시면서 알아보시는 재미가 있습니다)

8. 😀**채팅**

   - 채팅창에 채팅을 적고 Enter키를 누르면 client에서 server로 채팅이 전송됩니다.
   - server는 채팅 신호를 받으며, 이를 보낸 유저와 상대방에게 전송합니다.
   - 두 유저의 client는 수신받은 채팅을 UI로 띄웁니다.


