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

    // 이벤트 목록 (코드 스타일 메시지로 업데이트)
    const events = [
        { 
            message: (c1, c2) => `{ try { "${c1.name}"님이 "${c2.name}"님에게 롤 듀오를 신청합니다. } catch (error) { "거절당했습니다." } }`,
            action: (c1, c2) => { 
                const success = Math.random() > 0.5;
                if (success) {
                    c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 5);
                    c2.satiety = Math.min(MAX_SATIETY, c2.satiety + 5);
                } else {
                    c1.health = Math.max(0, c1.health - 5);
                }
            }
        },
        {
            message: (c1, c2) => `{ console.log("${c1.name}"님이 "${c2.name}"님을 괴롭힙니다. 😂); }`,
            action: (c1, c2) => { 
                c2.health = Math.max(0, c2.health - 15); 
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 5);
            }
        },
        {
            message: (c1) => `{ if (snack.found()) { "${c1.name}".satiety += 20; console.log("Yummy!"); } }`,
            action: (c1) => { c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 20); }
        },
        {
            message: (c1) => `{ wallet.add(10000); // "${c1.name}"님이 길에서 돈을 주웠습니다. }`,
            action: (c1) => { c1.money = Math.min(MAX_MONEY, c1.money + 10000); }
        },
        {
            message: (c1, c2) => `{ "${c1.name}".steal("${c2.name}".snack); satiety_exchange(10); }`,
            action: (c1, c2) => {
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                c2.satiety = Math.max(0, c2.satiety - 10);
            }
        },
        {
            message: (c1) => `{ "${c1.name}".work_out(); health += 10; satiety -= 5; }`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 10);
                c1.satiety = Math.max(0, c1.satiety - 5);
            }
        },
        { 
            message: (c1, c2) => `{ "${c1.name}".give_gift("${c2.name}"); money -= 5000; satiety += 15; }`,
            action: (c1, c2) => { 
                c2.satiety = Math.min(MAX_SATIETY, c2.satiety + 15);
                c1.money = Math.max(0, c1.money - 5000); 
            }
        },
        { 
            message: (c1, c2) => `{ "${c1.name}".cheer_up("${c2.name}"); health += 20; }`,
            action: (c1, c2) => { 
                c2.health = Math.min(MAX_HEALTH, c2.health + 20);
            }
        }
    ];

    // 코딩 버튼 이벤트
    codeButton.addEventListener('click', () => {
        // 3, 4, 5개 중 랜덤으로 결과 개수 결정
        const resultCount = Math.floor(Math.random() * 3) + 3;
        let outputHTML = '';

        for (let i = 0; i < resultCount; i++) {
            const eventIndex = Math.floor(Math.random() * events.length);
            const event = events[eventIndex];
            
            // 랜덤 캐릭터 선택
            const char1Index = Math.floor(Math.random() * characters.length);
            let char2Index = Math.floor(Math.random() * characters.length);
            while (char1Index === char2Index) {
                char2Index = Math.floor(Math.random() * characters.length);
            }
            
            const char1 = characters[char1Index];
            const char2 = characters[char2Index];

            // 액션 실행 및 메시지 생성
            event.action(char1, char2);
            outputHTML += `<div class="code-line">> ${event.message(char1, char2)}</div>`;
        }

        codeOutput.innerHTML = outputHTML;
        
        // 애니메이션 효과를 위해 클래스 추가/제거
        codeOutput.classList.remove('typing');
        void codeOutput.offsetWidth; // 리플로우 강제
        codeOutput.classList.add('typing');

        renderCharacters();
    });

    // 초기 렌더링
    renderCharacters();
});
