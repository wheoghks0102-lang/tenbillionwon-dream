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

    // 사운드 효과 설정
    const sounds = {
        click: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'), // 뾰로롱/팝
        typing: new Audio('https://assets.mixkit.co/active_storage/sfx/1583/1583-preview.mp3'), // 키보드
        gain: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),  // 긍정
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')   // 부정
    };

    const characterGrid = document.getElementById('character-grid');
    const codeOutput = document.getElementById('code-output');
    const codeButton = document.getElementById('code-button');

    function getStatusIcons(char) {
        let icons = '';
        if (char.health < 20) icons += '💀';
        else if (char.health < 50) icons += '💦';
        
        if (char.satiety < 30) icons += '🍕?';
        return icons;
    }

    // 캐릭터 UI 렌더링 함수
    function renderCharacters() {
        characterGrid.innerHTML = '';
        characters.forEach(char => {
            const charCard = document.createElement('div');
            charCard.className = `character-card ${char.money >= 10000 ? 'wealthy-glow' : ''}`;
            charCard.id = `char-${char.id}`;
            charCard.innerHTML = `
                <div class="card-header">
                    <h3 class="character-name">${char.name}</h3>
                    <span class="status-icon">${getStatusIcons(char)}</span>
                </div>
                <div class="status-bar-container">
                    <p class="status-label">체력: <span class="health-val">${char.health}</span> / ${MAX_HEALTH}</p>
                    <div class="status-bar">
                        <div class="status-bar-inner health-bar" style="width: ${char.health}%;"></div>
                    </div>
                </div>
                <div class="status-bar-container">
                    <p class="status-label">포만감: <span class="satiety-val">${char.satiety}</span> / ${MAX_SATIETY}</p>
                    <div class="status-bar">
                        <div class="status-bar-inner satiety-bar" style="width: ${char.satiety}%;"></div>
                    </div>
                </div>
                <p class="money-status">보유 원: <span class="money-val">${char.money.toLocaleString()}</span> / ${MAX_MONEY.toLocaleString()}</p>
            `;
            characterGrid.appendChild(charCard);
        });
    }

    function animateCharacter(charId, type) {
        const card = document.getElementById(`char-${charId}`);
        if (!card) return;
        
        card.classList.remove('pulse-gain', 'pulse-loss');
        void card.offsetWidth; 
        card.classList.add(type === 'gain' ? 'pulse-gain' : 'pulse-loss');
        
        // 사운드 재생
        if (type === 'gain') sounds.gain.play().catch(e => {});
        else sounds.loss.play().catch(e => {});
    }

    function updateCharacterUI(char) {
        const card = document.getElementById(`char-${char.id}`);
        if (!card) return;

        const healthBar = card.querySelector('.health-bar');
        const healthVal = card.querySelector('.health-val');
        const satietyBar = card.querySelector('.satiety-bar');
        const satietyVal = card.querySelector('.satiety-val');
        const moneyVal = card.querySelector('.money-val');
        const statusIcon = card.querySelector('.status-icon');

        healthBar.style.width = `${char.health}%`;
        healthVal.textContent = char.health;
        satietyBar.style.width = `${char.satiety}%`;
        satietyVal.textContent = char.satiety;
        moneyVal.textContent = char.money.toLocaleString();
        
        // 아이콘 업데이트
        statusIcon.textContent = getStatusIcons(char);
        
        // 부자 효과 업데이트
        if (char.money >= 10000) {
            card.classList.add('wealthy-glow');
        } else {
            card.classList.remove('wealthy-glow');
        }
    }

    const events = [
        { 
            message: (c1, c2) => `{ try { "${c1.name}"님이 "${c2.name}"님에게 롤 듀오를 신청합니다. } catch (error) { "거절당했습니다." } }`,
            result: (c1, c2, success) => success ? `결과: ${c1.name}, ${c2.name} 포만감 +5` : `결과: ${c1.name} 체력 -5 (실패)`,
            action: (c1, c2) => { 
                const success = Math.random() > 0.5;
                if (success) {
                    c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 5);
                    c2.satiety = Math.min(MAX_SATIETY, c2.satiety + 5);
                    animateCharacter(c1.id, 'gain');
                    animateCharacter(c2.id, 'gain');
                } else {
                    c1.health = Math.max(0, c1.health - 5);
                    animateCharacter(c1.id, 'loss');
                }
                updateCharacterUI(c1);
                updateCharacterUI(c2);
                return success;
            }
        },
        {
            message: (c1, c2) => `{ console.log("${c1.name}"님이 "${c2.name}"님을 괴롭힙니다. 😂); }`,
            result: (c1, c2) => `결과: ${c2.name} 체력 -15, ${c1.name} 포만감 +5`,
            action: (c1, c2) => { 
                c2.health = Math.max(0, c2.health - 15); 
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 5);
                animateCharacter(c2.id, 'loss');
                animateCharacter(c1.id, 'gain');
                updateCharacterUI(c1);
                updateCharacterUI(c2);
            }
        },
        {
            message: (c1) => `{ if (snack.found()) { "${c1.name}".satiety += 20; console.log("Yummy!"); } }`,
            result: (c1) => `결과: ${c1.name} 포만감 +20`,
            action: (c1) => { 
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 20); 
                animateCharacter(c1.id, 'gain');
                updateCharacterUI(c1);
            }
        },
        {
            message: (c1) => `{ wallet.add(10000); // "${c1.name}"님이 길에서 돈을 주웠습니다. }`,
            result: (c1) => `결과: ${c1.name} 보유 원 +10,000`,
            action: (c1) => { 
                c1.money = Math.min(MAX_MONEY, c1.money + 10000); 
                animateCharacter(c1.id, 'gain');
                updateCharacterUI(c1);
            }
        },
        {
            message: (c1, c2) => `{ "${c1.name}".steal("${c2.name}".snack); satiety_exchange(10); }`,
            result: (c1, c2) => `결과: ${c1.name} 포만감 +10, ${c2.name} 포만감 -10`,
            action: (c1, c2) => {
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                c2.satiety = Math.max(0, c2.satiety - 10);
                animateCharacter(c1.id, 'gain');
                animateCharacter(c2.id, 'loss');
                updateCharacterUI(c1);
                updateCharacterUI(c2);
            }
        },
        {
            message: (c1) => `{ "${c1.name}".work_out(); health += 10; satiety -= 5; }`,
            result: (c1) => `결과: ${c1.name} 체력 +10, 포만감 -5`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 10);
                c1.satiety = Math.max(0, c1.satiety - 5);
                animateCharacter(c1.id, 'gain');
                updateCharacterUI(c1);
            }
        },
        { 
            message: (c1, c2) => `{ "${c1.name}".give_gift("${c2.name}"); money -= 5000; satiety += 15; }`,
            result: (c1, c2) => `결과: ${c2.name} 포만감 +15, ${c1.name} 보유 원 -5,000`,
            action: (c1, c2) => { 
                c2.satiety = Math.min(MAX_SATIETY, c2.satiety + 15);
                c1.money = Math.max(0, c1.money - 5000); 
                animateCharacter(c2.id, 'gain');
                animateCharacter(c1.id, 'loss');
                updateCharacterUI(c1);
                updateCharacterUI(c2);
            }
        },
        { 
            message: (c1, c2) => `{ "${c1.name}".cheer_up("${c2.name}"); health += 20; }`,
            result: (c1, c2) => `결과: ${c2.name} 체력 +20`,
            action: (c1, c2) => { 
                c2.health = Math.min(MAX_HEALTH, c2.health + 20);
                animateCharacter(c2.id, 'gain');
                updateCharacterUI(c2);
            }
        }
    ];

    let isProcessing = false;

    async function processCoding() {
        if (isProcessing) return;
        isProcessing = true;
        codeButton.disabled = true;

        // 시작 사운드
        sounds.click.play().catch(e => {});

        codeOutput.innerHTML = `<div class="code-line comment">// 시나모롤의 코딩 스타트...</div>`;
        
        const resultCount = Math.floor(Math.random() * 3) + 3;

        for (let i = 1; i <= resultCount; i++) {
            await new Promise(resolve => setTimeout(resolve, 800)); 
            
            const eventIndex = Math.floor(Math.random() * events.length);
            const event = events[eventIndex];
            
            const char1Index = Math.floor(Math.random() * characters.length);
            let char2Index = Math.floor(Math.random() * characters.length);
            while (char1Index === char2Index) {
                char2Index = Math.floor(Math.random() * characters.length);
            }
            
            const char1 = characters[char1Index];
            const char2 = characters[char2Index];

            // 타이핑 사운드
            sounds.typing.play().catch(e => {});

            const situationDiv = document.createElement('div');
            situationDiv.className = 'code-line comment';
            situationDiv.textContent = `// ${i}번째 상황`;
            codeOutput.appendChild(situationDiv);
            
            const codeDiv = document.createElement('div');
            codeDiv.className = 'code-line';
            codeDiv.textContent = `> ${event.message(char1, char2)}`;
            codeOutput.appendChild(codeDiv);

            codeOutput.scrollTop = codeOutput.scrollHeight;

            await new Promise(resolve => setTimeout(resolve, 600));

            const success = event.action(char1, char2);
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'code-line result';
            resultDiv.textContent = `  ${event.result(char1, char2, success)}`;
            codeOutput.appendChild(resultDiv);

            codeOutput.scrollTop = codeOutput.scrollHeight;
        }

        const endDiv = document.createElement('div');
        endDiv.className = 'code-line comment';
        endDiv.textContent = `// 코딩 종료! ✨`;
        codeOutput.appendChild(endDiv);
        codeOutput.scrollTop = codeOutput.scrollHeight;

        isProcessing = false;
        codeButton.disabled = false;
    }

    codeButton.addEventListener('click', processCoding);

    renderCharacters();
});
