document.addEventListener('DOMContentLoaded', () => {
    const characters = [
        { id: 1, name: '심우성', health: 70, satiety: 70, money: 0 },
        { id: 2, name: '채의진', health: 70, satiety: 70, money: 0 },
        { id: 3, name: '조윤혜', health: 70, satiety: 70, money: 0 },
        { id: 4, name: '조대환', health: 70, satiety: 70, money: 0 },
        { id: 5, name: '최준', health: 70, satiety: 70, money: 0 },
        { id: 6, name: '전유희', health: 70, satiety: 70, money: 0 },
    ];

    const MAX_HEALTH = 100;
    const MAX_SATIETY = 100;
    const MAX_MONEY = 1000000;

    const characterGrid = document.getElementById('character-grid');
    const codeOutput = document.getElementById('code-output');
    const codeButton = document.getElementById('code-button');

    // 캐릭터 UI 렌더링 함수
    function renderCharacters() {
        characterGrid.innerHTML = '';
        characters.forEach(char => {
            const charCard = document.createElement('div');
            charCard.className = 'character-card';
            charCard.innerHTML = `
                <h3 class="character-name">${char.name}</h3>
                <div class="status-bar-container">
                    <p class="status-label">체력: ${char.health} / ${MAX_HEALTH}</p>
                    <div class="status-bar">
                        <div class="status-bar-inner health-bar" style="width: ${char.health}%;"></div>
                    </div>
                </div>
                <div class="status-bar-container">
                    <p class="status-label">포만감: ${char.satiety} / ${MAX_SATIETY}</p>
                    <div class="status-bar">
                        <div class="status-bar-inner satiety-bar" style="width: ${char.satiety}%;"></div>
                    </div>
                </div>
                <p class="money-status">보유 원: ${char.money.toLocaleString()} / ${MAX_MONEY.toLocaleString()}</p>
            `;
            characterGrid.appendChild(charCard);
        });
    }

    // 이벤트 목록
    const events = [
        { 
            message: (c1, c2) => `${c1.name}이가 ${c2.name}에게 똥을 던졌습니다. ${c2.name}의 체력이 15 감소합니다.`,
            action: (c1, c2) => { c2.health = Math.max(0, c2.health - 15); }
        },
        {
            message: (c1) => `${c1.name}이가 맛있는 간식을 발견했습니다. 포만감이 20 증가합니다.`,
            action: (c1) => { c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 20); }
        },
        {
            message: (c1) => `${c1.name}이가 길에서 10,000원을 주웠습니다.`,
            action: (c1) => { c1.money = Math.min(MAX_MONEY, c1.money + 10000); }
        },
        {
            message: (c1, c2) => `${c1.name}이가 ${c2.name}의 간식을 빼앗아 먹었습니다. ${c1.name}의 포만감이 10 증가하고, ${c2.name}의 포만감이 10 감소합니다.`,
            action: (c1, c2) => {
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                c2.satiety = Math.max(0, c2.satiety - 10);
            }
        },
        {
            message: (c1) => `${c1.name}이가 운동을 시작했습니다. 체력이 10 증가하지만 포만감이 5 감소합니다.`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 10);
                c1.satiety = Math.max(0, c1.satiety - 5);
            }
        },
         { 
            message: (c1, c2) => `${c1.name}이가 ${c2.name}에게 선물을 주었습니다. ${c2.name}의 포만감이 15 증가하고 ${c1.name}은 5000원을 잃었습니다.`,
            action: (c1, c2) => { 
                c2.satiety = Math.max(0, c2.satiety + 15);
                 c1.money = Math.min(MAX_MONEY, c1.money - 5000); 
            }
        },
         { 
            message: (c1, c2) => `${c1.name}이가 ${c2.name}를 응원했습니다. ${c2.name}의 체력이 20 증가합니다.`,
            action: (c1, c2) => { c2.health = Math.max(0, c2.health + 20); }
        },
    ];

    // 버튼 클릭 이벤트 리스너
    codeButton.addEventListener('click', () => {
        codeOutput.innerHTML = '<p>시나모롤이 코딩을 시작합니다...</p>';

        // 간단한 딜레이 효과
        setTimeout(() => {
            const randomEvent = events[Math.floor(Math.random() * events.length)];
            
            // 캐릭터 랜덤 선택 (중복 가능, 혹은 중복 방지 로직 추가 가능)
            let char1 = characters[Math.floor(Math.random() * characters.length)];
            let char2 = characters[Math.floor(Math.random() * characters.length)];
            
            // 이벤트 실행
            randomEvent.action(char1, char2);

            // 결과 메시지 출력
            const message = randomEvent.message(char1, char2);
            codeOutput.innerHTML = `<p>코딩 결과:</p><p>${message}</p>`;

            // 캐릭터 UI 다시 렌더링
            renderCharacters();
        }, 1500); // 1.5초 후 결과 표시
    });

    // 초기 렌더링
    renderCharacters();
});