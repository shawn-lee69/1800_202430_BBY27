
// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const listId = getQueryParam('id');

function toggleIsChecked(itemId) {
  docRef = db.collection('lists').doc(listId).collection('items').doc(itemId);

  docRef.get().then((doc) => {
    if (doc.exists) {
      const currentValue = doc.data().isChecked;

      // Toggle the value and update it in Firestore
      docRef.update({
        isChecked: !currentValue
      }).then(() => {
        console.log('Toggled successfully');
      }).catch((error) => {
        console.error('Error toggling: ', error);
      });
    } else {
      console.log('No such item');
    }
  }).catch((error) => {
    console.error('Error fetching document: ', error);
  });

}

// Ensure code runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {

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
let itemsList = [];

function displayItems() {
  const selectedItemsContainer = document.querySelector('.selected-items-container');
  selectedItemsContainer.innerHTML = ''; // Clear any existing items

  itemsList.forEach((item, index) => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('shopping-item');
    itemDiv.innerHTML = `
      <div class='item-header'>
        <img class='checkbox' src='./images/create-list/check-box-empty.png' alt='checkbox' />
        ${item.name}
      </div>
      <img class='delete-item-button' src='./images/create-list/delete-circle-button.png' alt='delete button' />
    `;
    selectedItemsContainer.appendChild(itemDiv);

    // Attach event listener to the delete button
    const deleteButton = itemDiv.querySelector('.delete-item-button'); // Select within itemDiv
    deleteButton.addEventListener('click', function () {
      removeItemFromFirestore(item.id);
    });

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

      // Toggle the item's isChecked status in Firestore
      toggleIsChecked(item.id);
    });
  });
}

// Function to fetch lists from Firestore and display them
function fetchAndDisplayItems(listId) {
  db.collection('lists').doc(listId).collection('items').get().then((querySnapshot) => {
    itemsList = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      itemsList.push({
        id: doc.id,
        name: data.name,
        isChecked: data.isChecked || false,
        quantity: data.quantity || 1,
        saleLink: data.saleLink || "https://google.com",
      });
    });
    displayItems();
  });
}

document.getElementById('item-add-button').addEventListener('click', function(event) {
  const listId = getQueryParam('id');
  window.location.href = `add-item.html?id=${listId}`;
});

function removeItemFromFirestore(itemId) {
  db.collection('lists').doc(listId).collection('items').doc(itemId).delete()
    .then(() => {
      // TODO: show modal that asks user to really delete the item
      window.location.href = `create-list.html?id=${listId}`;
    })
    .catch((error) => {
      console.log('Failed to remove item: ', error);
    })
}


// Attach event listener to the delete button for list
const deleteListButton = document.getElementById('delete-list-button');
deleteListButton.addEventListener('click', function () {
  // TODO: show modal that asks user to really delete the item
  removeListFromFirestore(listId);
});

function removeListFromFirestore(listId) {
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }
  db.collection('lists').doc(listId).delete()
    .then(() => {
      window.location.href = 'index.html';
    })
    .catch((error) => {
      console.log('Failed to remove list: ', error);
    });
}
