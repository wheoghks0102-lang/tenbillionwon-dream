document.addEventListener('DOMContentLoaded', () => {
    console.log('Online Cinnamoroll Game Initializing...');

    // Gun.js Initialization - Version v3 (Unified Global State)
    const gun = Gun([
        'https://gun-manhattan.herokuapp.com/gun',
        'https://gun-ams1.herokuapp.com/gun',
        'https://gun-sjc1.herokuapp.com/gun'
    ]);
    const world = gun.get('cinnamoroll-world-v3');

    const INITIAL_CHARACTERS = [
        { id: 1, name: '심우성', prefix: 'sim', img: 'sim.png', health: 50, satiety: 50, money: 10000 },
        { id: 2, name: '채의진', prefix: 'chae', img: 'chae.png', health: 50, satiety: 50, money: 10000 },
        { id: 3, name: '조윤혜', prefix: 'yoon', img: 'yoon.png', health: 50, satiety: 50, money: 10000 },
        { id: 4, name: '조대환', prefix: 'jo', img: 'jo.png', health: 50, satiety: 50, money: 10000 },
        { id: 5, name: '최준', prefix: 'choi', img: 'choi.png', health: 50, satiety: 50, money: 10000 },
        { id: 6, name: '전유희', prefix: 'jeon', img: 'jeon.png', health: 50, satiety: 50, money: 10000 },
    ];

    let characters = JSON.parse(JSON.stringify(INITIAL_CHARACTERS));

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
    const onlineUsersList = document.getElementById('online-users-list');
    const titleH1 = document.querySelector('header h1');

    // Online Users Tracking
    let activeUsers = {};

    function updateOnlineUsersUI() {
        const now = Date.now();
        const onlineNicknames = Object.keys(activeUsers).filter(nick => {
            return (now - activeUsers[nick]) < 60000;
        });
        
        if (onlineNicknames.length === 0) {
            onlineUsersList.textContent = '나 홀로 마을에...';
        } else {
            onlineUsersList.textContent = onlineNicknames.join(', ');
        }
    }

    function heartbeat() {
        if (myNickname) {
            world.get('presence').get(myNickname).put(Date.now());
        }
    }

    // Easter Egg Logic
    let titleClickCount = 0;
    titleH1.addEventListener('click', () => {
        titleClickCount++;
        if (titleClickCount === 15) {
            titleClickCount = 0;
            if (confirm('모든 마을 데이터(캐릭터, 로그, 전역 기회)를 초기화할까요?')) {
                resetAllSharedStates();
            }
        }
    });

    function resetAllSharedStates() {
        INITIAL_CHARACTERS.forEach(char => {
            world.get(`char_${char.id}`).put({
                health: char.health,
                satiety: char.satiety,
                money: char.money
            });
        });
        
        // 전역 기회 데이터 초기화 (필요 시)
        world.get('village_status').put({
            chances: 3,
            lastTime: 0
        });

        // 로그 초기화 트리거
        world.get('reset_logs_trigger').put({
            time: Date.now(),
            by: myNickname
        });
        
        broadcastMessage(`시스템: 마을의 공유 데이터가 초기화되었습니다! ✨`);
    }

    // Login Logic
    loginButton.addEventListener('click', () => {
        const nick = nicknameInput.value.trim();
        if (nick) {
            myNickname = nick;
            loginOverlay.style.display = 'none';
            appContainer.style.display = 'block';
            myNicknameSpan.textContent = myNickname;
            
            initSharedState();
            
            logActivity(myNickname, '접속');
            
            heartbeat();
            setInterval(heartbeat, 30000);
        } else {
            alert('닉네임을 입력해주세요!');
        }
    });

    // Shared State Logic
    function initSharedState() {
        // 1. 캐릭터 상태 동기화 (전체 공유)
        characters.forEach(char => {
            world.get(`char_${char.id}`).on(data => {
                if (data) {
                    char.health = typeof data.health === 'number' ? data.health : char.health;
                    char.satiety = typeof data.satiety === 'number' ? data.satiety : char.satiety;
                    char.money = typeof data.money === 'number' ? data.money : char.money;
                    updateCharacterUI(char);
                }
            });
        });

        // 2. 활동 로그 동기화
        world.get('activity_logs').map().on((data, id) => {
            if (data && data.user && data.type) {
                addHistoryItem(data.user, data.type, data.time, id);
            }
        });

        // 3. 실시간 접속자 추적
        world.get('presence').map().on((time, nick) => {
            if (nick) {
                if (time && time > 0) {
                    activeUsers[nick] = time;
                } else {
                    delete activeUsers[nick];
                }
                updateOnlineUsersUI();
            }
        });

        // 4. 개별 사용자 기회(Chances) 동기화 - 각자 하루 3번
        world.get('users').get(myNickname).on(data => {
            if (data) {
                dailyChances = data.chances ?? 3;
                lastCodingTime = data.lastTime ?? 0;
            } else {
                // 데이터가 없으면 초기화
                world.get('users').get(myNickname).put({
                    chances: 3,
                    lastTime: 0
                });
            }
            updateChanceUI();
        });

        // 5. 실시간 코딩 로그 동기화 (code-output 공유)
        world.get('coding_broadcast').on(data => {
            if (data && data.time > (Date.now() - 10000)) { // 최근 10초 이내의 메시지만 표시
                displayBroadcastMessage(data.msg, data.type);
            }
        });

        // 6. 초기화 리스너
        world.get('reset_logs_trigger').on(data => {
            if (data) {
                clearHistoryUI();
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

    function logActivity(user, type) {
        world.get('activity_logs').set({
            user: user,
            type: type,
            time: Date.now()
        });
    }

    function broadcastCodingStep(msg, type = 'comment') {
        world.get('coding_broadcast').put({
            msg: msg,
            type: type,
            time: Date.now(),
            by: myNickname
        });
    }

    function displayBroadcastMessage(msg, type) {
        // 중복 메시지 방지
        const lastLine = codeOutput.lastElementChild;
        if (lastLine && lastLine.textContent === (type === 'code' ? `> ${msg}` : `// ${msg}`)) return;

        const div = document.createElement('div');
        div.className = `code-line ${type === 'code' ? 'system' : 'comment'}`;
        if (type === 'code') {
            div.textContent = `> ${msg}`;
            div.style.color = '#3182ce';
        } else if (type === 'reaction') {
            div.className = 'code-line cinnamoroll-reaction';
            div.textContent = msg;
        } else {
            div.textContent = `// ${msg}`;
        }
        
        codeOutput.appendChild(div);
        codeOutput.scrollTop = codeOutput.scrollHeight;
    }

    function updateChanceUI() {
        const now = Date.now();
        const lastDate = new Date(lastCodingTime).toDateString();
        const nowDate = new Date(now).toDateString();
        
        // 날짜가 바뀌었으면 기회 초기화 (개별 사용자 기준)
        if (lastDate !== nowDate && lastCodingTime > 0) {
            dailyChances = 3;
            world.get('users').get(myNickname).put({
                chances: 3,
                lastTime: now
            });
        }

        chanceCountSpan.textContent = dailyChances;
        
        if (dailyChances <= 0) {
            codeButton.disabled = true;
            codeButton.textContent = `오늘 기회를 모두 사용했어요! 😴`;
        } else {
            codeButton.disabled = false;
            codeButton.textContent = `시나모롤에게 코딩 시키기! ✨`;
        }
    }

    function useChance() {
        dailyChances--;
        lastCodingTime = Date.now();
        world.get('users').get(myNickname).put({
            chances: dailyChances,
            lastTime: lastCodingTime
        });
    }

    const renderedLogIds = new Set();

    function addHistoryItem(user, type, time, id) {
        if (renderedLogIds.has(id)) return;
        renderedLogIds.add(id);

        const emptyMsg = attemptHistory.querySelector('.empty');
        if (emptyMsg) emptyMsg.remove();

        const div = document.createElement('div');
        div.className = 'history-item';
        div.dataset.time = time;
        const timeStr = new Date(time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        
        if (type === '접속') {
            div.style.background = '#f0fff4';
            div.style.borderColor = '#48bb78';
            div.innerHTML = `<strong>[${timeStr}]</strong> 🌟 <b>${user}</b>님이 마을에 입성했습니다!`;
        } else if (type === '퇴장') {
            div.style.background = '#fff5f5';
            div.style.borderColor = '#feb2b2';
            div.innerHTML = `<strong>[${timeStr}]</strong> 👋 <b>${user}</b>님이 마을을 떠났습니다.`;
        } else {
            div.innerHTML = `<strong>[${timeStr}]</strong> 💻 <b>${user}</b>님이 코딩을 시도했습니다!`;
        }
        
        // 시간 순서대로 정렬하여 삽입
        const items = Array.from(attemptHistory.querySelectorAll('.history-item'));
        const nextItem = items.find(item => parseInt(item.dataset.time) < time);
        
        if (nextItem) {
            attemptHistory.insertBefore(div, nextItem);
        } else {
            attemptHistory.appendChild(div);
        }

        if (attemptHistory.children.length > 50) {
            const last = attemptHistory.lastChild;
            renderedLogIds.delete(last.dataset.id);
            attemptHistory.removeChild(last);
        }
    }

    function clearHistoryUI() {
        attemptHistory.innerHTML = '<p class="history-item empty">데이터가 초기화되었습니다.</p>';
        renderedLogIds.clear();
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
        return titles.length > 0 ? titles.join(' ') : '';
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
            const titleStr = getCharacterTitle(char);

            charCard.innerHTML = `
                <div class="card-header">
                    <h3 class="character-name">
                        <span class="titles">${titleStr}</span>
                        <span class="name">${char.name}</span>
                    </h3>
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
        if (imgElement && imgElement.src.indexOf(currentImg) === -1) imgElement.src = currentImg;

        card.querySelector('.titles').textContent = getCharacterTitle(char);
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
        logActivity(myNickname, '시도');

        const startMsg = `시나모롤이 ${myNickname}님의 요청으로 코딩을 시작합니다...`;
        codeOutput.innerHTML = `<div class="code-line comment">// ${startMsg}</div>`;
        broadcastCodingStep(startMsg, 'comment');
        
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

                const codeText = event.code(c1, c2, c3);
                const codeDiv = document.createElement('div');
                codeDiv.className = `code-line ${event.type}`;
                codeDiv.textContent = `> ${codeText}`;
                codeOutput.appendChild(codeDiv);
                codeOutput.scrollTop = codeOutput.scrollHeight;
                broadcastCodingStep(codeText, 'code');

                await new Promise(r => setTimeout(r, 1000));
                const summary = event.action(c1, c2, c3);
                const summaryDiv = document.createElement('div');
                summaryDiv.className = 'code-line comment';
                summaryDiv.textContent = `// ${summary}`;
                codeOutput.appendChild(summaryDiv);
                codeOutput.scrollTop = codeOutput.scrollHeight;
                broadcastCodingStep(summary, 'comment');
            }
            
            const endMsg = `시나모롤: "코딩 끝! 모두에게 좋은 일이 생겼길 바라요! (´,,•ω•,,)♡"`;
            const endDiv = document.createElement('div');
            endDiv.className = 'code-line cinnamoroll-reaction';
            endDiv.textContent = endMsg;
            codeOutput.appendChild(endDiv);
            codeOutput.scrollTop = codeOutput.scrollHeight;
            broadcastCodingStep(endMsg, 'reaction');
            
        } catch (error) {
            console.error(error);
        } finally {
            isProcessing = false;
            updateChanceUI();
        }
    }

    function broadcastMessage(msg) {
        const div = document.createElement('div');
        div.className = 'code-line broadcast';
        div.textContent = `📢 ${msg}`;
        codeOutput.appendChild(div);
        codeOutput.scrollTop = codeOutput.scrollHeight;
    }

    codeButton.addEventListener('click', processCoding);
    renderCharacters();
});
