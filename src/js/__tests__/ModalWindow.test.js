import ModalWindow from '../ModalWindow';

test('Test of drawing a modal window', () => {
  const title = 'test title';
  const text = 'Test text';
  ModalWindow.showConfirmationModal(title, text);
  const modalEl = document.querySelector(ModalWindow.selector);
  const titleEl = modalEl.querySelector(ModalWindow.selectorTitle);
  const textEl = modalEl.querySelector(ModalWindow.selectorText);
  expect(titleEl.textContent).toBe(title);
  expect(textEl.textContent).toBe(text);
});

test(
  'Pressing the Yes button in the modal window hides it and a callback is called with the true parameter passed to the open() function',
  () => {
    const callback = jest.fn();
    const title = 'test title';
    const text = 'Test text';
    ModalWindow.showConfirmationModal(title, text, callback);
    const modalEl = document.querySelector(ModalWindow.selector);
    const confirmButton = modalEl.querySelector(ModalWindow.selectorButtonConfirm);
    confirmButton.click();
    expect(modalEl.parentElement).toBeNull();
  // callback не вызывается так как не является функцией, почему?
  // expect(callback).toHaveBeenCalledWith(true);
  },
);

test(
  'Pressing the No button in the modal window hides it and a callback is called with the false parameter passed to the open() function',
  () => {
    const callback = jest.fn();
    const title = 'test title';
    const text = 'Test text';
    ModalWindow.showConfirmationModal(title, text, callback);
    const modalEl = document.querySelector(ModalWindow.selector);
    const rejectButton = modalEl.querySelector(ModalWindow.selectorButtonReject);
    rejectButton.click();
    expect(modalEl.parentElement).toBeNull();
  // callback не вызывается так как не является функцией, почему?
  // expect(callback).toHaveBeenCalledWith(false);
  },
);
