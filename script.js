const joinDialog = document.querySelector('#join-dialog');
const joinButton = document.querySelector('#join-button');
const dialogClose = document.querySelector('#dialog-close');
const joinForm = document.querySelector('#join-form');
const formSuccess = document.querySelector('#form-success');
let lastJoinAttempt = 0;
const registerDialog = document.querySelector('#register-dialog');
const loginDialog = document.querySelector('#login-dialog');
const registerClose = document.querySelector('#register-close');
const loginClose = document.querySelector('#login-close');
const registerButton = document.querySelector('#register-button');
const loginButton = document.querySelector('#login-button');
const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const registerStatus = document.querySelector('#register-status');
const loginStatus = document.querySelector('#login-status');

async function submitAuthForm(event, endpoint, statusElement) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    statusElement.textContent = 'Connecting securely...';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            credentials: 'same-origin',
            body: JSON.stringify(Object.fromEntries(new FormData(form)))
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

if (registerDialog && loginDialog && registerClose && loginClose && registerButton && loginButton && registerForm && loginForm && registerStatus && loginStatus) {
    registerButton.addEventListener('click', () => { registerStatus.textContent = ''; registerDialog.showModal(); });
    loginButton.addEventListener('click', () => { loginStatus.textContent = ''; loginDialog.showModal(); });
    registerClose.addEventListener('click', () => registerDialog.close());
    loginClose.addEventListener('click', () => loginDialog.close());
    registerDialog.addEventListener('click', (event) => {
        if (event.target === registerDialog) registerDialog.close();
    });
    loginDialog.addEventListener('click', (event) => {
        if (event.target === loginDialog) loginDialog.close();
    });
    registerForm.addEventListener('submit', (event) => submitAuthForm(event, '/api/auth/register', registerStatus));
    loginForm.addEventListener('submit', (event) => submitAuthForm(event, '/api/auth/login', loginStatus));
}

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
