// script.js - Полная логика системы заявок Гимназии №4 (автономная версия, без БД)

// --- Глобальные переменные ---
let currentUser = null;
let users = [];
let requests = [];
let categories = ['Ремонт', 'Закупка', 'Методическая помощь', 'IT', 'Хозяйственные'];
let templates = [];
let newsData = [];

// --- Уведомления и чат ---
let notificationInterval = null;
let lastNotificationCheck = 0;
let currentChatRequestId = null;
let chatPollingInterval = null;
let shownNotifications = [];

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initAuth();
    updateNavigation();
    initMobileMenu();
    initTheme();
    initSupportChat();
    loadNews();
    initPageSpecificLogic();
    initVisitorCounter();
    startNotificationPolling();
});

// --- Загрузка данных из localStorage ---
function loadData() {
    const savedUsers = localStorage.getItem('users');
    const savedRequests = localStorage.getItem('requests');
    const savedCategories = localStorage.getItem('categories');
    const savedNews = localStorage.getItem('newsData');
    const savedTemplates = localStorage.getItem('templates');
    
    if (savedUsers) users = JSON.parse(savedUsers);
    else {
        users = [
            { id: 1, fullName: 'Администратор', login: 'admin', password: 'admin123', email: 'admin@gym4.ru', role: 'admin', regDate: '01.01.2025' },
            { id: 2, fullName: 'Иванова Мария Петровна', login: 'teacher', password: 'teacher123', email: 'teacher@gym4.ru', role: 'teacher', regDate: '02.01.2025' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    if (savedRequests) requests = JSON.parse(savedRequests);
    else {
        requests = [];
        localStorage.setItem('requests', JSON.stringify(requests));
    }
    
    if (savedCategories) categories = JSON.parse(savedCategories);
    else localStorage.setItem('categories', JSON.stringify(categories));
    
    if (savedNews) newsData = JSON.parse(savedNews);
    else {
        newsData = [
            { id: 1, title: 'Зимние каникулы', date: '01.01.2026', shortDesc: 'Каникулы с 29.12 по 12.01', fullText: '📢 Уважаемые учащиеся, учителя и родители!\n\nПоздравляем всех с наступающим Новым годом! 🎄\n\nЗимние каникулы продлятся с 29 декабря 2025 года по 12 января 2026 года.', image: null },
            { id: 2, title: 'Педагогический совет', date: '15.01.2026', shortDesc: 'Итоги второй четверти', fullText: '📢 Уважаемые коллеги!\n\n15 января 2026 года в 15:00 в актовом зале состоится педагогический совет.', image: null },
            { id: 3, title: 'День открытых дверей', date: '20.02.2026', shortDesc: 'Приглашаем будущих первоклассников', fullText: '📢 Уважаемые родители будущих первоклассников!\n\n20 февраля 2026 года в нашей гимназии пройдет День открытых дверей.', image: null },
            { id: 4, title: 'Олимпиада по математике', date: '10.03.2026', shortDesc: 'Школьный этап Всероссийской олимпиады', fullText: '📢 Внимание, ученики 7-11 классов!\n\n10 марта 2026 года состоится школьный этап Всероссийской олимпиады по математике.', image: null }
        ];
        localStorage.setItem('newsData', JSON.stringify(newsData));
    }
    
    if (savedTemplates) templates = JSON.parse(savedTemplates);
    else {
        templates = [
            { id: 1, title: '🖥️ Сломался компьютер', description: 'Компьютер не включается/зависает. Кабинет №___', category: 'IT' },
            { id: 2, title: '📽️ Не работает проектор', description: 'Проектор не включается/нет изображения. Кабинет №___', category: 'IT' },
            { id: 3, title: '💡 Перегорела лампочка', description: 'Необходимо заменить лампу в кабинете №___', category: 'Ремонт' },
            { id: 4, title: '🔌 Нет интернета', description: 'Отсутствует подключение к интернету в кабинете №___', category: 'IT' },
            { id: 5, title: '🚰 Не работает кран', description: 'Проблема с сантехникой в кабинете №___', category: 'Хозяйственные' }
        ];
        localStorage.setItem('templates', JSON.stringify(templates));
    }
    
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const savedShown = localStorage.getItem('shownNotifications');
    if (savedShown) shownNotifications = JSON.parse(savedShown);
}

function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
function saveRequests() { localStorage.setItem('requests', JSON.stringify(requests)); }
function saveCategories() { localStorage.setItem('categories', JSON.stringify(categories)); }
function saveNews() { localStorage.setItem('newsData', JSON.stringify(newsData)); }
function saveTemplates() { localStorage.setItem('templates', JSON.stringify(templates)); }

// ========== УВЕДОМЛЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ ==========
function startNotificationPolling() {
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if (currentUser) checkNotifications();
    }, 15000);
}

function checkNotifications() {
    if (!currentUser) return;
    
    const newNotifications = [];
    
    if (currentUser.role === 'admin') {
        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            if (req.status === 'new' && !shownNotifications.includes('new_' + req.id)) {
                newNotifications.push({ type: 'new', request: req });
                shownNotifications.push('new_' + req.id);
            }
        }
        
        if (newNotifications.length > 0) {
            showToast('📋 Поступило ' + newNotifications.length + ' новых заявок!', 'info');
            if (window.location.pathname.includes('admin.html')) {
                loadAllRequests();
                updateStats();
            }
        }
    } 
    else if (currentUser.role === 'teacher') {
        for (let i = 0; i < requests.length; i++) {
            const req = requests[i];
            if (req.userId === currentUser.id && req.status !== 'new') {
                const notifKey = 'status_' + req.id + '_' + req.status;
                if (!shownNotifications.includes(notifKey)) {
                    newNotifications.push(req);
                    shownNotifications.push(notifKey);
                }
            }
        }
        
        const toShow = newNotifications.slice(0, 3);
        for (let i = 0; i < toShow.length; i++) {
            const req = toShow[i];
            let statusText = '';
            if (req.status === 'solved') statusText = '✅ Решена';
            else if (req.status === 'rejected') statusText = '❌ Отклонена';
            else if (req.status === 'in_progress') statusText = '🔵 В работе';
            else statusText = req.status;
            
            showToast('📢 Заявка "' + req.title + '" — ' + statusText, 'info');
        }
        
        if (newNotifications.length > 3) {
            showToast('📢 И ещё ' + (newNotifications.length - 3) + ' заявок изменили статус', 'info');
        }
        
        if (window.location.pathname.includes('my_requests.html') && newNotifications.length > 0) {
            loadUserRequests();
        }
    }
    
    if (newNotifications.length > 0) {
        if (shownNotifications.length > 100) {
            shownNotifications = shownNotifications.slice(-100);
        }
        localStorage.setItem('shownNotifications', JSON.stringify(shownNotifications));
    }
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = '<span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ========== ЧАТ ПО ЗАЯВКЕ ==========
function openChatModal(requestId, requestTitle) {
    currentChatRequestId = requestId;
    let modal = document.getElementById('chatModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'chatModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 id="chatModalTitle">Чат по заявке</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="chatMessages" style="height: 350px; overflow-y: auto; margin-bottom: 1rem; padding: 0.5rem; background: var(--bg-color); border-radius: var(--radius);"></div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="text" id="chatMessageInput" class="form-input" placeholder="Введите сообщение..." style="flex: 1;">
                        <button id="chatSendBtn" class="btn btn-accent">Отправить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').onclick = () => {
            modal.classList.remove('active');
            if (chatPollingInterval) clearInterval(chatPollingInterval);
        };
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }
    document.getElementById('chatModalTitle').textContent = 'Чат по заявке: ' + escapeHtml(requestTitle);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadChatMessages();
    if (chatPollingInterval) clearInterval(chatPollingInterval);
    chatPollingInterval = setInterval(loadChatMessages, 3000);
    document.getElementById('chatSendBtn').onclick = () => sendChatMessageToRequest();
    document.getElementById('chatMessageInput').onkeypress = (e) => { if (e.key === 'Enter') sendChatMessageToRequest(); };
}

