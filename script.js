// ============================================================
// ЧАСТЬ 1: ЛОГИКА МОБИЛЬНОГО ПРИЛОЖЕНИЯ (МЕНЮ)
// ============================================================

function navigateTo(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById('screen-' + screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.scrollTop = 0;
    }
    const bottomNav = document.getElementById('bottom-nav');
    if (screenId === 'auth' || screenId === 'register') {
        bottomNav.style.display = 'none';
    } else {
        bottomNav.style.display = 'flex';
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        let activeNavId = screenId;
        if (screenId === 'quest' || screenId === 'help') activeNavId = 'home';
        if (screenId === 'account') activeNavId = 'settings';
        const activeNavItem = document.getElementById('nav-' + activeNavId);
        if (activeNavItem) activeNavItem.classList.add('active');
    }
}

function openQuest(type) {
    const title = document.getElementById('quest-title');
    const desc = document.getElementById('quest-desc');
    if (type === 'gathering') {
        title.innerText = "Точка сбора";
        desc.innerText = "Коллектив соберется, чтобы обсудить цели и задачи на день. Будь готов поделиться своими планами.";
    } else if (type === 'commit') {
        title.innerText = "Первый коммит";
        desc.innerText = "Твой первый шаг в команду. Напиши свой первый код и отправь на проверку капитану.";
    } else if (type === 'watch') {
        title.innerText = "Код-дозор";
        desc.innerText = "Ты работаешь в команде, дебажишь код и фиксишь баги. Найди уязвимость до релиза!";
    }
    navigateTo('quest');
}

function completeQuest() {
    alert('✅ Задача отправлена на проверку капитану! +150 XP, +50 RC');
    navigateTo('home');
}

// ============================================================
// ЧАСТЬ 2: ЛОГИКА 2D-ИГРЫ (CANVAS)
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Состояние игрока
let player = {
    x: 400, y: 300,
    size: 30,
    speed: 4,
    color: '#C6FF00',
    direction: 'down',
    xp: 0,
    coins: 840
};

let keys = {};
let activeNPC = null;
let currentQuest = null;
let isGameRunning = false;

// NPC и объекты на карте
const npcs = [
    { id: 'captain', x: 200, y: 150, color: '#ff9800', name: 'Капитан Алекс', questId: 'quest1', active: true },
    { id: 'coder', x: 600, y: 400, color: '#2196f3', name: 'Кодер Макс', questId: 'quest2', active: true },
    { id: 'mentor', x: 400, y: 500, color: '#9c27b0', name: 'Наставник', questId: 'quest3', active: true }
];

// Стены (простая карта колледжа)
const walls = [
    { x: 0, y: 0, w: 800, h: 20 },     // верх
    { x: 0, y: 580, w: 800, h: 20 },   // низ
    { x: 0, y: 0, w: 20, h: 600 },     // лево
    { x: 780, y: 0, w: 20, h: 600 },   // право
    { x: 300, y: 100, w: 200, h: 20 }, // перегородка 1
    { x: 300, y: 100, w: 20, h: 150 }, // перегородка 2
    { x: 150, y: 350, w: 20, h: 150 }  // перегородка 3
];

// Квесты
const quests = {
    quest1: {
        title: "Точка сбора",
        text: "Капитан: 'Привет, Артур! Сегодня отличный день для гонки. Твоя первая задача — изучить документацию и написать функцию.'",
        tasks: true,
        actionText: "Взять задание"
    },
    quest2: {
        title: "Код-дозор",
        text: "Макс: 'Йо! В коде завелся баг. Помоги мне его найти, и я поделюсь с тобой опытом.'",
        tasks: true,
        actionText: "Приступить"
    },
    quest3: {
        title: "Первый коммит",
        text: "Наставник: 'Твой первый коммит ждет тебя. Покажи, на что ты способен!'",
        tasks: false,
        actionText: "Начать квест"
    }
};

