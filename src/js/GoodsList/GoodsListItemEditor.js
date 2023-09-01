export default class GoodsListItemEditor {
  #resolveFunction;

  #rejectFunction;

  static get selector() {
    return '.goods-list-item-editor';
  }

  static get markup() {
    return `
      <form novalidate>
        <div>
          <label for="itemName">Название</label>
          <input required name="itemName" type="text" placeholder="Введите имя">
        </div>
        <div>
          <label for="itemPrice">Цена</label>
          <input required name="itemPrice" type="number" min="1" placeholder="Введите цену">
        </div>
        <div class="goods-list-item-editor-controls">
          <button type="submit">Сохранить</button>
          <button type="button">Отмена</button>
        </div>
      </form>
    `;
  }

  constructor() {
    this.container = document.createElement('div');
    this.container.classList.add('goods-list-item-editor');
    this.container.style.zIndex = 1000;
    this.container.innerHTML = GoodsListItemEditor.markup;
    this.form = this.container.querySelector('form');
    this.nameInputEl = this.form.querySelector('[name="itemName"]');
    this.priceInputEl = this.form.querySelector('[name="itemPrice"]');
    this.cancelBtn = this.form.querySelector('button[type="button"]');
    this.onSubmit = this.onSubmit.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.close = this.close.bind(this);
    this.form.addEventListener('submit', this.onSubmit);
    this.cancelBtn.addEventListener('click', this.onCancel);
  }

  validate() {
    const errorList = {
      itemName: {
        valueMissing: 'Необходимо указать название товара!',
      },
      itemPrice: {
        valueMissing: 'Необходимо указать стоимость товара!',
        rangeUnderflow: 'Стоимость должна быть больше 0!',
      },
    };
    this.form.checkValidity();
    for (const el of [this.nameInputEl, this.priceInputEl]) {
      const errorKey = Object.keys(ValidityState.prototype).find((key) => {
        if (['valid', 'customError'].includes(key)) return false;
        if (el.validity[key]) return key;
        return false;
      });
      if (errorKey) {
        el.setCustomValidity(errorList[el.name][errorKey]);
        el.reportValidity();
        return false;
      }
    }
    return true;
  }

  onSubmit(event) {
    event.preventDefault();
    if (this.validate()) {
      const [name, price] = [this.nameInputEl.value, +this.priceInputEl.value];
      this.#resolveFunction({ name, price });
    }
  }

  onCancel() {
    this.#rejectFunction();
  }

  open(name = '', price = 1) {
    this.nameInputEl.value = name;
    this.priceInputEl.value = price;
    document.body.appendChild(this.container);
    return new Promise((resolve, reject) => {
      this.#resolveFunction = resolve;
      this.#rejectFunction = reject;
    });
  }

  close() {
    document.body.removeChild(this.container);
  }
}