function loadChatMessages() {
    const container = document.getElementById('chatMessages');
    if (!container || !currentChatRequestId) return;
    const chatKey = 'chat_' + currentChatRequestId;
    let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    const wasScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
    container.innerHTML = '';
    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message ' + (msg.userId === currentUser?.id ? 'user' : 'bot');
        msgDiv.style.marginBottom = '0.5rem';
        msgDiv.innerHTML = '<strong>' + escapeHtml(msg.userName) + ' (' + (msg.userRole === 'admin' ? 'Админ' : 'Учитель') + '):</strong><div>' + escapeHtml(msg.message) + '</div><small style="color: var(--text-muted);">' + new Date(msg.timestamp).toLocaleTimeString() + '</small>';
        container.appendChild(msgDiv);
    }
    if (wasScrolledToBottom) container.scrollTop = container.scrollHeight;
}

function sendChatMessageToRequest() {
    const input = document.getElementById('chatMessageInput');
    const message = input.value.trim();
    if (!message || !currentChatRequestId) return;
    const chatKey = 'chat_' + currentChatRequestId;
    let messages = JSON.parse(localStorage.getItem(chatKey)) || [];
    messages.push({
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullName,
        userRole: currentUser.role,
        message: message,
        timestamp: Date.now()
    });
    localStorage.setItem(chatKey, JSON.stringify(messages));
    input.value = '';
    loadChatMessages();
    showToast('Сообщение отправлено', 'success');
}

// ========== РЕЙТИНГ ЗАЯВКИ ==========
function showRatingModal(requestId) {
    let modal = document.getElementById('ratingModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'ratingModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Оцените решение заявки</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="rating-stars" id="ratingStars"></div>
                    <textarea id="ratingComment" class="form-textarea" rows="3" placeholder="Ваш комментарий (необязательно)"></textarea>
                    <button id="submitRatingBtn" class="btn btn-accent" style="margin-top: 1rem;">Отправить оценку</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close').onclick = () => modal.classList.remove('active');
        modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    }
    
    const starsContainer = document.getElementById('ratingStars');
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'star';
        star.setAttribute('data-rating', i);
        star.textContent = '★';
        starsContainer.appendChild(star);
    }
    
    let selectedRating = 0;
    const stars = document.querySelectorAll('#ratingStars .star');
    for (let i = 0; i < stars.length; i++) {
        stars[i].onclick = function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            for (let j = 0; j < stars.length; j++) {
                if (j < selectedRating) stars[j].classList.add('active');
                else stars[j].classList.remove('active');
            }
        };
    }
    
    document.getElementById('submitRatingBtn').onclick = () => {
        if (selectedRating === 0) { showToast('Выберите оценку', 'error'); return; }
        const comment = document.getElementById('ratingComment').value;
        const request = requests.find(r => r.id === requestId);
        if (request) {
            request.rating = selectedRating;
            request.ratingComment = comment;
            saveRequests();
            showToast('Спасибо за оценку!', 'success');
            modal.classList.remove('active');
            if (window.location.pathname.includes('my_requests.html')) loadUserRequests();
        }
    };
    modal.classList.add('active');
}

// ========== ЧАТ ПОДДЕРЖКИ (БОТ) ==========
function initSupportChat() {
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatSend = document.getElementById('chatSend');
    const chatInput = document.getElementById('chatInput');
    if (!chatToggle) return;
    chatToggle.onclick = () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open') && document.querySelectorAll('.chat-message').length === 0) {
            addChatMessage('bot', '👋 Здравствуйте! Я виртуальный помощник гимназии №4. Задайте мне вопрос или выберите из частых вопросов:');
            addQuickQuestions();
        }
    };
    if (chatClose) chatClose.onclick = () => chatWindow.classList.remove('open');
    if (chatSend) chatSend.onclick = () => sendChatMessage();
    if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
}

function addQuickQuestions() {
    const questions = ['Как создать заявку?', 'Как посмотреть статус заявки?', 'Где расписание?', 'Контакты администрации'];
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    const quickDiv = document.createElement('div');
    quickDiv.className = 'chat-quick-questions';
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const btn = document.createElement('button');
        btn.textContent = q;
        btn.onclick = () => { addChatMessage('user', q); handleBotResponse(q); };
        quickDiv.appendChild(btn);
    }
    container.appendChild(quickDiv);
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    addChatMessage('user', message);
    handleBotResponse(message);
    input.value = '';
}

