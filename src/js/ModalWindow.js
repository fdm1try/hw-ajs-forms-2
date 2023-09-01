export default class ModalWindow {
  static get selector() {
    return '.modal';
  }

  static get selectorTitle() {
    return '.modal-title';
  }

  static get selectorText() {
    return '.modal-content';
  }

  static get selectorButtonConfirm() {
    return '.modal-confirm_button';
  }

  static get selectorButtonReject() {
    return '.modal-reject_button';
  }

  static showConfirmationModal(title, text, callback) {
    const container = document.createElement('div');
    container.classList.add('modal', 'modal-confirmation');
    container.innerHTML = `
      <div class="modal-window">
        <h4 class="modal-title">${title}</h4>
        <div class="modal-content">${text}</div>
        <div class="modal-controls">
          <button class="modal-confirm_button">Да</button>
          <button class="modal-reject_button">Нет</button>
        </div>
      </div>
    `;
    document.body.appendChild(container);
    const yesBtn = container.querySelector(ModalWindow.selectorButtonConfirm);
    const noBtn = container.querySelector(ModalWindow.selectorButtonReject);
    const onAction = (result) => {
      container.remove();
      if (typeof callback === 'function') callback(result);
    };
    yesBtn.addEventListener('click', () => onAction(true));
    noBtn.addEventListener('click', () => onAction(false));
  }
}
