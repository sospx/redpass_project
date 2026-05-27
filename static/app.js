const baseUrl = 'http://127.0.0.1:8000';
let token = localStorage.getItem('token');

// --- DOM Элементы ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authError = document.getElementById('auth-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');

const userEmailDisplay = document.getElementById('user-email-display');
const btnLogout = document.getElementById('btn-logout');
const checkPasswordInput = document.getElementById('check-password-input');
const btnCheck = document.getElementById('btn-check');
const strengthLabel = document.getElementById('strength-label');
const strengthBar = document.getElementById('strength-bar');
const checkResult = document.getElementById('check-result');
const resScore = document.getElementById('res-score');
const resTime = document.getElementById('res-time');
const resLeak = document.getElementById('res-leak');
const historyTableBody = document.getElementById('history-table-body');
const btnRefreshHistory = document.getElementById('btn-refresh-history');
const btnClearHistory = document.getElementById('btn-clear-history');

// --- Конфигуратор Стойкости ---
function getStrengthByScore(score) {
    switch(score) {
        case 0: return { label: 'Критически слабый', width: '20%', colorClass: 'bg-red-600' };
        case 1: return { label: 'Низкая стойкость', width: '40%', colorClass: 'bg-orange-500' };
        case 2: return { label: 'Умеренная стойкость', width: '60%', colorClass: 'bg-amber-500' };
        case 3: return { label: 'Высокая стойкость', width: '80%', colorClass: 'bg-lime-500' };
        case 4: return { label: 'Максимальная стойкость', width: '100%', colorClass: 'bg-green-600' };
        default: return { label: 'Ожидание ввода', width: '0%', colorClass: 'bg-slate-300' };
    }
}

// Рендер предварительной оценки (zxcvbn)
function renderStrengthPreview(password) {
    if (!password) {
        strengthLabel.textContent = 'Ожидание ввода';
        strengthLabel.className = 'text-slate-400 transition-colors';
        strengthBar.style.width = '0%';
        strengthBar.className = 'h-full w-0 bg-slate-300 transition-all duration-300';
        return;
    }

    const score = typeof zxcvbn === 'function' ? zxcvbn(password).score : 0;
    const strength = getStrengthByScore(score);

    strengthLabel.textContent = `${strength.label} (${score}/4)`;
    strengthBar.style.width = strength.width;
    strengthBar.className = `h-full transition-all duration-300 ${strength.colorClass}`;
}

// --- Управление состояниями экранов ---
function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
    authError.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userEmailDisplay.textContent = payload.sub || "Пользователь";
    } catch (e) {
        userEmailDisplay.textContent = "Авторизован";
    }
    loadHistory();
}

function showError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

// --- Обработчики событий (Авторизация) ---
btnRegister.addEventListener('click', async () => {
    authError.classList.add('hidden');
    if (!emailInput.value || !passwordInput.value) {
        showError('Заполните все поля формы');
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: emailInput.value, password: passwordInput.value})
        });
        if (res.ok) {
            alert('Регистрация успешна! Теперь вы можете войти в систему.');
        } else {
            const data = await res.json();
            showError(data.detail || 'Не удалось зарегистрироваться');
        }
    } catch (e) {
        showError('Сервер недоступен');
    }
});

btnLogin.addEventListener('click', async () => {
    authError.classList.add('hidden');
    if (!emailInput.value || !passwordInput.value) {
        showError('Введите логин и пароль');
        return;
    }

    const formData = new URLSearchParams();
    formData.append('username', emailInput.value);
    formData.append('password', passwordInput.value);

    try {
        const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData
        });

        if (res.ok) {
            const data = await res.json();
            token = data.access_token;
            localStorage.setItem('token', token);
            showApp();
            emailInput.value = '';
            passwordInput.value = '';
        } else {
            showError('Неверный email или пароль');
        }
    } catch (e) {
        showError('Ошибка сети при авторизации');
    }
});