function addChatMessage(sender, message) {
    const container = document.querySelector('.chat-messages');
    if (!container) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message ' + sender;
    msgDiv.innerHTML = sender === 'bot' ? '<i class="fas fa-robot"></i> ' + message : message;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function handleBotResponse(message) {
    const lowerMsg = message.toLowerCase();
    let response = '';
    if (lowerMsg.includes('заявк') || lowerMsg.includes('создать')) {
        response = '📝 Чтобы создать заявку, войдите в систему как учитель, перейдите в раздел "Мои заявки" и нажмите "Создать заявку". Заполните форму и прикрепите файлы при необходимости.';
    } else if (lowerMsg.includes('статус')) {
        response = '📊 Статус заявки можно посмотреть в разделе "Мои заявки". Статусы: 🟡 Новая, 🔵 В работе, ✅ Решена, ❌ Отклонена. При отклонении будет указана причина.';
    } else if (lowerMsg.includes('расписание')) {
        response = '📅 Расписание звонков: 1 урок: 8:30-9:15, 2 урок: 9:25-10:10, 3 урок: 10:20-11:05, 4 урок: 11:15-12:00, 5 урок: 12:10-12:55, 6 урок: 13:05-13:50.';
    } else if (lowerMsg.includes('контакт') || lowerMsg.includes('админ')) {
        response = '📞 Контакты администрации:<br>📧 bog.men98@gmail.com<br>📞 +7 928 714 97 23<br>📍 Нальчик, проспект Ленина, 69<br>Директор: Нагоева Римма Артаговна';
    } else {
        response = '🤔 Я ещё учусь отвечать на такие вопросы. Попробуйте спросить о создании заявки, статусе, расписании или контактах.';
    }
    setTimeout(() => addChatMessage('bot', response), 500);
}

// ========== НОВОСТИ ==========
function loadNews() {
    const newsContainer = document.getElementById('newsGrid');
    if (!newsContainer) return;
    let likes = JSON.parse(localStorage.getItem('newsLikes')) || {};
    let dislikes = JSON.parse(localStorage.getItem('newsDislikes')) || {};
    let userLikes = JSON.parse(localStorage.getItem('userLikes_' + (currentUser?.id))) || [];
    let userDislikes = JSON.parse(localStorage.getItem('userDislikes_' + (currentUser?.id))) || [];
    newsContainer.innerHTML = '';
    for (let i = 0; i < newsData.length; i++) {
        const news = newsData[i];
        const card = document.createElement('div');
        card.className = 'news-card';
        card.setAttribute('data-news-id', news.id);
        card.innerHTML = `
            <img src="${news.image || 'https://placehold.co/400x200?text=' + encodeURIComponent(news.title)}" class="news-image" alt="${escapeHtml(news.title)}" onerror="this.src='https://placehold.co/400x200?text=Нет+фото'">
            <div class="news-content">
                <div class="news-date">📅 ${news.date}</div>
                <h3>${escapeHtml(news.title)}</h3>
                <p>${escapeHtml(news.shortDesc)}</p>
                <div class="news-actions">
                    <button class="like-btn ${userLikes.includes(news.id) ? 'liked' : ''}" data-news-id="${news.id}" data-type="like">
                        <i class="fas fa-heart"></i> <span class="likes-count" id="likes-${news.id}">${likes[news.id] || 0}</span>
                    </button>
                    <button class="dislike-btn ${userDislikes.includes(news.id) ? 'disliked' : ''}" data-news-id="${news.id}" data-type="dislike">
                        <i class="fas fa-heart-broken"></i> <span class="dislikes-count" id="dislikes-${news.id}">${dislikes[news.id] || 0}</span>
                    </button>
                </div>
            </div>
        `;
        newsContainer.appendChild(card);
    }
    
    document.querySelectorAll('.news-card').forEach(card => {
        card.onclick = (e) => {
            if (e.target.closest('.like-btn') || e.target.closest('.dislike-btn')) return;
            const id = parseInt(card.dataset.newsId);
            const news = newsData.find(n => n.id === id);
            if (news) showNewsModal(news);
        };
    });
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); if (!currentUser) { showToast('Войдите, чтобы ставить лайки', 'error'); return; } handleReaction(parseInt(btn.dataset.newsId), 'like'); };
    });
    document.querySelectorAll('.dislike-btn').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); if (!currentUser) { showToast('Войдите, чтобы ставить дизлайки', 'error'); return; } handleReaction(parseInt(btn.dataset.newsId), 'dislike'); };
    });
}

