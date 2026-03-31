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

// ========== ФУНКЦИЯ ДЛЯ ДИНАМИЧЕСКОЙ НАВИГАЦИИ ==========
function updateNavigation() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;
    
    let html = `
        <a href="index.html">Главная</a>
        <a href="about.html">О нас</a>
        <a href="my_requests.html">Заявки</a>
        <a href="register.html">Регистрация</a>
    `;
    
    if (currentUser) {
        html += `<a href="#" id="logout-link">Выйти</a>`;
    } else {
        html += `<a href="login.html">Войти</a>`;
    }
    
    nav.innerHTML = html;
    
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
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
    location.href = 'index.html'; 
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
        return true;
    }
    return false;
}

// ========== ПОЛУЧИТЬ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ==========
function getAllUsers() {
    return users;
}

// ========== НОВОСТИ НА ГЛАВНОЙ ==========
function loadNews() {
    const news = [
        {date: '01.01.2026', title: 'Зимние каникулы', text: 'Каникулы с 29.12 по 12.01', img: 'https://via.placeholder.com/300x150?text=Зимние+каникулы'},
        {date: '02.01.2026', title: 'Родительское собрание', text: '15.01 в 18:00', img: 'https://via.placeholder.com/300x150?text=Родительское+собрание'},
        {date: '03.01.2026', title: 'Олимпиада по математике', text: 'Школьный этап 20.01', img: 'https://via.placeholder.com/300x150?text=Олимпиада'},
        {date: '04.01.2026', title: 'Ремонт в столовой', text: 'Завершен ремонт', img: 'https://via.placeholder.com/300x150?text=Ремонт'}
    ];
    
    let container = document.getElementById('news-container');
    if (container) {
        let html = '';
        news.forEach(n => {
            html += `<div class="news-card">
                <img src="${n.img}" class="news-image" alt="${n.title}">
                <div class="news-content">
                    <div class="news-date">${n.date}</div>
                    <h3>${n.title}</h3>
                    <p>${n.text}</p>
                </div>
            </div>`;
        });
        container.innerHTML = html;
    }
    
    let counter = parseInt(localStorage.getItem('counter')) || 1250;
    counter++;
    localStorage.setItem('counter', counter);
    let counterSpan = document.getElementById('counter');
    if (counterSpan) counterSpan.textContent = counter;
}

