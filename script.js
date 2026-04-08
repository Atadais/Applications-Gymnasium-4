// ========== ДАННЫЕ ==========
let users = JSON.parse(localStorage.getItem('users')) || [
    {id: 1, login: 'admin', password: 'admin', fio: 'Администратор', email: 'admin@mail.ru', role: 'admin'},
    {id: 2, login: 'ivanov', password: '123', fio: 'Иванов Иван Иванович', email: 'ivanov@mail.ru', role: 'teacher'},
    {id: 3, login: 'petrov', password: '123', fio: 'Петров Петр Петрович', email: 'petrov@mail.ru', role: 'user'}
];
let requests = JSON.parse(localStorage.getItem('requests')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['Техника', 'Мебель', 'Сантехника', 'Учебные вопросы', 'Методическая работа'];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// ========== СОХРАНЕНИЕ ==========
function saveAll() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('requests', JSON.stringify(requests));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ЭКРАНИРОВАНИЯ HTML ==========
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ========== ПЛАВНЫЕ УВЕДОМЛЕНИЯ ==========
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</div>
        <div class="notification-content">${message}</div>
        <button class="notification-close">×</button>
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.15);
                z-index: 2000;
                transform: translateX(120%);
                transition: transform 0.3s ease;
                max-width: 350px;
                font-size: 14px;
                border-left: 4px solid;
            }
            .notification-success { border-left-color: #28a745; }
            .notification-error { border-left-color: #D52B1E; }
            .notification-info { border-left-color: #2A5C9E; }
            .notification-icon { font-size: 20px; }
            .notification-content { flex: 1; color: #333; }
            .notification-close {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: #999;
                padding: 0 5px;
            }
            .notification-close:hover { color: #333; }
            .notification.show { transform: translateX(0); }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// ========== РЕГИСТРАЦИЯ ==========
function register(fio, login, email, password, confirmPass) {
    if (!/^[а-яА-ЯёЁ\s\-]+$/.test(fio)) return 'ФИО только русские буквы';
    if (users.find(u => u.login === login)) return 'Логин уже занят';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email';
    if (password !== confirmPass) return 'Пароли не совпадают';
    if (password.length < 3) return 'Пароль минимум 3 символа';
    
    users.push({id: Date.now(), fio, login, email, password, role: 'user'});
    saveAll();
    return 'ok';
}

// ========== ВХОД ==========
function loginUser(login, password) {
    let user = users.find(u => u.login === login && u.password === password);
    if (user) { 
        currentUser = user; 
        saveAll(); 
        return true; 
    }
    return false;
}

// ========== ВЫХОД ==========
function logout() { 
    currentUser = null; 
    saveAll(); 
    showNotification('Вы вышли из системы', 'info');
    updateNavButtons();
    location.href = 'index.html'; 
}

// ========== ОБНОВЛЕНИЕ КНОПОК В ШАПКЕ ==========
function updateNavButtons() {
    const mainNav = document.querySelector('.main-nav');
    const mobileNav = document.querySelector('#mobileNav');
    
    if (!mainNav) return;
    
    let authLink = mainNav.querySelector('#auth-link');
    let mobileAuthLink = mobileNav ? mobileNav.querySelector('#mobile-auth-link') : null;
    
    if (currentUser) {
        if (authLink) {
            authLink.textContent = 'Выйти';
            authLink.href = '#';
            authLink.removeEventListener('click', logout);
            authLink.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
        if (mobileAuthLink) {
            mobileAuthLink.textContent = 'Выйти';
            mobileAuthLink.href = '#';
            mobileAuthLink.removeEventListener('click', logout);
            mobileAuthLink.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    } else {
        if (authLink) {
            authLink.textContent = 'Зарегистрироваться';
            authLink.href = 'register.html';
        }
        if (mobileAuthLink) {
            mobileAuthLink.textContent = 'Зарегистрироваться';
            mobileAuthLink.href = 'register.html';
        }
    }
}

// ========== ПРОВЕРКА ПРАВ ==========
function canCreateRequests() {
    return currentUser && (currentUser.role === 'teacher' || currentUser.role === 'admin');
}

// ========== СОЗДАТЬ ЗАЯВКУ ==========
function createRequest(title, category, description) {
    if (!canCreateRequests()) return false;
    if (!currentUser) return false;
    
    requests.push({
        id: Date.now(),
        userId: currentUser.id,
        userRole: currentUser.role,
        title: title,
        category: category,
        description: description,
        status: 'Новая',
        date: new Date().toLocaleString('ru-RU'),
        rejectReason: ''
    });
    saveAll();
    return true;
}

// ========== ПОЛУЧИТЬ ЗАЯВКИ ПОЛЬЗОВАТЕЛЯ ==========
function getUserRequests(filter = 'all') {
    let userReqs = requests.filter(r => r.userId === currentUser?.id);
    if (filter === 'all') return userReqs;
    return userReqs.filter(r => r.status === filter);
}

// ========== УДАЛИТЬ ЗАЯВКУ ==========
function deleteRequest(id) {
    let req = requests.find(r => r.id === id);
    if (req && req.userId === currentUser?.id && req.status === 'Новая') {
        if (confirm('Удалить заявку?')) {
            requests = requests.filter(r => r.id !== id);
            saveAll();
            showNotification('Заявка удалена', 'success');
            return true;
        }
    }
    return false;
}

// ========== АДМИН: СМЕНИТЬ СТАТУС ==========
function changeStatus(id, newStatus, reason = '') {
    if (currentUser?.role !== 'admin') return false;
    let req = requests.find(r => r.id === id);
    if (req && req.status === 'Новая') {
        req.status = newStatus;
        if (newStatus === 'Отклонена') req.rejectReason = reason;
        saveAll();
        showNotification(`Заявка ${newStatus === 'Решена' ? 'отмечена как решенная' : 'отклонена'}`, 'success');
        return true;
    }
    return false;
}

// ========== ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ==========
function getAllUsers() {
    return users;
}

// ========== СЧЕТЧИК ПОСЕЩЕНИЙ ==========
function initCounter() {
    let counter = localStorage.getItem('visitorCounter');
    if (!counter) {
        counter = 1250;
    } else {
        counter = parseInt(counter) + 1;
    }
    localStorage.setItem('visitorCounter', counter);
    const counterSpan = document.getElementById('counter');
    if (counterSpan) {
        counterSpan.textContent = counter;
    }
}

// ========== БУРГЕР-МЕНЮ ==========
function initBurgerMenu() {
    const burgerBtn = document.getElementById('burgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const overlay = document.getElementById('overlay');
    
    if (!burgerBtn || !mobileNav || !overlay) return;
    
    function closeMenu() {
        mobileNav.classList.remove('open');
        overlay.classList.remove('active');
        burgerBtn.classList.remove('open');
    }
    
    function openMenu() {
        mobileNav.classList.add('open');
        overlay.classList.add('active');
        burgerBtn.classList.add('open');
    }
    
    burgerBtn.addEventListener('click', () => {
        if (mobileNav.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });
    
    overlay.addEventListener('click', closeMenu);
    
    mobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}

// ========== ЗАГРУЗКА ЗАЯВОК (ТАБЛИЦА + КАРТОЧКИ) ==========
let currentFilter = 'all';

function loadRequestsTable() {
    let reqs = getUserRequests(currentFilter);
    let tbody = document.getElementById('requests-table');
    let cardsContainer = document.getElementById('requests-cards');
    
    if (tbody) {
        let html = '';
        reqs.forEach(r => {
            let statusColor = r.status === 'Новая' ? '#F9A826' : (r.status === 'Решена' ? '#2A5C9E' : '#D52B1E');
            let statusText = r.status === 'Новая' ? '🟡 Новая' : (r.status === 'Решена' ? '✅ Решена' : '❌ Отклонена');
            html += `<tr>
                <td>${escapeHtml(r.date)}</td>
                <td><strong>${escapeHtml(r.title)}</strong></td>
                <td>${escapeHtml(r.category)}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                <td>
                    ${r.status === 'Новая' ? `<button class="danger delete-req-btn" data-id="${r.id}">🗑 Удалить</button>` : (r.status === 'Отклонена' ? `<span title="${escapeHtml(r.rejectReason || '')}" style="font-size:12px; color:#999;">❓ ${escapeHtml(r.rejectReason || 'нет причины')}</span>` : '—')}
                </td>
            </tr>`;
        });
        
        if (reqs.length === 0) {
            html = '<tr><td colspan="5" style="text-align: center; padding: 40px;">📭 Нет заявок</td></tr>';
        }
        
        tbody.innerHTML = html;
    }
    
    if (cardsContainer) {
        let cardsHtml = '';
        reqs.forEach(r => {
            let cardClass = r.status === 'Новая' ? 'request-card-new' : (r.status === 'Решена' ? 'request-card-resolved' : 'request-card-rejected');
            let statusClass = r.status === 'Новая' ? 'status-new' : (r.status === 'Решена' ? 'status-resolved' : 'status-rejected');
            let statusText = r.status === 'Новая' ? '🟡 Новая' : (r.status === 'Решена' ? '✅ Решена' : '❌ Отклонена');
            
            cardsHtml += `
                <div class="request-card ${cardClass}">
                    <div class="request-card-header">
                        <div class="request-card-title">${escapeHtml(r.title)}</div>
                        <div class="request-card-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="request-card-date">📅 ${escapeHtml(r.date)}</div>
                    <div class="request-card-category"><span>📁 ${escapeHtml(r.category)}</span></div>
                    ${r.status === 'Отклонена' && r.rejectReason ? `<div class="request-card-reason">❌ Причина: ${escapeHtml(r.rejectReason)}</div>` : ''}
                    <div class="request-card-actions">
                        ${r.status === 'Новая' ? `<button class="danger delete-req-card-btn" data-id="${r.id}">🗑 Удалить</button>` : ''}
                    </div>
                </div>
            `;
        });
        
        if (reqs.length === 0) {
            cardsHtml = '<div style="text-align: center; padding: 40px; background: white; border-radius: 16px;">📭 Нет заявок</div>';
        }
        
        cardsContainer.innerHTML = cardsHtml;
        
        document.querySelectorAll('.delete-req-card-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                let id = parseInt(this.dataset.id);
                if (deleteRequest(id)) loadRequestsTable();
            });
        });
    }
    
    document.querySelectorAll('.delete-req-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            let id = parseInt(this.dataset.id);
            if (deleteRequest(id)) loadRequestsTable();
        });
    });
}

// ========== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ==========
document.addEventListener('DOMContentLoaded', function() {
    let path = window.location.pathname;
    
    updateNavButtons();
    initBurgerMenu();
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        initCounter();
        
        // ========== НОВОСТИ С ОТКРЫТИЕМ ПРИ НАЖАТИИ ==========
        const newsDatabase = {
            1: {
                title: 'Зимние каникулы',
                date: '01.01.2026',
                fullDescription: 'Уважаемые ученики и родители! Зимние каникулы продлятся с 29 декабря по 12 января. Желаем всем отлично отдохнуть, набраться сил и встретить Новый год с хорошим настроением! Занятия в школе возобновятся 13 января. Берегите себя и соблюдайте правила безопасности во время каникул.',
                imageSrc: 'news/news1.jpg'
            },
            2: {
                title: 'Родительское собрание',
                date: '02.01.2026',
                fullDescription: 'Приглашаем всех родителей на общешкольное родительское собрание, которое состоится 15 января в 18:00 в актовом зале. Повестка дня: итоги первого полугодия, организация учебного процесса во втором полугодии, профилактика детского травматизма, ответы на вопросы. Явка обязательна!',
                imageSrc: 'news/news2.jpg'
            },
            3: {
                title: 'Олимпиада по математике',
                date: '03.01.2026',
                fullDescription: 'Школьный этап Всероссийской олимпиады по математике состоится 20 января. Приглашаются ученики 5-11 классов. Олимпиада пройдет в два тура: теоретический и практический. Победители будут представлять нашу гимназию на муниципальном этапе. Желаем успехов! Регистрация участников до 15 января у учителей математики.',
                imageSrc: 'news/news3.jpg'
            },
            4: {
                title: 'Ремонт в столовой',
                date: '04.01.2026',
                fullDescription: 'Рады сообщить, что в школьной столовой завершен долгожданный ремонт! Обновлено освещение, установлена новая мебель, улучшена вентиляция. Меню стало еще разнообразнее и полезнее. Приглашаем всех оценить обновленную столовую после каникул! Администрация благодарит родителей за помощь в организации ремонта.',
                imageSrc: 'news/news4.jpg'
            }
        };
        
        const modal = document.getElementById('newsModal');
        if (modal) {
            const modalImage = document.getElementById('modalImage');
            const modalDate = document.getElementById('modalDate');
            const modalTitle = document.getElementById('modalTitle');
            const modalDescription = document.getElementById('modalDescription');
            const closeModalBtn = document.getElementById('closeModalBtn');
            
            function openNewsModal(newsId) {
                const news = newsDatabase[newsId];
                if (!news) return;
                
                modalImage.src = news.imageSrc;
                modalImage.alt = news.title;
                modalImage.onerror = function() {
                    this.src = 'https://placehold.co/400x200?text=Нет+фото';
                };
                modalDate.textContent = `📅 ${news.date}`;
                modalTitle.textContent = news.title;
                modalDescription.textContent = news.fullDescription;
                
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            function closeNewsModal() {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            const newsCards = document.querySelectorAll('.news-card');
            newsCards.forEach(card => {
                card.style.cursor = 'pointer';
                card.addEventListener('click', function(e) {
                    if (e.target.tagName === 'A') return;
                    const newsId = this.dataset.newsId;
                    if (newsId) openNewsModal(newsId);
                });
            });
            
            if (closeModalBtn) closeModalBtn.addEventListener('click', closeNewsModal);
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closeNewsModal();
            });
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modal.classList.contains('active')) closeNewsModal();
            });
        }
    }
    
    if (path.includes('login.html')) {
        let loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                let login = document.getElementById('login').value;
                let pass = document.getElementById('password').value;
                let errorDiv = document.getElementById('error');
                
                if (loginUser(login, pass)) {
                    showNotification(`Добро пожаловать, ${currentUser.fio}!`, 'success');
                    updateNavButtons();
                    if (currentUser.role === 'admin') {
                        location.href = 'admin.html';
                    } else {
                        location.href = 'my_requests.html';
                    }
                } else {
                    errorDiv.textContent = 'Неверный логин или пароль';
                    showNotification('Неверный логин или пароль', 'error');
                }
            });
        }
    }
    
    if (path.includes('register.html')) {
        let registerBtn = document.getElementById('register-btn');
        if (registerBtn) {
            registerBtn.addEventListener('click', function() {
                let fio = document.getElementById('fio').value;
                let login = document.getElementById('login').value;
                let email = document.getElementById('email').value;
                let pass = document.getElementById('pass').value;
                let pass2 = document.getElementById('pass2').value;
                let agree = document.getElementById('agree').checked;
                let errorDiv = document.getElementById('error');
                
                if (!agree) {
                    errorDiv.textContent = 'Необходимо согласие на обработку данных';
                    showNotification('Необходимо согласие на обработку данных', 'error');
                    return;
                }
                
                let result = register(fio, login, email, pass, pass2);
                if (result === 'ok') {
                    showNotification('Регистрация успешна! Теперь можно войти.', 'success');
                    setTimeout(() => { location.href = 'login.html'; }, 1500);
                } else {
                    errorDiv.textContent = result;
                    showNotification(result, 'error');
                }
            });
        }
    }
    
    if (path.includes('create_request.html')) {
        if (!currentUser) {
            location.href = 'login.html';
        }
        
        let categorySelect = document.getElementById('category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
            categories.forEach(c => {
                let option = document.createElement('option');
                option.value = c;
                option.textContent = c;
                categorySelect.appendChild(option);
            });
        }
        
        if (!canCreateRequests()) {
            let accessError = document.getElementById('access-error');
            if (accessError) accessError.classList.remove('hidden');
            let titleInput = document.getElementById('title');
            let categoryInput = document.getElementById('category');
            let descInput = document.getElementById('description');
            let submitBtn = document.getElementById('submit-btn');
            if (titleInput) titleInput.disabled = true;
            if (categoryInput) categoryInput.disabled = true;
            if (descInput) descInput.disabled = true;
            if (submitBtn) submitBtn.disabled = true;
        }
        
        let submitBtn = document.getElementById('submit-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                if (!canCreateRequests()) {
                    showNotification('У вас нет прав для создания заявки', 'error');
                    return;
                }
                
                let title = document.getElementById('title').value.trim();
                let category = document.getElementById('category').value;
                let description = document.getElementById('description').value.trim();
                
                if (!title || !description) {
                    showNotification('Заполните все поля', 'error');
                    return;
                }
                
                if (!category) {
                    showNotification('Выберите категорию', 'error');
                    return;
                }
                
                if (createRequest(title, category, description)) {
                    showNotification('Заявка успешно создана!', 'success');
                    setTimeout(() => { location.href = 'my_requests.html'; }, 1000);
                } else {
                    showNotification('Ошибка при создании заявки', 'error');
                }
            });
        }
    }
    
    if (path.includes('my_requests.html')) {
        if (!currentUser) {
            location.href = 'login.html';
            return;
        }
        
        let teacherInfo = document.getElementById('teacher-info');
        let userInfo = document.getElementById('user-info');
        let adminInfo = document.getElementById('admin-info');
        let newRequestBtn = document.getElementById('new-request-btn');
        
        if (currentUser.role === 'teacher') {
            if (teacherInfo) teacherInfo.classList.remove('hidden');
            if (newRequestBtn) newRequestBtn.style.display = 'inline-block';
        } else if (currentUser.role === 'admin') {
            if (adminInfo) adminInfo.classList.remove('hidden');
            if (newRequestBtn) newRequestBtn.style.display = 'inline-block';
        } else {
            if (userInfo) userInfo.classList.remove('hidden');
            if (newRequestBtn) newRequestBtn.style.display = 'none';
        }
        
        if (newRequestBtn) {
            newRequestBtn.addEventListener('click', function() {
                location.href = 'create_request.html';
            });
        }
        
        function filterRequests(filter, btnElement) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');
            loadRequestsTable();
        }
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                let filter = this.dataset.filter;
                filterRequests(filter, this);
            });
        });
        
        loadRequestsTable();
    }
    
    if (path.includes('admin.html')) {
        if (!currentUser || currentUser.role !== 'admin') {
            location.href = 'index.html';
            return;
        }
        
        function loadUsersTable() {
            let tbody = document.getElementById('users-table');
            if (!tbody) return;
            
            let html = '';
            getAllUsers().forEach(u => {
                let roleText = u.role === 'admin' ? '👑 Администратор' : (u.role === 'teacher' ? '👨‍🏫 Учитель' : '👤 Пользователь');
                let btn = '';
                if (u.role === 'admin') {
                    btn = '<span style="color: #999;">—</span>';
                } else if (u.role === 'teacher') {
                    btn = `<button class="remove-teacher-btn danger" data-id="${u.id}">🔽 Убрать права</button>`;
                } else {
                    btn = `<button class="make-teacher-btn" data-id="${u.id}">⬆ Назначить учителем</button>`;
                }
                html += `<tr>
                    <td>${escapeHtml(u.fio)}</td>
                    <td>${escapeHtml(u.login)}</td>
                    <td>${escapeHtml(u.email)}</td>
                    <td>${roleText}</td>
                    <td>${btn}</td>
                </tr>`;
            });
            tbody.innerHTML = html;
            
            document.querySelectorAll('.make-teacher-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let userId = parseInt(this.dataset.id);
                    let user = users.find(u => u.id === userId);
                    if (user && user.role === 'user') {
                        if (confirm(`Назначить "${user.fio}" учителем?`)) {
                            user.role = 'teacher';
                            saveAll();
                            loadUsersTable();
                            showNotification(`${user.fio} теперь учитель!`, 'success');
                        }
                    }
                });
            });
            
            document.querySelectorAll('.remove-teacher-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let userId = parseInt(this.dataset.id);
                    let user = users.find(u => u.id === userId);
                    if (user && user.role === 'teacher') {
                        if (confirm(`Убрать права учителя у "${user.fio}"?`)) {
                            user.role = 'user';
                            saveAll();
                            loadUsersTable();
                            showNotification(`У ${user.fio} убраны права учителя`, 'info');
                        }
                    }
                });
            });
        }
        
        function loadAllRequestsTable() {
            let tbody = document.getElementById('requests-table');
            if (!tbody) return;
            
            let html = '';
            [...requests].reverse().forEach(r => {
                let user = users.find(u => u.id === r.userId);
                let username = user ? user.fio : 'Неизвестно';
                let userRole = user ? (user.role === 'teacher' ? '👨‍🏫 Учитель' : (user.role === 'admin' ? '👑 Админ' : '👤 Пользователь')) : 'Неизвестно';
                let statusColor = r.status === 'Новая' ? '#F9A826' : (r.status === 'Решена' ? '#2A5C9E' : '#D52B1E');
                let statusText = r.status === 'Новая' ? '🟡 Новая' : (r.status === 'Решена' ? '✅ Решена' : '❌ Отклонена');
                
                html += `<tr>
                    <td>${escapeHtml(r.date)}</td>
                    <td>${escapeHtml(username)}</td>
                    <td>${userRole}</td>
                    <td><strong>${escapeHtml(r.title)}</strong></td>
                    <td>${escapeHtml(r.category)}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                    <td>
                        ${r.status === 'Новая' ? 
                            `<button class="solve-req-btn" data-id="${r.id}">✅ Решена</button>
                             <button class="reject-req-btn danger" data-id="${r.id}">❌ Отклонить</button>` : 
                            (r.status === 'Отклонена' ? `<span title="${escapeHtml(r.rejectReason || '')}" style="font-size:12px; color:#999;">📝 ${escapeHtml(r.rejectReason || 'нет причины')}</span>` : '—')}
                    </td>
                </tr>`;
            });
            
            if (requests.length === 0) {
                html = '<tr><td colspan="7" style="text-align: center; padding: 40px;">📭 Нет заявок</td></tr>';
            }
            
            tbody.innerHTML = html;
            
            document.querySelectorAll('.solve-req-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let id = parseInt(this.dataset.id);
                    if (changeStatus(id, 'Решена')) {
                        loadAllRequestsTable();
                        loadUsersTable();
                    }
                });
            });
            
            document.querySelectorAll('.reject-req-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let id = parseInt(this.dataset.id);
                    let reason = prompt('📝 Укажите причину отклонения:');
                    if (reason && reason.trim() !== '') {
                        if (changeStatus(id, 'Отклонена', reason)) {
                            loadAllRequestsTable();
                            loadUsersTable();
                        }
                    } else if (reason !== null) {
                        showNotification('Необходимо указать причину отклонения', 'error');
                    }
                });
            });
        }
        
        function loadCategoriesList() {
            let list = document.getElementById('categories-list');
            if (!list) return;
            
            let html = '';
            categories.forEach(c => {
                let hasRequests = requests.some(r => r.category === c);
                html += `<li>
                    <span>📁 ${escapeHtml(c)}</span>
                    ${!hasRequests ? `<button class="delete-cat-btn danger" data-cat="${c}">🗑 Удалить</button>` : '<span style="color: #999;">(есть заявки)</span>'}
                </li>`;
            });
            list.innerHTML = html;
            
            document.querySelectorAll('.delete-cat-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let cat = this.dataset.cat;
                    if (confirm(`Удалить категорию "${cat}"?`)) {
                        categories = categories.filter(c => c !== cat);
                        saveAll();
                        loadCategoriesList();
                        showNotification(`Категория "${cat}" удалена`, 'success');
                    }
                });
            });
        }
        
        let addBtn = document.getElementById('add-category-btn');
        if (addBtn) {
            addBtn.addEventListener('click', function() {
                let newCat = document.getElementById('new-category').value.trim();
                if (newCat && !categories.includes(newCat)) {
                    categories.push(newCat);
                    saveAll();
                    loadCategoriesList();
                    document.getElementById('new-category').value = '';
                    showNotification(`Категория "${newCat}" добавлена`, 'success');
                } else if (categories.includes(newCat)) {
                    showNotification('Такая категория уже существует', 'error');
                } else {
                    showNotification('Введите название категории', 'error');
                }
            });
        }
        
        loadUsersTable();
        loadAllRequestsTable();
        loadCategoriesList();
    }
});
