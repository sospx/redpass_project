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

// Элемент очистки истории
const btnClearHistory = document.getElementById('btn-clear-history');

// Элементы для глазика (будут работать, если ты добавил их в HTML)
const btnToggleVisibility = document.getElementById('btn-toggle-visibility');
const iconEyeClosed = document.getElementById('icon-eye-closed');
const iconEyeOpen = document.getElementById('icon-eye-open');

// --- Утилиты ---
function getStrengthByScore(score) {
    if (score <= 0) return { label: 'Критически слабый', width: '20%', colorClass: 'bg-red-600' };
    if (score === 1) return { label: 'Низкая стойкость', width: '40%', colorClass: 'bg-orange-500' };
    if (score === 2) return { label: 'Умеренная стойкость', width: '60%', colorClass: 'bg-amber-500' };
    if (score === 3) return { label: 'Высокая стойкость', width: '80%', colorClass: 'bg-lime-500' };
    return { label: 'Максимальная стойкость', width: '100%', colorClass: 'bg-green-600' };
}

function renderStrengthPreview(password) {
    if (!password) {
        strengthLabel.textContent = 'Начните вводить пароль';
        strengthBar.style.width = '0%';
        strengthBar.className = 'h-2 w-0 bg-gray-400 transition-all duration-200';
        return;
    }

    const score = typeof zxcvbn === 'function' ? zxcvbn(password).score : 0;
    const strength = getStrengthByScore(score);

    strengthLabel.textContent = `${strength.label} (${score}/4)`;
    strengthBar.style.width = strength.width;
    strengthBar.className = `h-2 transition-all duration-200 ${strength.colorClass}`;
}

// --- Инициализация ---
if (token) {
    showApp();
} else {
    showAuth();
}

function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        userEmailDisplay.textContent = payload.sub;
    } catch (e) {
        userEmailDisplay.textContent = "Пользователь";
    }
    loadHistory();
}

function showError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

// --- Авторизация ---
btnRegister.addEventListener('click', async () => {
    authError.classList.add('hidden');
    const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: emailInput.value, password: passwordInput.value})
    });
    if (res.ok) {
        alert('Успешно! Теперь нажмите "Войти".');
    } else {
        const data = await res.json();
        showError(data.detail || 'Ошибка регистрации');
    }
});

btnLogin.addEventListener('click', async () => {
    authError.classList.add('hidden');
    const formData = new URLSearchParams();
    formData.append('username', emailInput.value);
    formData.append('password', passwordInput.value);

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
    } else {
        showError('Неверный email или пароль');
    }
});

btnLogout.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    checkResult.classList.add('hidden');
    showAuth();
});

// --- Глазик для скрытия/показа пароля ---
if (btnToggleVisibility && iconEyeClosed && iconEyeOpen) {
    btnToggleVisibility.addEventListener('click', () => {
        if (checkPasswordInput.type === 'password') {
            checkPasswordInput.type = 'text';
            iconEyeClosed.classList.add('hidden');
            iconEyeOpen.classList.remove('hidden');
        } else {
            checkPasswordInput.type = 'password';
            iconEyeOpen.classList.add('hidden');
            iconEyeClosed.classList.remove('hidden');
        }
    });
}

// --- Проверка пароля ---
btnCheck.addEventListener('click', async () => {
    const pwd = checkPasswordInput.value;
    if (!pwd) return;

    btnCheck.textContent = "Считаем...";

    const res = await fetch(`${baseUrl}/password/check`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({password: pwd})
    });

    btnCheck.textContent = "Проверить";

    if (res.ok) {
        const data = await res.json();
        checkResult.classList.remove('hidden');
        resScore.textContent = data.score;
        resTime.textContent = data.crack_time;

        if (data.is_leaked) {
            resLeak.textContent = `ВНИМАНИЕ! Пароль слит ${data.leak_count} раз!`;
            resLeak.className = 'text-sm mt-2 font-bold text-red-600';
        } else {
            resLeak.textContent = 'Отлично! Пароль не найден в базах утечек.';
            resLeak.className = 'text-sm mt-2 font-bold text-green-600';
        }

        const backendStrength = getStrengthByScore(data.score);
        strengthLabel.textContent = `${backendStrength.label} (${data.score}/4)`;
        strengthBar.style.width = backendStrength.width;
        strengthBar.className = `h-2 transition-all duration-200 ${backendStrength.colorClass}`;

        loadHistory();
    } else if (res.status === 401) {
        btnLogout.click();
    }
});

checkPasswordInput.addEventListener('input', (event) => {
    renderStrengthPreview(event.target.value);
});

// --- История ---
btnRefreshHistory.addEventListener('click', loadHistory);

// Защита от ошибки, если кнопка btnClearHistory не найдена в HTML
if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
        const isConfirmed = confirm('Вы уверены, что хотите удалить всю историю проверок? Это действие нельзя отменить.');

        if (!isConfirmed) return;

        const res = await fetch(`${baseUrl}/password/history`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            loadHistory();
        } else if (res.status === 401) {
            btnLogout.click();
        } else {
            alert('Не удалось очистить историю. Попробуйте позже.');
        }
    });
}

async function loadHistory() {
    const res = await fetch(`${baseUrl}/password/history`, {
        headers: {'Authorization': `Bearer ${token}`}
    });
    if (res.ok) {
        const history = await res.json();
        historyTableBody.innerHTML = '';

        history.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-3 py-3 text-sm text-gray-700 font-mono">${item.masked_password}</td>
                <td class="px-3 py-3 text-sm text-gray-700 font-bold">${item.score} / 4</td>
                <td class="px-3 py-3 text-sm ${item.is_leaked ? 'text-red-600 font-bold' : 'text-green-600'}">
                    ${item.is_leaked ? 'Слит (' + item.leak_count + ')' : 'Чисто'}
                </td>
            `;
            historyTableBody.appendChild(tr);
        });
    }
}

renderStrengthPreview('');
