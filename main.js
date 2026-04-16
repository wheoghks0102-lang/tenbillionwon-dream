document.addEventListener('DOMContentLoaded', () => {
    console.log('Online Cinnamoroll Game Initializing...');

    // Gun.js Initialization
    const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);
    const world = gun.get('cinnamoroll-world-v1');

    let characters = [
        { id: 1, name: '심우성', prefix: 'sim', img: 'sim.png', health: 50, satiety: 50, money: 10000, heightRank: 1 },
        { id: 2, name: '채의진', prefix: 'chae', img: 'chae.png', health: 50, satiety: 50, money: 10000, heightRank: 4 },
        { id: 3, name: '조윤혜', prefix: 'yoon', img: 'yoon.png', health: 50, satiety: 50, money: 10000, heightRank: 5 },
        { id: 4, name: '조대환', prefix: 'jo', img: 'jo.png', health: 50, satiety: 50, money: 10000, heightRank: 2 },
        { id: 5, name: '최준', prefix: 'choi', img: 'choi.png', health: 50, satiety: 50, money: 10000, heightRank: 3 },
        { id: 6, name: '전유희', prefix: 'jeon', img: 'jeon.png', health: 50, satiety: 50, money: 10000, heightRank: 3 },
    ];

    let myNickname = '';
    let dailyChances = 3;
    let lastCodingTime = 0;

    const MAX_HEALTH = 100;
    const MAX_SATIETY = 100;

    // DOM Elements
    const loginOverlay = document.getElementById('login-overlay');
    const nicknameInput = document.getElementById('nickname-input');
    const loginButton = document.getElementById('login-button');
    const appContainer = document.getElementById('app-container');
    const myNicknameSpan = document.getElementById('my-nickname');
    const chanceCountSpan = document.getElementById('chance-count');
    const characterGrid = document.getElementById('character-grid');
    const codeOutput = document.getElementById('code-output');
    const codeButton = document.getElementById('code-button');
    const attemptHistory = document.getElementById('attempt-history');

    // Sounds
    const sounds = {
        gain: new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3')
    };
    Object.values(sounds).forEach(s => { s.volume = 0.15; });

    // Login Logic
    loginButton.addEventListener('click', () => {
        const nick = nicknameInput.value.trim();
        if (nick) {
            myNickname = nick;
            loginOverlay.style.display = 'none';
            appContainer.style.display = 'block';
            myNicknameSpan.textContent = myNickname;
            initSharedState();
            checkDailyChances();
        } else {
            alert('닉네임을 입력해주세요!');
        }
    });

    // Daily Chance Logic
    function checkDailyChances() {
        const stored = localStorage.getItem(`coding_chances_${myNickname}`);
        const now = Date.now();
        if (stored) {
            const data = JSON.parse(stored);
            const timeDiff = now - data.lastTime;
            
            // 24시간이 지났으면 초기화
            if (timeDiff >= 24 * 60 * 60 * 1000) {
                dailyChances = 3;
            } else {
                dailyChances = data.count;
                lastCodingTime = data.lastTime;
            }
        } else {
            dailyChances = 3;
        }
        updateChanceUI();
    }

    function updateChanceUI() {
        chanceCountSpan.textContent = dailyChances;
        if (dailyChances <= 0) {
            const now = Date.now();
            const remaining = 24 * 60 * 60 * 1000 - (now - lastCodingTime);
            if (remaining > 0) {
                const hours = Math.ceil(remaining / (1000 * 60 * 60));
                codeButton.disabled = true;
                codeButton.textContent = `${hours}시간 뒤 시킬 수 있어요!`;
            } else {
                dailyChances = 3;
                codeButton.disabled = false;
                codeButton.textContent = `시나모롤에게 코딩 시키기! ✨`;
                updateChanceUI();
            }
        } else {
            codeButton.disabled = false;
            codeButton.textContent = `시나모롤에게 코딩 시키기! ✨`;
        }
    }

    function useChance() {
        dailyChances--;
        // 마지막 코딩 시간은 3번째 기회를 다 썼을 때가 아니라 각 시도마다 갱신 (유저 요청: 3번 다 쓰면 24시간 뒤)
        // 여기서는 "3번 다 썼을 때의 시점"을 기준으로 24시간을 체크하는 로직으로 구현
        lastCodingTime = Date.now();
        localStorage.setItem(`coding_chances_${myNickname}`, JSON.stringify({
            count: dailyChances,
            lastTime: lastCodingTime
        }));
        updateChanceUI();
    }

    // Shared State Logic
    function initSharedState() {
        characters.forEach(char => {
            world.get(`char_${char.id}`).on(data => {
                if (data) {
                    char.health = data.health ?? char.health;
                    char.satiety = data.satiety ?? char.satiety;
                    char.money = data.money ?? char.money;
                    updateCharacterUI(char);
                }
            });
        });

        // Listen for coding attempts from others
        world.get('last_attempt').on(data => {
            if (data && data.user) {
                addHistoryItem(data.user);
            }
        });
    }

    function syncCharacter(char) {
        world.get(`char_${char.id}`).put({
            health: char.health,
            satiety: char.satiety,
            money: char.money
        });
    }

    function broadcastAttempt() {
        world.get('last_attempt').put({
            user: myNickname,
            time: Date.now()
        });
    }

    function addHistoryItem(user) {
        const emptyMsg = attemptHistory.querySelector('.empty');
        if (emptyMsg) emptyMsg.remove();

        const div = document.createElement('div');
        div.className = 'history-item';
        const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `<strong>[${time}]</strong> ${user}님이 코딩을 시도했습니다!`;
        
        attemptHistory.prepend(div);
        
        // 너무 많으면 삭제
        if (attemptHistory.children.length > 20) {
            attemptHistory.removeChild(attemptHistory.lastChild);
        }
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
        if (char.money <= 5000) titles.push('<그지>');
        else if (char.money >= 30000) titles.push('<부자>');
        if (char.satiety <= 30) titles.push('<굶주린>');
        else if (char.satiety >= 70) titles.push('<배부른>');
        if (char.health <= 30) titles.push('<지친>');
        else if (char.health >= 70) titles.push('<쌩쌩한>');
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
                    <div class="status-bar"><div class="status-bar-inner health-bar" style="width: ${char.health}%;"></div></div>
                </div>
                <div class="status-bar-container">
                    <div class="status-label-group">
                        <span class="status-label-text">HUNGRY</span>
                        <span class="status-val satiety-val">${char.satiety}</span>
                    </div>
                    <div class="status-bar"><div class="status-bar-inner satiety-bar" style="width: ${char.satiety}%;"></div></div>
                </div>
                <p class="money-status">보유 원: <span class="money-val">${char.money.toLocaleString()}</span></p>
            `;
            characterGrid.appendChild(charCard);
        });
    }

    function updateCharacterUI(char) {
        const card = document.getElementById(`char-${char.id}`);
        if (!card) return;
        
        const currentImg = getStatusImage(char);
        const imgElement = card.querySelector('.character-avatar');
        if (imgElement.src.indexOf(currentImg) === -1) imgElement.src = currentImg;

        card.querySelector('.character-name').textContent = getCharacterTitle(char) + char.name;
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
            desc: (c1) => `👉 ${c1.name}님이 오늘 저녁을 쐈습니다!`,
            action: (c1) => { 
                c1.money = Math.max(0, c1.money - 6000);
                syncCharacter(c1);
                characters.filter(c => c.id !== c1.id).forEach(c => {
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 15);
                    syncCharacter(c);
                });
                return `[${c1.name}: 재산 -6,000 / 나머지: 포만감 +15]`;
            }
        },
        {
            type: 'negative', name: '단톡방 고백 공격',
            code: (c1, c2) => `try { ${c1.name}.고백(${c2.name}); } catch { ${c1.name}.멘탈바사삭; }`,
            desc: (c1, c2) => `👉 ${c1.name}님의 고백 공격! 결과는... 거절입니다. 💔`,
            action: (c1) => { 
                c1.health = Math.max(0, c1.health - 25);
                syncCharacter(c1);
                return `[${c1.name}: 체력 -25]`;
            }
        },
        {
            type: 'positive', name: '공동 구매 성공',
            code: (c1, c2, c3) => `Group.buy(${c1.name}, ${c2.name}, ${c3.name}).success;`,
            desc: (c1, c2, c3) => `👉 세 분이서 공동 구매에 성공했습니다!`,
            action: (c1, c2, c3) => {
                [c1, c2, c3].forEach(c => {
                    c.money = Math.max(0, c.money - 2000);
                    c.satiety = Math.min(MAX_SATIETY, c.satiety + 15);
                    syncCharacter(c);
                });
                return `[${c1.name},${c2.name},${c3.name}: 재산 -2,000, 포만감 +15]`;
            }
        },
        {
            type: 'positive', name: '비밀 공유하기',
            code: (c1, c2) => `${c1.name}.whisper(${c2.name}, "비밀이야 🤫");`,
            desc: (c1, c2) => `👉 ${c1.name}님과 ${c2.name}님이 비밀을 공유했습니다!`,
            action: (c1, c2) => {
                [c1, c2].forEach(c => { c.health = Math.min(MAX_HEALTH, c.health + 10); syncCharacter(c); });
                return `[${c1.name},${c2.name}: 체력 +10]`;
            }
        },
        {
            type: 'positive', name: '새벽 러닝',
            code: (c1) => `while(running) { ${c1.name}.speed++; }`,
            desc: (c1) => `👉 새벽 러닝으로 갓생 사는 ${c1.name}님!`,
            action: (c1) => {
                c1.health = Math.min(MAX_HEALTH, c1.health + 15);
                c1.satiety = Math.max(0, c1.satiety - 20);
                syncCharacter(c1);
                return `[${c1.name}: 체력 +15, 포만감 -20]`;
            }
        },
        {
            type: 'positive', name: '전설의 물고기',
            code: (c1) => `if (${c1.name}.낚시 == "월척") { ${c1.name}.회_파티(); }`,
            desc: (c1) => `👉 대박! ${c1.name}님이 전설의 물고기를 잡았습니다! 🎣`,
            action: (c1) => {
                c1.money += 8000;
                c1.satiety = Math.min(MAX_SATIETY, c1.satiety + 10);
                syncCharacter(c1);
                return `[${c1.name}: 재산 +8,000, 포만감 +10]`;
            }
        },
        {
            type: 'system', name: '열공 모드',
            code: (c1) => `${c1.name}.study_hard();`,
            desc: (c1) => `👉 ${c1.name}님이 공부에 집중합니다. 피곤하지만 장학금을 기대해 봅니다.`,
            action: (c1) => {
                c1.health = Math.max(0, c1.health - 15);
                c1.money += 4000;
                syncCharacter(c1);
                return `[${c1.name}: 체력 -15, 재산 +4,000]`;
            }
        },
        {
            type: 'positive', name: '복권 당첨 버그',
            code: (c1) => `system.money_glitch(${c1.name});`,
            desc: (c1) => `👉 축하합니다! ${c1.name}님에게 소소한 복권 당첨 버그가 발생했습니다! 🍀`,
            action: (c1) => { 
                c1.money += 12000;
                syncCharacter(c1);
                return `[${c1.name}: 재산 +12,000]`;
            }
        }
    ];

    let isProcessing = false;

    async function processCoding() {
        if (isProcessing || dailyChances <= 0) return;
        
        isProcessing = true;
        codeButton.disabled = true;
        useChance();
        broadcastAttempt();

        codeOutput.innerHTML = `<div class="code-line comment">// 시나모롤이 ${myNickname}님의 요청으로 코딩을 시작합니다...</div>`;
        
        const resultCount = Math.floor(Math.random() * 2) + 3;
        const availableEvents = [...events];

        try {
            for (let i = 1; i <= resultCount; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const eventIndex = Math.floor(Math.random() * availableEvents.length);
                const event = availableEvents[eventIndex];

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
                const summary = event.action(c1, c2, c3);
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'code-line comment';
                summaryDiv.textContent = `// ${summary}`;
                codeOutput.appendChild(summaryDiv);

                codeOutput.scrollTop = codeOutput.scrollHeight;
            }
            // 최종 리액션 추가
            const endDiv = document.createElement('div');
            endDiv.className = 'code-line cinnamoroll-reaction';
            endDiv.textContent = `시나모롤: "코딩 끝! 모두에게 좋은 일이 생겼길 바라요! (´,,•ω•,,)♡"`;
            codeOutput.appendChild(endDiv);
            codeOutput.scrollTop = codeOutput.scrollHeight;
            
        } catch (error) {
            console.error(error);
        } finally {
            isProcessing = false;
            updateChanceUI();
        }
    }

    codeButton.addEventListener('click', processCoding);
    renderCharacters();
});
