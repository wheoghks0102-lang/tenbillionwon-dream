document.addEventListener('DOMContentLoaded', () => {
    console.log('Cinnamoroll Game Initializing...');

    let characters = [
        { id: 1, name: '심우성', prefix: 'sim', img: 'sim.png', health: 50, satiety: 50, money: 10000, heightRank: 1 },
        { id: 2, name: '채의진', prefix: 'chae', img: 'chae.png', health: 50, satiety: 50, money: 10000, heightRank: 4 },
        { id: 3, name: '조윤혜', prefix: 'yoon', img: 'yoon.png', health: 50, satiety: 50, money: 10000, heightRank: 5 },
        { id: 4, name: '조대환', prefix: 'jo', img: 'jo.png', health: 50, satiety: 50, money: 10000, heightRank: 2 },
        { id: 5, name: '최준', prefix: 'choi', img: 'choi.png', health: 50, satiety: 50, money: 10000, heightRank: 3 },
        { id: 6, name: '전유희', prefix: 'jeon', img: 'jeon.png', health: 50, satiety: 50, money: 10000, heightRank: 3 },
    ];

    const MAX_HEALTH = 100;
    const MAX_SATIETY = 100;

    // Audio files can sometimes cause loading issues if the CDN is slow.
    const sounds = {
        gain: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')
    };
    
    Object.values(sounds).forEach(s => {
        s.volume = 0.15;
        s.onerror = () => console.warn('Failed to load sound:', s.src);
    });

    const characterGrid = document.getElementById('character-grid');
    const codeOutput = document.getElementById('code-output');
    const codeButton = document.getElementById('code-button');

    if (!characterGrid || !codeOutput || !codeButton) {
        console.error('Required DOM elements not found!');
        return;
    }

    function getStatusIcons(char) {
        let icons = '';
        if (char.health <= 0) return '👻';
        if (char.health < 20) icons += '💀';
        else if (char.health < 50) icons += '💦';
        if (char.satiety >= 100) icons += '🥰';
        else if (char.satiety < 20) icons += '🍕?';
        return icons;
    }

    function getCharacterTitle(char) {
        let titles = [];
        
        if (char.money <= 5000) titles.push('그지');
        else if (char.money >= 30000) titles.push('부자');
        
        if (char.satiety <= 30) titles.push('굶주린');
        else if (char.satiety >= 70) titles.push('배부른');
        
        if (char.health <= 30) titles.push('지친');
        else if (char.health >= 70) titles.push('쌩쌩한');
        
        return titles.length > 0 ? titles.join(' ') + ' ' : '';
    }

    function getStatusImage(char) {
        const prefix = char.prefix;
        if (char.money >= 30000) return `${prefix}_돈많은.png`;
        if (char.money <= 5000) return `${prefix}_돈없는.png`;
        if (char.satiety <= 30) return `${prefix}_배고픈.png`;
        if (char.satiety >= 70) return `${prefix}_배부른.png`;
        if (char.health <= 30) return `${prefix}_체력없는.png`;
        if (char.health >= 70) return `${prefix}_체력많은.png`;
        return char.img;
    }

    function renderCharacters() {
        characterGrid.innerHTML = '';
        characters.forEach(char => {
            const charCard = document.createElement('div');
            const statusClass = char.health <= 0 ? 'exhausted' : '';
            charCard.className = `character-card ${statusClass}`;
            charCard.id = `char-${char.id}`;

            const currentImg = getStatusImage(char);
            const fullDisplayName = getCharacterTitle(char) + char.name;

            charCard.innerHTML = `
                <div class="card-header">
                    <h3 class="character-name">${fullDisplayName}</h3>
                    <span class="status-icon">${getStatusIcons(char)}</span>
                </div>
                <div class="character-img-container">
                    <img src="${currentImg}" alt="${char.name}" class="character-avatar" onerror="this.src='https://via.placeholder.com/150?text=${encodeURIComponent(char.name)}'">
                </div>
                <div class="status-bar-container">
                    <div class="status-label-group">
                        <span class="status-label-text">HP</span>
                        <span class="status-val health-val">${char.health}</span>
                    </div>
                    <div class="status-bar">
                        <div class="status-bar-inner health-bar" style="width: ${char.health}%;"></div>
                    </div>
                </div>
                <div class="status-bar-container">
                    <div class="status-label-group">
                        <span class="status-label-text">HUNGRY</span>
                        <span class="status-val satiety-val">${char.satiety}</span>
                    </div>
                    <div class="status-bar">
                        <div class="status-bar-inner satiety-bar" style="width: ${char.satiety}%;"></div>
                    </div>
                </div>
                <p class="money-status">보유 원: <span class="money-val">${char.money.toLocaleString()}</span></p>
            `;
            characterGrid.appendChild(charCard);
        });
        console.log('Characters rendered');
    }

    function animateCharacter(charId, type) {
        const card = document.getElementById(`char-${charId}`);
        if (!card) return;
        card.classList.remove('pulse-gain', 'pulse-loss');
        void card.offsetWidth; 
        card.classList.add(type === 'gain' ? 'pulse-gain' : 'pulse-loss');
        
        const sound = type === 'gain' ? sounds.gain : sounds.loss;
        if (sound && sound.readyState >= 2) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }

    function updateCharacterUI(char) {
        const card = document.getElementById(`char-${char.id}`);
        if (!char || !card) return;
        
        const currentImg = getStatusImage(char);
        const imgElement = card.querySelector('.character-avatar');
        if (imgElement.src.indexOf(currentImg) === -1) {
            imgElement.src = currentImg;
        }

        const fullDisplayName = getCharacterTitle(char) + char.name;
        card.querySelector('.character-name').textContent = fullDisplayName;

        card.querySelector('.health-bar').style.width = `${char.health}%`;
        card.querySelector('.health-val').textContent = char.health;
        card.querySelector('.satiety-bar').style.width = `${char.satiety}%`;
        card.querySelector('.satiety-val').textContent = char.satiety;
        card.querySelector('.money-val').textContent = char.money.toLocaleString();
        card.querySelector('.status-icon').textContent = getStatusIcons(char);
        if (char.health <= 0) card.classList.add('exhausted');
        else card.classList.remove('exhausted');
    }

    const events = [
        { 
            type: 'negative', name: '오늘 저녁 쏜다!',
            code: (c1) => `${c1.name}.결제(전체_저녁값);`,
            desc: (c1) => `👉 ${c1.name}님이 오늘 저녁을 쐈습니다! 통장은 조금 가벼워졌지만 모두가 행복합니다.`,
            action: (c1) => { 
                c1.money = Math.max(0, c1.money - 6000); // 50000 -> 6000
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1);
                characters.filter(c => c.id !== c1.id).forEach(c => {
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 15);
                    animateCharacter(c.id, 'gain'); updateCharacterUI(c);
                });
                return `[${c1.name}: 재산 -6,000 / 나머지: 포만감 +15]`;
            }
        },
        {
            type: 'negative', name: '단톡방 고백 공격',
            code: (c1, c2) => `try { ${c1.name}.고백(${c2.name}); } catch { ${c1.name}.멘탈바사삭; }`,
            desc: (c1, c2) => `👉 ${c1.name}님의 고백 공격! 결과는... 당연히 거절입니다. 체력이 크게 감소합니다. 💔`,
            action: (c1) => { 
                c1.health = Math.max(0, c1.health - 25);
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); 
                return `[${c1.name}: 체력 -25]`;
            }
        },
        {
            type: 'positive', name: '공동 구매 성공',
            code: (c1, c2, c3) => `Group.buy(${c1.name}, ${c2.name}, ${c3.name}).success;`,
            desc: (c1, c2, c3) => `👉 세 분이서 공동 구매에 성공했습니다! 저렴하게 맛있는 걸 먹었네요.`,
            action: (c1, c2, c3) => {
                [c1, c2, c3].forEach(c => {
                    c.money = Math.max(0, c.money - 2000); // 8000 -> 2000
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 15);
                    animateCharacter(c.id, 'gain'); updateCharacterUI(c);
                });
                return `[${c1.name},${c2.name},${c3.name}: 재산 -2,000, 포만감 +15]`;
            }
        },
        {
            type: 'positive', name: '비밀 공유하기',
            code: (c1, c2) => `${c1.name}.whisper(${c2.name}, "비밀이야 🤫");`,
            desc: (c1, c2) => `👉 ${c1.name}님과 ${c2.name}님이 비밀을 공유하며 유대감이 상승했습니다!`,
            action: (c1, c2) => {
                [c1, c2].forEach(c => { c.health = Math.min(MAX_HEALTH, c.health + 10); animateCharacter(c.id, 'gain'); updateCharacterUI(c); });
                return `[${c1.name},${c2.name}: 체력 +10]`;
            }
        },
        {
            type: 'positive', name: '새벽 러닝(Sub-2)',
            code: (c1) => `while(running) { ${c1.name}.speed++; }`,
            desc: (c1) => `👉 새벽 러닝으로 갓생 사는 ${c1.name}님! 체력이 오르고 배가 고파집니다.`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 15);
                c1.satiety = Math.max(0, c1.satiety - 20);
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
                return `[${c1.name}: 체력 +15, 포만감 -20]`;
            }
        },
        {
            type: 'positive', name: '전설의 물고기',
            code: (c1) => `if (${c1.name}.낚시 == "월척") { ${c1.name}.회_파티(); }`,
            desc: (c1) => `👉 대박! ${c1.name}님이 전설의 물고기를 잡았습니다. 재산과 포만감이 상승! 🎣`,
            action: (c1) => {
                c1.money += 8000; // 15000 -> 8000
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
                return `[${c1.name}: 재산 +8,000, 포만감 +10]`;
            }
        },
        {
            type: 'positive', name: '홈텐딩 오픈',
            code: (c1) => `${c1.name}.mix(진토닉); // 캬~ 🍸`,
            desc: (c1) => `👉 ${c1.name}님의 홈바 오픈! 기분이 좋아 체력이 오르지만 돈을 썼습니다.`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 10);
                c1.money = Math.max(0, c1.money - 3000); // 10000 -> 3000
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1);
                return `[${c1.name}: 체력 +10, 재산 -3,000]`;
            }
        },
        {
            type: 'system', name: '열공 모드',
            code: (c1) => `${c1.name}.study_hard(); // 펜 소리만 들림`,
            desc: (c1) => `👉 ${c1.name}님이 공부에 집중합니다. 피곤하지만 장학금을 기대해 봅니다.`,
            action: (c1) => {
                c1.health = Math.max(0, c1.health - 15);
                c1.money += 4000; // 5000 -> 4000
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1);
                return `[${c1.name}: 체력 -15, 재산 +4,000]`;
            }
        },
        {
            type: 'negative', name: '무한 루프 발생',
            code: (c1) => `while(true) { ${c1.name}.댄스(); }`,
            desc: (c1) => `👉 멈추지 않는 댄스 본능! ${c1.name}님이 춤추다 지쳐 쓰러집니다. 💃`,
            action: (c1) => { 
                c1.health = Math.max(0, c1.health - 35);
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); 
                return `[${c1.name}: 체력 -35]`;
            }
        },
        {
            type: 'positive', name: '복권 당첨 버그',
            code: (c1) => `system.money_glitch(${c1.name});`,
            desc: (c1) => `👉 축하합니다! ${c1.name}님에게 소소한 복권 당첨 버그가 발생했습니다! 럭키! 🍀`,
            action: (c1) => { 
                c1.money += 12000; // 50000 -> 12000
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); 
                return `[${c1.name}: 재산 +12,000]`;
            }
        },
        {
            type: 'system', name: '서버 점검 시간',
            code: () => `System.sleep(); // 모두 정지`,
            desc: () => `👉 서버 점검으로 강제 휴식 시간입니다. 모든 캐릭터의 체력이 5 회복됩니다.`,
            action: () => { 
                characters.forEach(c => { c.health = Math.min(MAX_HEALTH, c.health + 5); updateCharacterUI(c); }); 
                return `[전체: 체력 +5]`;
            }
        },
        {
            type: 'negative', name: '다이어트 버그',
            code: (c1) => `delete ${c1.name}.satiety; // 배고픔 삭제`,
            desc: (c1) => `👉 이런! 다이어트 버그로 ${c1.name}님의 포만감이 증발했습니다. 꼬르륵...`,
            action: (c1) => { 
                c1.satiety = 0; 
                animateCharacter(c1.id, 'loss'); updateCharacterUI(c1); 
                return `[${c1.name}: 포만감 0으로 초기화]`;
            }
        },
        {
            type: 'positive', name: '용돈 발견',
            code: (c1) => `Pocket.search(${c1.name}).result = 2000;`,
            desc: (c1) => `👉 ${c1.name}님이 옷 주머니에서 잊고 있던 2천원을 발견했습니다!`,
            action: (c1) => { 
                c1.money += 2000;
                animateCharacter(c1.id, 'gain'); updateCharacterUI(c1); 
                return `[${c1.name}: 재산 +2,000]`;
            }
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
        const availableEvents = [...events];

        try {
            for (let i = 1; i <= resultCount; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const eventIndex = Math.floor(Math.random() * availableEvents.length);
                const event = availableEvents[eventIndex];
                if (availableEvents.length > 5) availableEvents.splice(eventIndex, 1);

                const c1 = characters[Math.floor(Math.random() * characters.length)];
                const others = characters.filter(c => c.id !== c1.id);
                const c2 = others[Math.floor(Math.random() * others.length)];
                const others2 = others.filter(c => c.id !== c2.id);
                const c3 = others2[Math.floor(Math.random() * others2.length)];

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
                
                const summary = event.action(c1, c2, c3);
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'code-line comment summary-line';
                summaryDiv.textContent = `// ${summary}`;
                codeOutput.appendChild(summaryDiv);

                codeOutput.scrollTop = codeOutput.scrollHeight;
                await new Promise(r => setTimeout(r, 500));
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
        } catch (error) {
            console.error('Error during coding process:', error);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'code-line negative';
            errorDiv.textContent = `> 에러 발생: ${error.message}`;
            codeOutput.appendChild(errorDiv);
        } finally {
            isProcessing = false;
            codeButton.disabled = false;
        }
    }

    codeButton.addEventListener('click', processCoding);
    renderCharacters();
    console.log('Initialization complete');
});
