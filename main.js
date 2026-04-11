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
        gain: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')
    };
    
    Object.values(sounds).forEach(s => s.volume = 0.15);

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
        card.querySelector('.health-bar').style.width = `${char.health}%`;
        card.querySelector('.health-val').textContent = char.health;
        card.querySelector('.satiety-bar').style.width = `${char.satiety}%`;
        card.querySelector('.satiety-val').textContent = char.satiety;
        card.querySelector('.money-val').textContent = char.money.toLocaleString();
        card.querySelector('.status-icon').textContent = getStatusIcons(char);
        if (char.health <= 0) card.classList.add('exhausted');
        else card.classList.remove('exhausted');
        if (char.money >= 10000) card.classList.add('wealthy-glow');
        else card.classList.remove('wealthy-glow');
    }

    const events = [
        { 
            type: 'negative', name: '오늘 저녁 쏜다!',
            code: (c1) => `${c1.name}.결제(전체_저녁값);`,
            desc: (c1) => `👉 ${c1.name}님이 오늘 저녁을 쐈습니다! 통장은 비었지만 모두가 행복합니다.`,
            action: (c1) => { 
                c1.money = Math.max(0, c1.money - 50000);
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1);
                characters.filter(c => c.id !== c1.id).forEach(c => {
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 20);
                    animateCharacter(c.id, 'gain'); updateCharacterUI(c);
                });
            }
        },
        {
            type: 'negative', name: '단톡방 고백 공격',
            code: (c1, c2) => `try { ${c1.name}.고백(${c2.name}); } catch { ${c1.name}.멘탈바사삭; }`,
            desc: (c1, c2) => `👉 ${c1.name}님의 고백 공격! 결과는... 당연히 거절입니다. 체력이 20 감소합니다. 💔`,
            action: (c1) => { c1.health = Math.max(0, c1.health - 20); animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        },
        {
            type: 'positive', name: '공동 구매 성공',
            code: (c1, c2, c3) => `Group.buy(${c1.name}, ${c2.name}, ${c3.name}).success;`,
            desc: (c1, c2, c3) => `👉 세 분이서 공동 구매에 성공했습니다! 저렴하게 맛있는 걸 먹었네요.`,
            action: (c1, c2, c3) => {
                [c1, c2, c3].forEach(c => {
                    c.money = Math.max(0, c.money - 5000);
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 15);
                    animateCharacter(c.id, 'gain'); updateCharacterUI(c);
                });
            }
        },
        {
            type: 'positive', name: '비밀 공유하기',
            code: (c1, c2) => `${c1.name}.whisper(${c2.name}, "비밀이야 🤫");`,
            desc: (c1, c2) => `👉 ${c1.name}님과 ${c2.name}님이 비밀을 공유하며 유대감이 상승했습니다!`,
            action: (c1, c2) => {
                [c1, c2].forEach(c => { c.health = Math.min(MAX_HEALTH, c.health + 10); animateCharacter(c.id, 'gain'); updateCharacterUI(c); });
            }
        },
        {
            type: 'positive', name: '새벽 러닝(Sub-2)',
            code: (c1) => `while(running) { ${c1.name}.speed++; }`,
            desc: (c1) => `👉 새벽 러닝으로 갓생 사는 ${c1.name}님! 체력이 오르고 배가 고파집니다.`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 20);
                c1.satiety = Math.max(0, c1.satiety - 15);
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
            }
        },
        {
            type: 'positive', name: '전설의 물고기',
            code: (c1) => `if (${c1.name}.낚시 == "월척") { ${c1.name}.회_파티(); }`,
            desc: (c1) => `👉 대박! ${c1.name}님이 전설의 물고기를 잡았습니다. 재산과 포만감이 상승! 🎣`,
            action: (c1) => {
                c1.money += 20000; c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
            }
        },
        {
            type: 'positive', name: '홈텐딩 오픈',
            code: (c1) => `${c1.name}.mix(진토닉); // 캬~ 🍸`,
            desc: (c1) => `👉 ${c1.name}님의 홈바 오픈! 기분이 좋아 체력이 오르지만 돈을 썼습니다.`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 15); c1.money = Math.max(0, c1.money - 5000);
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
            }
        },
        {
            type: 'system', name: '열공 모드',
            code: (c1) => `${c1.name}.study_hard(); // 펜 소리만 들림`,
            desc: (c1) => `👉 ${c1.name}님이 공부에 집중합니다. 피곤하지만 장학금을 기대해 봅니다.`,
            action: (c1) => {
                c1.health = Math.max(0, c1.health - 10); c1.money += 5000;
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1);
            }
        },
        {
            type: 'negative', name: '무한 루프 발생',
            code: (c1) => `while(true) { ${c1.name}.댄스(); }`,
            desc: (c1) => `👉 멈추지 않는 댄스 본능! ${c1.name}님이 춤추다 지쳐 쓰러집니다. 💃`,
            action: (c1) => { c1.health = Math.max(0, c1.health - 30); animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        },
        {
            type: 'positive', name: '복권 당첨 버그',
            code: (c1) => `system.money_glitch(${c1.name});`,
            desc: (c1) => `👉 축하합니다! ${c1.name}님에게 복권 당첨 버그가 발생했습니다! 럭키! 🍀`,
            action: (c1) => { c1.money += 100000; animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); }
        },
        {
            type: 'system', name: '서버 점검 시간',
            code: () => `System.sleep(); // 모두 정지`,
            desc: () => `👉 서버 점검으로 강제 휴식 시간입니다. 모든 캐릭터의 체력이 5 회복됩니다.`,
            action: () => { characters.forEach(c => { c.health = Math.min(MAX_HEALTH, c.health + 5); updateCharacterUI(c); }); }
        },
        {
            type: 'negative', name: '다이어트 버그',
            code: (c1) => `delete ${c1.name}.satiety; // 배고픔 삭제`,
            desc: (c1) => `👉 이런! 다이어트 버그로 ${c1.name}님의 포만감이 증발했습니다. 꼬르륵...`,
            action: (c1) => { c1.satiety = 0; animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); }
        }
    ];

    const reactions = [
        "앗, 코드를 잘못 짰나? (´,,•ω•,,)♡",
        "와! 대박 이벤트 발생! ✨",
        "모두들 즐거워 보여요! (〃´𓎟`〃)",
        "오늘도 평화로운 시나모롤 마을~ ☁️",
        "방금 그 코드, 좀 위험했던 것 같은데... ( •̀ ω •́ )y"
    ];

    let isProcessing = false;

    async function processCoding() {
        if (isProcessing) return;
        isProcessing = true;
        codeButton.disabled = true;
        codeOutput.innerHTML = `<div class="code-line comment">// 시나모롤의 코딩 스타트...</div>`;
        
        const resultCount = Math.floor(Math.random() * 3) + 4;
        const availableEvents = [...events]; // 이벤트 섞기 위해 복사

        for (let i = 1; i <= resultCount; i++) {
            await new Promise(r => setTimeout(r, 1000));
            
            const eventIndex = Math.floor(Math.random() * availableEvents.length);
            const event = availableEvents[eventIndex];
            
            // 사용한 이벤트는 잠시 제거하여 다양성 확보
            if (availableEvents.length > 5) availableEvents.splice(eventIndex, 1);

            const c1 = characters[Math.floor(Math.random() * characters.length)];
            const others = characters.filter(c => c.id !== c1.id);
            const c2 = others[Math.floor(Math.random() * others.length)];
            const c3 = others.filter(c => c.id !== c2.id)[Math.floor(Math.random() * (others.length - 1))];

            const codeDiv = document.createElement('div');
            codeDiv.className = `code-line ${event.type}`;
            codeDiv.textContent = `> ${event.code(c1, c2, c3)}`;
            codeOutput.appendChild(codeDiv);
            codeOutput.scrollTop = codeOutput.scrollHeight;

            await new Promise(r => setTimeout(r, 1000));

            const descDiv = document.createElement('div');
            descDiv.className = 'code-line result-text';
            descDiv.textContent = event.desc(c1, c2, c3);
            codeOutput.appendChild(descDiv);
            
            event.action(c1, c2, c3);
            codeOutput.scrollTop = codeOutput.scrollHeight;
        }

        await new Promise(r => setTimeout(r, 1000));
        const reactDiv = document.createElement('div');
        reactDiv.className = 'code-line cinnamoroll-reaction';
        reactDiv.textContent = `시나모롤: "${reactions[Math.floor(Math.random() * reactions.length)]}"`;
        codeOutput.appendChild(reactDiv);

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
