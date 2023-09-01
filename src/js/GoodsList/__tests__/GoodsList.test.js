import GoodsList from '../GoodsList';
import GoodsListItemEditor from '../GoodsListItemEditor';
import ModalWindow from '../../ModalWindow';

const spyOnAdd = jest.spyOn(GoodsList.prototype, 'onAdd');
const spyOnEdit = jest.spyOn(GoodsList.prototype, 'onEdit');
const spyOnRemove = jest.spyOn(GoodsList.prototype, 'onRemove');
const spyShowConfirmationModal = jest.spyOn(ModalWindow, 'showConfirmationModal');
const spyEditorOpen = jest.spyOn(GoodsListItemEditor.prototype, 'open');
let container;

beforeAll(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

test('The HTML content of the rendered element must match GoodsList.baseMarkup', () => {
  const goods = new GoodsList(container);
  goods.render();
  expect(container.innerHTML).toBe(GoodsList.baseMarkup);
});

test(
  'After adding item, a row appears in the table, the first and second columns of which correspond to name and price',
  () => {
    const name = 'test item';
    const price = 10000;
    const goods = new GoodsList(container);
    goods.render();
    goods.add(name, price);
    const item = goods.tableBodyEl.children[0];
    const nameEl = item.querySelector(GoodsList.selectorItemName);
    const priceEl = item.querySelector(GoodsList.selectorItemPrice);
    expect(nameEl.textContent).toBe(name);
    expect(+priceEl.textContent).toBe(price);
  },
);

test(
  'The getItem(id) function returns an element by its id, the element property corresponds to a row in the items table',
  () => {
    const name = 'test item';
    const price = 10000;
    const goods = new GoodsList(container);
    goods.render();
    goods.add(name, price);
    const item = goods.getItem(1);
    const itemEl = goods.tableBodyEl.children[0];
    expect(item.element).toEqual(itemEl);
  },
);

test(
  'Deleting an item deletes a row with it in the items table and the data about this item is deleted from memory',
  () => {
    const name = 'test item';
    const price = 10000;
    const goods = new GoodsList(container);
    goods.render();
    goods.add(name, price);
    const itemEl = goods.tableBodyEl.children[0];
    goods.remove(1);
    const good = goods.getItem(1);
    expect(good).toBeUndefined();
    expect(itemEl.parentElement).toBeNull();
  },
);

test('The name and price properties correspond to those that were specified when adding', () => {
  const name = 'test item';
  const price = 10000;
  const goods = new GoodsList(container);
  goods.render();
  goods.add('1', 1);
  goods.edit(1, name, price);
  const good = goods.getItem(1);
  expect(good.name).toBe(name);
  expect(good.price).toBe(price);
});

test('Pressing the add item button calls the onAdd() function', () => {
  const goods = new GoodsList(container);
  goods.render();
  goods.addButton.click();
  expect(spyOnAdd).toHaveBeenCalled();
});

test('Pressing the edit item button calls the onEdit() function', () => {
  const goods = new GoodsList(container);
  goods.render();
  goods.add('1', 1);
  const itemEl = goods.tableBodyEl.children[0];
  const editButton = itemEl.querySelector(GoodsList.selectorEditButton);
  editButton.click();
  expect(spyOnEdit).toHaveBeenCalled();
});

test('Pressing the remove item button calls the onRemove() function', () => {
  const goods = new GoodsList(container);
  goods.render();
  goods.add('1', 1);
  const itemEl = goods.tableBodyEl.children[0];
  const removeButton = itemEl.querySelector(GoodsList.selectorRemoveButton);
  removeButton.click();
  expect(spyOnRemove).toHaveBeenCalled();
});

describe('Testing the reaction to button presses', () => {
  let goodsList;

  beforeAll(() => {
    goodsList = new GoodsList(container);
    goodsList.render();
  });

  test('After clicking the add item button, the editor should open', () => {
    goodsList.addButton.click();
    expect(spyEditorOpen).toHaveBeenCalledWith();
  });

  test('After clicking the change item button, the editor with the specified name and price should open', () => {
    const name = 'test name';
    const price = 'test price';
    goodsList.add(name, price);
    const itemEl = goodsList.tableBodyEl.children[0];
    const editButton = itemEl.querySelector(GoodsList.selectorEditButton);
    editButton.click();
    expect(spyEditorOpen).toHaveBeenCalledWith(name, price);
  });

  test('After clicking the delete item button, a modal window should open to confirm', () => {
    const itemEl = goodsList.tableBodyEl.children[0];
    const removeButton = itemEl.querySelector(GoodsList.selectorRemoveButton);
    removeButton.click();
    expect(spyShowConfirmationModal).toHaveBeenCalled();
  });
});
