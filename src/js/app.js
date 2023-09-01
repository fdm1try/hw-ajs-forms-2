import GoodsList from './GoodsList/GoodsList';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('goods-list');
  const goodsList = new GoodsList(container);
  goodsList.render();
});
