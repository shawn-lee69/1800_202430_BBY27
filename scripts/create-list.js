
// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Ensure code runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  const listId = getQueryParam('id');

  if (listId) {
    // Fetch the list from Firestore
    db.collection('lists').doc(listId).get()
      .then((doc) => {
        const listNameInput = document.getElementById('listNameInput');
        if (!listNameInput) {
          console.warn('Element with ID "listNameInput" not found'); // TODO: must work on input when letting users change list name
          return;
        }

        if (doc.exists) {
          const listData = doc.data();
          // Set the default name as "New List" if no name is in Firestore
          listNameInput.value = listData.name || "New List";
        } else {
          console.log('No such document!');
          // If the document doesn't exist, set a default name
          listNameInput.value = "New List";
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
        // Set a default name in case of an error
        document.getElementById('listNameInput').value = "New List";
      });
    fetchAndDisplayItems(listId);
  } else {
    console.log('No list ID provided in the URL.');
    // Set a default name if no list ID is provided
    document.getElementById('listNameInput').value = "New List";
  }
});

// Declare listItems globally
let listItems = [];

function displayItems() {
  const selectedItemsContainer = document.querySelector('.selected-items-container');
  selectedItemsContainer.innerHTML = ''; // Clear any existing items

  listItems.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('shopping-item');
    itemDiv.innerHTML = `
      <div class='item-header'>
        <img class='checkbox' src='./images/create-list/check-box-empty.png' alt='checkbox' />
        ${item.name}
      </div>
      <img src='./images/create-list/delete-circle-button.png' alt='delete button' />
    `;
    selectedItemsContainer.appendChild(itemDiv);

    // Attach event listener to the checkbox
    const checkbox = itemDiv.querySelector('.checkbox');
    checkbox.addEventListener('click', function () {
      if (this.src.includes('check-box-empty.png')) {
        this.src = './images/create-list/check-box-checked.png';
        this.classList.add('checked'); // Enlarge effect

        // Ensure it shrinks back after the animation finishes
        setTimeout(() => this.classList.add('shrink'), 200);
      } else {
        this.src = './images/create-list/check-box-empty.png';
        this.classList.remove('checked'); // Reset
        this.classList.remove('shrink'); // Remove shrink class
      }
    });
  });
}

// Function to fetch lists from Firestore and display them
function fetchAndDisplayItems(listId) {
  db.collection('lists').doc(listId).collection('items').get().then((querySnapshot) => {
    listItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listItems.push({
        name: data.name,
        isChecked: false,
        quantity: 1,
        saleLink: "https://google.com",
      });
    });
    displayItems();
  });
}

document.getElementById('item-add-button').addEventListener('click', function(event) {
  const listId = getQueryParam('id');
  window.location.href = `add-item.html?id=${listId}`;
});


