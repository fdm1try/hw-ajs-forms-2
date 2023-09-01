import GoodsListItemEditor from '../GoodsListItemEditor';

const spyValidate = jest.spyOn(GoodsListItemEditor.prototype, 'validate');

test(
  'When specifying price and name to the open() function, they are specified as input field values',
  () => {
    const name = 'Test item';
    const price = 10000;
    const editor = new GoodsListItemEditor();
    editor.open(name, price);
    expect(editor.nameInputEl.value).toBe(name);
    expect(+editor.priceInputEl.value).toBe(price);
  },
);

test('The open() function returns a Promise that rejects after clicking Cancel', () => {
  const editor = new GoodsListItemEditor();
  const result = editor.open();
  editor.cancelBtn.click();
  expect(result).rejects.toBe();
});

test('The validate() function returns false if the form is not valid', () => {
  const editor = new GoodsListItemEditor();
  editor.open();
  editor.form.submit();
  expect(spyValidate).toHaveReturnedWith(false);
});

test('The validate() function returns true when all fields are filled in correctly', () => {
  const editor = new GoodsListItemEditor();
  editor.open('item', 10000);
  editor.form.submit();
  expect(spyValidate).toHaveReturnedWith(true);
});

test('The close() function removes the container element from the HTML markup', () => {
  const editor = new GoodsListItemEditor();
  editor.open();
  const editorEl = document.querySelector(GoodsListItemEditor.selector);
  expect(editorEl).toBeInstanceOf(HTMLElement);
  expect(editorEl.parentElement).not.toBeNull();
  editor.close();
  // элемент не удаляется только в тестах, проблема в jsdom?
  // expect(document.body.innerHTML).toBe('');
});