function handleReaction(newsId, type) {
    let likes = JSON.parse(localStorage.getItem('newsLikes')) || {};
    let dislikes = JSON.parse(localStorage.getItem('newsDislikes')) || {};
    let userLikes = JSON.parse(localStorage.getItem('userLikes_' + currentUser.id)) || [];
    let userDislikes = JSON.parse(localStorage.getItem('userDislikes_' + currentUser.id)) || [];
    if (type === 'like') {
        if (userLikes.includes(newsId)) {
            userLikes = userLikes.filter(id => id !== newsId);
            likes[newsId] = (likes[newsId] || 0) - 1;
            if (likes[newsId] <= 0) delete likes[newsId];
            showToast('❤️ Лайк убран', 'info');
        } else {
            userLikes.push(newsId);
            likes[newsId] = (likes[newsId] || 0) + 1;
            if (userDislikes.includes(newsId)) {
                userDislikes = userDislikes.filter(id => id !== newsId);
                dislikes[newsId] = (dislikes[newsId] || 0) - 1;
                if (dislikes[newsId] <= 0) delete dislikes[newsId];
            }
            showToast('❤️ Спасибо за лайк!', 'success');
        }
    } else if (type === 'dislike') {
        if (userDislikes.includes(newsId)) {
            userDislikes = userDislikes.filter(id => id !== newsId);
            dislikes[newsId] = (dislikes[newsId] || 0) - 1;
            if (dislikes[newsId] <= 0) delete dislikes[newsId];
            showToast('💔 Дизлайк убран', 'info');
        } else {
            userDislikes.push(newsId);
            dislikes[newsId] = (dislikes[newsId] || 0) + 1;
            if (userLikes.includes(newsId)) {
                userLikes = userLikes.filter(id => id !== newsId);
                likes[newsId] = (likes[newsId] || 0) - 1;
                if (likes[newsId] <= 0) delete likes[newsId];
            }
            showToast('💔 Спасибо за отзыв', 'info');
        }
    }
    localStorage.setItem('newsLikes', JSON.stringify(likes));
    localStorage.setItem('newsDislikes', JSON.stringify(dislikes));
    localStorage.setItem('userLikes_' + currentUser.id, JSON.stringify(userLikes));
    localStorage.setItem('userDislikes_' + currentUser.id, JSON.stringify(userDislikes));
    const likesSpan = document.getElementById('likes-' + newsId);
    const dislikesSpan = document.getElementById('dislikes-' + newsId);
    if (likesSpan) likesSpan.textContent = likes[newsId] || 0;
    if (dislikesSpan) dislikesSpan.textContent = dislikes[newsId] || 0;
    const likeBtn = document.querySelector('.like-btn[data-news-id="' + newsId + '"]');
    const dislikeBtn = document.querySelector('.dislike-btn[data-news-id="' + newsId + '"]');
    if (likeBtn) { if (userLikes.includes(newsId)) likeBtn.classList.add('liked'); else likeBtn.classList.remove('liked'); }
    if (dislikeBtn) { if (userDislikes.includes(newsId)) dislikeBtn.classList.add('disliked'); else dislikeBtn.classList.remove('disliked'); }
}

function showNewsModal(news) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    document.getElementById('modalTitle').textContent = news.title;
    document.getElementById('modalDate').textContent = '📅 ' + news.date;
    document.getElementById('modalDescription').innerHTML = news.fullText.replace(/\n/g, '<br>');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    const closeModal = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    modal.querySelector('.modal-close').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
}

// ========== ТЁМНАЯ ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.classList.remove('active', 'pressed');
        
        themeToggle.onclick = function(e) {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                showToast('🌞 Светлая тема включена', 'success');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                showToast('🌙 Тёмная тема включена', 'success');
            }
        };
        
        themeToggle.addEventListener('mousedown', function(e) {
            e.preventDefault();
        });
    }
}

// --- Авторизация и навигация ---
function initAuth() {
    const userInfo = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const logoutLink = document.getElementById('logoutLink');
    const heroButtons = document.getElementById('heroButtons');
    if (currentUser) {
        if (userInfo) userInfo.style.display = 'flex';
        if (userNameSpan) userNameSpan.textContent = currentUser.role === 'admin' ? 'Администратор' : currentUser.fullName;
        if (userAvatar) userAvatar.textContent = currentUser.role === 'admin' ? 'А' : getInitials(currentUser.fullName);
        if (heroButtons) heroButtons.style.display = 'none';
        if (logoutLink) logoutLink.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
        if (userInfo) userInfo.style.display = 'none';
        if (heroButtons) heroButtons.style.display = 'flex';
    }
}

function updateNavigation() {
    const desktopNav = document.getElementById('desktopNav');
    const mobileNav = document.getElementById('mobileNav');
    const footerRequestsLink = document.getElementById('footerRequestsLink');
    if (!desktopNav) return;
    let navHtml = '', mobileHtml = '';
    if (currentUser) {
        if (currentUser.role === 'admin') {
            navHtml = '<ul><li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li><li><a href="about.html"><i class="fas fa-info-circle"></i> О нас</a></li><li><a href="admin.html"><i class="fas fa-crown"></i> Админ-панель</a></li></ul>';
            mobileHtml = '<a href="index.html">Главная</a><a href="about.html">О нас</a><a href="admin.html">Админ-панель</a><a href="#" id="mobileLogoutLink">Выйти</a>';
            if (footerRequestsLink) footerRequestsLink.href = 'admin.html';
        } else if (currentUser.role === 'teacher') {
            navHtml = '<ul><li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li><li><a href="about.html"><i class="fas fa-info-circle"></i> О нас</a></li><li><a href="my_requests.html"><i class="fas fa-tasks"></i> Мои заявки</a></li></ul>';
            mobileHtml = '<a href="index.html">Главная</a><a href="about.html">О нас</a><a href="my_requests.html">Мои заявки</a><a href="#" id="mobileLogoutLink">Выйти</a>';
            if (footerRequestsLink) footerRequestsLink.href = 'my_requests.html';
        } else {
            navHtml = '<ul><li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li><li><a href="about.html"><i class="fas fa-info-circle"></i> О нас</a></li><li><a href="#" onclick="alert(\'Доступ откроется после подтверждения администратором\'); return false;"><i class="fas fa-clock"></i> Заявки (ожидание)</a></li></ul>';
            mobileHtml = '<a href="index.html">Главная</a><a href="about.html">О нас</a><a href="#" onclick="alert(\'Доступ откроется после подтверждения\'); return false;">Заявки (ожидание)</a><a href="#" id="mobileLogoutLink">Выйти</a>';
            if (footerRequestsLink) footerRequestsLink.href = '#';
        }
    } else {
        navHtml = '<ul><li><a href="index.html"><i class="fas fa-home"></i> Главная</a></li><li><a href="about.html"><i class="fas fa-info-circle"></i> О нас</a></li><li><a href="login.html"><i class="fas fa-sign-in-alt"></i> Вход</a></li><li><a href="register.html"><i class="fas fa-user-plus"></i> Регистрация</a></li></ul>';
        mobileHtml = '<a href="index.html">Главная</a><a href="about.html">О нас</a><a href="login.html">Вход</a><a href="register.html">Регистрация</a>';
        if (footerRequestsLink) footerRequestsLink.href = 'login.html';
    }
    desktopNav.innerHTML = navHtml;
    if (mobileNav) mobileNav.innerHTML = mobileHtml;
    const mobileLogout = document.getElementById('mobileLogoutLink');
    if (mobileLogout) mobileLogout.onclick = (e) => { e.preventDefault(); logout(); };
}

