const joinDialog = document.querySelector('#join-dialog');
const joinButton = document.querySelector('#join-button');
const dialogClose = document.querySelector('#dialog-close');
const joinForm = document.querySelector('#join-form');
const formSuccess = document.querySelector('#form-success');
let lastJoinAttempt = 0;
const posterDialog = document.querySelector('#poster-dialog');
const posterTrigger = document.querySelector('#poster-trigger');
const posterClose = document.querySelector('#poster-close');
const registerDialog = document.querySelector('#register-dialog');
const loginDialog = document.querySelector('#login-dialog');
const registerClose = document.querySelector('#register-close');
const loginClose = document.querySelector('#login-close');
const registerButton = document.querySelector('#register-button');
const loginButton = document.querySelector('#login-button');
const logoutButton = document.querySelector('#logout-button');
const profileButton = document.querySelector('#profile-button');
const cancelLogoutButton = document.querySelector('#cancel-logout');
const confirmLogoutButton = document.querySelector('#confirm-logout');
const logoutConfirmDialog = document.querySelector('#logout-confirm-dialog');
const accountUser = document.querySelector('#account-user');
const userBadge = document.querySelector('#user-badge');
const userMenu = document.querySelector('#user-menu');
const menuUserName = document.querySelector('#menu-user-name');
const menuUserEmail = document.querySelector('#menu-user-email');
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const registerStatus = document.querySelector('#register-status');
const loginStatus = document.querySelector('#login-status');
const adminNavItem = document.querySelector('#admin-nav-item');
const adminSection = document.querySelector('#admin');
const adminAccountCount = document.querySelector('#admin-account-count');
const adminStatusText = document.querySelector('#admin-status-text');
const adminUserTableBody = document.querySelector('#admin-user-table-body');
const ADMIN_EMAIL = 'admin@kabarkada.com';
const ADMIN_PASSWORD = 'Admin@123';
const STORAGE_KEYS = {
    accounts: 'kabarkada_accounts',
    currentUser: 'kabarkada_current_user',
    activeUsers: 'kabarkada_active_users'
};

function getAccounts() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.accounts) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveAccounts(accounts) {
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

function getActiveUsers() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.activeUsers) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveActiveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.activeUsers, JSON.stringify(users));
}

function getDisplayName(email, role) {
    if (role === 'admin') return 'Admin';
    const localPart = String(email || '').split('@')[0] || 'Member';
    return localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

function ensureBuiltInAdmin() {
    const accounts = getAccounts();
    const adminExists = accounts.some(account => account.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (!adminExists) {
        accounts.push({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            createdBy: 'system',
            createdAt: new Date().toISOString()
        });
        saveAccounts(accounts);
    }
}

function renderActiveUsers() {
    const users = getActiveUsers();
    if (!adminUserTableBody) return;

    if (!users.length) {
        adminUserTableBody.innerHTML = '<tr><td colspan="3">No active users</td></tr>';
        return;
    }

    adminUserTableBody.innerHTML = users
        .map((user) => `
            <tr>
                <td>${user.name || getDisplayName(user.email, user.role)}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
            </tr>
        `)
        .join('');
}

function updateAuthUI() {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null');
    const isLoggedIn = Boolean(currentUser && currentUser.email);
    const isAdmin = Boolean(currentUser && currentUser.role === 'admin');

    if (loginButton) {
        loginButton.hidden = isLoggedIn;
    }
    if (accountUser) {
        accountUser.hidden = !isLoggedIn;
    }
    if (userBadge && currentUser) {
        userBadge.innerHTML = `<span>Hi, ${currentUser.name || getDisplayName(currentUser.email, currentUser.role)}</span>`;
        userBadge.setAttribute('aria-expanded', String(userMenu ? !userMenu.hidden : false));
    }
    if (menuUserName && currentUser) {
        menuUserName.textContent = currentUser.name || getDisplayName(currentUser.email, currentUser.role);
    }
    if (menuUserEmail && currentUser) {
        menuUserEmail.textContent = currentUser.email;
    }
    if (userMenu) {
        userMenu.hidden = true;
    }

    if (adminNavItem) {
        adminNavItem.hidden = !isAdmin;
    }
    if (adminSection) {
        adminSection.hidden = !isAdmin;
    }
    if (adminAccountCount) {
        adminAccountCount.textContent = String(getAccounts().length);
    }
    if (adminStatusText) {
        adminStatusText.textContent = isAdmin ? 'Active' : 'Hidden';
    }
    renderActiveUsers();
}

function setCurrentUser(user) {
    const userData = {
        email: String(user.email || '').toLowerCase(),
        role: user.role || 'user',
        name: user.name || getDisplayName(user.email, user.role || 'user')
    };
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(userData));

    const activeUsers = getActiveUsers().filter((entry) => entry.email.toLowerCase() !== userData.email);
    activeUsers.push({
        email: userData.email,
        role: userData.role,
        name: userData.name,
        loggedInAt: new Date().toISOString()
    });
    saveActiveUsers(activeUsers);
    updateAuthUI();
}

function requestLogout() {
    if (logoutConfirmDialog) {
        logoutConfirmDialog.showModal();
    } else {
        logoutCurrentUser();
    }
}

function logoutCurrentUser() {
    const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null');
    const emailToRemove = String(currentUser?.email || '').toLowerCase();
    const activeUsers = getActiveUsers().filter((entry) => entry.email.toLowerCase() !== emailToRemove);
    saveActiveUsers(activeUsers);
    localStorage.removeItem(STORAGE_KEYS.currentUser);
    updateAuthUI();
    if (loginStatus) loginStatus.textContent = '';
    if (registerStatus) registerStatus.textContent = '';
    if (loginDialog) loginDialog.close();
    if (logoutConfirmDialog) logoutConfirmDialog.close();
    if (userMenu) userMenu.hidden = true;
}

function handleLocalRegister(data, statusElement, form, submitButton) {
    ensureBuiltInAdmin();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    if (!email || !password) {
        throw new Error('Please complete all required fields.');
    }
    if (email === ADMIN_EMAIL.toLowerCase()) {
        throw new Error('The built-in admin account is reserved and cannot be created again.');
    }
    const accounts = getAccounts();
    const duplicate = accounts.some(account => account.email.toLowerCase() === email);
    if (duplicate) {
        throw new Error('An account with this email already exists.');
    }
    const name = getDisplayName(email, 'user');
    accounts.push({ email, password, name, role: 'user', createdBy: 'self', createdAt: new Date().toISOString() });
    saveAccounts(accounts);
    statusElement.textContent = 'Account created successfully.';
    form.reset();
    if (registerDialog) registerDialog.close();
}

function handleLocalLogin(data, statusElement, form, submitButton) {
    ensureBuiltInAdmin();
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const accounts = getAccounts();
    const user = accounts.find(account => account.email.toLowerCase() === email && account.password === password);
    if (!user) {
        throw new Error('Incorrect email or password.');
    }
    const name = user.name || getDisplayName(user.email, user.role || 'user');
    setCurrentUser({ email: user.email, role: user.role || 'user', name });
    statusElement.textContent = user.role === 'admin' ? 'Admin access granted.' : 'Login successful.';
    form.reset();
    if (loginDialog) loginDialog.close();
}

if (posterDialog && posterTrigger && posterClose) {
    posterTrigger.addEventListener('click', () => posterDialog.showModal());
    posterClose.addEventListener('click', () => posterDialog.close());
    posterDialog.addEventListener('click', (event) => {
        if (event.target === posterDialog) posterDialog.close();
    });
}

async function submitAuthForm(event, endpoint, statusElement) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    statusElement.textContent = 'Connecting securely...';

    try {
        const formData = Object.fromEntries(new FormData(form));
        if (endpoint === '/api/auth/register') {
            handleLocalRegister(formData, statusElement, form, submitButton);
            return;
        }
        if (endpoint === '/api/auth/login') {
            handleLocalLogin(formData, statusElement, form, submitButton);
            return;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify(formData)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'The request could not be completed.');
        statusElement.textContent = result.message || 'Success. Check your email for the next step.';
        form.reset();
    } catch (error) {
        statusElement.textContent = error.message || 'The account service is unavailable.';
    } finally {
        submitButton.disabled = false;
    }
}

