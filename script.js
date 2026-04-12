// script.js - Полная логика системы заявок Гимназии №4

// --- Глобальные переменные ---
let currentUser = null;
let users = [];
let requests = [];
let categories = ['Ремонт', 'Закупка', 'Методическая помощь', 'IT', 'Хозяйственные'];

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initAuth();
    updateNavigation();
    initMobileMenu();
    loadNews();
    initPageSpecificLogic();
    initVisitorCounter();
});

// --- Загрузка данных из localStorage ---
function loadData() {
    const savedUsers = localStorage.getItem('users');
    const savedRequests = localStorage.getItem('requests');
    const savedCategories = localStorage.getItem('categories');
    
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
    
    currentUser = JSON.parse(localStorage.getItem('currentUser'));
}

// --- Авторизация и навигация ---
function initAuth() {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const userInfo = document.getElementById('userInfo');
    const userNameSpan = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const logoutLink = document.getElementById('logoutLink');
    const heroButtons = document.getElementById('heroButtons');
    
    if (currentUser) {
        if (loginLink) loginLink.style.display = 'none';
        if (registerLink) registerLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
        
        // ИСПРАВЛЕНО: для админа显示 "Администратор", для других - полное имя
        if (userNameSpan) {
            if (currentUser.role === 'admin') {
                userNameSpan.textContent = 'Администратор';
            } else {
                userNameSpan.textContent = currentUser.fullName;
            }
        }
        
        if (userAvatar) {
            if (currentUser.role === 'admin') {
                userAvatar.textContent = 'А';  // ИСПРАВЛЕНО: одна буква А
            } else {
                userAvatar.textContent = getInitials(currentUser.fullName);
            }
        }
        
        if (heroButtons) heroButtons.style.display = 'none';
        
        // КНОПКА ВЫХОДА - для всех авторизованных пользователей
        if (logoutLink) {
            logoutLink.onclick = (e) => {
                e.preventDefault();
                logout();
            };
            logoutLink.style.display = 'block';
        }
    } else {
        if (loginLink) loginLink.style.display = 'block';
        if (registerLink) registerLink.style.display = 'block';
        if (userInfo) userInfo.style.display = 'none';
        if (heroButtons) heroButtons.style.display = 'flex';
        
        // Скрываем кнопку выхода если нет пользователя
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

function updateNavigation() {
    const desktopNav = document.getElementById('desktopNav');
    const mobileNav = document.getElementById('mobileNav');
    const footerRequestsLink = document.getElementById('footerRequestsLink');
    
    if (!desktopNav) return;
    
    let navHtml = '';
    let mobileHtml = '';
    
    if (currentUser) {
        if (currentUser.role === 'admin') {
            navHtml = `
                <ul>
                    <li><a href="index.html" ${isActive('index.html') ? 'class="active"' : ''}><i class="fas fa-home"></i> Главная</a></li>
                    <li><a href="about.html" ${isActive('about.html') ? 'class="active"' : ''}><i class="fas fa-info-circle"></i> О нас</a></li>
                    <li><a href="admin.html" ${isActive('admin.html') ? 'class="active"' : ''}><i class="fas fa-crown"></i> Админ-панель</a></li>
                </ul>
            `;
            mobileHtml = `
                <a href="index.html"><i class="fas fa-home"></i> Главная</a>
                <a href="about.html"><i class="fas fa-info-circle"></i> О нас</a>
                <a href="admin.html"><i class="fas fa-crown"></i> Админ-панель</a>
                <a href="#" id="mobileLogoutLink"><i class="fas fa-sign-out-alt"></i> Выйти</a>
            `;
            if (footerRequestsLink) footerRequestsLink.href = 'admin.html';
        } else if (currentUser.role === 'teacher') {
            navHtml = `
                <ul>
                    <li><a href="index.html" ${isActive('index.html') ? 'class="active"' : ''}><i class="fas fa-home"></i> Главная</a></li>
                    <li><a href="about.html" ${isActive('about.html') ? 'class="active"' : ''}><i class="fas fa-info-circle"></i> О нас</a></li>
                    <li><a href="my_requests.html" ${isActive('my_requests.html') ? 'class="active"' : ''}><i class="fas fa-tasks"></i> Мои заявки</a></li>
                </ul>
            `;
            mobileHtml = `
                <a href="index.html"><i class="fas fa-home"></i> Главная</a>
                <a href="about.html"><i class="fas fa-info-circle"></i> О нас</a>
                <a href="my_requests.html"><i class="fas fa-tasks"></i> Мои заявки</a>
                <a href="#" id="mobileLogoutLink"><i class="fas fa-sign-out-alt"></i> Выйти</a>
            `;
            if (footerRequestsLink) footerRequestsLink.href = 'my_requests.html';
        } else {
            // Обычный пользователь (user) - ожидает подтверждения
            navHtml = `
                <ul>
                    <li><a href="index.html" ${isActive('index.html') ? 'class="active"' : ''}><i class="fas fa-home"></i> Главная</a></li>
                    <li><a href="about.html" ${isActive('about.html') ? 'class="active"' : ''}><i class="fas fa-info-circle"></i> О нас</a></li>
                    <li><a href="#" onclick="alert('Доступ к заявкам откроется после подтверждения администратором'); return false;"><i class="fas fa-clock"></i> Заявки (ожидание)</a></li>
                </ul>
            `;
            mobileHtml = `
                <a href="index.html"><i class="fas fa-home"></i> Главная</a>
                <a href="about.html"><i class="fas fa-info-circle"></i> О нас</a>
                <a href="#" onclick="alert('Доступ к заявкам откроется после подтверждения администратором'); return false;"><i class="fas fa-clock"></i> Заявки (ожидание)</a>
                <a href="#" id="mobileLogoutLink"><i class="fas fa-sign-out-alt"></i> Выйти</a>
            `;
            if (footerRequestsLink) {
                footerRequestsLink.href = '#';
                footerRequestsLink.onclick = (e) => {
                    e.preventDefault();
                    alert('Доступ к заявкам откроется после подтверждения администратором');
                };
            }
        }
    } else {
        navHtml = `
            <ul>
                <li><a href="index.html" ${isActive('index.html') ? 'class="active"' : ''}><i class="fas fa-home"></i> Главная</a></li>
                <li><a href="about.html" ${isActive('about.html') ? 'class="active"' : ''}><i class="fas fa-info-circle"></i> О нас</a></li>
                <li><a href="login.html"><i class="fas fa-sign-in-alt"></i> Заявки</a></li>
                <li><a href="register.html" ${isActive('register.html') ? 'class="active"' : ''}><i class="fas fa-user-plus"></i> Регистрация</a></li>
            </ul>
        `;
        mobileHtml = `
            <a href="index.html"><i class="fas fa-home"></i> Главная</a>
            <a href="about.html"><i class="fas fa-info-circle"></i> О нас</a>
            <a href="login.html"><i class="fas fa-sign-in-alt"></i> Вход</a>
            <a href="register.html"><i class="fas fa-user-plus"></i> Регистрация</a>
        `;
        if (footerRequestsLink) footerRequestsLink.href = 'login.html';
    }
    
    desktopNav.innerHTML = navHtml;
    if (mobileNav) mobileNav.innerHTML = mobileHtml;
    
    const mobileLogout = document.getElementById('mobileLogoutLink');
    if (mobileLogout) {
        mobileLogout.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }
}

function isActive(page) {
    return window.location.pathname.includes(page);
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getInitials(name) {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function initMobileMenu() {
    const burger = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('mobileOverlay');
    
    if (burger && mobileNav && overlay) {
        burger.onclick = () => {
            mobileNav.classList.toggle('open');
            overlay.classList.toggle('active');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
        };
        overlay.onclick = () => {
            mobileNav.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
    }
}

function initVisitorCounter() {
    const counter = document.getElementById('visitor-counter');
    if (!counter) return;
    
    let count = parseInt(localStorage.getItem('visitorCount')) || 128;
    counter.textContent = count;
    
    setInterval(() => {
        let change = Math.floor(Math.random() * 5) - 2;
        count = Math.max(100, count + change);
        localStorage.setItem('visitorCount', count);
        counter.textContent = count;
    }, 5000);
}

// ========== НОВОСТИ С ПОДРОБНЫМ ТЕКСТОМ ==========
function loadNews() {
    const newsContainer = document.getElementById('newsGrid');
    if (!newsContainer) return;
    
    const newsData = [
        { 
            id: 1, 
            title: 'Зимние каникулы', 
            date: '01.01.2026', 
            shortDesc: 'Каникулы с 29.12 по 12.01',
            fullText: '📢 Уважаемые учащиеся, учителя и родители!\n\nПоздравляем всех с наступающим Новым годом! 🎄\n\nЗимние каникулы продлятся с 29 декабря 2025 года по 12 января 2026 года.\n\n📌 Важная информация:\n• Школа будет закрыта на период каникул\n• Дежурный администратор на связи по телефону +7 (928) 714-97-23\n• Экстренные вопросы можно направлять на email: admin@gym4.ru\n\nЖелаем вам отличного отдыха, набраться сил и с новыми силами приступить к учебе 13 января.\n\nБерегите себя и своих близких! ✨' 
        },
        { 
            id: 2, 
            title: 'Педагогический совет', 
            date: '15.01.2026', 
            shortDesc: 'Итоги второй четверти',
            fullText: '📢 Уважаемые коллеги!\n\n15 января 2026 года в 15:00 в актовом зале состоится педагогический совет.\n\n📌 Повестка дня:\n1. Итоги успеваемости за вторую четверть\n2. Анализ результатов контрольных работ\n3. Планирование работы на третью четверть\n4. Утверждение графика проведения олимпиад\n5. Разное\n\n📍 Место проведения: актовый зал (3 этаж)\n⏰ Время: 15:00\n\nЯвка всех учителей обязательна. При себе иметь планшет или тетрадь для заметок.' 
        },
        { 
            id: 3, 
            title: 'День открытых дверей', 
            date: '20.02.2026', 
            shortDesc: 'Приглашаем будущих первоклассников и их родителей',
            fullText: '📢 Уважаемые родители будущих первоклассников!\n\n20 февраля 2026 года в нашей гимназии пройдет День открытых дверей.\n\n📌 Программа мероприятия:\n• 10:00 - 11:00 — Экскурсия по гимназии\n• 11:00 - 12:00 — Встреча с директором и учителями начальных классов\n• 12:00 - 13:00 — Открытые уроки и мастер-классы\n• 13:00 - 14:00 — Ответы на вопросы родителей\n\n📍 Адрес: г. Нальчик, ул. Кулиева, д. 20\n📞 Телефон для справок: +7 (8662) 77-55-44\n\nПри себе иметь паспорт. Ждем вас!' 
        },
        { 
            id: 4, 
            title: 'Олимпиада по математике', 
            date: '10.03.2026', 
            shortDesc: 'Школьный этап Всероссийской олимпиады',
            fullText: '📢 Внимание, ученики 7-11 классов!\n\n10 марта 2026 года состоится школьный этап Всероссийской олимпиады по математике.\n\n📌 Информация:\n• Начало: 10:00\n• Место: кабинет 301\n• Продолжительность: 3 часа (180 минут)\n\n📌 Что нужно знать:\n• При себе иметь паспорт или дневник\n• Разрешены: ручка, карандаш, линейка, циркуль\n• Запрещены: телефоны, калькуляторы, шпаргалки\n\n🏆 Победители будут награждены грамотами и призами.\n\nЖелаем удачи! 🍀' 
        }
    ];
    
    newsContainer.innerHTML = newsData.map(news => `
        <div class="news-card animate" data-news-id="${news.id}">
            <img src="news/news${news.id}.jpg" class="news-image" alt="${news.title}" onerror="this.src='https://placehold.co/400x200?text=Нет+фото'">
            <div class="news-content">
                <div class="news-date">📅 ${news.date}</div>
                <h3>${news.title}</h3>
                <p>${news.shortDesc}</p>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.news-card').forEach(card => {
        card.onclick = () => {
            const id = parseInt(card.dataset.newsId);
            const news = newsData.find(n => n.id === id);
            if (news) showNewsModal(news);
        };
    });
}

function showNewsModal(news) {
    const modal = document.getElementById('newsModal');
    if (!modal) return;
    
    document.getElementById('modalTitle').textContent = news.title;
    document.getElementById('modalDate').textContent = `📅 ${news.date}`;
    document.getElementById('modalDescription').innerHTML = news.fullText.replace(/\n/g, '<br>');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    modal.querySelector('.modal-close').onclick = closeModal;
    modal.onclick = (e) => { if (e.target === modal) closeModal(); };
    
    document.onkeydown = (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    };
}

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
    
    loginInput.addEventListener('input', function() {
        const login = this.value.trim();
        if (login.length === 0) return;
        
        if (!/^[a-zA-Z0-9_]+$/.test(login)) {
            document.getElementById('loginError').textContent = 'Только латиница, цифры и _';
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('loginSuccess').style.display = 'none';
            this.classList.add('error');
        } else if (existingLogins.includes(login)) {
            document.getElementById('loginError').textContent = 'Логин уже занят';
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('loginSuccess').style.display = 'none';
            this.classList.add('error');
        } else {
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('loginSuccess').style.display = 'block';
            this.classList.remove('error');
            this.classList.add('success');
        }
    });
    
    form.onsubmit = (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value.trim();
        const login = document.getElementById('login').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;
        const agree = document.getElementById('agree').checked;
        
        let isValid = true;
        
        if (!fullName || !/^[А-Яа-яЁё\s-]+$/.test(fullName)) {
            showError('fullNameError', true);
            isValid = false;
        }
        if (!login || existingLogins.includes(login)) {
            showError('loginError', true);
            isValid = false;
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('emailError', true);
            isValid = false;
        }
        if (!password || password.length < 6) {
            showError('passwordError', true);
            isValid = false;
        }
        if (password !== confirm) {
            showError('confirmPasswordError', true);
            isValid = false;
        }
        if (!agree) {
            showError('agreeError', true);
            isValid = false;
        }
        
        if (!isValid) return;
        
        const newUser = {
            id: Date.now(),
            fullName: fullName,
            login: login,
            password: password,
            email: email,
            role: 'user',
            regDate: new Date().toLocaleDateString('ru-RU')
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        alert(`Регистрация успешна! Добро пожаловать, ${fullName}!\n\nПосле подтверждения администратором вам откроется доступ к созданию заявок.`);
        window.location.href = 'index.html';
    };
}

function showError(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? 'block' : 'none';
}

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
            alert(`Добро пожаловать, ${user.fullName}!`);
            
            if (user.role === 'admin') {
                window.location.href = 'admin.html';
            } else if (user.role === 'teacher') {
                window.location.href = 'my_requests.html';
            } else {
                window.location.href = 'index.html';
                setTimeout(() => {
                    alert('Ваш аккаунт ожидает подтверждения администратором. Доступ к заявкам откроется позже.');
                }, 500);
            }
        } else {
            document.getElementById('loginError').style.display = 'block';
            document.getElementById('passwordError').style.display = 'block';
        }
    };
}

// --- Мои заявки ---
function initMyRequests() {
    if (!currentUser || currentUser.role !== 'teacher') {
        alert('Доступ запрещен. Только подтвержденные учителя могут создавать заявки.');
        window.location.href = 'index.html';
        return;
    }
    
    loadUserRequests();
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterRequests(btn.dataset.filter);
        };
    });
}

function loadUserRequests() {
    const userRequests = requests.filter(r => r.userId === currentUser.id);
    renderRequests(userRequests);
}

function renderRequests(requestsList) {
    const container = document.getElementById('requestsList');
    const emptyState = document.getElementById('emptyState');
    
    if (!container) return;
    
    if (requestsList.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }
    
    if (emptyState) emptyState.classList.add('hidden');
    
    container.innerHTML = requestsList.map(req => `
        <div class="request-card ${req.status}">
            <div class="request-header">
                <div class="request-title">${escapeHtml(req.title)}</div>
                <div class="request-date">📅 ${req.date}</div>
            </div>
            <div class="request-category">📂 ${req.category}</div>
            <div class="request-description">${escapeHtml(req.description)}</div>
            ${req.status === 'rejected' && req.rejectReason ? `<div class="request-reason">❌ Причина: ${escapeHtml(req.rejectReason)}</div>` : ''}
            <div class="request-footer">
                <span class="status-badge status-${req.status}">${getStatusText(req.status)}</span>
                ${req.status === 'new' ? `<button class="btn btn-danger btn-sm" onclick="deleteRequest(${req.id})"><i class="fas fa-trash"></i> Удалить</button>` : ''}
            </div>
        </div>
    `).join('');
}

function filterRequests(filter) {
    let filtered = requests.filter(r => r.userId === currentUser.id);
    if (filter !== 'all') filtered = filtered.filter(r => r.status === filter);
    renderRequests(filtered);
}

function deleteRequest(id) {
    if (confirm('Удалить заявку?')) {
        requests = requests.filter(r => r.id !== id);
        localStorage.setItem('requests', JSON.stringify(requests));
        loadUserRequests();
    }
}

function getStatusText(status) {
    const statuses = { 'new': '🟡 Новая', 'solved': '✅ Решена', 'rejected': '❌ Отклонена' };
    return statuses[status] || status;
}

// --- Создание заявки ---
function initCreateRequest() {
    if (!currentUser || currentUser.role !== 'teacher') {
        alert('Доступ запрещен. Только подтвержденные учителя могут создавать заявки.');
        window.location.href = 'index.html';
        return;
    }
    
    const categorySelect = document.getElementById('requestCategory');
    if (categorySelect) {
        categories = JSON.parse(localStorage.getItem('categories')) || categories;
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>' + 
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
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
            
            const newRequest = {
                id: Date.now(),
                userId: currentUser.id,
                title: title,
                category: category,
                description: description,
                date: new Date().toLocaleDateString('ru-RU'),
                status: 'new',
                rejectReason: null
            };
            
            requests.push(newRequest);
            localStorage.setItem('requests', JSON.stringify(requests));
            alert('Заявка успешно создана!');
            window.location.href = 'my_requests.html';
        };
    }
}

// --- Админ-панель ---
function initAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    
    loadAllRequests();
    loadCategoriesList();
    loadUsersList();
    updateStats();
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function activateTab(tabId) {
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        const activeContent = document.getElementById(`${tabId}Tab`);
        if (activeContent) activeContent.classList.add('active');
    }
    
    tabBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const tabId = btn.getAttribute('data-tab');
            if (tabId) activateTab(tabId);
        };
    });
}

function loadAllRequests() {
    const tableBody = document.getElementById('requestsTableBody');
    const cardsContainer = document.getElementById('requestsCards');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = requests.map(req => {
        const user = users.find(u => u.id === req.userId);
        return `
            <tr>
                <td>${req.id}</td>
                <td>${req.date}</td>
                <td>${user ? user.fullName : 'Неизвестно'} ${user && user.role === 'user' ? '(ожидает)' : ''}</td>
                <td>${escapeHtml(req.title)}</td>
                <td>${req.category}</td>
                <td><span class="status-badge status-${req.status}">${getStatusText(req.status)}</span></td>
                <td>
                    ${req.status === 'new' ? `
                        <button class="btn btn-success btn-sm" onclick="solveRequest(${req.id})">✅ Решить</button>
                        <button class="btn btn-danger btn-sm" onclick="openRejectModal(${req.id})">❌ Отклонить</button>
                    ` : ''}
                  </div>
            </tr>
        `;
    }).join('');
    
    if (cardsContainer) {
        cardsContainer.innerHTML = requests.map(req => {
            const user = users.find(u => u.id === req.userId);
            return `
                <div class="request-card ${req.status}">
                    <div class="request-header">
                        <div class="request-title">${escapeHtml(req.title)}</div>
                        <div class="request-date">📅 ${req.date}</div>
                    </div>
                    <div class="request-category">📂 ${req.category}</div>
                    <div><strong>👤 ${user ? user.fullName : 'Неизвестно'}</strong></div>
                    <div class="request-description">${escapeHtml(req.description)}</div>
                    ${req.status === 'rejected' && req.rejectReason ? `<div class="request-reason">❌ Причина: ${escapeHtml(req.rejectReason)}</div>` : ''}
                    <div class="request-footer">
                        <span class="status-badge status-${req.status}">${getStatusText(req.status)}</span>
                        ${req.status === 'new' ? `
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-success btn-sm" onclick="solveRequest(${req.id})">✅ Решить</button>
                                <button class="btn btn-danger btn-sm" onclick="openRejectModal(${req.id})">❌ Отклонить</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function loadCategoriesList() {
    const container = document.getElementById('categoriesList');
    if (!container) return;
    
    categories = JSON.parse(localStorage.getItem('categories')) || categories;
    container.innerHTML = categories.map(cat => `
        <div class="category-item">
            <span>${cat}</span>
            <button class="btn btn-danger btn-sm" onclick="deleteCategory('${cat}')">🗑️</button>
        </div>
    `).join('');
}

function loadUsersList() {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = users.map(user => {
        const userRequests = requests.filter(r => r.userId === user.id).length;
        const roleDisplay = user.role === 'admin' ? '👑 Админ' : (user.role === 'teacher' ? '👨‍🏫 Учитель' : '👤 Пользователь (ожидает)');
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.fullName}</td>
                <td>${user.login}</td>
                <td>${user.email}</td>
                <td>
                    ${roleDisplay}
                    ${user.role === 'user' ? `
                        <button class="btn btn-success btn-sm" style="margin-left: 0.5rem;" onclick="confirmUser(${user.id})">
                            ✅ Подтвердить
                        </button>
                    ` : ''}
                    ${user.role === 'teacher' ? `
                        <button class="btn btn-warning btn-sm" style="margin-left: 0.5rem;" onclick="revokeTeacher(${user.id})">
                            🔄 Отозвать
                        </button>
                    ` : ''}
                  </div>
                <td>${userRequests}</div>
            </tr>
        `;
    }).join('');
}

function confirmUser(userId) {
    if (confirm('Подтвердить доступ пользователя к созданию заявок?')) {
        const user = users.find(u => u.id === userId);
        if (user && user.role === 'user') {
            user.role = 'teacher';
            localStorage.setItem('users', JSON.stringify(users));
            loadUsersList();
            alert(`Пользователь ${user.fullName} теперь имеет доступ к созданию заявок!`);
        }
    }
}

function revokeTeacher(userId) {
    if (confirm('Отозвать доступ к созданию заявок у этого учителя?')) {
        const user = users.find(u => u.id === userId);
        if (user && user.role === 'teacher') {
            user.role = 'user';
            localStorage.setItem('users', JSON.stringify(users));
            loadUsersList();
            alert(`Доступ пользователя ${user.fullName} к заявкам отозван.`);
        }
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalRequests');
    const newEl = document.getElementById('newRequests');
    const solvedEl = document.getElementById('solvedRequests');
    const rejectedEl = document.getElementById('rejectedRequests');
    
    if (totalEl) totalEl.textContent = requests.length;
    if (newEl) newEl.textContent = requests.filter(r => r.status === 'new').length;
    if (solvedEl) solvedEl.textContent = requests.filter(r => r.status === 'solved').length;
    if (rejectedEl) rejectedEl.textContent = requests.filter(r => r.status === 'rejected').length;
}

let currentRejectId = null;

function openRejectModal(id) {
    currentRejectId = id;
    const modal = document.getElementById('rejectModal');
    if (modal) modal.classList.add('active');
}

function closeRejectModal() {
    const modal = document.getElementById('rejectModal');
    if (modal) modal.classList.remove('active');
    const reasonInput = document.getElementById('rejectReason');
    if (reasonInput) reasonInput.value = '';
}

function confirmReject() {
    const reason = document.getElementById('rejectReason').value.trim();
    if (!reason) {
        alert('Укажите причину отклонения');
        return;
    }
    
    const request = requests.find(r => r.id === currentRejectId);
    if (request) {
        request.status = 'rejected';
        request.rejectReason = reason;
        localStorage.setItem('requests', JSON.stringify(requests));
        loadAllRequests();
        updateStats();
        closeRejectModal();
        alert('Заявка отклонена');
    }
}

function solveRequest(id) {
    if (confirm('Отметить заявку как решенную?')) {
        const request = requests.find(r => r.id === id);
        if (request) {
            request.status = 'solved';
            localStorage.setItem('requests', JSON.stringify(requests));
            loadAllRequests();
            updateStats();
            alert('Заявка решена');
        }
    }
}

function addCategory() {
    const input = document.getElementById('newCategoryName');
    const name = input.value.trim();
    if (!name) {
        alert('Введите название категории');
        return;
    }
    
    categories = JSON.parse(localStorage.getItem('categories')) || categories;
    if (categories.includes(name)) {
        alert('Такая категория уже существует');
        return;
    }
    
    categories.push(name);
    localStorage.setItem('categories', JSON.stringify(categories));
    loadCategoriesList();
    input.value = '';
    alert('Категория добавлена');
}

function deleteCategory(name) {
    if (confirm(`Удалить категорию "${name}"?`)) {
        categories = categories.filter(c => c !== name);
        localStorage.setItem('categories', JSON.stringify(categories));
        loadCategoriesList();
        alert('Категория удалена');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}
