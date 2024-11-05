
// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Ensure that the back button is created after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  goBackToTheList();
});

const listId = getQueryParam('id');

// JavaScript to clear the input when the cancel button is clicked
document.getElementById('cancel-button').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('search-input').value = '';
});

function addItemToFirestore() {
  const itemAddButton = document.querySelector('.item-add-button');
  const itemName = itemAddButton ? itemAddButton.textContent.trim() : '';

  if (itemName) {
    const newItem = {
      name: itemName,
      isChecked: false,
      quantity: 1,
      saleLink: 'https://google.com',
    };

    db.collection('lists').doc(listId).collection('items').add(newItem)
      .then((docRef) => {
        // TODO: show modal that informs user that adding item was a success
        window.location.href = `create-list.html?id=${listId}`;
      })
      .catch((error) => {
        console.log('Failed to add item: ', error);
      })
  } else {
    console.log('No item added.');
  }
}

function goBackToTheList() {
  const linkAnchor = document.createElement('a');
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  linkAnchor.href = `${basePath}/create-list.html?id=${listId}`;
  linkAnchor.innerHTML = `
      <img src='images/create-list/back-arrow.png' alt='arrow image for moving back'/>
    `;
  const backArrowDiv = document.querySelector('.back-arrow');
  backArrowDiv.appendChild(linkAnchor);
}

function setupAddItemButton() {
  const addLink = document.querySelector('.item-add-button');

  if (addLink) {
    addLink.addEventListener('click', function(event) {
      addItemToFirestore();
    });
  }
}

setupAddItemButton();
