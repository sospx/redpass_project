const baseUrl = 'http://127.0.0.1:8000';
let token = localStorage.getItem('token');

const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authError = document.getElementById('auth-error');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const privacyAgree = document.getElementById('privacy-agree');

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

function getStrengthByScore(score) {
    switch(score) {
        case 0: return { label: 'Критический', width: '25%', colorClass: 'bg-red-600' };
        case 1: return { label: 'Слабый', width: '50%', colorClass: 'bg-orange-500' };
        case 2: return { label: 'Средний', width: '75%', colorClass: 'bg-amber-500' };
        case 3: return { label: 'Надежный', width: '90%', colorClass: 'bg-lime-500' };
        case 4: return { label: 'Элитный', width: '100%', colorClass: 'bg-emerald-500' };
        default: return { label: 'Ожидание', width: '0%', colorClass: 'bg-white/20' };
    }
}

function renderStrengthPreview(password) {
    if (!password) {
        strengthLabel.textContent = 'Ожидание ввода';
        strengthBar.style.width = '0%';
        strengthBar.className = 'h-full w-0 bg-white/20 transition-all duration-300';
        return;
    }
    const score = typeof zxcvbn === 'function' ? zxcvbn(password).score : 0;
    const strength = getStrengthByScore(score);
    strengthLabel.textContent = `${strength.label} (${score}/4)`;
    strengthBar.style.width = strength.width;
    strengthBar.className = `h-full transition-all duration-300 ${strength.colorClass}`;
}

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
        userEmailDisplay.textContent = payload.sub || "User";
    } catch (e) {
        userEmailDisplay.textContent = "Авторизован";
    }
    loadHistory();
}

function showError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

btnRegister.addEventListener('click', async () => {
    authError.classList.add('hidden');

    if (!privacyAgree.checked) {
        showError('Необходимо согласиться с Политикой конфиденциальности!');
        return;
    }

    if (!emailInput.value || !passwordInput.value) {
        showError('Заполните поля email и пароля');
        return;
    }

    try {
        const res = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: emailInput.value, password: passwordInput.value})
        });
        if (res.ok) alert('Успешная регистрация! Теперь войдите.');
        else { const d = await res.json(); showError(d.detail || 'Ошибка регистрации'); }
    } catch (e) { showError('Сервер недоступен'); }
});

btnLogin.addEventListener('click', async () => {
    authError.classList.add('hidden');
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
        } else { showError('Неверный логин или пароль'); }
    } catch (e) { showError('Ошибка сети'); }
});

btnLogout.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    checkResult.classList.add('hidden');
    checkPasswordInput.value = '';
    renderStrengthPreview('');
    showAuth();
});

btnCheck.addEventListener('click', async () => {
    const pwd = checkPasswordInput.value;
    if (!pwd) return;
    try {
        const res = await fetch(`${baseUrl}/password/check`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({password: pwd})
        });
        if (res.ok) {
            const data = await res.json();
            checkResult.classList.remove('hidden');
            resScore.textContent = data.score;
            resTime.textContent = data.crack_time || 'Мгновенно';
            if (data.is_leaked) {
                resLeak.textContent = `Слит в базах: ${data.leak_count} раз`;
                resLeak.className = 'p-3 rounded-lg font-bold text-center text-[10px] tracking-wider uppercase bg-red-950/50 text-red-400 border border-red-900/50';
            } else {
                resLeak.textContent = 'Чист. В базах утечек не обнаружен';
                resLeak.className = 'p-3 rounded-lg font-bold text-center text-[10px] tracking-wider uppercase bg-emerald-950/50 text-emerald-400 border border-emerald-900/50';
            }
            loadHistory();
        } else if (res.status === 401) { btnLogout.click(); }
    } catch (e) { alert('Ошибка API'); }
});

checkPasswordInput.addEventListener('input', (e) => renderStrengthPreview(e.target.value));
btnRefreshHistory.addEventListener('click', loadHistory);

if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async () => {
        if (!confirm('Очистить историю?')) return;
        await fetch(`${baseUrl}/password/history`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} });
        loadHistory();
    });
}

async function loadHistory() {
    if (!token) return;
    try {
        const res = await fetch(`${baseUrl}/password/history`, { headers: {'Authorization': `Bearer ${token}`} });
        if (res.ok) {
            const history = await res.json();
            historyTableBody.innerHTML = '';
            if (history.length === 0) {
                historyTableBody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-slate-600 italic">История пуста</td></tr>`;
                return;
            }
            history.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = "hover:bg-white/5 transition-colors";
                const status = item.is_leaked
                    ? `<span class="text-red-400 font-bold">Утечка</span>`
                    : `<span class="text-emerald-400">Чист</span>`;
                tr.innerHTML = `
                    <td class="py-2 px-2 text-slate-500 font-mono truncate max-w-[120px]">${item.masked_password}</td>
                    <!-- Цвет изменен на красный -->
                    <td class="py-2 px-2 text-center text-red-500 font-bold">${item.score}/4</td>
                    <td class="py-2 px-2 text-right">${status}</td>
                `;
                historyTableBody.appendChild(tr);
            });
        }
    } catch (e) { console.error(e); }
}

if (token) showApp(); else showAuth();
renderStrengthPreview('');