import './GoodsList.css';
import GoodsListItemEditor from './GoodsListItemEditor';
import ModalWindow from '../ModalWindow';

export default class GoodsList {
  #items;

  constructor(container) {
    this.container = container;
    this.#items = [];
    this.itemEditor = new GoodsListItemEditor();
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
    this.edit = this.edit.bind(this);
    this.onAdd = this.onAdd.bind(this);
    this.onEdit = this.onEdit.bind(this);
    this.onRemove = this.onRemove.bind(this);
  }

  static get selector() {
    return '.goods-list-table';
  }

  static get selectorItemName() {
    return '.goods-list-item-name';
  }

  static get selectorItemPrice() {
    return '.goods-list-item-price';
  }

  static get selectorItemAddButton() {
    return '.goods-list-add_button';
  }

  static get selectorEditButton() {
    return '.goods-list-item-edit_button';
  }

  static get selectorRemoveButton() {
    return '.goods-list-item-remove_button';
  }

  static get baseMarkup() {
    return `
    <div class="goods-list-header">
      <span class="goods-list-title">Товары</span>
      <button class="goods-list-add_button">+</button>
    </div>
    <table class="goods-list-table">
      <thead>
        <tr>
          <th class="goods-list-item-name">Название</th>
          <th class="goods-list-item-price">Стоимость</th>
          <th class="goods-list-item-actions">Действия</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  `;
  }

  render() {
    this.container.innerHTML = GoodsList.baseMarkup;
    this.tableBodyEl = this.container.querySelector(`${GoodsList.selector} > tbody`);
    this.addButton = this.container.querySelector(GoodsList.selectorItemAddButton);
    this.addButton.addEventListener('click', this.onAdd);
  }

  getItem(id) {
    return this.#items.find((item) => item.id === id);
  }

  removeItem(id) {
    this.#items = this.#items.filter((item) => item.id !== id);
  }

  add(name, price) {
    const id = this.#items.length ? this.#items[this.#items.length - 1].id + 1 : 1;
    const row = document.createElement('tr');
    this.#items.push({
      id, name, price, element: row,
    });
    row.innerHTML = `
        <td class='goods-list-item-name'>${name}</td>
        <td class='goods-list-item-price'>${price}</td>
        <td class="goods-list-item-actions">
          <button class='goods-list-item-edit_button'>✎</button>
          <button class='goods-list-item-remove_button'>✖</button>
        </td>
    `;
    this.tableBodyEl.appendChild(row);
    const editBtn = row.querySelector(GoodsList.selectorEditButton);
    const removeBtn = row.querySelector(GoodsList.selectorRemoveButton);
    editBtn.addEventListener('click', this.onEdit.bind(this, id));
    removeBtn.addEventListener('click', this.onRemove.bind(this, id));
  }

  remove(id) {
    const item = this.getItem(id);
    if (item) item.element.remove();
    this.removeItem(id);
  }

  edit(id, newName, newPrice) {
    const item = this.getItem(id);
    if (!item) return false;
    item.name = newName;
    item.price = newPrice;
    const nameEl = item.element.querySelector(GoodsList.selectorItemName);
    const priceEl = item.element.querySelector(GoodsList.selectorItemPrice);
    nameEl.textContent = newName;
    priceEl.textContent = newPrice;
    return true;
  }

  onAdd() {
    this.addButton.disabled = true;
    this.itemEditor.open().then((data) => {
      this.itemEditor.close();
      this.add(data.name, data.price);
    }).catch(this.itemEditor.close).finally(() => {
      this.addButton.disabled = false;
    });
  }

  onEdit(id) {
    const item = this.getItem(id);
    if (!item) return;
    this.addButton.disabled = true;
    const { name, price } = item;
    this.itemEditor.open(name, price).then((data) => {
      this.itemEditor.close();
      this.edit(id, data.name, data.price);
    }).catch(this.itemEditor.close).finally(() => {
      this.addButton.disabled = false;
    });
  }

  onRemove(id) {
    const item = this.getItem(id);
    const title = 'Подтвердите удаление';
    const text = `Вы действительно хотите удалить товар "${item.name}"?`;
    ModalWindow.showConfirmationModal(title, text, (yes) => {
      if (yes) this.remove(id);
    });
  }
}