// --- УПРАВЛЕНИЕ КЛАВИАТУРОЙ ---
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;

    if (e.key.toLowerCase() === 'e' && activeNPC && isGameRunning) {
        openGameQuest(activeNPC.questId);
    }
    if (e.key === 'Escape') {
        closeDialog();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// --- ПЕРЕКЛЮЧЕНИЕ МЕЖДУ МЕНЮ И ИГРОЙ ---
function startGameMode() {
    document.getElementById('app-mode').classList.add('hidden');
    document.getElementById('game-mode').classList.remove('hidden');
    
    // Сброс позиции игрока
    player.x = 400;
    player.y = 300;
    player.xp = 0;
    player.coins = 840;
    
    // Сброс NPC
    npcs.forEach(npc => npc.active = true);
    
    // Обновление HUD
    document.getElementById('xp-count').innerText = player.xp;
    document.getElementById('coin-count').innerText = player.coins;
    
    isGameRunning = true;
    gameLoop();
}

function exitGameMode() {
    isGameRunning = false;
    document.getElementById('game-mode').classList.add('hidden');
    document.getElementById('app-mode').classList.remove('hidden');
    closeDialog();
}

// --- ЛОГИКА ИГРЫ ---
function update() {
    if (!isGameRunning) return;
    if (!document.getElementById('dialog-box').classList.contains('hidden')) return;

    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['arrowup']) { dy = -player.speed; player.direction = 'up'; }
    if (keys['s'] || keys['arrowdown']) { dy = player.speed; player.direction = 'down'; }
    if (keys['a'] || keys['arrowleft']) { dx = -player.speed; player.direction = 'left'; }
    if (keys['d'] || keys['arrowright']) { dx = player.speed; player.direction = 'right'; }

    let nextX = player.x + dx;
    if (!checkCollision(nextX, player.y)) player.x = nextX;

    let nextY = player.y + dy;
    if (!checkCollision(player.x, nextY)) player.y = nextY;

    // Проверка близости к NPC
    activeNPC = null;
    npcs.forEach(npc => {
        if (!npc.active) return;
        const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
        if (dist < 60) activeNPC = npc;
    });

    const prompt = document.getElementById('interaction-prompt');
    if (activeNPC) prompt.classList.remove('hidden');
    else prompt.classList.add('hidden');
}

function checkCollision(x, y) {
    if (x < 20 || x > 780 - player.size || y < 20 || y > 580 - player.size) return true;
    for (let wall of walls) {
        if (x < wall.x + wall.w && x + player.size > wall.x &&
            y < wall.y + wall.h && y + player.size > wall.y) {
            return true;
        }
    }
    return false;
}

// --- ОТРИСОВКА ---
function draw() {
    // Очистка
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Сетка (пол)
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Стены
    walls.forEach(wall => {
        ctx.fillStyle = '#333';
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    });

    // NPC
    npcs.forEach(npc => {
        if (!npc.active) return;
        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.ellipse(npc.x + 15, npc.y + 35, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
        // Тело
        ctx.fillStyle = npc.color;
        ctx.beginPath(); ctx.arc(npc.x + 15, npc.y + 15, 15, 0, Math.PI * 2); ctx.fill();
        // Иконка "!" над головой
        ctx.fillStyle = '#C6FF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('!', npc.x + 10, npc.y - 5);
    });

    // Игрок
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(player.x + 15, player.y + 35, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = player.color;
    ctx.beginPath(); ctx.arc(player.x + 15, player.y + 15, 15, 0, Math.PI * 2); ctx.fill();
    
    // Глаза (направление)
    ctx.fillStyle = '#000';
    let eyeX = player.x + 15;
    let eyeY = player.y + 15;
    if (player.direction === 'left') eyeX -= 5;
    if (player.direction === 'right') eyeX += 5;
    if (player.direction === 'up') eyeY -= 5;
    if (player.direction === 'down') eyeY += 5;
    ctx.beginPath(); ctx.arc(eyeX - 4, eyeY, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(eyeX + 4, eyeY, 2, 0, Math.PI * 2); ctx.fill();
}

// --- ДИАЛОГИ И КВЕСТЫ В ИГРЕ ---
function openGameQuest(questId) {
    const quest = quests[questId];
    currentQuest = questId;

    document.getElementById('dialog-title').innerText = quest.title;
    document.getElementById('dialog-text').innerText = quest.text;
    document.getElementById('dialog-box').classList.remove('hidden');

    const tasksDiv = document.getElementById('quest-tasks');
    const btn = document.getElementById('dialog-action-btn');

    if (quest.tasks) tasksDiv.classList.remove('hidden');
    else tasksDiv.classList.add('hidden');

    btn.innerText = quest.actionText;
}

function closeDialog() {
    document.getElementById('dialog-box').classList.add('hidden');
    currentQuest = null;
}

function handleQuestAction() {
    if (!currentQuest) return;

    // Награда
    player.xp += 150;
    player.coins += 50;

    document.getElementById('xp-count').innerText = player.xp;
    document.getElementById('coin-count').innerText = player.coins;

    // Деактивация NPC
    const npcIndex = npcs.findIndex(n => n.questId === currentQuest);
    if (npcIndex !== -1) npcs[npcIndex].active = false;

    alert(`✅ Квест "${quests[currentQuest].title}" выполнен!\n+150 XP, +50 RC`);

    closeDialog();
}

// --- ИГРОВОЙ ЦИКЛ ---
function gameLoop() {
    if (!isGameRunning) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', () => {
    navigateTo('auth');
});