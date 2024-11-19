//Sale Information Data
const saleInformationForm = document.querySelector('.sale-information-form');
const itemName = document.querySelector('.item-name');
const itemPrice = document.querySelector('.item-price');
const store = document.querySelector('.store');
const saleDate = document.querySelector('.sale-date');
const confirmButton = document.querySelector('.confirm-btn');




document.addEventListener('DOMContentLoaded', () => {

  confirmButton.addEventListener('click', (e) => {
    db.collection('Sale-Information')
      .doc()
      .set({
        itemName: itemName.value,
        itemPrice: itemPrice.value,
        store: store.value,
        saleDate: saleDate.value,
      }).then(() => {
      saleInformationForm.reset();
    });

    confirmButton.addEventListener('click', (e) => {
      console.log("Button clicked");
      e.preventDefault();

    });
  });
});