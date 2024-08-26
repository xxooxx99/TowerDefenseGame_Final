const baseHp = {
    value: 1000, // 초기 기지 체력
  };
  
  const attackBase = (data, socket) => {
    const { damage } = data;
  
    if (typeof damage !== 'number' || damage <= 0) {
      return;
    }
  
    baseHp.value -= damage;
  
    if (baseHp.value <= 0) {
      // 기지가 파괴된 경우 추가 로직 (게임 오버 등) or 이벤트
      baseHp.value = 0;
    }
  
    // 필요에 따라 모든 클라이언트에게 새로운 기지 체력 상태를 브로드캐스트
    socket.broadcast.emit('updateBaseHp', { baseHp: baseHp.value });
  };
  
export { attackBase, baseHp };