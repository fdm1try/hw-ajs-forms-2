import puppetteer from 'puppeteer';
import { fork } from 'child_process';

jest.setTimeout(300000); // default puppeteer timeout

describe('Credit Card Validator form', () => {
  let browser = null;
  let page = null;
  let server = null;

  // helper functions
  async function getGoodsListItems(page) {
    const itemListTableBody = await page.waitForSelector('.goods-list-table tbody');
    let items = await itemListTableBody.$$('tr');
    await itemListTableBody.dispose();
    if (!items.length) return [];    
    const result = [];
    for (const item of items) {
      const buttonEdit = await item.waitForSelector('.goods-list-item-edit_button');
      const buttonRemove = await item.waitForSelector('.goods-list-item-remove_button');
      const nameText = await item.$eval('.goods-list-item-name', (el) => el.textContent);
      const priceText = await item.$eval('.goods-list-item-price', (el) => el.textContent);
      await item.dispose();
      result.push({
        buttonEdit,
        buttonRemove,
        nameText,
        priceText,
        disposeAll: async () => {
          await buttonEdit.dispose();
          await buttonRemove.dispose();
        }
      });
    }
    return result;
  }

  async function getItemEditorControls(page) {
    const editorForm = await page.waitForSelector('.goods-list-item-editor form');
    const editorInputName = await editorForm.waitForSelector('input[name="itemName"]');
    const editorInputPrice = await editorForm.waitForSelector('input[name="itemPrice"]');
    const editorButtonSubmit = await editorForm.waitForSelector('button[type="submit"]');
    const editorButtonCancel = await editorForm.waitForSelector('button[type="button"]');
    return {
      editorForm,
      editorInputName,
      editorInputPrice,
      editorButtonSubmit,
      editorButtonCancel,
      disposeAll: async () => {
        await editorForm.dispose();
        await editorInputName.dispose();
        await editorInputPrice.dispose();
        await editorButtonSubmit.dispose();
        await editorButtonCancel.dispose();
      }
    }
  }

  async function getModalWindowControls(page) {
    const modalWindow = await page.waitForSelector('.modal');
    const buttonConfirm = await modalWindow.waitForSelector('.modal-confirm_button');
    const buttonCancel = await modalWindow.waitForSelector('.modal-reject_button');
    return {
      modalWindow,
      buttonConfirm,
      buttonCancel,
      disposeAll: async () => {
        await modalWindow.dispose();
        await buttonConfirm.dispose();
        await buttonCancel.dispose();
      }
    }
  }
  
  const baseUrl = 'http://localhost:9000';

  beforeAll(async () => {
    server = fork(`${__dirname}/e2e.server.js`);
    await new Promise((resolve, reject) => {
      server.on('error', reject);
      server.on('message', (message) => {
        if (message === 'ok') {
          resolve();
        }
      });
    });

    browser = await puppetteer.launch({
      headless: true,
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    server.kill();
  });

  test('The add item button is not active while the add new item form is active', async () => {
    await page.goto(baseUrl);
    const name = 'Test name';
    const price = '12345';
    const addItemButton = await page.waitForSelector('.goods-list-add_button');
    await addItemButton.click();
    
    const editorControls = await getItemEditorControls(page);
    const { editorForm, editorInputName, editorInputPrice } = editorControls;
    await editorInputName.type(name);
    await editorInputPrice.click({ clickCount: 3 });
    await editorInputPrice.type(price);
    await addItemButton.click();
    
    const isFormVisible = await editorForm.isVisible();
    expect(isFormVisible).toBeTruthy();

    const inputNameValue = await page.evaluate((el) => el.value, editorInputName);
    const inputPriceValue = await page.evaluate((el) => el.value, editorInputPrice);
    expect([inputNameValue, inputPriceValue]).toEqual([name, price]);

    await editorControls.disposeAll();
    await addItemButton.dispose();
  });

  test('The item addition form closes when click Cancel', async () => {
    await page.goto(baseUrl);
    const addItemButton = await page.waitForSelector('.goods-list-add_button');
    await addItemButton.click();
    
    const editorControls = await getItemEditorControls(page);
    await editorControls.editorButtonCancel.click();
    const isFormVisible = await editorControls.editorForm.isVisible();
    expect(isFormVisible).toBeFalsy();
    await editorControls.disposeAll();
    const isAddButtonDisabled = await page.evaluate((el) => el.disabled, addItemButton);
    await addItemButton.dispose();
    expect(isAddButtonDisabled).toBeFalsy();
  });

  describe('Testing the item addition form with invalid data', () => {
    let editorControls;

    beforeAll(async () => {
      await page.goto(baseUrl);
      const addItemButton = await page.waitForSelector('.goods-list-add_button');
      await addItemButton.click();
      await addItemButton.dispose();
      editorControls = await getItemEditorControls(page);
    });

    afterAll(async () => {
      await editorControls.disposeAll();
    });

    test('If the name is not specified, the error "Необходимо указать название товара!" occurs',
      async () => {
        const { editorInputName, editorButtonSubmit } = editorControls;
        await editorInputName.click({ clickCount: 3 });
        await editorInputName.press('Backspace');
        await editorButtonSubmit.click();
        const validationMessage = await page.evaluate((el) => el.validationMessage, editorInputName);
        expect(validationMessage).toBe('Необходимо указать название товара!');
      });

    test('If the price is not specified, the error "Необходимо указать стоимость товара!" occurs',
      async () => {
        const { editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
        await editorInputName.click({ clickCount: 3 });
        await editorInputName.type('name');
        await editorInputPrice.click({ clickCount: 3 });
        await editorInputPrice.press('Backspace');
        await editorButtonSubmit.click();
        const validationMessage = await page.evaluate((el) => el.validationMessage, editorInputPrice);
        expect(validationMessage).toBe('Необходимо указать стоимость товара!');
      });

    test('If the price is less than 1, the error "Стоимость должна быть больше 0!" occurs', async () => {
      const { editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
      await editorInputName.click({ clickCount: 3 });
      await editorInputName.type('name');
      await editorInputPrice.click({ clickCount: 3 });
      await editorInputPrice.type('0');
      await editorButtonSubmit.click();
      const validationMessage = await page.evaluate((el) => el.validationMessage, editorInputPrice);
      expect(validationMessage).toBe('Стоимость должна быть больше 0!');
    });
  });

  describe('Basic CRUD Operations Test', () => {
    const name = 'Old item name';
    const price = '10000';
    const newName = 'New name';
    const newPrice = '23456';

    beforeAll(async () => {
      await page.goto(baseUrl);
    });

    test('Adding one item and checking its display in the list of items', async () => {
      const addItemButton = await page.waitForSelector('.goods-list-add_button');
      await addItemButton.click();
      await addItemButton.dispose();
      
      const editorControls = await getItemEditorControls(page);
      const { editorForm, editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
      await editorInputName.type(name);
      await editorInputPrice.click({ clickCount: 3 });
      await editorInputPrice.type(price);
      await editorButtonSubmit.click();
      
      const isFormVisible = await editorForm.isVisible();
      expect(isFormVisible).toBeFalsy();
      await editorControls.disposeAll();
      
      const [item] = await getGoodsListItems(page);
      expect(item.nameText).toBe(name);
      expect(item.priceText).toBe(price);
      await item.disposeAll();
    });

    test('Changing a previously added product and checking whether the display in the list matches the new data', 
      async () => {
        const [item] = await getGoodsListItems(page);
        await item.buttonEdit.click();
        const editorControls = await getItemEditorControls(page);
        const { editorForm, editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
        await item.disposeAll();
        
        const isFormVisible = await editorForm.isVisible();
        expect(isFormVisible).toBeTruthy();
        
        const inputNameValue = await page.evaluate((el) => el.value, editorInputName);
        const inputPriceValue = await page.evaluate((el) => el.value, editorInputPrice);
        expect([inputNameValue, inputPriceValue]).toEqual([name, price]);
        
        await editorInputName.click({ clickCount: 3 });
        await editorInputName.type(newName);
        await editorInputPrice.click({ clickCount: 3 });
        await editorInputPrice.type(newPrice);
        await editorButtonSubmit.click();
        await editorControls.disposeAll();
        
        const [newItem] = await getGoodsListItems(page);
        expect(newItem.nameText).toBe(newName);
        expect(newItem.priceText).toBe(newPrice);
        await newItem.disposeAll();
      });

    test('Deleting an item requires confirmation, if you click No in the modal window, the item will not be deleted', 
      async () => {
        let items = await getGoodsListItems(page);
        await items[0].buttonRemove.click();
        let modal = await getModalWindowControls(page);
        await modal.buttonCancel.click();
        
        let isModalVisible = await modal.modalWindow.isVisible();
        expect(isModalVisible).toBeFalsy();
        await modal.disposeAll();
        
        const [item] = await getGoodsListItems(page);
        expect(item.nameText).toBe(items[0].nameText);
        expect(item.priceText).toBe(items[0].priceText);
        await items[0].disposeAll();
        await item.disposeAll();
      });

    test('Deleting an item, the items list should be empty', async () => {
      let items = await getGoodsListItems(page);
      await items[0].buttonRemove.click();
      let modal = await getModalWindowControls(page);
      await modal.buttonConfirm.click();
      await items[0].disposeAll();
      
      let isModalVisible = await modal.modalWindow.isVisible();
      expect(isModalVisible).toBeFalsy();
      await modal.disposeAll();
      
      items = await getGoodsListItems(page);
      expect(items.length).toBe(0);
    });
  });

  describe('Comprehensive test of adding, updating and deleting multiple items', () => {
    const itemsData = [
      ['iPhone 5', 10500],
      ['iPhone 6', 20200],
      ['iPhone 7', 31400],
      ['iPhone 8', 46600],
      ['iPhone 9', 59500],
    ];
  
    const newItemsData = [
      ['iPhone 11', 77999],
      ['iPhone 6', 22999],
      ['iPhone 10', 67400],
      ['iPhone 7', 0],
      ['iPhone 8', 41230],
      ['iPhone 9', 0],
    ];

    const remainingItemsData = [
      [0, 'iPhone 5', 10500],
      [1, 'iPhone 6', 22999],
      [2, 'iPhone 8', 41230],
      [3, 'iPhone 11', 77999],
      [4, 'iPhone 10', 67400],
    ];

    const addItemsTest = test.each(itemsData);
    const editAddAndRemoveItemsTest = test.each(newItemsData);
    const checkRemainingItemsTest = test.each(remainingItemsData);

    beforeAll(async () => {
      await page.goto(baseUrl);
    });

    addItemsTest('Adding a "%s" item worth %s', async (name, price) => {
      const addItemButton = await page.waitForSelector('.goods-list-add_button');
      await addItemButton.click();
      await addItemButton.dispose();
      
      const editorControls = await getItemEditorControls(page);
      const { editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
      await editorInputName.type(name);
      await editorInputPrice.click({ clickCount: 3 });
      await editorInputPrice.type(price.toString());
      await editorButtonSubmit.click();
      await editorControls.disposeAll();
    });

    editAddAndRemoveItemsTest('Add or update (if exists) "%s" item worth %s (0 - remove item)', async (name, price) => {
      const items = await getGoodsListItems(page);
      const existItem = items.find((item) => item.nameText === name);
      if (existItem) {
        if (price === 0) {
          await existItem.buttonRemove.click();
          const modal = await getModalWindowControls(page);
          await modal.buttonConfirm.click();
        } else {
          await existItem.buttonEdit.click();
          const editorControls = await getItemEditorControls(page);
          const { editorInputPrice, editorButtonSubmit } = editorControls;
          await editorInputPrice.click({ clickCount: 3 });
          await editorInputPrice.type(price.toString());
          await editorButtonSubmit.click();
          await editorControls.disposeAll();
        }
      } else {
        const addItemButton = await page.waitForSelector('.goods-list-add_button');
        await addItemButton.click();
        await addItemButton.dispose();
        const editorControls = await getItemEditorControls(page);
        const { editorInputName, editorInputPrice, editorButtonSubmit } = editorControls;
        await editorInputName.type(name);
        await editorInputPrice.click({ clickCount: 3 });
        await editorInputPrice.type(price.toString());
        await editorButtonSubmit.click();
        await editorControls.disposeAll();
      }
      for (const item of items) {
        await item.disposeAll();
      }
    });

    checkRemainingItemsTest('Item #%s should be "%s" worth %s', async (id, name, price) => {
      const items = await getGoodsListItems(page);
      const item = items[id];
      expect([item.nameText, item.priceText]).toEqual([name, price.toString()]);
    });
  });
});
