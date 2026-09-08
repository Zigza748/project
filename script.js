const joinDialog = document.querySelector('#join-dialog');
const joinButton = document.querySelector('#join-button');
const dialogClose = document.querySelector('#dialog-close');
const joinForm = document.querySelector('#join-form');
const formSuccess = document.querySelector('#form-success');

if (joinDialog && joinButton && dialogClose && joinForm && formSuccess) {
    joinButton.addEventListener('click', () => joinDialog.showModal());
    dialogClose.addEventListener('click', () => joinDialog.close());
    joinDialog.addEventListener('click', (event) => {
        if (event.target === joinDialog) joinDialog.close();
    });
    joinForm.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!joinForm.reportValidity()) return;

        joinForm.hidden = true;
        formSuccess.hidden = false;
    });
}
