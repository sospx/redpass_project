const baseUrl = 'http://127.0.0.1:8000';
let token = localStorage.getItem('token');

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
const checkResult = document.getElementById('check-result');
const resScore = document.getElementById('res-score');
const resTime = document.getElementById('res-time');
const resLeak = document.getElementById('res-leak');
const historyTableBody = document.getElementById('history-table-body');
const btnRefreshHistory = document.getElementById('btn-refresh-history');

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

    // Достаем email из токена
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

// --- ЛОГИКА ПРОВЕРКИ ПАРОЛЯ ---
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

        loadHistory();
        checkPasswordInput.value = '';
    } else if (res.status === 401) {
        btnLogout.click();
    }
});

btnRefreshHistory.addEventListener('click', loadHistory);

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