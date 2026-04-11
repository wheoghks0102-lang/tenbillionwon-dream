document.addEventListener('DOMContentLoaded', () => {
    let characters = [
        { id: 1, name: '심우성', health: 60, satiety: 60, money: 1000 },
        { id: 2, name: '채의진', health: 60, satiety: 60, money: 1000 },
        { id: 3, name: '조윤혜', health: 60, satiety: 60, money: 1000 },
        { id: 4, name: '조대환', health: 60, satiety: 60, money: 1000 },
        { id: 5, name: '최준', health: 60, satiety: 60, money: 1000 },
        { id: 6, name: '전유희', health: 60, satiety: 60, money: 1000 },
    ];

    const MAX_HEALTH = 100;
    const MAX_SATIETY = 100;

    const sounds = {
        typing: new Audio('https://assets.mixkit.co/active_storage/sfx/1583/1583-preview.mp3'), 
        gain: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')
    };
    
    Object.values(sounds).forEach(s => s.volume = 0.2);

    const characterGrid = document.getElementById('character-grid');
    const codeOutput = document.getElementById('code-output');
    const codeButton = document.getElementById('code-button');

    function getStatusIcons(char) {
        let icons = '';
        if (char.health <= 0) return '👻';
        if (char.health < 20) icons += '💀';
        else if (char.health < 50) icons += '💦';
        
        if (char.satiety >= 100) icons += '🥰';
        else if (char.satiety < 20) icons += '🍕?';
        return icons;
    }

    function renderCharacters() {
        characterGrid.innerHTML = '';
        characters.forEach(char => {
            const charCard = document.createElement('div');
            const statusClass = char.health <= 0 ? 'exhausted' : '';
            const wealthyClass = char.money >= 10000 ? 'wealthy-glow' : '';
            
            charCard.className = `character-card ${wealthyClass} ${statusClass}`;
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
                <p class="money-status">보유 원: <span class="money-val">${char.money.toLocaleString()}</span></p>
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
        statusIcon.textContent = getStatusIcons(char);
        
        if (char.health <= 0) card.classList.add('exhausted');
        else card.classList.remove('exhausted');

        if (char.money >= 10000) card.classList.add('wealthy-glow');
        else card.classList.remove('wealthy-glow');
    }

    const events = [
        { 
            code: (c1) => `시나모롤.선물하기("${c1.name}", "비타민");`,
            desc: (c1) => `👉 ${c1.name}님이 시나모롤에게 비타민을 선물받아 체력이 15 증가합니다!`,
            action: (c1) => { c1.health = Math.min(MAX_HEALTH, c1.health + 15); animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `await ${c1.name}.수면(8_시간);`,
            desc: (c1) => `👉 ${c1.name}님이 꿀잠을 자고 일어나 체력이 30이나 회복되었습니다! 💤`,
            action: (c1) => { c1.health = Math.min(MAX_HEALTH, c1.health + 30); animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `try { ${c1.name}.업무(); } catch (피곤) { }`,
            desc: (c1) => `👉 ${c1.name}님에게 갑작스러운 야근이 발생했습니다... 체력이 20 감소합니다. 😫`,
            action: (c1) => { c1.health = Math.max(0, c1.health - 20); animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `보내기("${c1.name}", "할 수 있어! ✨");`,
            desc: (c1) => `👉 따뜻한 응원 메시지가 도착했습니다! ${c1.name}님의 체력이 10 증가합니다.`,
            action: (c1) => { c1.health = Math.min(MAX_HEALTH, c1.health + 10); animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `if (맛집.발견()) { ${c1.name}.먹방(); }`,
            desc: (c1) => `👉 ${c1.name}님이 숨겨진 맛집을 발견했습니다! 포만감이 25 증가합니다. 🍔`,
            action: (c1) => { c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 25); animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `for (음식 in 편의점) { ${c1.name}.흡입(); }`,
            desc: (c1) => `👉 배고픈 ${c1.name}님이 편의점을 털었습니다! 포만감이 15 증가합니다.`,
            action: (c1) => { c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 15); animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1, c2) => `${c1.name}.한입뺏어먹기(from: "${c2.name}");`,
            desc: (c1, c2) => `👉 ${c1.name}님이 ${c2.name}님의 간식을 한입 뺏어먹었습니다! 😲`,
            action: (c1, c2) => {
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                c2.satiety = Math.max(0, c2.satiety - 10);
                animateCharacter(c1.id, 'gain'); animateCharacter(c2.id, 'loss');
                updateCharacterUI(c1); updateCharacterUI(c2);
            }
        },
        {
            code: (c1) => `window.alert("배달이 취소되었습니다. 😭");`,
            desc: (c1) => `👉 ${c1.name}님의 배달이 갑자기 취소되었습니다... 포만감이 5 감소합니다.`,
            action: (c1) => { c1.satiety = Math.max(0, c1.satiety - 5); animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `계좌.입금("${c1.name}", 50000); // 보너스`,
            desc: (c1) => `👉 와우! ${c1.name}님에게 특별 보너스 50,000원이 입금되었습니다! 💰`,
            action: (c1) => { c1.money += 50000; animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `${c1.name}.지갑.상태 = "텅텅";`,
            desc: (c1) => `👉 아차! ${c1.name}님이 지갑을 분실했습니다. 10,000원을 잃어버렸습니다. 💸`,
            action: (c1) => { c1.money = Math.max(0, c1.money - 10000); animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `${c1.name}.주식.수익률 = 200;`,
            desc: (c1) => `👉 ${c1.name}님이 투자한 주식이 떡상했습니다! 30,000원의 수익이 발생합니다. 📈`,
            action: (c1) => { c1.money += 30000; animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            code: (c1) => `${c1.name}.쇼핑("명품"); // 기분최고`,
            desc: (c1) => `👉 ${c1.name}님이 플렉스를 즐깁니다! 재산은 줄었지만 기분이 좋아 체력이 10 오릅니다.`,
            action: (c1) => { 
                c1.money = Math.max(0, c1.money - 40000); 
                c1.health = Math.min(MAX_HEALTH, c1.health + 10);
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); 
            }
        }
    ];

    let isProcessing = false;

    async function processCoding() {
        if (isProcessing) return;
        isProcessing = true;
        codeButton.disabled = true;

        codeOutput.innerHTML = `<div class="code-line comment">// 시나모롤의 코딩 스타트...</div>`;
        
        if (Math.random() < 0.01) {
            await new Promise(r => setTimeout(r, 1000));
            const crashCode = document.createElement('div');
            crashCode.className = 'code-line error';
            crashCode.textContent = `> { system.reboot(); all_characters.reset(); }`;
            codeOutput.appendChild(crashCode);
            
            const crashDesc = document.createElement('div');
            crashDesc.className = 'code-line';
            crashDesc.textContent = `🚨 서버 대폭발!! 모든 수치가 초기화됩니다!`;
            codeOutput.appendChild(crashDesc);
            
            characters.forEach(c => {
                c.health = 60; c.satiety = 60; c.money = 1000;
                updateCharacterUI(c);
            });
            isProcessing = false;
            codeButton.disabled = false;
            return;
        }

        const resultCount = Math.floor(Math.random() * 3) + 3;

        for (let i = 1; i <= resultCount; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            sounds.typing.play().catch(e => {});

            if (Math.random() < 0.15) {
                const easterEgg = document.createElement('div');
                easterEgg.className = 'code-line comment';
                easterEgg.textContent = `// 미래에 100억을 벌 사나이, 조대환이 지나갑니다... 💎`;
                codeOutput.appendChild(easterEgg);
                codeOutput.scrollTop = codeOutput.scrollHeight;
                await new Promise(r => setTimeout(r, 1000));
            }

            const char1 = characters[Math.floor(Math.random() * characters.length)];
            let char2 = characters[Math.floor(Math.random() * characters.length)];
            while (char1 === char2) char2 = characters[Math.floor(Math.random() * characters.length)];

            if (Math.random() < 0.25) {
                const duoReqCode = document.createElement('div');
                duoReqCode.className = 'code-line';
                duoReqCode.textContent = `> ${char1.name}.requestDuo("${char2.name}");`;
                codeOutput.appendChild(duoReqCode);
                
                const duoReqDesc = document.createElement('div');
                duoReqDesc.className = 'code-line comment';
                duoReqDesc.textContent = `// ${char1.name}님이 듀오 신청 중...`;
                codeOutput.appendChild(duoReqDesc);
                codeOutput.scrollTop = codeOutput.scrollHeight;

                await new Promise(r => setTimeout(r, 1000));

                const success = Math.random() > 0.5;
                const duoResCode = document.createElement('div');
                duoResCode.className = 'code-line';
                duoResCode.textContent = success ? `> success! 함께 협곡으로 떠납니다. 🎮` : `> catch: 거절당했습니다.. ㅠㅠ`;
                codeOutput.appendChild(duoResCode);

                if (success) {
                    char1.health = Math.min(MAX_HEALTH, char1.health + 10);
                    char2.health = Math.min(MAX_HEALTH, char2.health + 10);
                    animateCharacter(char1.id, 'gain'); animateCharacter(char2.id, 'gain');
                } else {
                    char1.health = Math.max(0, char1.health - 10);
                    animateCharacter(char1.id, 'loss');
                }
                updateCharacterUI(char1); updateCharacterUI(char2);
                codeOutput.scrollTop = codeOutput.scrollHeight;
                await new Promise(r => setTimeout(r, 1000));
            } else {
                const event = events[Math.floor(Math.random() * events.length)];
                
                const codeDiv = document.createElement('div');
                codeDiv.className = 'code-line';
                codeDiv.textContent = `> ${event.code(char1, char2)}`;
                codeOutput.appendChild(codeDiv);
                codeOutput.scrollTop = codeOutput.scrollHeight;

                await new Promise(r => setTimeout(r, 1000));
                
                const descDiv = document.createElement('div');
                descDiv.className = 'code-line result-text';
                descDiv.textContent = event.desc(char1, char2);
                codeOutput.appendChild(descDiv);

                event.action(char1, char2);
                codeOutput.scrollTop = codeOutput.scrollHeight;
                await new Promise(r => setTimeout(r, 1000));
            }

            if (char1.health <= 0) {
                const errDiv = document.createElement('div');
                errDiv.className = 'code-line error';
                errDiv.textContent = `❌ 컴파일 에러: ${char1.name}님이 지쳤습니다.`;
                codeOutput.appendChild(errDiv);
            } else if (char1.satiety >= 100) {
                const happyDiv = document.createElement('div');
                happyDiv.className = 'code-line success';
                happyDiv.textContent = `✨ ${char1.name}님이 배불러서 매우 행복해합니다!`;
                codeOutput.appendChild(happyDiv);
            }
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