if (loginButton && loginDialog && loginClose && loginForm && loginStatus) {
    loginButton.addEventListener('click', () => { loginStatus.textContent = ''; loginDialog.showModal(); });
    loginClose.addEventListener('click', () => loginDialog.close());
    loginDialog.addEventListener('click', (event) => {
        if (event.target === loginDialog) loginDialog.close();
    });
    loginForm.addEventListener('submit', (event) => submitAuthForm(event, '/api/auth/login', loginStatus));
}

if (registerDialog && registerClose && registerForm && registerStatus) {
    registerClose.addEventListener('click', () => registerDialog.close());
    registerDialog.addEventListener('click', (event) => {
        if (event.target === registerDialog) registerDialog.close();
    });
    registerForm.addEventListener('submit', (event) => submitAuthForm(event, '/api/auth/register', registerStatus));
}

if (userBadge) {
    userBadge.addEventListener('click', () => {
        if (!userMenu) return;
        userMenu.hidden = !userMenu.hidden;
        userBadge.setAttribute('aria-expanded', String(!userMenu.hidden));
    });
}

if (profileButton) {
    profileButton.addEventListener('click', () => {
        if (userMenu) userMenu.hidden = true;
        if (userBadge) userBadge.setAttribute('aria-expanded', 'false');
        alert('Profile view coming soon.');
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        requestLogout();
    });
}

if (cancelLogoutButton && logoutConfirmDialog) {
    cancelLogoutButton.addEventListener('click', () => logoutConfirmDialog.close());
}

if (confirmLogoutButton) {
    confirmLogoutButton.addEventListener('click', () => {
        logoutCurrentUser();
    });
}

if (document.body) {
    document.body.addEventListener('click', (event) => {
        const clickedInsideAccount = event.target.closest('#account-user') || event.target.closest('#user-menu');
        if (!clickedInsideAccount && userMenu) {
            userMenu.hidden = true;
            if (userBadge) userBadge.setAttribute('aria-expanded', 'false');
        }
    });
}

ensureBuiltInAdmin();
updateAuthUI();

if (joinDialog && joinButton && dialogClose && joinForm && formSuccess) {
    joinButton.addEventListener('click', () => joinDialog.showModal());
    dialogClose.addEventListener('click', () => joinDialog.close());
    joinDialog.addEventListener('click', (event) => {
        if (event.target === joinDialog) joinDialog.close();
    });
    joinForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!joinForm.reportValidity()) return;

        const now = Date.now();
        const honeypot = joinForm.elements.company;
        if (honeypot.value || now - lastJoinAttempt < 5000) return;
        lastJoinAttempt = now;

        joinForm.hidden = true;
        formSuccess.hidden = false;
    });
}
