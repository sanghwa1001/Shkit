const firebaseConfig = {
    apiKey: "AIzaSyAs5o4rlC1-bhA4J0P8LXp54CzDQ_aRNCo",
    authDomain: "shkit-300c7.firebaseapp.com",
    projectId: "shkit-300c7",
    storageBucket: "shkit-300c7.firebasestorage.app",
    messagingSenderId: "233422083288",
    appId: "1:233422083288:web:2943bf7fdcc1c64ab333ad",
    measurementId: "G-3X7SHWR081",
    databaseURL: "https://shkit-300c7-default-rtdb.firebaseio.com" 
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const DEFAULT_AVATARS = ['image_0.gif', 'image_1.gif'];
const ALL_SHOP_AVATARS = ['1.gif', '2.gif', '3.gif', '4.gif', '5.gif', '6.gif', '7.gif', '8.gif', '9.gif', '10.gif'];

let currentUser = null;
let myCurrentAvatar = null;
let tempSelectedAvatar = null; 
let isAdmin = false; 
let selectedStudentsForGems = []; 
let pendingRequests = []; 
let adminShopReturnPage = 'admin-menu-page'; 
let adminManageReturnPage = 'admin-menu-page';
let isChatMuted = false; 

let tempShopItems = [];
let localStudentAccounts = {}; 
let localOnlineUsers = {}; 
let localShopItems = []; 
let localShopNames = {}; 
let localShopPrices = {}; 

// 하이파이브 변수
let hfParticipants = {};
let hfState = { isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] };
let hfRequests = {};
let selectedHfUser = null;
const PAIR_COLORS = ['#ff9800', '#17a2b8', '#28a745', '#e83e8c', '#6f42c1', '#d84315', '#007bff', '#20c997'];

// 파도타기 변수
let waveParticipants = {};
let waveState = { isOpen: false, isStarted: false, shuffledIds: [] };
let waveClicks = {}; 

// 학습 관련 전역 변수
let localLearningData = {};
let currentEditDataSet = null;
let currentLearnMode = null; 
let currentSelectedData = null;

// ==========================================
// 🏃‍♂️ 상티런 인게임용 전역 독립 변수 모음
// ==========================================
let runWords = []; 
let currentRunWord = null;
let runScore = 0;
let runCorrectCount = 0;
let runWrongCount = 0;
let runGameStarted = false;
let RUN_WORLD_HEIGHT = 0;
let runCameraY = 0;
let runPlayerY = 0;
let runVelocity = 0;
let runIsPressing = false; 
let runMonsters = [];
let runSpawnInterval;
let runBgX = 0; 
const originalCharacterSrc = "swimcharacter1.gif"; 
let runAvatarChangeTimeout; 
let runActiveCoins = [];
let runTimeLeft = 60; 
const RUN_MAX_TIME = 60; 
let runTimerInterval;
let runResizeObserver = null; // 🛠️ wrapper 크기 변화를 감시해 스케일을 자동 재계산하는 옵저버

const RUN_BASE_WIDTH = 900;
const RUN_BASE_HEIGHT = 506.25;
const RUN_CHAR_X = RUN_BASE_WIDTH * 0.08; 

let runLastTime = 0;

let runCharW = 0;
let runCharH = 0;
let runCharBubbleW = 0;