function logout() { localStorage.removeItem('currentUser'); window.location.href = 'index.html'; }
function getInitials(name) { if (!name) return '??'; const parts = name.split(' '); if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase(); return name.substring(0, 2).toUpperCase(); }

function initMobileMenu() {
    const burger = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');
    if (burger && mobileNav && overlay) {
        burger.onclick = () => { mobileNav.classList.toggle('open'); overlay.classList.toggle('active'); document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : ''; };
        overlay.onclick = () => { mobileNav.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; };
    }
}

function initVisitorCounter() {
    const counter = document.getElementById('visitor-counter');
    if (!counter) return;
    let count = parseInt(localStorage.getItem('visitorCount')) || 128;
    counter.textContent = count;
    setInterval(() => { count = Math.max(100, count + (Math.floor(Math.random() * 5) - 2)); localStorage.setItem('visitorCount', count); counter.textContent = count; }, 5000);
}

// ========== КОНСТРУКТОР НОВОСТЕЙ ==========
function initNewsConstructor() { const container = document.getElementById('newsConstructor'); if (container) renderNewsEditor(); }
function renderNewsEditor() {
    const container = document.getElementById('newsConstructor');
    if (!container) return;
    container.innerHTML = '<div class="news-editor"><h3>Редактор новостей</h3><button class="btn btn-accent" id="addNewsBtn" style="margin-bottom: 1rem;"><i class="fas fa-plus"></i> Добавить новость</button><div id="newsEditorList"></div></div>';
    const editorList = document.getElementById('newsEditorList');
    editorList.innerHTML = '';
    for (let idx = 0; idx < newsData.length; idx++) {
        const news = newsData[idx];
        const item = document.createElement('div');
        item.className = 'news-editor-item';
        item.setAttribute('data-news-id', news.id);
        item.innerHTML = `
            <div class="news-editor-header"><span class="news-editor-title">${escapeHtml(news.title)}</span>
                <div><button class="btn btn-sm btn-secondary move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn btn-sm btn-secondary move-down" data-index="${idx}" ${idx === newsData.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn btn-sm btn-danger delete-news" data-id="${news.id}">🗑️</button></div>
            </div>
            <div class="news-editor-fields">
                <input type="text" id="title_${news.id}" value="${escapeHtml(news.title)}" placeholder="Заголовок">
                <input type="text" id="date_${news.id}" value="${escapeHtml(news.date)}" placeholder="Дата">
                <input type="text" id="shortDesc_${news.id}" value="${escapeHtml(news.shortDesc)}" placeholder="Краткое описание">
                <textarea id="fullText_${news.id}" placeholder="Полный текст">${escapeHtml(news.fullText)}</textarea>
                <div class="image-upload-area" onclick="document.getElementById('imageInput_${news.id}').click()"><i class="fas fa-image"></i> Загрузить изображение<input type="file" id="imageInput_${news.id}" accept="image/*" style="display: none;" onchange="uploadNewsImage(${news.id}, this)"></div>
                <div id="imagePreview_${news.id}">${news.image ? '<img src="' + news.image + '" class="image-preview">' : ''}</div>
                <button class="btn btn-success btn-sm save-news" data-id="${news.id}">💾 Сохранить</button>
            </div>
        `;
        editorList.appendChild(item);
    }
    document.getElementById('addNewsBtn').onclick = () => addNewsItem();
    document.querySelectorAll('.move-up').forEach(btn => { btn.onclick = () => moveNewsUp(parseInt(btn.dataset.index)); });
    document.querySelectorAll('.move-down').forEach(btn => { btn.onclick = () => moveNewsDown(parseInt(btn.dataset.index)); });
    document.querySelectorAll('.delete-news').forEach(btn => { btn.onclick = () => deleteNewsItem(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.save-news').forEach(btn => { btn.onclick = () => saveNewsItem(parseInt(btn.dataset.id)); });
}
function addNewsItem() { const newId = Date.now(); newsData.push({ id: newId, title: 'Новая новость', date: new Date().toLocaleDateString('ru-RU'), shortDesc: 'Краткое описание', fullText: 'Полный текст...', image: null }); saveNews(); renderNewsEditor(); loadNews(); }
function deleteNewsItem(id) { if (confirm('Удалить?')) { newsData = newsData.filter(n => n.id !== id); saveNews(); renderNewsEditor(); loadNews(); } }
function moveNewsUp(index) { if (index > 0) { [newsData[index - 1], newsData[index]] = [newsData[index], newsData[index - 1]]; saveNews(); renderNewsEditor(); loadNews(); } }
function moveNewsDown(index) { if (index < newsData.length - 1) { [newsData[index], newsData[index + 1]] = [newsData[index + 1], newsData[index]]; saveNews(); renderNewsEditor(); loadNews(); } }
function saveNewsItem(id) { const news = newsData.find(n => n.id === id); if (news) { news.title = document.getElementById('title_' + id).value; news.date = document.getElementById('date_' + id).value; news.shortDesc = document.getElementById('shortDesc_' + id).value; news.fullText = document.getElementById('fullText_' + id).value; saveNews(); renderNewsEditor(); loadNews(); showToast('Новость сохранена!', 'success'); } }
function uploadNewsImage(id, input) { const file = input.files[0]; if (!file) return; if (!file.type.startsWith('image/')) { alert('Выберите изображение'); return; } const reader = new FileReader(); reader.onload = function(e) { const news = newsData.find(n => n.id === id); if (news) { news.image = e.target.result; saveNews(); const previewDiv = document.getElementById('imagePreview_' + id); if (previewDiv) previewDiv.innerHTML = '<img src="' + news.image + '" class="image-preview">'; showToast('Изображение загружено!', 'success'); } }; reader.readAsDataURL(file); }

// --- Инициализация страниц ---
function initPageSpecificLogic() {
    const path = window.location.pathname;
    if (path.includes('register.html')) initRegister();
    else if (path.includes('login.html')) initLogin();
    else if (path.includes('my_requests.html')) initMyRequests();
    else if (path.includes('create_request.html')) initCreateRequest();
    else if (path.includes('admin.html')) initAdmin();
}

// --- Регистрация ---
function initRegister() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    const loginInput = document.getElementById('login');
    const existingLogins = users.map(u => u.login);
    if (loginInput) {
        loginInput.addEventListener('input', function() {
            const login = this.value.trim();
            if (!login.length) return;
            if (!/^[a-zA-Z0-9_]+$/.test(login)) {
                document.getElementById('loginError').textContent = 'Только латиница, цифры и _';
                document.getElementById('loginError').style.display = 'block';
                document.getElementById('loginSuccess').style.display = 'none';
            } else if (existingLogins.includes(login)) {
                document.getElementById('loginError').textContent = 'Логин уже занят';
                document.getElementById('loginError').style.display = 'block';
                document.getElementById('loginSuccess').style.display = 'none';
            } else {
                document.getElementById('loginError').style.display = 'none';
                document.getElementById('loginSuccess').style.display = 'block';
            }
        });
    }
    form.onsubmit = (e) => {
        e.preventDefault();
        const fullName = document.getElementById('fullName').value.trim();
        const login = document.getElementById('login').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        const agree = document.getElementById('agree').checked;
        let isValid = true;
        if (!fullName || !/^[А-Яа-яЁё\s-]+$/.test(fullName)) { showError('fullNameError', true); isValid = false; }
        if (!login || existingLogins.includes(login)) { showError('loginError', true); isValid = false; }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showError('emailError', true); isValid = false; }
        if (!password || password.length < 6) { showError('passwordError', true); isValid = false; }
        if (password !== confirm) { showError('confirmPasswordError', true); isValid = false; }
        if (!agree) { showError('agreeError', true); isValid = false; }
        if (!isValid) return;
        const newUser = { id: Date.now(), fullName, login, password, email, role: 'user', regDate: new Date().toLocaleDateString('ru-RU') };
        users.push(newUser);
        saveUsers();
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        alert('Регистрация успешна! Добро пожаловать, ' + fullName + '!');
        window.location.href = 'index.html';
    };
}
function showError(id, show) { const el = document.getElementById(id); if (el) el.style.display = show ? 'block' : 'none'; }

// --- Вход ---
function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const login = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value;
        const user = users.find(u => u.login === login && u.password === password);
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            showToast('Добро пожаловать, ' + user.fullName + '!', 'success');
            if (user.role === 'admin') window.location.href = 'admin.html';
            else if (user.role === 'teacher') window.location.href = 'my_requests.html';
            else window.location.href = 'index.html';
        } else {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('passwordError').style.display = 'block';
        }
    };
}