btnLogout.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    checkResult.classList.add('hidden');
    checkPasswordInput.value = '';
    renderStrengthPreview('');
    showAuth();
});

// --- Работа с проверками паролей ---
btnCheck.addEventListener('click', async () => {
    const pwd = checkPasswordInput.value;
    if (!pwd) return;

    btnCheck.textContent = "Анализ...";
    btnCheck.disabled = true;

    try {
        const res = await fetch(`${baseUrl}/password/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({password: pwd})
        });

        btnCheck.textContent = "Проверить";
        btnCheck.disabled = false;

        if (res.ok) {
            const data = await res.json();
            checkResult.classList.remove('hidden');
            resScore.textContent = data.score;
            resTime.textContent = data.crack_time || 'Мгновенно';

            // Оформление блока утечек
            if (data.is_leaked) {
                resLeak.textContent = `Внимание! Найдено в утечках: ${data.leak_count} раз!`;
                resLeak.className = 'p-3 rounded-xl font-bold text-center text-xs tracking-wide uppercase bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50';
            } else {
                resLeak.textContent = 'Безопасно: пароль отсутствует в базах компрометации.';
                resLeak.className = 'p-3 rounded-xl font-bold text-center text-xs tracking-wide uppercase bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50';
            }

            // Синхронизация прогресс-бара по данным от бэкенда
            const backendStrength = getStrengthByScore(data.score);
            strengthLabel.textContent = `${backendStrength.label} (${data.score}/4)`;
            strengthBar.style.width = backendStrength.width;
            strengthBar.className = `h-full transition-all duration-300 ${backendStrength.colorClass}`;

            loadHistory();
        } else if (res.status === 401) {
            btnLogout.click();
        }
    } catch (e) {
        btnCheck.textContent = "Проверить";
        btnCheck.disabled = false;
        alert('Не удалось связаться с сервером API');
    }
});

// Отслеживание ввода для предпросмотра сложности
checkPasswordInput.addEventListener('input', (event) => {
    renderStrengthPreview(event.target.value);
});

// --- Работа с историей запросов ---
btnRefreshHistory.addEventListener('click', loadHistory);

if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
        if (!confirm('Вы действительно хотите полностью очистить историю ваших проверок?')) return;

        try {
            const res = await fetch(`${baseUrl}/password/history`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                loadHistory();
            }
        } catch (e) {
            alert('Ошибка при попытке очистить историю');
        }
    });
}

async function loadHistory() {
    if (!token) return;
    try {
        const res = await fetch(`${baseUrl}/password/history`, {
            headers: {'Authorization': `Bearer ${token}`}
        });
        if (res.ok) {
            const history = await res.json();
            historyTableBody.innerHTML = '';

            if (history.length === 0) {
                historyTableBody.innerHTML = `
                    <tr>
                        <td colspan="3" class="py-4 text-center text-xs text-slate-400 italic">История проверок пуста</td>
                    </tr>`;
                return;
            }

            history.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = "text-xs hover:bg-slate-100/50 dark:hover:bg-gray-700/30 transition-colors";

                const leakedCell = item.is_leaked
                    ? `<span class="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/40 text-red-600 font-bold">Утечка</span>`
                    : `<span class="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-950/40 text-green-600">Чист</span>`;

                tr.innerHTML = `
                    <td class="py-3 px-2 font-mono text-slate-500 dark:text-slate-400 truncate max-w-[150px]">${item.masked_password}</td>
                    <td class="py-3 px-2 text-center font-bold dark:text-slate-200">${item.score}/4</td>
                    <td class="py-3 px-2 text-right">${leakedCell}</td>
                `;
                historyTableBody.appendChild(tr);
            });
        } else if (res.status === 401) {
            btnLogout.click();
        }
    } catch (e) {
        console.error('Ошибка загрузки истории:', e);
    }
}

// --- Первичная сборка состояний при старте ---
if (token) {
    showApp();
} else {
    showAuth();
}
renderStrengthPreview('');