function getNameClass(text) {
    const len = text ? text.length : 0;
    if (len <= 4) return 'name-sm';
    if (len <= 6) return 'name-md';
    if (len <= 8) return 'name-lg';
    return 'name-xl';
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

db.ref('studentAccounts').on('value', (snapshot) => {
    localStudentAccounts = snapshot.val() || {};
    if (document.getElementById('student-manage-page').classList.contains('active')) renderStudentList();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

db.ref('onlineUsers').on('value', (snapshot) => {
    localOnlineUsers = snapshot.val() || {};
    if (document.getElementById('student-lobby-page').classList.contains('active')) renderOnlineUsers();
});

db.ref('shopItems').on('value', (snapshot) => {
    localShopItems = snapshot.val() || [];
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

db.ref('shopItemNames').on('value', (snapshot) => {
    localShopNames = snapshot.val() || {};
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
    if (document.getElementById('storage-page').classList.contains('active')) renderAvatarList();
});

db.ref('shopItemPrices').on('value', (snapshot) => {
    localShopPrices = snapshot.val() || {};
    if (document.getElementById('admin-shop-page').classList.contains('active')) renderAdminShopPage();
    if (document.getElementById('student-shop-page').classList.contains('active')) renderStudentShop();
});

// 하이파이브 리스너
db.ref('highfive/state').on('value', snap => {
    const newState = snap.val() || { isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] };
    if (!isAdmin && newState.isOpen === false && document.getElementById('highfive-page').classList.contains('active')) {
        alert('관리자가 하이파이브 게임을 종료하여 메인 로비로 이동합니다.');
        db.ref('highfive/participants/' + currentUser).child('isOnline').onDisconnect().cancel(); 
        showPage('student-lobby-page');
    }
    hfState = newState;
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

db.ref('highfive/participants').on('value', snap => {
    hfParticipants = snap.val() || {};
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

db.ref('highfive/requests').on('value', snap => {
    hfRequests = snap.val() || {};
    if (document.getElementById('highfive-page').classList.contains('active')) renderHighFiveRoom();
});

// 파도타기 리스너
db.ref('wave/state').on('value', snap => {
    const newState = snap.val() || { isOpen: false, isStarted: false, shuffledIds: [] };
    if (!isAdmin && newState.isOpen === false && document.getElementById('wave-page').classList.contains('active')) {
        alert('관리자가 파도타기 게임을 종료하여 메인 로비로 이동합니다.');
        db.ref('wave/participants/' + currentUser).child('isOnline').onDisconnect().cancel(); 
        showPage('student-lobby-page');
    }
    waveState = newState;
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

db.ref('wave/participants').on('value', snap => {
    waveParticipants = snap.val() || {};
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

db.ref('wave/clicks').on('value', snap => {
    waveClicks = snap.val() || {};
    if (document.getElementById('wave-page').classList.contains('active')) renderWaveRoom();
});

db.ref('chatLog').on('child_added', (snapshot) => {
    const data = snapshot.val();
    const logDiv = document.getElementById('chat-log');
    
    if (data.isAlert) {
        const color = data.alertColor || '#007bff'; 
        logDiv.innerHTML += `<div style="margin-bottom: 8px; color: ${color}; font-weight: bold; text-align: center; background: #f8f9fa; padding: 6px; border-radius: 8px; border: 2px dashed ${color}80; font-size:14px; word-break:keep-all;">📢 ${data.message}</div>`;
    } else {
        const displayName = data.senderName || data.sender;
        const isMe = data.sender === currentUser;
        let nameColor = '#333'; let msgColor = '#333';
        
        if (data.sender === '⭐상티' || displayName === '⭐상티') {
            nameColor = '#007bff'; msgColor = '#007bff';
        } else if (isMe) {
            nameColor = '#007bff';
        }
        
        logDiv.innerHTML += `<div style="margin-bottom: 5px;"><strong style="color:${nameColor}">${displayName}:</strong> <span style="color:${msgColor}">${data.message}</span></div>`;
    }
    logDiv.scrollTop = logDiv.scrollHeight;
});

db.ref('chatLog').on('value', (snapshot) => {
    if (!snapshot.exists()) document.getElementById('chat-log').innerHTML = '';
});

db.ref('chatState/isMuted').on('value', (snapshot) => {
    isChatMuted = snapshot.val() || false;
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const muteBtn = document.getElementById('admin-mute-btn');

    if (isChatMuted) {
        if (!isAdmin) {
            chatInput.disabled = true;
            chatInput.placeholder = "관리자가 채팅을 금지했습니다 🤫";
            chatSendBtn.disabled = true;
            chatSendBtn.className = "btn-disabled chat-action-btn";
        }
        if (isAdmin && muteBtn) {
            muteBtn.innerText = "음소거 해제";
            muteBtn.className = "btn-red chat-action-btn";
        }
    } else {
        if (!isAdmin) {
            chatInput.disabled = false;
            chatInput.placeholder = "채팅 입력!";
            chatSendBtn.disabled = false;
            chatSendBtn.className = "btn-green chat-action-btn";
        }
        if (isAdmin && muteBtn) {
            muteBtn.innerText = "음소거";
            muteBtn.className = "btn-gray chat-action-btn";
        }
    }
});

// 학습 데이터 리스너
db.ref('learningData').on('value', (snapshot) => {
    localLearningData = snapshot.val() || {};
    if (document.getElementById('admin-edit-learn-page').classList.contains('active')) renderLearnDataList();
    if (document.getElementById('admin-edit-words-page').classList.contains('active') && currentEditDataSet) renderWordsList(currentEditDataSet);
    if (document.getElementById('student-select-data-page').classList.contains('active')) renderStudentDataList();
});

function listenForGemRequests() {
    db.ref(`gemRequests/${currentUser}`).on('value', snapshot => {
        const reqs = snapshot.val();
        pendingRequests = [];
        const now = Date.now(); 
        
        if (reqs) {
            for (let key in reqs) {
                const req = reqs[key];
                if (!req.expiresAt || now > req.expiresAt) {
                    db.ref(`gemRequests/${currentUser}/${key}`).remove();
                } else {
                    pendingRequests.push({ key, ...req });
                }
            }
        }
        
        const acceptBtn = document.getElementById('accept-request-btn');
        if (pendingRequests.length > 0) {
            acceptBtn.disabled = false;
            acceptBtn.className = "btn-orange gem-action-btn";
            acceptBtn.innerText = `🤝 수락 (${pendingRequests.length})`; 
        } else {
            acceptBtn.disabled = true;
            acceptBtn.className = "btn-disabled gem-action-btn";
            acceptBtn.innerText = '🤝 수락';
        }

        if (document.getElementById('student-lobby-page').classList.contains('active')) {
            renderOnlineUsers();
        }
    });
}

setInterval(() => {
    if (!currentUser || isAdmin) return;
    const now = Date.now();

    pendingRequests.forEach(req => {
        if (req.expiresAt && now > req.expiresAt) {
            if (req.isDeleting) return;
            req.isDeleting = true; 
            db.ref(`gemRequests/${currentUser}/${req.key}`).remove().then(() => {
                const requesterNick = localStudentAccounts[req.from]?.nickname || req.from;
                db.ref('chatLog').push().set({
                    sender: 'system',
                    message: `${requesterNick}이(가) 보낸 조르기가 취소되었습니다. ⏳`,
                    isAlert: true,
                    alertColor: '#6c757d', 
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                });
            });
        } else if (req.expiresAt) {
            let timeLeft = Math.max(0, Math.ceil((req.expiresAt - now) / 1000));
            const safeId = req.from.replace(/[^a-zA-Z0-9_-]/g, '_');
            const badgeEl = document.getElementById(`badge-${safeId}`);
            if (badgeEl) badgeEl.innerText = `🙏${req.amount}개 (${timeLeft}s)`;
        }
    });
}, 1000);

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    if (pageId === 'student-lobby-page') {
        const logDiv = document.getElementById('chat-log');
        logDiv.scrollTop = logDiv.scrollHeight;
        renderOnlineUsers();
    }
}

function applySelectedAvatar() {
    if (!tempSelectedAvatar) return;
    myCurrentAvatar = tempSelectedAvatar;
    db.ref('studentAccounts/' + currentUser).update({ avatarId: tempSelectedAvatar });
    db.ref('onlineUsers/' + currentUser).update({ avatarId: tempSelectedAvatar });
    
    showPage('student-lobby-page');
    renderOnlineUsers();
}

function checkStudentLogin() {
    const inputId = document.getElementById('student-id').value.trim();
    const inputPw = document.getElementById('student-pw').value.trim();
    
    if (inputId === '' || inputPw === '') {
        alert('아이디와 비밀번호를 모두 입력해주세요.');
        return;
    }

    const loginBtn = document.querySelector('#student-page .btn-blue');
    const originalText = loginBtn.innerText;
    
    loginBtn.innerText = "로그인 중... ⏳";
    loginBtn.disabled = true;

    setTimeout(() => {
        if (Object.keys(localStudentAccounts).length === 0) {
            alert('서버와 연결 중입니다. 잠시 후 다시 눌러주세요 ⏳');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            return;
        }

        const account = localStudentAccounts[inputId];

        if (account && account.pw === inputPw) {
            currentUser = inputId;
            isAdmin = false;
            
            let fixedOwned = account.ownedAvatars || DEFAULT_AVATARS;
            let fixedAvatar = account.avatarId || DEFAULT_AVATARS[0];

            myCurrentAvatar = fixedAvatar;
            
            if (account.gems === undefined) {
                db.ref('studentAccounts/' + currentUser).update({ gems: 10 });
            }
            
            document.getElementById('student-nickname').value = account.nickname || inputId;
            
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            showPage('nickname-page');
        } else {
            alert('아이디 또는 비밀번호가 틀렸습니다.');
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    }, 300);
}

function checkAdminLogin() {
    const inputId = document.getElementById('admin-id').value.trim();
    const inputPw = document.getElementById('admin-pw').value.trim();
    if (inputId === '' || inputPw === '') { alert('아이디와 비밀번호를 모두 입력해주세요.'); return; }
    
    const loginBtn = document.querySelector('#admin-login-page .btn-blue');
    const originalText = loginBtn.innerText;
    loginBtn.innerText = "로그인 중... ⏳";
    loginBtn.disabled = true;

    const adminEmail = inputId + "@gmail.com";
    firebase.auth().signInWithEmailAndPassword(adminEmail, inputPw)
        .then((userCredential) => { 
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            showPage('admin-menu-page'); 
        })
        .catch((error) => { 
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
            alert('관리자 정보가 일치하지 않습니다.'); 
        });
}

function createStudentAccount() {
    const newId = document.getElementById('new-student-id').value.trim();
    const newPw = document.getElementById('new-student-pw').value.trim();
    if (newId === '' || newPw === '') return alert('아이디와 비밀번호를 모두 입력해주세요.');
    if (localStudentAccounts[newId]) return alert('이미 존재하는 아이디입니다.');
    db.ref('studentAccounts/' + newId).set({ pw: newPw, nickname: newId, avatarId: DEFAULT_AVATARS[0], ownedAvatars: DEFAULT_AVATARS, gems: 10 });
    alert(`학생 계정(${newId})이 생성되었습니다!`);
    showPage('admin-menu-page');
}

function handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        let successCount = 0; let duplicateCount = 0; let updates = {};
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row[0] === undefined || row[1] === undefined) continue;
            const id = String(row[0]).trim(); const pw = String(row[1]).trim();
            if (id === '' || pw === '' || id === '아이디' || id.toLowerCase() === 'id') continue;
            if (localStudentAccounts[id]) { duplicateCount++; continue; }
            updates[id] = { pw: pw, nickname: id, avatarId: DEFAULT_AVATARS[0], ownedAvatars: DEFAULT_AVATARS, gems: 10 };
            successCount++;
        }
        if (successCount > 0) db.ref('studentAccounts').update(updates);
        alert(`일괄 등록 완료!\n생성: ${successCount}개\n중복 제외: ${duplicateCount}개`);
        event.target.value = ''; showPage('admin-menu-page');
    };
    reader.readAsArrayBuffer(file);
}

function showManagePage(returnPage = 'admin-menu-page') { 
    adminManageReturnPage = returnPage;
    renderStudentList(); 
    showPage('student-manage-page'); 
}

function closeManagePage() { showPage(adminManageReturnPage); }

function renderStudentList() {
    const listDiv = document.getElementById('student-list');
    listDiv.innerHTML = '';
    const ids = Object.keys(localStudentAccounts);
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color:#888; font-size:16px;">생성된 계정이 없습니다.</p>'; return; }
    
    listDiv.innerHTML = `<div class="list-header"><div class="h-id">ID</div><div class="h-nick">별명</div><div class="h-pw">PW</div><div class="h-btn">관리</div></div>`;
    
    ids.forEach((id) => {
        if (id.toLowerCase() === 'admin' || id === '⭐상티') return;

        const account = localStudentAccounts[id];
        const currentNick = account.nickname || id;
        const itemDiv = document.createElement('div');
        itemDiv.className = 'account-item';
        itemDiv.innerHTML = `
            <input type="text" value="${id}" readonly style="background:#eee;">
            <input type="text" id="edit-nickname-${id}" value="${currentNick}" placeholder="별명" maxlength="10">
            <input type="text" id="edit-pw-${id}" value="${account.pw}" placeholder="PW">
            <button class="btn-green btn-sm edit-btn" onclick="updateAccount('${id}')">수정</button>
            <button class="btn-red btn-sm edit-btn" onclick="deleteAccount('${id}')">삭제</button>
        `;
        listDiv.appendChild(itemDiv);
    });
}

function updateAccount(id) {
    const newPw = document.getElementById(`edit-pw-${id}`).value.trim();
    const newNick = document.getElementById(`edit-nickname-${id}`).value.trim().substring(0, 10);
    if (newPw === '') return alert('비밀번호를 입력해주세요.');
    
    db.ref('studentAccounts/' + id).update({ pw: newPw, nickname: newNick });
    if (localOnlineUsers[id]) db.ref('onlineUsers/' + id).update({ nickname: newNick });
    alert('계정 정보가 성공적으로 수정되었습니다.');
}

function deleteAccount(id) {
    if (localOnlineUsers[id]) return alert('현재 접속 중인 학생은 삭제할 수 없습니다.');
    if (confirm('정말 삭제하시겠습니까?')) db.ref('studentAccounts/' + id).remove();
}

function deleteAllAccounts() {
    if (Object.keys(localStudentAccounts).length === 0) return alert('삭제할 계정이 없습니다.');
    if (Object.keys(localOnlineUsers).length > 0) return alert('접속 중인 학생이 있어 삭제할 수 없습니다.');
    if (confirm('⚠️ 모든 학생 계정을 삭제하시겠습니까?')) db.ref('studentAccounts').remove();
}

function showAdminShopPage(returnPage = 'admin-menu-page') { 
    adminShopReturnPage = returnPage;
    tempShopItems = [...localShopItems]; 
    renderAdminShopPage(); 
    showPage('admin-shop-page'); 
}

function closeAdminShopPage() { showPage(adminShopReturnPage); }

function renderAdminShopPage() {
    const listDiv = document.getElementById('admin-shop-list');
    listDiv.innerHTML = '';
    ALL_SHOP_AVATARS.forEach((avatarId, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'avatar-item';
        if (tempShopItems.includes(avatarId)) itemDiv.classList.add('selected');

        const dbKey = avatarId.replace('.', '_'); 
        
        const currentName = localShopNames[dbKey] || `아바타 ${index + 1}`;
        const currentPrice = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
        
        itemDiv.innerHTML = `
            <img src="${avatarId}" alt="아바타">
            <div id="view-name-mode-${index}" style="margin-top: 8px; display:flex; align-items:center; gap:4px; justify-content:center; width:100%;">
                <span class="name-text-fit ${getNameClass(currentName)}" style="margin-top:0; flex:1;">${currentName}</span>
                <span title="이름 수정" style="cursor: pointer; font-size: 14px; background: #eee; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="enableEditMode(event, ${index}, 'name')">✏️</span>
            </div>
            <div id="edit-name-mode-${index}" style="margin-top: 8px; display:none; align-items:center; gap:4px; justify-content:center; width:100%;">
                <input type="text" id="name-input-${index}" value="${currentName}" maxlength="10" style="flex:1; width: 0; padding: 4px; font-size: 13px; text-align: center; border: 2px solid #ccc; border-radius: 6px; margin:0;" onclick="event.stopPropagation();" onkeypress="handleEnter(event, '${avatarId}', ${index}, 'name')">
                <span title="저장" style="cursor: pointer; font-size: 14px; background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="saveSingleData(event, '${avatarId}', ${index}, 'name')">✔️</span>
            </div>
            <div id="view-price-mode-${index}" style="margin-top: 8px; margin-bottom: 5px; display:flex; align-items:center; gap:4px; justify-content:center; width:100%;">
                <span style="font-size: 16px; color: #d84315; flex:1;">${currentPrice}</span>
                <span title="가격 수정" style="cursor: pointer; font-size: 14px; background: #eee; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="enableEditMode(event, ${index}, 'price')">💎</span>
            </div>
            <div id="edit-price-mode-${index}" style="margin-top: 8px; margin-bottom: 5px; display:none; align-items:center; gap:4px; justify-content:center; width:100%;">
                <input type="number" id="price-input-${index}" value="${currentPrice}" min="0" style="flex:1; width: 0; padding: 4px; font-size: 13px; text-align: center; border: 2px solid #ccc; border-radius: 6px; margin:0;" onclick="event.stopPropagation();" onkeypress="handleEnter(event, '${avatarId}', ${index}, 'price')">
                <span title="저장" style="cursor: pointer; font-size: 14px; background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 6px; flex-shrink: 0;" onclick="saveSingleData(event, '${avatarId}', ${index}, 'price')">✔️</span>
            </div>
        `;
        itemDiv.onclick = (e) => {
            if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'SPAN') {
                if (tempShopItems.includes(avatarId)) {
                    tempShopItems = tempShopItems.filter(id => id !== avatarId);
                    itemDiv.classList.remove('selected'); 
                } else {
                    tempShopItems.push(avatarId);
                    itemDiv.classList.add('selected'); 
                }
            }
        };
        listDiv.appendChild(itemDiv);
    });
}

function enableEditMode(event, index, type) {
    event.stopPropagation();
    document.getElementById(`view-${type}-mode-${index}`).style.display = 'none';
    document.getElementById(`edit-${type}-mode-${index}`).style.display = 'flex';
    document.getElementById(`${type}-input-${index}`).focus(); 
}

function saveSingleData(event, avatarId, index, type) {
    event.stopPropagation();
    const inputField = document.getElementById(`${type}-input-${index}`);
    let newValue = inputField.value.trim();
    const dbKey = avatarId.replace('.', '_');

    if (type === 'name') {
        newValue = newValue.substring(0, 10); 
        const currentNameInDB = localShopNames[dbKey];
        if (newValue === '') {
            if (currentNameInDB !== undefined) db.ref('shopItemNames/' + dbKey).remove().then(() => renderAdminShopPage());
            else renderAdminShopPage(); 
        } else {
            if (newValue !== currentNameInDB) db.ref('shopItemNames/' + dbKey).set(newValue).then(() => renderAdminShopPage());
            else renderAdminShopPage(); 
        }
    } else if (type === 'price') {
        const currentPriceInDB = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
        let parsedPrice = parseInt(newValue, 10);
        if (isNaN(parsedPrice) || parsedPrice < 0) parsedPrice = 1;
        if (parsedPrice !== currentPriceInDB) db.ref('shopItemPrices/' + dbKey).set(parsedPrice).then(() => renderAdminShopPage());
        else renderAdminShopPage();
    }
}

function handleEnter(event, avatarId, index, type) { if(event.key === 'Enter') saveSingleData(event, avatarId, index, type); }

function saveShopItems() { 
    db.ref('shopItems').set(tempShopItems); 
    showPage(adminShopReturnPage); 
}

function enterLobbyWithNickname() {
    const nicknameInput = document.getElementById('student-nickname').value.trim();
    const finalNickname = (nicknameInput === '' ? currentUser : nicknameInput).substring(0, 10);

    db.ref('studentAccounts/' + currentUser).update({ nickname: finalNickname });
    
    document.getElementById('admin-chat-reset-btn').style.display = 'none';
    document.getElementById('admin-mute-btn').style.display = 'none';
    
    document.getElementById('student-learn-btn').style.display = 'block';
    document.getElementById('admin-learn-lobby-btn').style.display = 'none';
    
    document.getElementById('shop-btn').style.display = 'block';
    document.getElementById('storage-btn').style.display = 'block';
    document.getElementById('student-hf-btn').style.display = 'block';
    document.getElementById('student-wave-btn').style.display = 'block';
    document.getElementById('student-logout-btn').style.display = 'block';
    
    document.getElementById('admin-gem-controls').style.display = 'none';
    document.getElementById('student-gem-controls').style.display = 'flex'; 
    
    document.getElementById('admin-shop-lobby-btn').style.display = 'none';
    document.getElementById('admin-manage-lobby-btn').style.display = 'none';
    document.getElementById('admin-hf-btn').style.display = 'none';
    document.getElementById('admin-wave-btn').style.display = 'none';
    document.getElementById('admin-back-lobby-btn').style.display = 'none';
    
    selectedStudentsForGems = [];
    listenForGemRequests(); 

    const myOnlineRef = db.ref('onlineUsers/' + currentUser);
    myOnlineRef.set({ avatarId: myCurrentAvatar, nickname: finalNickname });
    myOnlineRef.onDisconnect().remove(); 
    
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    if (isChatMuted) {
        chatInput.disabled = true;
        chatInput.placeholder = "관리자가 채팅을 금지했습니다 🤫";
        chatSendBtn.disabled = true;
        chatSendBtn.className = "btn-disabled chat-action-btn";
    } else {
        chatInput.disabled = false;
        chatInput.placeholder = "채팅 입력!";
        chatSendBtn.disabled = false;
        chatSendBtn.className = "btn-green chat-action-btn";
    }

    showPage('student-lobby-page');
}

function enterAdminLobby() {
    isAdmin = true;
    currentUser = '⭐상티';
    myCurrentAvatar = ""; 
    
    document.getElementById('admin-chat-reset-btn').style.display = 'block';
    document.getElementById('admin-mute-btn').style.display = 'block';
    
    document.getElementById('student-learn-btn').style.display = 'none';
    document.getElementById('admin-learn-lobby-btn').style.display = 'block';
    
    document.getElementById('shop-btn').style.display = 'none';
    document.getElementById('storage-btn').style.display = 'none';
    document.getElementById('student-hf-btn').style.display = 'none';
    document.getElementById('student-wave-btn').style.display = 'none';
    document.getElementById('student-logout-btn').style.display = 'none';
    
    document.getElementById('admin-gem-controls').style.display = 'flex';
    document.getElementById('student-gem-controls').style.display = 'none';
    
    document.getElementById('admin-shop-lobby-btn').style.display = 'block';
    document.getElementById('admin-manage-lobby-btn').style.display = 'block';
    document.getElementById('admin-hf-btn').style.display = 'block';
    document.getElementById('admin-wave-btn').style.display = 'block';
    document.getElementById('admin-back-lobby-btn').style.display = 'block';
    
    document.getElementById('chat-input').disabled = false;
    document.getElementById('chat-input').placeholder = "채팅 입력!";
    document.getElementById('chat-send-btn').disabled = false;
    document.getElementById('chat-send-btn').className = "btn-green chat-action-btn";

    const muteBtn = document.getElementById('admin-mute-btn');
    if (isChatMuted) {
        muteBtn.innerText = "음소거 해제";
        muteBtn.className = "btn-red chat-action-btn";
    } else {
        muteBtn.innerText = "음소거";
        muteBtn.className = "btn-gray chat-action-btn";
    }

    selectedStudentsForGems = []; 
    showPage('student-lobby-page');
}

function logoutStudent() {
    if (currentUser && !isAdmin) {
        db.ref('onlineUsers/' + currentUser).remove();
        db.ref(`gemRequests/${currentUser}`).off(); 
        
        const pRef = db.ref('highfive/participants/' + currentUser);
        if (hfState.isStarted) {
            pRef.update({ isOnline: false });
        } else {
            pRef.remove();
        }

        const wRef = db.ref('wave/participants/' + currentUser);
        if (waveState.isStarted) {
            wRef.update({ isOnline: false });
        } else {
            wRef.remove();
        }
    }
    currentUser = null;
    isAdmin = false;
    
    document.getElementById('admin-chat-reset-btn').style.display = 'none';
    document.getElementById('admin-mute-btn').style.display = 'none';
    
    document.getElementById('student-learn-btn').style.display = 'none';
    document.getElementById('admin-learn-lobby-btn').style.display = 'none';
    
    document.getElementById('admin-gem-controls').style.display = 'none';
    document.getElementById('student-gem-controls').style.display = 'none';
    document.getElementById('admin-shop-lobby-btn').style.display = 'none';
    document.getElementById('admin-manage-lobby-btn').style.display = 'none';
    document.getElementById('student-hf-btn').style.display = 'none';
    document.getElementById('student-wave-btn').style.display = 'none';
    document.getElementById('admin-hf-btn').style.display = 'none';
    document.getElementById('admin-wave-btn').style.display = 'none';
    document.getElementById('admin-back-lobby-btn').style.display = 'none';
    
    selectedStudentsForGems = [];
    showPage('main-page');
}

function sendChat() {
    if (!isAdmin && isChatMuted) return; 

    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg || !currentUser) return;

    let senderName = isAdmin ? '⭐상티' : (localStudentAccounts[currentUser]?.nickname || currentUser);

    const newChatRef = db.ref('chatLog').push();
    newChatRef.set({ 
        sender: currentUser, 
        senderName: senderName,
        message: msg, 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    });

    if (!isAdmin) {
        const now = Date.now();
        db.ref('onlineUsers/' + currentUser).update({ bubble: msg, bubbleTime: now });
        setTimeout(() => {
            db.ref('onlineUsers/' + currentUser).once('value').then(snap => {
                const data = snap.val();
                if(data && data.bubbleTime === now) {
                    db.ref('onlineUsers/' + currentUser).update({ bubble: null, bubbleTime: null });
                }
            });
        }, 5000);
    }
    input.value = '';
}

function clearAllChat() {
    if (confirm('🚨 모든 학생의 채팅 기록을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        db.ref('chatLog').remove()
            .then(() => alert('채팅 기록이 깔끔하게 지워졌습니다.'))
            .catch((error) => alert('초기화 중 오류가 발생했습니다.'));
    }
}

function toggleMute() {
    const newState = !isChatMuted;
    db.ref('chatState/isMuted').set(newState);

    const sysMsg = newState ? "상티가 채팅창을 비활성화했습니다." : "상티가 채팅창을 활성화했습니다.";
    
    db.ref('chatLog').push().set({ 
        sender: 'system',
        message: sysMsg, 
        isAlert: true,
        alertColor: '#007bff', 
        timestamp: firebase.database.ServerValue.TIMESTAMP 
    });
}

function modifyGems(action) {
    if (selectedStudentsForGems.length === 0) { alert(`보석을 ${action === 'add' ? '지급' : '차감'}할 학생을 선택해 주세요.`); return; }
    const amountInput = document.getElementById('gem-control-amount'); const gemsToModify = parseInt(amountInput.value, 10);
    if (isNaN(gemsToModify) || gemsToModify <= 0) { alert('올바른 보석 개수를 입력해 주세요. (1 이상의 정수)'); return; }
    
    let updates = {}; let nicknameArray = [];
    selectedStudentsForGems.forEach(id => {
        const currentGems = localStudentAccounts[id]?.gems || 0;
        let newGems = action === 'add' ? currentGems + gemsToModify : Math.max(0, currentGems - gemsToModify);
        updates[`studentAccounts/${id}/gems`] = newGems;
        nicknameArray.push(localStudentAccounts[id]?.nickname || id);
    });
    
    db.ref().update(updates).then(() => {
        const sysMsg = `${nicknameArray.join(', ')}이(가) 보석을 ${gemsToModify}개 ${action === 'add' ? '지급' : '차감'}받았습니다.`;
        db.ref('chatLog').push().set({ sender: 'system', message: sysMsg, isAlert: true, alertColor: action === 'add' ? '#28a745' : '#dc3545', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function giftGems() {
    if (selectedStudentsForGems.length === 0) return alert('선물할 친구를 선택해 주세요!');
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');
    const totalCost = amt * selectedStudentsForGems.length;
    const myGems = localStudentAccounts[currentUser]?.gems || 0;
    if (myGems < totalCost) return alert(`보석이 부족합니다! (필요: ${totalCost}개, 현재: ${myGems}개)`);

    let updates = {}; updates[`studentAccounts/${currentUser}/gems`] = myGems - totalCost;
    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        updates[`studentAccounts/${id}/gems`] = (localStudentAccounts[id]?.gems || 0) + amt;
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });

    db.ref().update(updates).then(() => {
        db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 선물했습니다. 🎁`, isAlert: true, alertColor: '#28a745', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function requestGems() {
    if (selectedStudentsForGems.length === 0) return alert('조를 친구를 선택해 주세요!');
    const amt = parseInt(document.getElementById('student-gem-amount').value, 10);
    if (isNaN(amt) || amt <= 0) return alert('올바른 보석 개수를 입력해 주세요.');

    let targetNicks = [];
    selectedStudentsForGems.forEach(id => {
        db.ref(`gemRequests/${id}`).push({ from: currentUser, amount: amt, expiresAt: Date.now() + 60000 });
        targetNicks.push(localStudentAccounts[id]?.nickname || id);
    });
    db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${targetNicks.join(', ')}에게 보석 ${amt}개를 조르기했습니다. 🙏`, isAlert: true, alertColor: '#17a2b8', timestamp: firebase.database.ServerValue.TIMESTAMP });
    selectedStudentsForGems = []; renderOnlineUsers(); alert('조르기 요청을 보냈습니다! (1분 후 자동 취소됩니다.)');
}

function acceptGemRequest() {
    if (pendingRequests.length === 0) return;
    if (selectedStudentsForGems.length === 0) return alert('조르기를 수락할 친구를 대기실에서 먼저 선택해 주세요!');
    let myGems = localStudentAccounts[currentUser]?.gems || 0;
    let updates = {}; let acceptedNicks = []; let totalDeduction = 0;
    let matchedRequests = pendingRequests.filter(req => selectedStudentsForGems.includes(req.from));
    if (matchedRequests.length === 0) return alert('선택한 친구 중에는 조르기를 요청한 친구가 없습니다.');
    matchedRequests.forEach(req => { totalDeduction += req.amount; });
    if (myGems < totalDeduction) return alert(`보석이 부족하여 선택한 요청을 모두 수락할 수 없습니다.`);

    updates[`studentAccounts/${currentUser}/gems`] = myGems - totalDeduction;
    matchedRequests.forEach(req => {
        updates[`studentAccounts/${req.from}/gems`] = (localStudentAccounts[req.from]?.gems || 0) + req.amount;
        updates[`gemRequests/${currentUser}/${req.key}`] = null; 
        acceptedNicks.push(localStudentAccounts[req.from]?.nickname || req.from);
    });
    db.ref().update(updates).then(() => {
        db.ref('chatLog').push().set({ sender: 'system', message: `${localStudentAccounts[currentUser]?.nickname || currentUser}이(가) ${acceptedNicks.join(', ')}의 조르기를 수락하여 보석을 주었습니다! 🎉`, isAlert: true, alertColor: '#28a745', timestamp: firebase.database.ServerValue.TIMESTAMP });
        selectedStudentsForGems = []; renderOnlineUsers();
    });
}

function renderOnlineUsers() {
    const listDiv = document.getElementById('online-users-list'); listDiv.innerHTML = '';
    const ids = Object.keys(localOnlineUsers); if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px;">현재 대기실에 아무도 없습니다.</p>'; return; }
    const now = Date.now();
    ids.forEach(id => {
        if (id === '⭐상티') return; 
        const user = localOnlineUsers[id]; const userDiv = document.createElement('div'); userDiv.className = 'online-user-item';
        if (selectedStudentsForGems.includes(id)) userDiv.classList.add('selected');
        if (id !== currentUser) {
            userDiv.style.cursor = 'pointer';
            userDiv.onclick = () => {
                selectedStudentsForGems = selectedStudentsForGems.includes(id) ? selectedStudentsForGems.filter(sid => sid !== id) : [...selectedStudentsForGems, id];
                renderOnlineUsers();
            };
        }
        let requestBadge = '';
        if (!isAdmin && currentUser) {
            const reqFromThisUser = pendingRequests.find(req => req.from === id);
            if (reqFromThisUser) {
                let timeLeft = Math.max(0, Math.ceil((reqFromThisUser.expiresAt - now) / 1000));
                requestBadge = `<div id="badge-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}" style="position:absolute; top:-10px; right:-10px; background:#dc3545; color:white; font-size:11px; font-weight:bold; padding:2px 4px; border-radius:10px; z-index:11; box-shadow:0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">🙏${reqFromThisUser.amount}개 (${timeLeft}s)</div>`;
            }
        }
        let bubbleHTML = (user.bubble && user.bubbleTime && (now - user.bubbleTime < 5000)) ? `<div class="speech-bubble">${user.bubble.length > 15 ? user.bubble.substring(0, 15) + '...' : user.bubble}</div>` : '';
        let displayId = user.nickname || id; const isMe = (id === currentUser) ? '<span style="color: #ff9800; margin-left:2px;">(나)</span>' : '';
        userDiv.innerHTML = `${requestBadge}${bubbleHTML}<img src="${user.avatarId || 'image_0.gif'}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayId)}">${displayId}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>`;
        listDiv.appendChild(userDiv);
    });
}

function showStudentShopPage() { renderStudentShop(); showPage('student-shop-page'); }
function renderStudentShop() {
    const listDiv = document.getElementById('student-shop-list'); listDiv.innerHTML = '';
    document.getElementById('my-gems-display').innerText = `내 보석: 💎 ${localStudentAccounts[currentUser]?.gems || 0}`;
    if (localShopItems.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 18px; grid-column: 1 / -1;">현재 등록된 상품이 없습니다.</p>'; return; }
    const myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS;
    localShopItems.forEach(avatarId => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'avatar-item'; const dbKey = avatarId.replace('.', '_');
        const avatarName = localShopNames[dbKey] || `${avatarId.split('.')[0]}번 아바타`; const nameText = `<span class="name-text-fit ${getNameClass(avatarName)}">${avatarName}</span>`;
        if (myOwnedAvatars.includes(avatarId)) itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타" style="opacity: 0.5;">${nameText}<div class="owned-tag">보유 중</div>`;
        else itemDiv.innerHTML = `<img src="${avatarId}" alt="아바타">${nameText}<button class="btn-cyan buy-btn" style="padding: 8px 2px; font-size: clamp(12px, 3.5vw, 15px); border-radius: 8px;" onclick="buyAvatar('${avatarId}')">💎 ${localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1} 구입</button>`;
        listDiv.appendChild(itemDiv);
    });
}

function buyAvatar(avatarId) {
    const dbKey = avatarId.replace('.', '_'); const price = localShopPrices[dbKey] !== undefined ? localShopPrices[dbKey] : 1;
    let myOwnedAvatars = localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS; let myGems = localStudentAccounts[currentUser]?.gems || 0;
    if (myGems < price) return alert('보석이 부족합니다!');
    db.ref('studentAccounts/' + currentUser).update({ ownedAvatars: [...myOwnedAvatars, avatarId], gems: myGems - price });
    alert('아바타를 성공적으로 구입했습니다! 🎉');
}

function showStoragePage() { tempSelectedAvatar = myCurrentAvatar; renderAvatarList(); showPage('storage-page'); }
function renderAvatarList() {
    const listDiv = document.getElementById('avatar-list'); listDiv.innerHTML = '';
    (localStudentAccounts[currentUser]?.ownedAvatars || DEFAULT_AVATARS).forEach(avatarId => {
        const avatarDiv = document.createElement('div'); avatarDiv.className = 'avatar-item';
        if (avatarId === tempSelectedAvatar) avatarDiv.classList.add('selected');
        avatarDiv.onclick = () => { tempSelectedAvatar = avatarId; listDiv.querySelectorAll('.avatar-item').forEach(item => item.classList.remove('selected')); avatarDiv.classList.add('selected'); };
        let avatarName = (avatarId === 'image_0.gif') ? '기본 남자' : (avatarId === 'image_1.gif') ? '기본 여자' : (localShopNames[avatarId.replace('.', '_')] || `${avatarId.split('.')[0]}번 아바타`);
        avatarDiv.innerHTML = `<img src="${avatarId}" alt="아바타"><p class="name-text-fit ${getNameClass(avatarName)}" style="margin-bottom:0;">${avatarName}</p>`;
        listDiv.appendChild(avatarDiv);
    });
}

// 하이파이브 및 파도타기 생략(원형 유지)
function enterHighFiveRoom() { if (isAdmin) { db.ref('highfive/state/isOpen').set(true); } else { const pRef = db.ref('highfive/participants/' + currentUser); pRef.once('value', snap => { if (!snap.val()) pRef.set({ status: 'waiting', pairId: null, pairColor: null, isOnline: true }); else pRef.update({ isOnline: true }); pRef.child('isOnline').onDisconnect().set(false); }); } selectedHfUser = null; showPage('highfive-page'); renderHighFiveRoom(); }
function exitHighFiveRoom() { if (isAdmin) { db.ref('highfive/state').update({ isOpen: false, isStarted: false, pairCount: 0, shuffledIds: [] }); db.ref('highfive/participants').remove(); db.ref('highfive/requests').remove(); showPage('student-lobby-page'); } else { const pRef = db.ref('highfive/participants/' + currentUser); pRef.child('isOnline').onDisconnect().cancel(); if (hfState.isStarted) pRef.update({ isOnline: false }); else pRef.remove(); showPage('student-lobby-page'); } }
function toggleHfReady() { if (hfState.isStarted) return; const myData = hfParticipants[currentUser]; if (!myData) return; db.ref('highfive/participants/' + currentUser).update({ status: myData.status === 'ready' ? 'waiting' : 'ready' }); }
function startHfGame() { const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false); if (onlineIds.length < 2) return alert('최소 2명 이상이어야 합니다.'); if (!onlineIds.every(id => hfParticipants[id].status === 'ready')) return alert('모두 준비되지 않았습니다!'); db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('highfive/requests').remove(); }
function restartHfGame() { const onlineIds = Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false); db.ref('highfive/state').update({ isStarted: true, pairCount: 0, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('highfive/requests').remove(); let updates = {}; for (let uid in hfParticipants) { updates[`highfive/participants/${uid}/pairId`] = null; updates[`highfive/participants/${uid}/pairColor`] = null; } db.ref().update(updates); }
function renderHighFiveRoom() {
    const adminBtnGroup = document.getElementById('hf-admin-btn-group'); const studentBtnGroup = document.getElementById('hf-student-btn-group'); const startBtn = document.getElementById('hf-admin-start-btn'); const readyBtn = document.getElementById('hf-ready-btn'); const listDiv = document.getElementById('hf-users-list'); listDiv.innerHTML = '';
    let ids = !hfState.isStarted ? Object.keys(hfParticipants).filter(id => hfParticipants[id].isOnline !== false) : (hfState.shuffledIds || []);
    const onlineStudentIds = ids.filter(id => hfParticipants[id] && hfParticipants[id].isOnline !== false); const unPairedCount = onlineStudentIds.filter(id => hfParticipants[id].pairId == null).length; const isMatchComplete = onlineStudentIds.length >= 2 && unPairedCount <= 1;
    document.getElementById('hf-controls').style.display = isAdmin ? 'none' : 'flex';
    if (isAdmin) { studentBtnGroup.style.display = 'none'; adminBtnGroup.style.display = 'flex'; if (hfState.isStarted && isMatchComplete) { startBtn.innerText = '다시하기'; startBtn.disabled = false; startBtn.style.opacity = '1'; startBtn.onclick = restartHfGame; } else { startBtn.innerText = '시작'; startBtn.onclick = startHfGame; startBtn.disabled = hfState.isStarted; startBtn.style.opacity = startBtn.disabled ? '0.5' : '1'; } }
    else { adminBtnGroup.style.display = 'none'; studentBtnGroup.style.display = 'flex'; if (hfState.isStarted) readyBtn.style.display = 'none'; else { readyBtn.style.display = 'block'; readyBtn.innerText = (hfParticipants[currentUser] || {}).status === 'ready' ? '취소' : '준비'; readyBtn.className = (hfParticipants[currentUser] || {}).status === 'ready' ? "btn-red" : "btn-green"; } }
    const reqBtn = document.getElementById('hf-request-btn'); const acceptBtn = document.getElementById('hf-accept-btn'); const myRequests = hfRequests[currentUser] || {};
    if (!isAdmin) { reqBtn.disabled = !hfState.isStarted; reqBtn.className = hfState.isStarted ? "btn-cyan hf-action-btn" : "btn-disabled hf-action-btn"; acceptBtn.disabled = !(hfState.isStarted && Object.keys(myRequests).length > 0); acceptBtn.className = (hfState.isStarted && Object.keys(myRequests).length > 0) ? "btn-orange hf-action-btn" : "btn-disabled hf-action-btn"; acceptBtn.innerText = Object.keys(myRequests).length > 0 ? `🤝 파이브! (${Object.keys(myRequests).length})` : '🤝 파이브!'; }
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>'; return; }
    ids.forEach(id => {
        if(!hfParticipants[id]) return; const data = hfParticipants[id]; const realAcc = localStudentAccounts[id] || {}; const isMe = id === currentUser; const userIsPaired = data.pairId != null; const isOffline = data.isOnline === false; const isFailedUser = hfState.isStarted && unPairedCount === 1 && !userIsPaired && !isOffline;
        let avatarSrc = (hfState.isStarted && !userIsPaired && !isFailedUser) ? 'unknown.gif' : (realAcc.avatarId || 'image_0.gif'); let displayName = (hfState.isStarted && !userIsPaired && !isFailedUser) ? '???' : (realAcc.nickname || id);
        let statusTextHtml = isOffline ? '<div class="hf-ready-text" style="color: #999;">나감</div>' : userIsPaired ? `<div class="hf-ready-text" style="color: ${data.pairColor};">하이파이브 완료!</div>` : isFailedUser ? `<div class="hf-ready-text" style="color: #dc3545;">하이파이브 실패</div>` : !hfState.isStarted ? (data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>') : '<div class="hf-ready-text">고르는중</div>';
        let badgeHtml = (!isAdmin && hfState.isStarted && !userIsPaired && !isOffline && !isFailedUser && hfRequests[currentUser] && hfRequests[currentUser][id]) ? '<div class="hf-badge">✋</div>' : '';
        const userDiv = document.createElement('div'); userDiv.className = 'online-user-item'; if (isOffline) userDiv.style.opacity = '0.5'; if (userIsPaired && data.pairColor) { userDiv.style.borderColor = data.pairColor; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = data.pairColor + '15'; } else if (isFailedUser) { userDiv.style.borderColor = '#dc3545'; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = '#f8d7da'; } else if (selectedHfUser === id) userDiv.classList.add('selected');
        if (!isAdmin && hfState.isStarted && !userIsPaired && id !== currentUser && !isOffline && !isFailedUser) { userDiv.style.cursor = 'pointer'; userDiv.onclick = () => { selectedHfUser = id; renderHighFiveRoom(); }; }
        userDiv.innerHTML = `${badgeHtml}<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}
function sendHighFiveRequest() { if (!hfState.isStarted) return; if (!selectedHfUser || selectedHfUser === currentUser || hfParticipants[selectedHfUser]?.pairId != null) return; db.ref(`highfive/requests/${selectedHfUser}/${currentUser}`).set(Date.now()); selectedHfUser = null; renderHighFiveRoom(); }
function acceptHighFive() { if (!hfState.isStarted || !selectedHfUser) return; const targetId = selectedHfUser; if ((hfRequests[currentUser] || {})[targetId] && hfParticipants[targetId]?.pairId == null) { const nextPairId = hfState.pairCount + 1; const pairColor = PAIR_COLORS[nextPairId % PAIR_COLORS.length]; let updates = {}; updates[`highfive/state/pairCount`] = nextPairId; updates[`highfive/participants/${currentUser}/pairId`] = nextPairId; updates[`highfive/participants/${currentUser}/pairColor`] = pairColor; updates[`highfive/participants/${targetId}/pairId`] = nextPairId; updates[`highfive/participants/${targetId}/pairColor`] = pairColor; updates[`highfive/requests/${currentUser}`] = null; updates[`highfive/requests/${targetId}`] = null; db.ref().update(updates).then(() => { selectedHfUser = null; }); } }
function enterWaveRoom() { if (isAdmin) { db.ref('wave/state/isOpen').set(true); } else { const pRef = db.ref('wave/participants/' + currentUser); pRef.once('value', snap => { if (!snap.val()) pRef.set({ status: 'waiting', isOnline: true }); else pRef.update({ isOnline: true }); pRef.child('isOnline').onDisconnect().set(false); }); } showPage('wave-page'); renderWaveRoom(); }
function exitWaveRoom() { if (isAdmin) { db.ref('wave/state').update({ isOpen: false, isStarted: false, shuffledIds: [] }); db.ref('wave/participants').remove(); db.ref('wave/clicks').remove(); showPage('student-lobby-page'); } else { const pRef = db.ref('wave/participants/' + currentUser); pRef.child('isOnline').onDisconnect().cancel(); if (waveState.isStarted) pRef.update({ isOnline: false }); else pRef.remove(); showPage('student-lobby-page'); } }
function toggleWaveReady() { if (waveState.isStarted) return; const myData = waveParticipants[currentUser]; if (!myData) return; db.ref('wave/participants/' + currentUser).update({ status: myData.status === 'ready' ? 'waiting' : 'ready' }); }
function startWaveGame() { const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false); if (onlineIds.length < 4) return alert('최소 4명 이상이어야 합니다.'); if (!onlineIds.every(id => waveParticipants[id].status === 'ready')) return alert('모두 준비되지 않았습니다!'); db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('wave/clicks').remove(); }
function restartWaveGame() { const onlineIds = Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false); db.ref('wave/state').update({ isStarted: true, shuffledIds: shuffleArray([...onlineIds]) }); db.ref('wave/clicks').remove(); }
function clickWaveBtn() { if (waveState.isStarted) db.ref('wave/clicks').push(currentUser); }
function renderWaveRoom() {
    const adminBtnGroup = document.getElementById('wave-admin-btn-group'); const studentBtnGroup = document.getElementById('wave-student-btn-group'); const startBtn = document.getElementById('wave-admin-start-btn'); const readyBtn = document.getElementById('wave-ready-btn'); const waveBtn = document.getElementById('wave-action-btn'); const listDiv = document.getElementById('wave-users-list'); listDiv.innerHTML = '';
    let ids = !waveState.isStarted ? Object.keys(waveParticipants).filter(id => waveParticipants[id].isOnline !== false) : (waveState.shuffledIds || []); const onlineStudentIds = ids.filter(id => waveParticipants[id] && waveParticipants[id].isOnline !== false); const clickArray = Object.values(waveClicks || {}); const isGameFinished = waveState.isStarted && onlineStudentIds.every(id => clickArray.includes(id));
    document.getElementById('wave-controls').style.display = isAdmin ? 'none' : 'flex';
    if (isAdmin) { studentBtnGroup.style.display = 'none'; adminBtnGroup.style.display = 'flex'; if (waveState.isStarted && isGameFinished) { startBtn.innerText = '다시하기'; startBtn.disabled = false; startBtn.style.opacity = '1'; startBtn.onclick = restartWaveGame; } else { startBtn.innerText = '시작'; startBtn.onclick = startWaveGame; startBtn.disabled = waveState.isStarted; startBtn.style.opacity = startBtn.disabled ? '0.5' : '1'; } }
    else { adminBtnGroup.style.display = 'none'; studentBtnGroup.style.display = 'flex'; if (waveState.isStarted) readyBtn.style.display = 'none'; else { readyBtn.style.display = 'block'; readyBtn.innerText = (waveParticipants[currentUser] || {}).status === 'ready' ? '취소' : '준비'; readyBtn.className = (waveParticipants[currentUser] || {}).status === 'ready' ? "btn-red" : "btn-green"; } const hasClicked = clickArray.includes(currentUser); waveBtn.disabled = !waveState.isStarted || hasClicked; waveBtn.className = (waveState.isStarted && !hasClicked) ? "btn-cyan hf-action-btn" : "btn-disabled hf-action-btn"; }
    if (ids.length === 0) { listDiv.innerHTML = '<p style="color: #888; font-size: 16px;">대기실에 아무도 없습니다.</p>'; return; }
    ids.forEach(id => {
        if(!waveParticipants[id]) return; const data = waveParticipants[id]; const realAcc = localStudentAccounts[id] || {}; const isMe = id === currentUser; const isOffline = data.isOnline === false; const clickIndex = clickArray.indexOf(id); const userHasClicked = clickIndex !== -1; const teamNumber = userHasClicked ? Math.floor(clickIndex / 4) + 1 : null; const isTeamComplete = userHasClicked && clickArray.length >= teamNumber * 4;
        let avatarSrc = (waveState.isStarted && !isTeamComplete && !isOffline) ? 'unknown.gif' : (realAcc.avatarId || 'image_0.gif'); let displayName = (waveState.isStarted && !isTeamComplete && !isOffline) ? '???' : (realAcc.nickname || id);
        let statusTextHtml = isOffline ? '<div class="hf-ready-text" style="color: #999;">나감</div>' : isTeamComplete ? `<div class="hf-ready-text" style="color: ${PAIR_COLORS[teamNumber % PAIR_COLORS.length]};">파도타기 완료!</div>` : userHasClicked ? '<div class="hf-ready-text" style="color: #17a2b8;">팀원 대기중..</div>' : !waveState.isStarted ? (data.status === 'ready' ? '<div class="hf-ready-text ready">준비완료</div>' : '<div class="hf-ready-text">준비중</div>') : '<div class="hf-ready-text" style="color: #d84315;">타이밍!</div>';
        const userDiv = document.createElement('div'); userDiv.className = 'online-user-item'; if (isOffline) userDiv.style.opacity = '0.5'; else if (isTeamComplete) { userDiv.style.borderColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length]; userDiv.style.borderWidth = '4px'; userDiv.style.backgroundColor = PAIR_COLORS[teamNumber % PAIR_COLORS.length] + '15'; }
        userDiv.innerHTML = `<img src="${avatarSrc}" alt="아바타" class="online-user-avatar"><div style="display:flex; flex-direction:column; width:100%; flex: 1; justify-content: flex-end;"><span class="name-text-fit ${getNameClass(displayName)}">${displayName}</span><span style="font-size:10px; color:#ff9800; font-weight:bold; min-height:12px; line-height:1; margin-bottom:2px;">${(isMe) ? '(나)' : ''}</span></div>${statusTextHtml}`; listDiv.appendChild(userDiv);
    });
}

function handleLearnExcelUpload(event) {
    const file = event.target.files[0]; if (!file) return; const fileName = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader(); reader.onload = function(e) {
        const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' }); const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        let words = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i]; if (!row || row[0] === undefined || row[1] === undefined) continue;
            const eng = String(row[0]).trim(); const kor = String(row[1]).trim();
            if (eng === '' || kor === '' || eng.toLowerCase() === 'english' || kor === '한글') continue;
            words.push({ eng: eng, kor: kor });
        }
        if (words.length > 0) { db.ref('learningData/' + fileName.replace(/[.#$[\]]/g, '_')).set({ name: fileName, words: words }); alert(`[${fileName}] 생성 완료!`); }
        else { alert('유효한 단어가 없습니다.'); }
        event.target.value = ''; showPage('admin-learn-menu-page');
    }; reader.readAsArrayBuffer(file);
}
function showManageLearnPage() { renderLearnDataList(); showPage('admin-edit-learn-page'); }
function renderLearnDataList() {
    const listDiv = document.getElementById('learn-data-list'); listDiv.innerHTML = ''; const keys = Object.keys(localLearningData);
    if (keys.length === 0) { listDiv.innerHTML = '<p style="color:#888;">생성된 학습 데이터가 없습니다.</p>'; return; }
    keys.forEach(key => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'account-item';
        itemDiv.innerHTML = `<input type="text" id="edit-dataset-name-${key}" value="${localLearningData[key].name}" style="flex:2;"><button class="btn-green btn-sm edit-btn" onclick="updateDatasetName('${key}')">이름저장</button><button class="btn-blue btn-sm edit-btn" onclick="openWordsEdit('${key}')">내용수정</button><button class="btn-red btn-sm edit-btn" onclick="deleteDataset('${key}')">삭제</button>`; listDiv.appendChild(itemDiv);
    });
}
function updateDatasetName(key) { const newName = document.getElementById(`edit-dataset-name-${key}`).value.trim(); if(newName === '') return; db.ref(`learningData/${key}/name`).set(newName); alert('변경 완료!'); }
function deleteDataset(key) { if(confirm('완전히 삭제하시겠습니까?')) db.ref(`learningData/${key}`).remove(); }
function openWordsEdit(key) { currentEditDataSet = key; document.getElementById('edit-words-title').innerText = `${localLearningData[key].name} 내용 수정`; renderWordsList(key); showPage('admin-edit-words-page'); }
function renderWordsList(key) {
    const listDiv = document.getElementById('words-list'); listDiv.innerHTML = ''; const words = localLearningData[key]?.words || [];
    words.forEach((word, index) => {
        const itemDiv = document.createElement('div'); itemDiv.className = 'account-item';
        itemDiv.innerHTML = `<input type="text" id="edit-eng-${key}-${index}" value="${word.eng}"><input type="text" id="edit-kor-${key}-${index}" value="${word.kor}"><button class="btn-green btn-sm edit-btn" onclick="updateWord('${key}', ${index})">저장</button><button class="btn-red btn-sm edit-btn" onclick="deleteWord('${key}', ${index})">삭제</button>`; listDiv.appendChild(itemDiv);
    });
}
function updateWord(key, index) { const eng = document.getElementById(`edit-eng-${key}-${index}`).value.trim(); const kor = document.getElementById(`edit-kor-${key}-${index}`).value.trim(); db.ref(`learningData/${key}/words/${index}`).update({ eng: eng, kor: kor }); alert('수정 완료!'); }
function deleteWord(key, index) { if(confirm('삭제하시겠습니까?')) { let words = localLearningData[key].words; words.splice(index, 1); db.ref(`learningData/${key}/words`).set(words); } }
function showSelectDataPage(mode) { currentLearnMode = mode; renderStudentDataList(); showPage('student-select-data-page'); }
function renderStudentDataList() {
    const listDiv = document.getElementById('student-data-list'); listDiv.innerHTML = ''; const keys = Object.keys(localLearningData);
    if (keys.length === 0) { listDiv.innerHTML = '<p style="color:#888;">등록된 데이터가 없습니다.</p>'; return; }
    const colors = ['btn-blue', 'btn-green', 'btn-orange', 'btn-purple', 'btn-pink', 'btn-cyan'];
    keys.forEach((key, index) => {
        const btn = document.createElement('button'); btn.className = colors[index % colors.length]; btn.style.marginBottom = '12px';
        btn.innerText = `${localLearningData[key].name} (총 ${localLearningData[key].words ? localLearningData[key].words.length : 0}단어)`;
        btn.onclick = () => selectDatasetForGame(key); listDiv.appendChild(btn);
    });
}
function selectDatasetForGame(key) { currentSelectedData = key; if (currentLearnMode === 'solo') { showPage('student-solo-game-page'); } else { alert('함께하기 목록은 곧 업데이트됩니다!'); } }

// ==========================================
// 🏃‍♂️ 상티런 인게임용 전역 독립 변수 모음
// ==========================================

function openSangtiRunGamePage() {
    if (!currentSelectedData || !localLearningData[currentSelectedData]) {
        alert("학습 내용을 먼저 선택해 주세요! ✏️");
        showPage('student-select-data-page');
        return;
    }
    
    const selectedSet = localLearningData[currentSelectedData];
    if (!selectedSet.words || selectedSet.words.length === 0) {
        alert("선택한 단어장에 단어가 존재하지 않습니다.");
        return;
    }
    
    runWords = selectedSet.words.map(w => ({ eng: String(w.eng), kor: String(w.kor) }));
    
    // 🛠️ 1번 수정 반영: 상티런 페이지가 열릴 때, 메인 플랫폼의 배경과 테두리를 투명하게 지우는 game-mode 클래스 부여
    document.querySelector('.container').classList.add('game-mode');
    
    resetSangtiRunEngineUI();
    showPage('sangtirun-page');
    updateSangtiRunScale();
    requestAnimationFrame(runLoopEngine); // 버그7 수정: 페이지 진입 시 rAF 루프 재시작

    // 🛠️ ResizeObserver로 game-wrapper의 실제 크기 변화를 감시한다.
    // 레이아웃이 자리잡는 동안에도 wrapper 크기가 바뀔 때마다
    // 스케일이 자동으로 다시 계산되므로, 첫 진입 시 배경이 꽉 차지 않던 문제가 해결된다.
    startSangtiRunResizeObserver();

    setTimeout(() => {
        RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
        document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
        
        const charWrapper = document.getElementById("charWrapper");
        const charImg = document.getElementById("character");
        
        if(charWrapper && charImg) {
            runCharW = charImg.offsetWidth || charWrapper.offsetWidth;
            runCharH = charImg.offsetHeight || charWrapper.offsetHeight;
            runPlayerY = (RUN_WORLD_HEIGHT / 2) - (runCharH / 2);
            charWrapper.style.transform = `translate(${RUN_CHAR_X}px, ${runPlayerY}px)`;
            
            runCameraY = (runPlayerY + (runCharH / 2)) - (RUN_BASE_HEIGHT / 2);
            let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
            runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
            document.getElementById("world").style.transform = `translateY(${-runCameraY}px)`;
        }
    }, 50);
}

function exitSangtiRunGamePage() {
    if (runGameStarted) endSangtiRunGame();

    // 🛠️ 게임 페이지를 떠날 때 옵저버를 해제해 불필요한 계산을 막는다.
    stopSangtiRunResizeObserver();

    // 🛠️ 1번 수정 반영: 게임에서 나갈 때 다시 원래의 메인 플랫폼 디자인으로 복구
    document.querySelector('.container').classList.remove('game-mode');
    
    showPage('student-solo-game-page');
}

function updateSangtiRunScale() {
    const wrapper = document.getElementById("game-wrapper");
    const gameCanvas = document.getElementById("game");
    if (!wrapper || !gameCanvas) return;
    const currentScale = wrapper.clientWidth / RUN_BASE_WIDTH;
    gameCanvas.style.setProperty('--game-scale', currentScale);
}

// 🛠️ game-wrapper의 크기가 바뀔 때마다 updateSangtiRunScale()을 호출하는 옵저버를 시작한다.
function startSangtiRunResizeObserver() {
    const wrapper = document.getElementById("game-wrapper");
    if (!wrapper || typeof ResizeObserver === 'undefined') return;

    // 기존 옵저버가 남아 있으면 먼저 정리
    stopSangtiRunResizeObserver();

    runResizeObserver = new ResizeObserver(() => {
        updateSangtiRunScale();
    });
    runResizeObserver.observe(wrapper);
}

// 🛠️ 옵저버 해제
function stopSangtiRunResizeObserver() {
    if (runResizeObserver) {
        runResizeObserver.disconnect();
        runResizeObserver = null;
    }
}

function resetSangtiRunEngineUI() {
    document.getElementById("score").textContent = "0";

    // 🛠️ 2번 수정 반영: 페이지 진입 시 시작 대기 오버레이를 보여주고, 종료 오버레이는 숨김
    document.getElementById("gameOver").classList.remove("show");
    document.getElementById("runStartOverlay").classList.add("show");
    document.getElementById("result").innerHTML = "";
    
    document.getElementById("characterBubbleWrapper").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    
    const charImg = document.getElementById("character");
    charImg.classList.remove("red-tint", "shake");
    charImg.src = originalCharacterSrc;
    
    const bgEl = document.getElementById("bg-layer");
    bgEl.classList.remove("bg-shake");
    
    runBgX = 0;
    // 🛠️ 2번 수정 반영: 시작할 때 배경이 점프하지 않도록, 대기화면의 배경 Y좌표를 처음부터 카메라 기준(50%)으로 세팅
    bgEl.style.backgroundPosition = "0px 50%";

    runMonsters.forEach(m => { m.wrapper.remove(); m.bWrapper.remove(); });
    runMonsters = [];
    runActiveCoins.forEach(c => c.remove());
    runActiveCoins = [];
}

function setRunCharacterWord(isFirstTime = false){
    if(runWords.length === 0) return;
    let aliveMonsters = runMonsters.filter(m => !m.dead && m.x > -50);
    if (!isFirstTime && aliveMonsters.length > 0) {
        let candidates = aliveMonsters.filter(m => m.bubble.textContent !== currentRunWord.kor);
        if(candidates.length > 0) {
            let randomMonster = candidates[Math.floor(Math.random() * candidates.length)];
            currentRunWord = runWords.find(w => w.kor === randomMonster.bubble.textContent) || runWords[Math.floor(Math.random()*runWords.length)];
        } else { currentRunWord = runWords[Math.floor(Math.random()*runWords.length)]; }
    } else { currentRunWord = runWords[Math.floor(Math.random()*runWords.length)]; }

    const bubble = document.getElementById("characterBubble");
    const bubbleWrapper = document.getElementById("characterBubbleWrapper");
    
    bubble.textContent = currentRunWord.eng;
    
    if(!isFirstTime) {
        bubble.classList.remove("bubble-pop");
        void bubble.offsetWidth; 
        bubble.classList.add("bubble-pop");
    }
    
    setTimeout(() => { runCharBubbleW = bubbleWrapper.offsetWidth; }, 0);
}

function updateRunTimerUI() {
    const bar = document.getElementById("timer-bar");
    let percentage = (runTimeLeft / RUN_MAX_TIME) * 100;
    bar.style.width = Math.max(0, Math.min(100, percentage)) + "%";
    bar.style.backgroundColor = runTimeLeft <= 10 ? "#ff4757" : "#2ed573";
}

function spawnRunMonster(){
    if(runWords.length === 0 || !runGameStarted) return;
    let spawnGroupHasCorrect = Math.random() < 0.5;
    let correctIndex = spawnGroupHasCorrect ? Math.floor(Math.random() * 2) : -1;

    for (let i = 0; i < 2; i++) {
        const mWrapper = document.createElement("div");
        mWrapper.className = "monster-wrapper";
        mWrapper.style.opacity = "0";

        const monsterImg = document.createElement("img");
        let monsterNum = Math.floor(Math.random() * 9) * 2 + 1;
        monsterImg.src = "swimmonster" + monsterNum + ".gif";
        monsterImg.className = "monster-img"; 
        mWrapper.appendChild(monsterImg);

        const bWrapper = document.createElement("div");
        bWrapper.className = "bubble-wrapper";
        bWrapper.style.opacity = "0";

        const bubbleContent = document.createElement("div");
        bubbleContent.className = "bubble"; 
        let isCorrect = (i === correctIndex);
        let word = isCorrect ? currentRunWord : (runWords.filter(w=>w.kor!==currentRunWord.kor)[Math.floor(Math.random()*(runWords.length-1))] || currentRunWord);
        bubbleContent.textContent = word.kor;
        bWrapper.appendChild(bubbleContent);
        
        let y, startX; let isValidPosition = false; let attempts = 0;

        // 🛠️ 초기버전 복원: 몹이 화면 오른쪽 끝에서만 나오지 않고,
        // 게임 화면 가로 범위 전체(0 ~ 화면너비+100) 어디서든 랜덤하게 스폰되도록 변경
        while (!isValidPosition && attempts < 20) {
            startX = Math.random() * (RUN_BASE_WIDTH + 100);
            y = (RUN_BASE_HEIGHT * 0.1) + Math.random() * (RUN_WORLD_HEIGHT - (RUN_BASE_HEIGHT * 0.3));
            isValidPosition = true;
            let charDist = Math.sqrt(Math.pow(startX - RUN_CHAR_X, 2) + Math.pow(y - runPlayerY, 2));
            if(charDist < RUN_BASE_WIDTH * 0.25) { isValidPosition = false; attempts++; continue; }
            for (let j = 0; j < runMonsters.length; j++) {
                if (runMonsters[j].dead) continue;
                if (Math.sqrt(Math.pow(startX - runMonsters[j].x, 2) + Math.pow(y - runMonsters[j].y, 2)) < RUN_BASE_WIDTH * 0.15) { isValidPosition = false; break; }
            }
            attempts++;
        }

        mWrapper.style.transform = `translate(${startX}px, ${y}px)`;
        const wDiv = document.getElementById("world");
        wDiv.appendChild(mWrapper); 
        wDiv.appendChild(bWrapper);
        
        setTimeout(() => { mWrapper.style.opacity = "1"; bWrapper.style.opacity = "1"; }, 50);

        runMonsters.push({ 
            wrapper: mWrapper, img: monsterImg, 
            bWrapper: bWrapper, bubble: bubbleContent, 
            x: startX, y: y, dead: false, speed: 2.0 + (Math.random() * 1.5), 
            spawnedTime: Date.now(), monsterNum: monsterNum, 
            w: 0, h: 0, bw: 0, bh: 0 
        });
    }
}

function runCollision(a,b){ return (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }

function startSangtiRunGame() {
    if(runWords.length === 0) return;
    runScore = 0; runCorrectCount = 0; runWrongCount = 0;
    document.getElementById("score").textContent = "0";

    // 🛠️ 2번 수정 반영: 시작 대기 오버레이/종료 오버레이를 모두 숨기고 게임 화면으로 전환
    document.getElementById("runStartOverlay").classList.remove("show");
    document.getElementById("gameOver").classList.remove("show");
    
    document.getElementById("characterBubbleWrapper").style.display = "block";
    document.getElementById("timer-container").style.display = "block";

    runMonsters.forEach(m => { m.wrapper.remove(); m.bWrapper.remove(); }); 
    runMonsters = [];
    runActiveCoins.forEach(c => c.remove()); 
    runActiveCoins = [];

    RUN_WORLD_HEIGHT = RUN_BASE_HEIGHT * 2.5;
    document.getElementById("world").style.height = RUN_WORLD_HEIGHT + "px";
    
    runPlayerY = (RUN_WORLD_HEIGHT / 2) - (runCharH / 2);
    runVelocity = 0; runIsPressing = false; runBgX = 0;

    setRunCharacterWord(true);
    runGameStarted = true; runTimeLeft = RUN_MAX_TIME; updateRunTimerUI();
    runLastTime = 0; 

    clearInterval(runTimerInterval); clearInterval(runSpawnInterval);
    runSpawnInterval = setInterval(spawnRunMonster, 750);
    runTimerInterval = setInterval(() => {
        runTimeLeft -= 0.1; updateRunTimerUI();
        if (runTimeLeft <= 0) { runTimeLeft = 0; endSangtiRunGame(); }
    }, 100);
}

function endSangtiRunGame(){
    if(!runGameStarted) return;
    runGameStarted = false;
    clearInterval(runSpawnInterval); clearInterval(runTimerInterval);
    if (runAvatarChangeTimeout) clearTimeout(runAvatarChangeTimeout);

    document.getElementById("characterBubbleWrapper").style.display = "none";
    document.getElementById("timer-container").style.display = "none";
    
    const charImg = document.getElementById("character");
    charImg.src = originalCharacterSrc; 
    charImg.classList.remove("red-tint", "shake");
    document.getElementById("bg-layer").classList.remove("bg-shake");

    // 🛠️ 2번 수정 반영: 게임 종료와 동시에 결과(점수/정답/오답)를 다시하기·이전으로 버튼과 함께 바로 표시
    document.getElementById("result").innerHTML = `🏆 점수 : ${runScore} 점<br>⭕ 정답 : ${runCorrectCount} 개<br>❌ 오답 : ${runWrongCount} 개`;

    document.getElementById("gameOver").classList.add("show");
}

function runLoopEngine(timestamp) {
    if (!runLastTime) runLastTime = timestamp;
    let dt = (timestamp - runLastTime) / 16.666; 
    runLastTime = timestamp;
    if (dt > 3) dt = 3; 

    if(runGameStarted) {
        const charWrapper = document.getElementById("charWrapper");
        const charImg = document.getElementById("character");
        const bubbleWrapper = document.getElementById("characterBubbleWrapper");
        const worldEl = document.getElementById("world");
        const bgEl = document.getElementById("bg-layer");
        const timerContainer = document.getElementById("timer-container");

        runVelocity += runIsPressing ? (-0.3 * dt) : (0.15 * dt);
        if (runVelocity < -4) runVelocity = -4; if (runVelocity > 3) runVelocity = 3;
        runPlayerY += runVelocity * dt;

        if(runPlayerY < -runCharH || runPlayerY > RUN_WORLD_HEIGHT) endSangtiRunGame();

        runCameraY = (runPlayerY + (runCharH / 2)) - (RUN_BASE_HEIGHT / 2);
        let maxCamY = RUN_WORLD_HEIGHT - RUN_BASE_HEIGHT;
        runCameraY = Math.max(0, Math.min(maxCamY, runCameraY));
        worldEl.style.transform = `translateY(${-runCameraY}px)`;

        runBgX -= 2 * dt;
        bgEl.style.backgroundPosition = `${runBgX}px ${maxCamY > 0 ? (runCameraY / maxCamY) * 100 : 0}%`;
        
        charWrapper.style.transform = `translate(${RUN_CHAR_X}px, ${runPlayerY}px)`;
        let cbX = RUN_CHAR_X + (runCharW / 2) - (runCharBubbleW / 2);
        let cbY = runPlayerY + runCharH + 2;
        bubbleWrapper.style.transform = `translate(${cbX}px, ${cbY}px)`;

        runActiveCoins.forEach(coin => { coin.style.top = (runPlayerY + parseFloat(coin.dataset.offsetY)) + "px"; });

        runMonsters.forEach(m => {
            // dead 상태여도 wrapper는 500ms 후 remove() 예약됐으므로 transform 업데이트는 계속
            if (m.w === 0) m.w = m.wrapper.offsetWidth;
            if (m.h === 0) m.h = m.wrapper.offsetHeight;
            if (m.bw === 0) m.bw = m.bWrapper.offsetWidth;
            if (m.bh === 0) m.bh = m.bWrapper.offsetHeight;

            m.x -= m.speed * dt;
            m.wrapper.style.transform = `translate(${m.x}px, ${m.y}px)`;
            
            let bx = m.x + (m.w / 2) - (m.bw / 2);
            let by = m.y + m.h + 2;
            m.bWrapper.style.transform = `translate(${bx}px, ${by}px)`;

            if(m.dead || Date.now() - m.spawnedTime < 500) return;

            let hit = false;
            if(m.w > 0 && runCharW > 0) {
                hit = runCollision(
                    { left: RUN_CHAR_X + runCharW*0.15, right: RUN_CHAR_X + runCharW*0.85, top: runPlayerY + runCharH*0.15, bottom: runPlayerY + runCharH*0.85 },
                    { left: m.x + m.w*0.15, right: m.x + m.w*0.85, top: m.y + m.h*0.15, bottom: m.y + m.h*0.85 }
                );
            }

            if(hit){
                m.dead = true; if (runAvatarChangeTimeout) clearTimeout(runAvatarChangeTimeout);
                timerContainer.classList.remove("timer-add", "timer-sub"); void timerContainer.offsetWidth;

                if(m.bubble.textContent === currentRunWord.kor){
                    runScore += 10; runCorrectCount++; runTimeLeft = Math.min(RUN_MAX_TIME, runTimeLeft + 6); updateRunTimerUI();
                    timerContainer.classList.add("timer-add"); 
                    
                    charImg.src = "swimcharacter2.gif";
                    m.img.src = "swimmonster" + (m.monsterNum + 1) + ".gif"; 
                    m.img.classList.add("shake");

                    const coin = document.createElement("img"); coin.src = "swimcoin.gif"; coin.className = "coin-effect";
                    coin.style.left = (RUN_CHAR_X + (runCharW / 2)) + "px"; coin.dataset.offsetY = "15"; coin.style.top = (runPlayerY + 15) + "px";
                    worldEl.appendChild(coin); runActiveCoins.push(coin);
                    setTimeout(() => { coin.remove(); runActiveCoins = runActiveCoins.filter(c => c !== coin); }, 500);
                    
                    setRunCharacterWord();
                } else {
                    runScore -= 10; runWrongCount++; runTimeLeft = Math.max(0, runTimeLeft - 3); updateRunTimerUI();
                    timerContainer.classList.add("timer-sub"); 
                    
                    charImg.src = "swimcharacter3.gif"; charImg.classList.add("red-tint");
                    m.img.src = "swimmonster" + (m.monsterNum + 1) + ".gif";
                    
                    charImg.classList.remove("shake"); void charImg.offsetWidth; charImg.classList.add("shake");
                    
                    bgEl.classList.remove("bg-shake"); void bgEl.offsetWidth; bgEl.classList.add("bg-shake");
                    setTimeout(() => charImg.classList.remove("red-tint"), 300);
                }
                runAvatarChangeTimeout = setTimeout(() => { charImg.src = originalCharacterSrc; }, 800);
                document.getElementById("score").textContent = runScore;
                
                // 500ms 후 DOM 제거 + 배열에서도 제거
                setTimeout(() => { m.wrapper.remove(); m.bWrapper.remove(); runMonsters = runMonsters.filter(x => x !== m); }, 500);
            }
            // 화면 왼쪽 밖으로 나간 몬스터: dead가 아닌 것만 제거 (dead는 위의 setTimeout에서 처리)
            if(m.x < -200 && !m.dead){ m.wrapper.remove(); m.bWrapper.remove(); runMonsters = runMonsters.filter(x => x !== m); }
        });
    }
    if (runGameStarted || document.getElementById('sangtirun-page').classList.contains('active')) {
        requestAnimationFrame(runLoopEngine);
    }
}

document.addEventListener("keydown", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) { e.preventDefault(); runIsPressing = true; } });
document.addEventListener("keyup", e => { if (e.code === "Space" && document.getElementById('sangtirun-page').classList.contains('active')) runIsPressing = false; });
document.addEventListener("mousedown", () => { if(document.getElementById('sangtirun-page').classList.contains('active')) runIsPressing = true; });
document.addEventListener("mouseup", () => { runIsPressing = false; });

document.addEventListener("touchstart", (e) => { 
    if (document.getElementById('sangtirun-page').classList.contains('active') && e.target.closest('#game-wrapper')) {
        runIsPressing = true; 
    }
}, { passive: true });
document.addEventListener("touchend", () => { runIsPressing = false; });

document.addEventListener("touchcancel", () => { runIsPressing = false; });
window.addEventListener("blur", () => { runIsPressing = false; });
document.addEventListener("visibilitychange", () => { if (document.hidden) runIsPressing = false; });

window.addEventListener("resize", () => { if (document.getElementById('sangtirun-page').classList.contains('active')) updateSangtiRunScale(); });

// rAF 루프는 openSangtiRunGamePage() 진입 시에만 시작 (앱 로드 시 자동 실행 제거 — 이중 루프 방지)
// ==========================================
// ⚔️ 몬스터 헌터 — 아바타 월드 통합 모듈
// (hunt.js 전체를 mh_ 네임스페이스로 격리)
// ==========================================

// ── DOM 레퍼런스 (게임 진입 시 초기화) ──────────────
let mhGameWrapper    = null;
let mhGameCanvas     = null;
let mhStartScreen    = null;
let mhGameoverScreen = null;
let mhPlayerImg      = null;
let mhPlayerEffect   = null;
let mhScoreDisplay   = null;
let mhFinalScore     = null;
let mhUltimateBtn    = null;
let mhQuizPanel      = null;
let mhQuizWord       = null;
let mhQuizChoices    = null;
let mhQuizBtns       = null;
let mhUltimateIconColor = null;

// ── 학습 데이터 ────────────────────────────────────
let mhWordList     = [];
let mhQuizQueue    = [];
let mhCurrentQuiz  = null;
let mhQuizAnswered = false;

// ── 게임 상태 ──────────────────────────────────────
const MH_GAME_BASE_WIDTH = 800;
let mhScore          = 0;
let mhCorrectCount   = 0;
let mhWrongCount     = 0;
let mhMonsters       = [];
let mhProjectiles    = [];
let mhIsAttacking    = false;
let mhIsGameStarted  = false;
let mhIsGameOver     = false;
let mhSpawnInterval  = 1000;
let mhSpawnTimer     = null;
let mhMoveTimer      = null;
let mhCollisionTimer = null;
let mhSkillTimer     = null; // 스킬 발사체 지연 setTimeout 취소용
let mhAttackTimer    = null; // 스킬/궁극기 isAttacking 복귀 타이머
let mhUltTimer1      = null; // 궁극기 발사체 타이머
let mhUltTimer2      = null; // 궁극기 isAttacking 복귀 타이머
let mhLoopId         = 0;    // rAF 루프 세대 번호 — 재시작 시 증가해 이전 루프 자동 종료
let mhResizeObserver = null;

// ── 궁극기 ────────────────────────────────────────
const MH_ULTIMATE_MAX  = 10;
let mhUltimateCharge   = 0;
let mhIsUltimateReady  = false;

// ── 물리 상수 ─────────────────────────────────────
const MH_GRAVITY    = 0.5;
const MH_JUMP_FORCE = -8;
const MH_GROUND_Y   = 0;
const MH_MAX_MONSTERS   = 5;
const MH_PLAYER_LEFT    = 50;
const MH_PLAYER_WIDTH   = 47;
const MH_MONSTER_HIT_W  = 40;

const MH_MONSTER_TYPES = [
    { walk: 'huntmonster1.gif',  idle: 'huntmonster2.gif',  hit: 'huntmonster3.png',  die: 'huntmonster4.gif' },
    { walk: 'huntmonster5.gif',  idle: 'huntmonster6.gif',  hit: 'huntmonster7.png',  die: 'huntmonster8.gif' },
    { walk: 'huntmonster9.gif',  idle: 'huntmonster10.gif', hit: 'huntmonster11.png', die: 'huntmonster12.gif' },
];

// =====================================================
//  진입 / 퇴장
// =====================================================
function openMonsterHunterPage() {
    if (!currentSelectedData || !localLearningData[currentSelectedData]) {
        alert("학습 내용을 먼저 선택해 주세요! ✏️");
        showPage('student-select-data-page');
        return;
    }
    const selectedSet = localLearningData[currentSelectedData];
    if (!selectedSet.words || selectedSet.words.length === 0) {
        alert("선택한 단어장에 단어가 존재하지 않습니다.");
        return;
    }

    // 아바타 월드 학습 데이터를 hunt.js 형식({ en, ko })으로 변환
    mhWordList = selectedSet.words.map(w => ({ en: String(w.eng), ko: String(w.kor) }));

    document.querySelector('.container').classList.add('game-mode');
    showPage('monsterhunter-page');  // 먼저 페이지를 보여야 DOM 크기가 잡힘

    mhInitDom();       // DOM 레퍼런스 수집 + 이벤트 등록
    mhResetUI();       // 오버레이·점수 초기화
    mhStartResizeObserver();  // ResizeObserver 시작

    // ResizeObserver 첫 콜백이 오기 전에도 올바른 scale 적용
    setTimeout(() => mhUpdateScale(), 0);
}

function exitMonsterHunterPage() {
    mhForceStop();
    mhStopResizeObserver();
    document.querySelector('.container').classList.remove('game-mode');
    showPage('student-solo-game-page');
}

// =====================================================
//  DOM 레퍼런스 수집 (페이지 진입 시 1회)
// =====================================================
function mhInitDom() {
    mhGameWrapper    = document.getElementById('mh-game-wrapper');
    mhGameCanvas     = document.getElementById('mh-game-canvas');
    mhStartScreen    = document.getElementById('mh-start-screen');
    mhGameoverScreen = document.getElementById('mh-gameover-screen');
    mhPlayerImg      = document.getElementById('mh-player-img');
    mhPlayerEffect   = document.getElementById('mh-player-effect');
    mhScoreDisplay   = document.getElementById('mh-score-display');
    mhFinalScore     = document.getElementById('mh-final-score');
    mhUltimateBtn    = document.getElementById('mh-ultimate-btn');
    mhQuizPanel      = document.getElementById('mh-quiz-panel');
    mhQuizWord       = document.getElementById('mh-quiz-word');
    mhQuizChoices    = document.getElementById('mh-quiz-choices');
    mhQuizBtns       = document.querySelectorAll('.mh-quiz-btn');
    mhUltimateIconColor = document.getElementById('mh-ultimate-icon-color');

    // 퀴즈 버튼 이벤트 (중복 방지: 기존 리스너 제거 후 재등록)
    mhQuizBtns.forEach((btn, i) => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    mhQuizBtns = document.querySelectorAll('.mh-quiz-btn');
    mhQuizBtns.forEach((btn, i) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); mhHandleQuizAnswer(i); });
        btn.addEventListener('touchstart', (e) => { e.stopPropagation(); }, { passive: true });
    });

    // 궁극기 버튼 — cloneNode로 기존 리스너 완전 제거 후 재등록 (버그4 수정)
    const oldUltBtn = mhUltimateBtn;
    const newUltBtn = oldUltBtn.cloneNode(true);
    oldUltBtn.parentNode.replaceChild(newUltBtn, oldUltBtn);
    mhUltimateBtn = newUltBtn;
    mhUltimateIconColor = document.getElementById('mh-ultimate-icon-color'); // cloneNode 후 재참조
    mhUltimateBtn.addEventListener('click', (e) => { e.stopPropagation(); mhUseUltimate(); });
    mhUltimateBtn.addEventListener('touchend', (e) => { e.stopPropagation(); mhUseUltimate(); }, { passive: true });

    // 게임 래퍼 — cloneNode로 기존 리스너 완전 제거 후 재등록 (버그4 수정)
    const oldWrapper = mhGameWrapper;
    const newWrapper = oldWrapper.cloneNode(false); // 자식은 유지해야 하므로 얕은 복사 불가 → 이벤트만 제거
    // cloneNode(false)는 자식을 잃으므로 대신 AbortController 패턴 사용
    if (mhGameWrapper._mhAbort) mhGameWrapper._mhAbort.abort();
    const mhAbort = new AbortController();
    mhGameWrapper._mhAbort = mhAbort;
    const sig = mhAbort.signal;
    mhGameWrapper.addEventListener('mousedown', (e) => {
        if (e.target.closest('.mh-overlay-box')) return;
        if (e.target.closest('#mh-quiz-panel')) return;
        if (e.target.closest('#mh-ultimate-btn-wrap')) return;
        if (!mhIsGameStarted || mhIsGameOver) return; // 버그6 수정: 게임 미시작 상태에서 스킬 발동 차단
        if (mhWordList.length < 4) mhUseSkill();
    }, { signal: sig });
    mhGameWrapper.addEventListener('touchstart', (e) => {
        if (e.target.closest('.mh-overlay-box')) return;
        if (e.target.closest('#mh-quiz-panel')) return;
        if (e.target.closest('#mh-ultimate-btn-wrap')) return;
        e.preventDefault();
        if (!mhIsGameStarted || mhIsGameOver) return; // 버그6 수정
        if (mhWordList.length < 4) mhUseSkill();
    }, { passive: false, signal: sig });
}

// =====================================================
//  스케일링 (상티런과 동일 패턴 + 퀴즈 패널 비례 조정)
// =====================================================
function mhUpdateScale() {
    if (!mhGameWrapper || !mhGameCanvas) return;
    const w = mhGameWrapper.clientWidth;
    const s = w / MH_GAME_BASE_WIDTH;
    mhGameCanvas.style.setProperty('--mh-scale', s);

    // 퀴즈 패널
    if (mhQuizPanel) {
        mhQuizPanel.style.top          = (50 * s) + 'px';
        mhQuizPanel.style.width        = (340 * s) + 'px';
        mhQuizPanel.style.padding      = (8 * s) + 'px ' + (16 * s) + 'px';
        mhQuizPanel.style.borderRadius = (14 * s) + 'px';
        if (mhQuizWord) mhQuizWord.style.fontSize = (24 * s) + 'px';
    }
    // 보기 버튼 줄
    if (mhQuizChoices) {
        mhQuizChoices.style.bottom = (5 * s) + 'px';
        mhQuizChoices.style.left   = (8 * s) + 'px';
        mhQuizChoices.style.width  = (724 * s) + 'px';
        mhQuizChoices.style.gap    = (8 * s) + 'px';
        if (mhQuizBtns) {
            mhQuizBtns.forEach(btn => {
                btn.style.fontSize     = (14 * s) + 'px';
                btn.style.padding      = (8 * s) + 'px ' + (4 * s) + 'px';
                btn.style.height       = (52 * s) + 'px';
                btn.style.borderRadius = (10 * s) + 'px';
            });
        }
    }
    // 궁극기 버튼
    const ultimateBtnWrap = document.getElementById('mh-ultimate-btn-wrap');
    if (ultimateBtnWrap && mhUltimateBtn) {
        ultimateBtnWrap.style.bottom       = (5 * s) + 'px';
        ultimateBtnWrap.style.right        = (8 * s) + 'px';
        ultimateBtnWrap.style.width        = (52 * s) + 'px';
        mhUltimateBtn.style.borderRadius   = (10 * s) + 'px';
        mhUltimateBtn.style.padding        = '0';
        const iconWrap = document.getElementById('mh-ultimate-icon-wrap');
        if (iconWrap) {
            const iconSize = (52 * s) + 'px';
            iconWrap.style.width  = iconSize;
            iconWrap.style.height = iconSize;
        }
    }
}

function mhStartResizeObserver() {
    if (!mhGameWrapper || typeof ResizeObserver === 'undefined') return;
    mhStopResizeObserver();
    mhResizeObserver = new ResizeObserver(() => mhUpdateScale());
    mhResizeObserver.observe(mhGameWrapper);
}

function mhStopResizeObserver() {
    if (mhResizeObserver) { mhResizeObserver.disconnect(); mhResizeObserver = null; }
}

window.addEventListener('resize', () => {
    if (document.getElementById('monsterhunter-page') &&
        document.getElementById('monsterhunter-page').classList.contains('active')) {
        mhUpdateScale();
    }
});

// =====================================================
//  UI 초기화 / 강제 정지
// =====================================================
function mhResetUI() {
    if (!mhStartScreen) return;
    mhStartScreen.classList.add('show');
    mhGameoverScreen.classList.remove('show');
    if (mhQuizPanel)   mhQuizPanel.style.display   = 'none';
    if (mhQuizChoices) mhQuizChoices.style.display  = 'none';
    mhScoreDisplay.textContent = '0';
    mhPlayerImg.src = 'huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhResetUltimateGauge();
}

function mhForceStop() {
    mhLoopId++;                          // 이전 rAF 루프 세대 무효화
    clearTimeout(mhSpawnTimer);
    clearTimeout(mhCollisionTimer);
    clearTimeout(mhSkillTimer);
    clearTimeout(mhAttackTimer);
    clearTimeout(mhUltTimer1);
    clearTimeout(mhUltTimer2);
    cancelAnimationFrame(mhMoveTimer);
    mhMonsters.forEach(m => {
        clearTimeout(m.jumpTimer);
        clearTimeout(m.stopTimer);
        clearTimeout(m.dieTimer);
        if (m.element) m.element.remove();
        if (m.effect)  m.effect.remove();
    });
    mhMonsters = [];
    mhProjectiles.forEach(p => { if (p.element) p.element.remove(); });
    mhProjectiles = [];
    mhIsAttacking   = false;
    mhIsGameStarted = false;
    mhIsGameOver    = false;
    mhSpawnInterval = 1000;
}

// =====================================================
//  퀴즈 로직 (hunt.js 원본과 동일, mh_ 접두사)
// =====================================================
function mhBuildQuizQueue() {
    mhQuizQueue = shuffleArray([...Array(mhWordList.length).keys()]);
}

function mhNextQuiz() {
    if (mhWordList.length < 4) return;
    if (mhQuizQueue.length === 0) mhBuildQuizQueue();

    const idx     = mhQuizQueue.pop();
    const correct = mhWordList[idx];
    const pool    = mhWordList.filter((_, i) => i !== idx);
    const distractors = shuffleArray(pool).slice(0, 3).map(w => w.ko);
    const choices     = shuffleArray([correct.ko, ...distractors]);
    const answerIdx   = choices.indexOf(correct.ko);

    mhCurrentQuiz  = { en: correct.en, ko: correct.ko, choices, answerIdx };
    mhQuizAnswered = false;

    mhQuizWord.textContent = correct.en;
    mhQuizBtns.forEach((btn, i) => {
        btn.textContent = choices[i];
        btn.className   = 'mh-quiz-btn';
        btn.disabled    = false;
    });

    // 버튼 폰트 크기 자동 조절 (hunt.js nextQuiz 원본 로직)
    const s             = mhGameWrapper.getBoundingClientRect().width / MH_GAME_BASE_WIDTH;
    const baseFontSize  = 14 * s;
    const minFontSize   = baseFontSize * 0.55;
    const estimatedWidth = (760 * s - 8 * s * 3) / 4 - 8 * s * 2;
    const tempCanvas = document.createElement('canvas');
    const ctx        = tempCanvas.getContext('2d');
    mhQuizBtns.forEach(btn => {
        let fontSize = baseFontSize;
        ctx.font = `${fontSize}px Jua, sans-serif`;
        while (ctx.measureText(btn.textContent).width > estimatedWidth && fontSize > minFontSize) {
            fontSize -= 0.5;
            ctx.font = `${fontSize}px Jua, sans-serif`;
        }
        btn.style.fontSize = fontSize + 'px';
    });
}

function mhHandleQuizAnswer(selectedIdx) {
    if (mhQuizAnswered || !mhCurrentQuiz || !mhIsGameStarted || mhIsGameOver) return;
    mhQuizAnswered = true;
    mhQuizBtns.forEach(btn => btn.disabled = true);

    if (selectedIdx === mhCurrentQuiz.answerIdx) {
        mhCorrectCount++;
        mhQuizBtns[selectedIdx].classList.add('correct');
        mhUseSkill();
        setTimeout(() => mhNextQuiz(), 300);
    } else {
        mhWrongCount++;
        mhQuizBtns[selectedIdx].classList.add('wrong');
        mhQuizBtns[mhCurrentQuiz.answerIdx].classList.add('correct');
        setTimeout(() => mhNextQuiz(), 600);
    }
}

// =====================================================
//  게임 시작 / 재시작
// =====================================================
function startMonsterHunterGame() {
    // mhInitDom()은 openMonsterHunterPage() 진입 시 1회만 호출 — 여기서 재호출하면 이벤트 리스너 중복 등록됨
    if (!mhGameWrapper) mhInitDom(); // 혹시 직접 호출된 경우만 보호
    mhForceStop();

    // GIF 사전 로드 — 캐시에 올려둬서 이펙트 첫 번째부터 즉시 재생
    [
        'huntskill1.gif', 'huntskill2.gif', 'huntskill3.gif',
        'huntskill4.gif', 'huntskill5.gif', 'huntskill6.gif',
        'huntcharacter2.gif',
        'huntmonster1.gif',  'huntmonster2.gif',  'huntmonster3.png',
        'huntmonster4.gif',  'huntmonster5.gif',  'huntmonster6.gif',
        'huntmonster7.png',  'huntmonster8.gif',  'huntmonster9.gif',
        'huntmonster10.gif', 'huntmonster11.png', 'huntmonster12.gif'
    ].forEach(src => { new Image().src = src; });

    mhScore         = 0;
    mhCorrectCount  = 0;
    mhWrongCount    = 0;
    mhIsAttacking   = false;
    mhIsGameOver    = false;
    mhIsGameStarted = true;
    mhSpawnInterval = 1000;
    mhScoreDisplay.textContent = '0';
    mhResetUltimateGauge();

    mhPlayerImg.src = 'huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';

    mhStartScreen.classList.remove('show');
    mhGameoverScreen.classList.remove('show');

    if (mhWordList.length >= 4) {
        mhBuildQuizQueue();
        mhQuizPanel.style.display   = 'block';
        mhQuizChoices.style.display = 'flex';
        mhNextQuiz();
    }

    mhSpawnTimer    = setTimeout(mhSpawnMonster, mhSpawnInterval);
    mhMoveMonsters();
    mhCollisionTimer = setTimeout(mhCheckCollision, 500);
}

function resetMonsterHunterGame() {
    mhForceStop();

    mhScore         = 0;
    mhCorrectCount  = 0;
    mhWrongCount    = 0;
    mhIsAttacking   = false;
    mhIsGameOver    = false;
    mhIsGameStarted = true;
    mhSpawnInterval = 1000;
    mhScoreDisplay.textContent = '0';
    mhResetUltimateGauge();

    mhPlayerImg.src = 'huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhGameoverScreen.classList.remove('show');

    if (mhWordList.length >= 4) {
        mhBuildQuizQueue();
        mhQuizPanel.style.display   = 'block';
        mhQuizChoices.style.display = 'flex';
        mhNextQuiz();
    }

    mhSpawnTimer     = setTimeout(mhSpawnMonster, mhSpawnInterval);
    mhMoveMonsters();
    mhCollisionTimer = setTimeout(mhCheckCollision, 500);
}

// =====================================================
//  점수
// =====================================================
function mhUpdateScore(delta) {
    mhScore += delta;
    if (mhScoreDisplay) mhScoreDisplay.textContent = mhScore;
}

// =====================================================
//  궁극기 게이지
// =====================================================
function mhUpdateUltimateGauge() {
    const pct     = (mhUltimateCharge / MH_ULTIMATE_MAX) * 100;
    const topClip = 100 - pct;
    if (mhUltimateIconColor) {
        mhUltimateIconColor.style.clipPath = `inset(${topClip}% 0% 0% 0%)`;
    }
    if (mhUltimateCharge >= MH_ULTIMATE_MAX && !mhIsUltimateReady) {
        mhIsUltimateReady = true;
        mhUltimateBtn.disabled = false;
        mhUltimateBtn.classList.add('ready');
    }
}

function mhChargeUltimate() {
    if (mhIsUltimateReady) return;
    mhUltimateCharge = Math.min(mhUltimateCharge + 1, MH_ULTIMATE_MAX);
    mhUpdateUltimateGauge();
}

function mhResetUltimateGauge() {
    mhUltimateCharge  = 0;
    mhIsUltimateReady = false;
    if (mhUltimateBtn) {
        mhUltimateBtn.disabled = true;
        mhUltimateBtn.classList.remove('ready');
    }
    if (mhUltimateIconColor) {
        mhUltimateIconColor.style.clipPath = 'inset(100% 0% 0% 0%)';
    }
}

// =====================================================
//  몬스터 스폰
// =====================================================
function mhRefreshGif(el, filename) {
    if (el) el.src = filename + '?t=' + Date.now();
}

function mhSpawnMonster() {
    if (!mhIsGameStarted || mhIsGameOver) return;

    const alive = mhMonsters.filter(m => !m.isDead).length;
    if (alive < MH_MAX_MONSTERS) {
        const wrapper = document.createElement('div');
        wrapper.className = 'mh-character-wrapper';

        const rightmostPos = mhMonsters
            .filter(m => !m.isDead)
            .reduce((max, m) => Math.max(max, m.pos), -Infinity);
        const spawnX = rightmostPos === -Infinity
            ? 800
            : Math.max(800, rightmostPos + 60 + Math.random() * 60);

        wrapper.style.left    = spawnX + 'px';
        wrapper.style.bottom  = '143px';
        wrapper.style.opacity = '0';

        const typeIdx = Math.floor(Math.random() * MH_MONSTER_TYPES.length);
        const mType   = MH_MONSTER_TYPES[typeIdx];

        const mImg = document.createElement('img');
        mhRefreshGif(mImg, mType.walk);

        const mEffect = document.createElement('img');
        mEffect.style.display  = 'none';
        mEffect.style.position = 'absolute';
        mEffect.style.zIndex   = '15';

        wrapper.appendChild(mImg);
        mhGameCanvas.appendChild(wrapper);
        mhGameCanvas.appendChild(mEffect);

        const jumpDelay  = 1000 + Math.random() * 3000;
        const stopTarget = Math.random() < 0.75 ? Math.random() * 800 : -9999;

        mhMonsters.push({
            element: wrapper, img: mImg, effect: mEffect, type: mType,
            pos: spawnX, hp: 2, isDead: false, isHit: false, knockback: 0,
            velY: 0, offsetY: 0, isJumping: false,
            jumpTimer: null, stopTarget, isStopped: false, stopTimer: null, dieTimer: null
        });

        setTimeout(() => { wrapper.style.opacity = '1'; }, 50);

        const m = mhMonsters[mhMonsters.length - 1];
        mhScheduleJump(m, jumpDelay);
    }

    mhSpawnInterval = Math.max(400, mhSpawnInterval * 0.95);
    mhSpawnTimer    = setTimeout(mhSpawnMonster, mhSpawnInterval);
}

function mhScheduleJump(monster, delay) {
    monster.jumpTimer = setTimeout(() => {
        if (!monster.isDead && !monster.isHit && !monster.isStopped && mhIsGameStarted && !mhIsGameOver) {
            mhDoJump(monster);
        }
    }, delay);
}

function mhDoJump(monster) {
    if (monster.isJumping || monster.isDead) return;
    monster.isJumping = true;
    monster.velY = MH_JUMP_FORCE;
}

// =====================================================
//  발사체 이동
// =====================================================
function mhMoveProjectiles() {
    for (let i = mhProjectiles.length - 1; i >= 0; i--) {
        const p = mhProjectiles[i];
        p.x += p.speed;
        p.element.style.left = p.x + 'px';

        if (p.target) {
            if (p.target.isDead) {
                const alreadyTargeted = new Set(
                    mhProjectiles.filter((_, j) => j !== i).map(q => q.target).filter(Boolean)
                );
                p.target = mhMonsters
                    .filter(m => !m.isDead && m.pos >= p.x - 50 && !alreadyTargeted.has(m))
                    .sort((a, b) => a.pos - b.pos)[0] || null;
                continue;
            }
            const targetHitX = p.target.pos + 55;
            if (p.x >= targetHitX) {
                const hit = p.target;
                p.element.remove();
                mhProjectiles.splice(i, 1);
                if (!hit.isDead) mhApplyHit(hit);
            }
        } else {
            if (p.x > 850) { p.element.remove(); mhProjectiles.splice(i, 1); }
        }
    }
}

function mhMoveMonsters() {
    const myLoopId = mhLoopId; // 이 루프가 속한 세대 기억
    function loop() {
        if (myLoopId !== mhLoopId || !mhIsGameStarted) return; // 세대가 바뀌면 즉시 종료
        for (let i = mhMonsters.length - 1; i >= 0; i--) {
            const m = mhMonsters[i];

            if (!m.isDead && !m.isHit) {
                if (!m.isStopped && !m.isJumping && m.pos <= m.stopTarget) {
                    m.isStopped = true;
                    mhRefreshGif(m.img, m.type.idle);
                    const stopDuration = 1000 + Math.random() * 500;
                    m.stopTimer = setTimeout(() => {
                        if (!m.isDead && !m.isHit) {
                            m.isStopped = false;
                            m.stopTarget = Math.random() < 0.75
                                ? m.pos - (80 + Math.random() * 200)
                                : -9999;
                            mhRefreshGif(m.img, m.type.walk);
                        }
                    }, stopDuration);
                }
                if (!m.isStopped) {
                    m.pos -= 1;
                    m.element.style.left = m.pos + 'px';
                }
            } else if (!m.isDead && m.isHit && m.knockback > 0) {
                const step = Math.min(m.knockback, 4);
                m.pos += step;
                m.knockback -= step;
                m.element.style.left = m.pos + 'px';
            }

            if (!m.isDead && m.isJumping) {
                m.velY    += MH_GRAVITY;
                m.offsetY -= m.velY;
                if (m.offsetY <= MH_GROUND_Y) {
                    m.offsetY  = 0; m.velY = 0; m.isJumping = false;
                    mhScheduleJump(m, 1500 + Math.random() * 3000);
                }
                m.element.style.bottom = (143 + m.offsetY) + 'px';
            }

            if (m.pos < -150) {
                clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer); clearTimeout(m.dieTimer);
                m.element.remove(); m.effect.remove();
                mhMonsters.splice(i, 1);
            }
        }

        mhMoveProjectiles();
        mhMoveTimer = requestAnimationFrame(loop);
    }
    loop();
}

// =====================================================
//  충돌 감지
// =====================================================
function mhCheckCollision() {
    clearTimeout(mhCollisionTimer);
    if (!mhIsGameStarted || mhIsGameOver) return;

    for (const m of mhMonsters) {
        if (m.isDead || m.isHit) continue;
        const playerLeft  = MH_PLAYER_LEFT + (150 - MH_PLAYER_WIDTH) / 2;
        const playerRight = playerLeft + MH_PLAYER_WIDTH;
        const mCenter = m.pos + 75;
        const mLeft   = mCenter - MH_MONSTER_HIT_W / 2;
        const mRight  = mCenter + MH_MONSTER_HIT_W / 2;
        if (mLeft < playerRight && mRight > playerLeft) {
            mhTriggerGameOver();
            return;
        }
    }
    mhCollisionTimer = setTimeout(mhCheckCollision, 50);
}

// =====================================================
//  게임오버
// =====================================================
function mhTriggerGameOver() {
    mhIsGameOver    = true;
    mhIsGameStarted = false;
    cancelAnimationFrame(mhMoveTimer);
    clearTimeout(mhSpawnTimer);
    clearTimeout(mhCollisionTimer);
    mhMonsters.forEach(m => {
        clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer); clearTimeout(m.dieTimer);
    });

    if (mhQuizPanel)   mhQuizPanel.style.display   = 'none';
    if (mhQuizChoices) mhQuizChoices.style.display  = 'none';
    mhPlayerImg.src = 'huntcharacter1.gif';
    mhPlayerEffect.style.display = 'none';
    mhResetUltimateGauge();

    mhFinalScore.innerHTML = `🏆 점수 : ${mhScore} 점<br>⭕ 정답 : ${mhCorrectCount} 개<br>❌ 오답 : ${mhWrongCount} 개`;
    mhGameoverScreen.classList.add('show');
}

// =====================================================
//  스킬 — 일반 공격
// =====================================================
function mhUseSkill() {
    if (!mhIsGameStarted || mhIsAttacking || mhIsGameOver) return;
    mhIsAttacking = true;

    mhRefreshGif(mhPlayerImg, 'huntcharacter2.gif');
    mhRefreshGif(mhPlayerEffect, 'huntskill1.gif');
    mhPlayerEffect.style.display = 'block';

    mhAttackTimer = setTimeout(() => {
        mhPlayerImg.src = 'huntcharacter1.gif';
        mhPlayerEffect.style.display = 'none';
        mhIsAttacking = false;
    }, 500);

    mhSkillTimer = setTimeout(() => {
        if (!mhIsGameStarted || mhIsGameOver) return; // 게임 종료 후 발사체 생성 차단
        const alreadyTargeted = new Set(mhProjectiles.map(p => p.target).filter(Boolean));
        let validTargets = mhMonsters
            .filter(m => !m.isDead && m.pos <= 800 && m.pos >= -50 && !alreadyTargeted.has(m));
        validTargets.sort((a, b) => a.pos - b.pos);
        const hitTargets = validTargets.slice(0, 3);
        if (hitTargets.length > 0) {
            hitTargets.forEach(m => mhSpawnProjectile(m));
        } else {
            mhSpawnProjectile(null);
        }
    }, 200);
}

function mhSpawnProjectile(targetMonster) {
    const projImg = document.createElement('img');
    mhRefreshGif(projImg, 'huntskill2.gif');
    projImg.className = 'mh-projectile';
    const startX = 190, startY = 168;
    projImg.style.left   = startX + 'px';
    projImg.style.bottom = startY + 'px';
    mhGameCanvas.appendChild(projImg);
    mhProjectiles.push({ element: projImg, x: startX, y: startY, target: targetMonster, speed: 18 });
}

function mhApplyHit(m) {
    mhRefreshGif(m.effect, 'huntskill3.gif');
    const hitX = m.pos + 55;
    m.effect.style.left      = hitX + 'px';
    m.effect.style.bottom    = '168px';
    m.effect.style.transform = 'translate(-50%, 50%)';
    m.effect.style.display   = 'block';
    setTimeout(() => { m.effect.style.display = 'none'; }, 500);

    m.hp--;
    if (m.hp > 0) {
        m.isHit = true; m.isStopped = false;
        clearTimeout(m.stopTimer);
        m.knockback = 19;
        mhRefreshGif(m.img, m.type.hit);
        setTimeout(() => {
            if (!m.isDead) { m.isHit = false; mhRefreshGif(m.img, m.type.walk); }
        }, 500);
    } else {
        m.isDead = true;
        clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer);
        mhRefreshGif(m.img, m.type.die);
        mhUpdateScore(1);
        mhChargeUltimate();
        setTimeout(() => { m.element.style.opacity = '0'; }, 50);
        m.dieTimer = setTimeout(() => {
            m.element.remove(); m.effect.remove();
            const idx = mhMonsters.indexOf(m);
            if (idx > -1) mhMonsters.splice(idx, 1);
        }, 550);
    }
}

// =====================================================
//  궁극기 — 관통 발사체
// =====================================================
function mhUseUltimate() {
    if (!mhIsGameStarted || mhIsGameOver || !mhIsUltimateReady || mhIsAttacking) return;
    mhIsAttacking = true;
    mhResetUltimateGauge();

    const ultScale  = (186 * 1.8) / 400;
    const ultEffect = document.createElement('img');
    ultEffect.id    = 'mh-ultimate-effect';
    mhRefreshGif(ultEffect, 'huntskill4.gif');
    ultEffect.style.cssText = `position:absolute; bottom:137px; left:50px; z-index:50;
        transform:translate(-77px,127px) scale(${ultScale}); transform-origin:left bottom;`;
    mhGameCanvas.appendChild(ultEffect);

    mhRefreshGif(mhPlayerImg, 'huntcharacter2.gif');
    mhPlayerEffect.style.display = 'none';

    mhUltTimer1 = setTimeout(() => { mhSpawnUltimateProjectile(); }, 550);

    mhUltTimer2 = setTimeout(() => {
        mhPlayerImg.src = 'huntcharacter1.gif';
        if (ultEffect.parentNode) ultEffect.remove();
        mhIsAttacking = false;
    }, 980);
}

function mhSpawnUltimateProjectile() {
    const projImg = document.createElement('img');
    mhRefreshGif(projImg, 'huntskill5.gif');
    projImg.className = 'mh-projectile';
    projImg.style.zIndex = '50';
    const startX = 190, startY = 168;
    projImg.style.left   = startX + 'px';
    projImg.style.bottom = startY + 'px';
    mhGameCanvas.appendChild(projImg);

    const hitMonsters = new Set();
    let x = startX;
    const SPEED = 9;

    function moveBullet() {
        if (!mhIsGameStarted && !mhIsGameOver) { projImg.remove(); return; }
        x += SPEED;
        projImg.style.left = x + 'px';
        mhMonsters.forEach(m => {
            if (m.isDead || hitMonsters.has(m)) return;
            const hitX = m.pos + 55;
            if (x >= hitX - 20 && x <= hitX + 60) {
                hitMonsters.add(m);
                mhApplyUltimateKill(m);
            }
        });
        if (x > 860) { projImg.remove(); return; }
        requestAnimationFrame(moveBullet);
    }
    requestAnimationFrame(moveBullet);
}

function mhApplyUltimateKill(m) {
    if (m.isDead) return;
    mhRefreshGif(m.effect, 'huntskill6.gif');
    const hitX = m.pos + 55;
    m.effect.style.left      = hitX + 'px';
    m.effect.style.bottom    = '168px';
    m.effect.style.transform = 'translate(-50%, 50%)';
    m.effect.style.display   = 'block';
    setTimeout(() => { m.effect.style.display = 'none'; }, 500);

    m.isDead = true;
    clearTimeout(m.jumpTimer); clearTimeout(m.stopTimer);
    mhRefreshGif(m.img, m.type.die);
    mhUpdateScore(1);

    setTimeout(() => { m.element.style.opacity = '0'; }, 50);
    m.dieTimer = setTimeout(() => {
        m.element.remove(); m.effect.remove();
        const idx = mhMonsters.indexOf(m);
        if (idx > -1) mhMonsters.splice(idx, 1);
    }, 550);
}

// Space 키 — 몬스터 헌터 페이지에서도 스킬 사용
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' &&
        document.getElementById('monsterhunter-page') &&
        document.getElementById('monsterhunter-page').classList.contains('active')) {
        e.preventDefault();
        if (mhWordList.length < 4) mhUseSkill();
    }
});