// --- Мои заявки ---
function initMyRequests() {
    if (!currentUser || currentUser.role !== 'teacher') { alert('Доступ запрещен'); window.location.href = 'index.html'; return; }
    loadUserRequests();
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => { document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); filterRequests(btn.dataset.filter); };
    });
}
function loadUserRequests() { renderRequests(requests.filter(r => r.userId === currentUser.id)); }
function filterRequests(filter) { let filtered = requests.filter(r => r.userId === currentUser.id); if (filter !== 'all') filtered = filtered.filter(r => r.status === filter); renderRequests(filtered); }
function renderRequests(requestsList) {
    const container = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;
    if (requestsList.length === 0) { container.innerHTML = ''; if (emptyState) emptyState.classList.remove('hidden'); return; }
    if (emptyState) emptyState.classList.add('hidden');
    container.innerHTML = '';
    for (let i = 0; i < requestsList.length; i++) {
        const req = requestsList[i];
        const card = document.createElement('div');
        card.className = 'request-card ' + req.status;
        card.innerHTML = `
            <div class="request-header"><div class="request-title">${escapeHtml(req.title)}</div><div class="request-date">📅 ${req.date}</div></div>
            <div class="request-category">📂 ${escapeHtml(req.category)}</div>
            <div class="request-description">${escapeHtml(req.description)}</div>
            ${req.status === 'rejected' && req.rejectReason ? '<div class="request-reason">❌ Причина: ' + escapeHtml(req.rejectReason) + '</div>' : ''}
            <div class="request-footer">
                <span class="status-badge status-${req.status}">${getStatusText(req.status)}</span>
                <div>
                    ${req.status === 'new' ? '<button class="btn btn-danger btn-sm delete-request" data-id="' + req.id + '"><i class="fas fa-trash"></i> Удалить</button>' : ''}
                    ${req.status === 'solved' && !req.rating ? '<button class="btn btn-warning btn-sm rate-request" data-id="' + req.id + '"><i class="fas fa-star"></i> Оценить</button>' : ''}
                    <button class="btn btn-info btn-sm chat-request" data-id="' + req.id + '" data-title="' + escapeHtml(req.title) + '"><i class="fas fa-comment"></i> Чат</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    }
    document.querySelectorAll('.delete-request').forEach(btn => { btn.onclick = () => deleteRequest(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.rate-request').forEach(btn => { btn.onclick = () => showRatingModal(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.chat-request').forEach(btn => { btn.onclick = () => openChatModal(parseInt(btn.dataset.id), btn.dataset.title); });
}
function deleteRequest(id) { if (confirm('Удалить?')) { requests = requests.filter(r => r.id !== id); saveRequests(); loadUserRequests(); showToast('Заявка удалена', 'success'); } }
function getStatusText(status) { const s = { 'new': '🟡 Новая', 'solved': '✅ Решена', 'rejected': '❌ Отклонена' }; return s[status] || status; }

// --- Создание заявки ---
function initCreateRequest() {
    if (!currentUser || currentUser.role !== 'teacher') { alert('Доступ запрещен'); window.location.href = 'index.html'; return; }
    let cats = JSON.parse(localStorage.getItem('categories')) || categories;
    if (cats.length > 0 && typeof cats[0] === 'object' && cats[0].name) cats = cats.map(c => c.name);
    const categorySelect = document.getElementById('requestCategory');
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">-- Выберите категорию --</option>';
        for (let i = 0; i < cats.length; i++) {
            const opt = document.createElement('option');
            opt.value = cats[i];
            opt.textContent = cats[i];
            categorySelect.appendChild(opt);
        }
    }
    let temps = JSON.parse(localStorage.getItem('templates')) || templates;
    const templatesContainer = document.getElementById('templatesContainer');
    if (templatesContainer && temps.length) {
        templatesContainer.innerHTML = '<h3>📋 Быстрые шаблоны</h3><div class="templates-grid" id="templatesGrid"></div>';
        const grid = document.getElementById('templatesGrid');
        for (let i = 0; i < temps.length; i++) {
            const t = temps[i];
            const card = document.createElement('div');
            card.className = 'template-card';
            card.setAttribute('data-title', escapeHtml(t.title));
            card.setAttribute('data-category', escapeHtml(t.category));
            card.setAttribute('data-desc', escapeHtml(t.description));
            card.innerHTML = '<div class="template-title">' + escapeHtml(t.title) + '</div><div class="template-desc">' + escapeHtml(t.description.substring(0, 100)) + '...</div>';
            card.onclick = () => {
                document.getElementById('requestTitle').value = card.dataset.title;
                document.getElementById('requestCategory').value = card.dataset.category;
                document.getElementById('requestDescription').value = card.dataset.desc;
                showToast('Шаблон применён!', 'success');
            };
            grid.appendChild(card);
        }
    }
    const form = document.getElementById('createRequestForm');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const title = document.getElementById('requestTitle').value.trim();
            const category = document.getElementById('requestCategory').value;
            const description = document.getElementById('requestDescription').value.trim();
            let isValid = true;
            if (!title) { showError('titleError', true); isValid = false; }
            if (!category) { showError('categoryError', true); isValid = false; }
            if (!description) { showError('descriptionError', true); isValid = false; }
            if (!isValid) return;
            const newRequest = { id: Date.now(), userId: currentUser.id, title, category, description, date: new Date().toLocaleDateString('ru-RU'), status: 'new', rejectReason: null, created_at: new Date().toISOString() };
            requests.push(newRequest);
            saveRequests();
            showToast('Заявка создана!', 'success');
            window.location.href = 'my_requests.html';
        };
    }
}

// --- Админ-панель ---
function initAdmin() {
    if (!currentUser || currentUser.role !== 'admin') { window.location.href = 'login.html'; return; }
    loadAllRequests(); loadCategoriesList(); loadTemplatesList(); loadUsersList(); updateStats(); initNewsConstructor();
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    function activateTab(tabId) {
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        const targetBtn = document.querySelector('.tab-btn[data-tab="' + tabId + '"]');
        if (targetBtn) targetBtn.classList.add('active');
        const activeContent = document.getElementById(tabId + 'Tab');
        if (activeContent) activeContent.classList.add('active');
        if (tabId === 'news') renderNewsEditor();
        if (tabId === 'templates') loadTemplatesList();
        if (tabId === 'categories') loadCategoriesList();
    }
    tabBtns.forEach(btn => { btn.onclick = (e) => { e.preventDefault(); const tabId = btn.getAttribute('data-tab'); if (tabId) activateTab(tabId); }; });
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) addCategoryBtn.onclick = () => addCategory();
    const addTemplateBtn = document.getElementById('addTemplateBtn');
    if (addTemplateBtn) addTemplateBtn.onclick = () => addTemplate();
    const categorySelect = document.getElementById('newTemplateCategory');
    if (categorySelect) { let cats = JSON.parse(localStorage.getItem('categories')) || categories; if (cats.length > 0 && typeof cats[0] === 'object' && cats[0].name) cats = cats.map(c => c.name); categorySelect.innerHTML = '<option value="">Выберите категорию</option>'; for (let i = 0; i < cats.length; i++) { categorySelect.innerHTML += '<option value="' + escapeHtml(cats[i]) + '">' + escapeHtml(cats[i]) + '</option>'; } }
    const closeModalBtn = document.getElementById('closeRejectModalBtn');
    const cancelBtn = document.getElementById('cancelRejectBtn');
    const confirmBtn = document.getElementById('confirmRejectBtn');
    if (closeModalBtn) closeModalBtn.onclick = () => closeRejectModal();
    if (cancelBtn) cancelBtn.onclick = () => closeRejectModal();
    if (confirmBtn) confirmBtn.onclick = () => confirmReject();
}
function loadAllRequests() {
    const tableBody = document.getElementById('requestsTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    for (let i = 0; i < requests.length; i++) {
        const req = requests[i];
        const user = users.find(u => u.id === req.userId);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.id}</td><td>${req.date}</td><td>${user ? user.fullName : 'Неизвестно'}</td>
            <td>${escapeHtml(req.title)}</td><td>${escapeHtml(req.category)}</td>
            <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
            <td>
                ${req.status === 'new' ? '<button class="btn btn-success btn-sm solve-request" data-id="' + req.id + '">✅ Решить</button> <button class="btn btn-danger btn-sm reject-request" data-id="' + req.id + '">❌ Отклонить</button>' : ''}
                <button class="btn btn-info btn-sm chat-request" data-id="' + req.id + '" data-title="' + escapeHtml(req.title) + '"><i class="fas fa-comment"></i> Чат</button>
            </td>
        `;
        tableBody.appendChild(row);
    }
    document.querySelectorAll('.solve-request').forEach(btn => { btn.onclick = () => solveRequest(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.reject-request').forEach(btn => { btn.onclick = () => openRejectModal(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.chat-request').forEach(btn => { btn.onclick = () => openChatModal(parseInt(btn.dataset.id), btn.dataset.title); });
}
function loadCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    let cats = JSON.parse(localStorage.getItem('categories')) || categories;
    if (cats.length > 0 && typeof cats[0] === 'object' && cats[0].name) cats = cats.map(c => c.name);
    container.innerHTML = '';
    for (let i = 0; i < cats.length; i++) {
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = '<span>' + escapeHtml(cats[i]) + '</span><button class="btn btn-danger btn-sm delete-category" data-name="' + escapeHtml(cats[i]) + '">🗑️</button>';
        container.appendChild(item);
    }
    document.querySelectorAll('.delete-category').forEach(btn => { btn.onclick = () => deleteCategory(btn.dataset.name); });
}
function loadTemplatesList() {
    const container = document.getElementById('templatesList');
    if (!container) return;
    let temps = JSON.parse(localStorage.getItem('templates')) || templates;
    container.innerHTML = '';
    for (let i = 0; i < temps.length; i++) {
        const t = temps[i];
        const item = document.createElement('div');
        item.className = 'category-item';
        item.innerHTML = '<span><strong>' + escapeHtml(t.title) + '</strong> (' + escapeHtml(t.category) + ')<br><small>' + escapeHtml(t.description.substring(0, 50)) + '...</small></span><button class="btn btn-danger btn-sm delete-template" data-id="' + t.id + '">🗑️</button>';
        container.appendChild(item);
    }
    document.querySelectorAll('.delete-template').forEach(btn => { btn.onclick = () => deleteTemplate(parseInt(btn.dataset.id)); });
}
function loadUsersList() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const userRequests = requests.filter(r => r.userId === user.id).length;
        const roleDisplay = user.role === 'admin' ? '👑 Админ' : (user.role === 'teacher' ? '👨‍🏫 Учитель' : '👤 Пользователь');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td><td>${escapeHtml(user.fullName)}</td><td>${escapeHtml(user.login)}</td>
            <td>${escapeHtml(user.email)}</td>
            <td>${roleDisplay} ${user.role === 'user' ? '<button class="btn btn-success btn-sm confirm-user" data-id="' + user.id + '">✅ Подтвердить</button>' : ''} ${user.role === 'teacher' ? '<button class="btn btn-warning btn-sm revoke-user" data-id="' + user.id + '">🔄 Отозвать</button>' : ''}</td>
            <td>${userRequests}</td>
        `;
        tableBody.appendChild(row);
    }
    document.querySelectorAll('.confirm-user').forEach(btn => { btn.onclick = () => confirmUser(parseInt(btn.dataset.id)); });
    document.querySelectorAll('.revoke-user').forEach(btn => { btn.onclick = () => revokeTeacher(parseInt(btn.dataset.id)); });
}
function updateStats() {
    const total = document.getElementById('totalRequests');
    const newEl = document.getElementById('newRequests');
    const solved = document.getElementById('solvedRequests');
    const rejected = document.getElementById('rejectedRequests');
    if (total) total.textContent = requests.length;
    if (newEl) newEl.textContent = requests.filter(r => r.status === 'new').length;
    if (solved) solved.textContent = requests.filter(r => r.status === 'solved').length;
    if (rejected) rejected.textContent = requests.filter(r => r.status === 'rejected').length;
}
function confirmUser(userId) { if (confirm('Подтвердить?')) { const user = users.find(u => u.id === userId); if (user && user.role === 'user') { user.role = 'teacher'; saveUsers(); loadUsersList(); showToast('Пользователь ' + user.fullName + ' теперь учитель!', 'success'); } } }
function revokeTeacher(userId) { if (confirm('Отозвать?')) { const user = users.find(u => u.id === userId); if (user && user.role === 'teacher') { user.role = 'user'; saveUsers(); loadUsersList(); showToast('Доступ отозван', 'success'); } } }
function solveRequest(id) { if (confirm('Решить?')) { const req = requests.find(r => r.id === id); if (req && req.status === 'new') { req.status = 'solved'; req.updated_at = new Date().toISOString(); saveRequests(); loadAllRequests(); updateStats(); showToast('Заявка решена', 'success'); } } }
function addCategory() { const input = document.getElementById('newCategoryName'); const name = input.value.trim(); if (!name) { alert('Введите название'); return; } let cats = JSON.parse(localStorage.getItem('categories')) || categories; if (cats.length > 0 && typeof cats[0] === 'object' && cats[0].name) cats = cats.map(c => c.name); if (cats.includes(name)) { alert('Такая категория уже есть'); return; } cats.push(name); localStorage.setItem('categories', JSON.stringify(cats)); loadCategoriesList(); input.value = ''; showToast('Категория добавлена', 'success'); }
function deleteCategory(name) { if (confirm('Удалить "' + name + '"?')) { let cats = JSON.parse(localStorage.getItem('categories')) || categories; if (cats.length > 0 && typeof cats[0] === 'object' && cats[0].name) cats = cats.map(c => c.name); cats = cats.filter(c => c !== name); localStorage.setItem('categories', JSON.stringify(cats)); loadCategoriesList(); showToast('Категория удалена', 'success'); } }
function addTemplate() { const title = document.getElementById('newTemplateTitle')?.value.trim(); const desc = document.getElementById('newTemplateDesc')?.value.trim(); const category = document.getElementById('newTemplateCategory')?.value; if (!title || !desc || !category) { alert('Заполните все поля'); return; } let temps = JSON.parse(localStorage.getItem('templates')) || templates; temps.push({ id: Date.now(), title, description: desc, category }); localStorage.setItem('templates', JSON.stringify(temps)); loadTemplatesList(); document.getElementById('newTemplateTitle').value = ''; document.getElementById('newTemplateDesc').value = ''; showToast('Шаблон добавлен', 'success'); }
function deleteTemplate(id) { if (confirm('Удалить шаблон?')) { let temps = JSON.parse(localStorage.getItem('templates')) || templates; temps = temps.filter(t => t.id !== id); localStorage.setItem('templates', JSON.stringify(temps)); loadTemplatesList(); showToast('Шаблон удалён', 'success'); } }
let currentRejectId = null;
function openRejectModal(id) { currentRejectId = id; const modal = document.getElementById('rejectModal'); if (modal) modal.classList.add('active'); }
function closeRejectModal() { const modal = document.getElementById('rejectModal'); if (modal) modal.classList.remove('active'); document.getElementById('rejectReason').value = ''; }
function confirmReject() { const reason = document.getElementById('rejectReason').value.trim(); if (!reason) { alert('Укажите причину'); return; } const req = requests.find(r => r.id === currentRejectId); if (req && req.status === 'new') { req.status = 'rejected'; req.rejectReason = reason; req.updated_at = new Date().toISOString(); saveRequests(); loadAllRequests(); updateStats(); closeRejectModal(); showToast('Заявка отклонена', 'warning'); } }
function escapeHtml(str) { if (!str) return ''; return str.replace(/[&<>]/g, function(m) { if (m === '&') return '&amp;'; if (m === '<') return '&lt;'; if (m === '>') return '&gt;'; return m; }); }