// ========== ИНИЦИАЛИЗАЦИЯ СТРАНИЦ ==========
document.addEventListener('DOMContentLoaded', function() {
    let path = window.location.pathname;
    
    // Обновляем навигацию для my_requests.html
    if (path.includes('my_requests.html')) {
        updateNavigation();
    }
    
    if (path.includes('index.html') || path === '/' || path.endsWith('/')) {
        loadNews();
    }
    
    let logoutLink = document.getElementById('logout-link');
    if (logoutLink && !path.includes('my_requests.html')) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    if (path.includes('login.html')) {
        let loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', function() {
                let login = document.getElementById('login').value;
                let pass = document.getElementById('password').value;
                let errorDiv = document.getElementById('error');
                
                if (loginUser(login, pass)) {
                    if (currentUser.role === 'admin') {
                        location.href = 'admin.html';
                    } else {
                        location.href = 'my_requests.html';
                    }
                } else {
                    errorDiv.textContent = 'Неверный логин или пароль';
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
                    return;
                }
                
                let result = register(fio, login, email, pass, pass2);
                if (result === 'ok') {
                    alert('Регистрация успешна! Теперь можно войти.');
                    location.href = 'login.html';
                } else {
                    errorDiv.textContent = result;
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
            // Очищаем select и добавляем категории
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
                    document.getElementById('error').textContent = 'У вас нет прав для создания заявки.';
                    return;
                }
                
                let title = document.getElementById('title').value.trim();
                let category = document.getElementById('category').value;
                let description = document.getElementById('description').value.trim();
                
                if (!title || !description) {
                    document.getElementById('error').textContent = 'Заполните все поля';
                    return;
                }
                
                if (!category) {
                    document.getElementById('error').textContent = 'Выберите категорию';
                    return;
                }
                
                if (createRequest(title, category, description)) {
                    alert('Заявка успешно создана!');
                    location.href = 'my_requests.html';
                } else {
                    document.getElementById('error').textContent = 'Ошибка при создании заявки.';
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
        
        let currentFilter = 'all';
        
        function loadRequestsTable() {
            let reqs = getUserRequests(currentFilter);
            let tbody = document.getElementById('requests-table');
            if (!tbody) return;
            
            let html = '';
            reqs.forEach(r => {
                let statusColor = r.status === 'Новая' ? '#F9A826' : (r.status === 'Решена' ? '#2A5C9E' : '#D52B1E');
                let statusText = r.status === 'Новая' ? '🟡 Новая' : (r.status === 'Решена' ? '✅ Решена' : '❌ Отклонена');
                html += `<tr>
                    <td>${r.date}</td>
                    <td>${r.title}</td>
                    <td>${r.category}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                    <td>
                        ${r.status === 'Новая' ? `<button class="danger delete-req-btn" data-id="${r.id}">🗑 Удалить</button>` : (r.status === 'Отклонена' ? `<span title="${r.rejectReason || ''}">❓ Причина: ${r.rejectReason || 'не указана'}</span>` : '—')}
                    </td>
                </tr>`;
            });
            
            if (reqs.length === 0) {
                html = '<tr><td colspan="5" style="text-align: center;">📭 Нет заявок</td></tr>';
            }
            
            tbody.innerHTML = html;
            
            document.querySelectorAll('.delete-req-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let id = parseInt(this.dataset.id);
                    if (deleteRequest(id)) loadRequestsTable();
                });
            });
        }
        
        window.filterRequests = function(filter, btnElement) {
            currentFilter = filter;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            if (btnElement) btnElement.classList.add('active');
            loadRequestsTable();
        };
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                let filter = this.dataset.filter;
                window.filterRequests(filter, this);
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
                    <td>${u.fio}</td>
                    <td>${u.login}</td>
                    <td>${u.email}</td>
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
                            loadAllRequestsTable();
                            alert(`✅ ${user.fio} теперь учитель!`);
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
                            loadAllRequestsTable();
                            alert(`⚠️ У ${user.fio} убраны права учителя`);
                        }
                    }
                });
            });
        }
        
        function loadAllRequestsTable() {
            let tbody = document.getElementById('requests-table');
            if (!tbody) return;
            
            let html = '';
            requests.slice().reverse().forEach(r => {
                let user = users.find(u => u.id === r.userId);
                let username = user ? user.fio : 'Неизвестно';
                let userRole = user ? (user.role === 'teacher' ? '👨‍🏫 Учитель' : (user.role === 'admin' ? '👑 Админ' : '👤 Пользователь')) : 'Неизвестно';
                let statusColor = r.status === 'Новая' ? '#F9A826' : (r.status === 'Решена' ? '#2A5C9E' : '#D52B1E');
                let statusText = r.status === 'Новая' ? '🟡 Новая' : (r.status === 'Решена' ? '✅ Решена' : '❌ Отклонена');
                
                html += `<tr>
                    <td>${r.date}</td>
                    <td>${username}</td>
                    <td>${userRole}</td>
                    <td>${r.title}</td>
                    <td>${r.category}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${statusText}</td>
                    <td>
                        ${r.status === 'Новая' ? 
                            `<button class="solve-req-btn" data-id="${r.id}">✅ Решена</button>
                             <button class="reject-req-btn danger" data-id="${r.id}">❌ Отклонить</button>` : 
                            (r.status === 'Отклонена' ? `<span title="${r.rejectReason || ''}">📝 Причина: ${r.rejectReason || 'не указана'}</span>` : '—')}
                    </td>
                </tr>`;
            });
            
            if (requests.length === 0) {
                html = '<tr><td colspan="7" style="text-align: center;">📭 Нет заявок</td></tr>';
            }
            
            tbody.innerHTML = html;
            
            document.querySelectorAll('.solve-req-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    let id = parseInt(this.dataset.id);
                    if (changeStatus(id, 'Решена')) {
                        loadAllRequestsTable();
                        alert('✅ Заявка отмечена как решенная');
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
                            alert('❌ Заявка отклонена');
                        }
                    } else if (reason !== null) {
                        alert('⚠️ Необходимо указать причину отклонения');
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
                    <span>📁 ${c}</span>
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
                        alert(`✅ Категория "${cat}" удалена`);
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
                    alert(`✅ Категория "${newCat}" добавлена`);
                } else if (categories.includes(newCat)) {
                    alert('⚠️ Такая категория уже существует');
                } else {
                    alert('⚠️ Введите название категории');
                }
            });
        }
        
        loadUsersTable();
        loadAllRequestsTable();
        loadCategoriesList();
    }
});