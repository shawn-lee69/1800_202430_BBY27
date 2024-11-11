let listName = "New List";

const CHECKBOX_EMPTY_SRC = './images/create-list/check-box-empty.png';
const CHECKBOX_CHECKED_SRC = './images/create-list/check-box-checked.png';

// Use these constants in your code

// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const listId = getQueryParam('id');

async function toggleIsChecked(itemId) {
  try {
    const docRef = db.collection('lists').doc(listId).collection('items').doc(itemId);
    const doc = await docRef.get();

    if (doc.exists) {
      const currentValue = doc.data().isChecked;
      await docRef.update({ isChecked: !currentValue });
      console.log('Toggled successfully');
    } else {
      console.log('No such item');
    }
  } catch (error) {
    console.error('Error toggling:', error);
  }
}

// Modal elements
const deleteModal = document.getElementById('deleteModal');
const deleteSuccessModal = document.getElementById('delete-success-modal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

// Show the modal when the delete button is clicked
const deleteListButton = document.getElementById('delete-list-button');

if (deleteListButton) {
  deleteListButton.addEventListener('click', function () {
    if (listId) {
      const docRef = db.collection('lists').doc(listId);

      // Fetch the list name from Firestore
      docRef.get().then((doc) => {
        if (doc.exists) {
          const listName = doc.data().name || "New List";

          // Set the modal message with the list name
          const modalMessage = deleteModal.querySelector('p');
          modalMessage.innerHTML = `Delete list <br>"${listName}"?`;

          // Show the modal
          deleteModal.style.display = 'block';
        } else {
          console.log("No such document!");
        }
      }).catch((error) => {
        console.error("Error fetching document:", error);
      });
    } else {
      console.error("Error: listId is empty or undefined.");
    }
  });
} else {
  console.warn('Element with ID "delete-list-button" not found');
}


// Hide the modal and proceed with delete if "Yes" is clicked
confirmDeleteButton.addEventListener('click', function () {
  removeListFromFirestore(listId);
  deleteSuccessModal.style.display = 'block';
  deleteModal.style.display = 'none';
});

// Hide the modal if "Cancel" is clicked
cancelDeleteButton.addEventListener('click', function () {
  deleteModal.style.display = 'none';
});

// Hide modal when clicking outside of it
window.addEventListener('click', function (event) {
  if (event.target === deleteModal) {
    deleteModal.style.display = 'none';
  }
});

// Ensure code runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  if (listId) {
    // Fetch the list from Firestore
    db.collection('lists').doc(listId).get()
      .then((doc) => {
        const listNameInput = document.getElementById('listNameInput');

        if (doc.exists) {
          const listData = doc.data();
          listName = listData.name || "New List";
          listNameInput.value = listName;
        }

        if (!listNameInput) {
          console.warn('Element with ID "listNameInput" not found');
          return;
        }

        if (doc.exists) {
          const listData = doc.data();
          listNameInput.value = listData.name || "New List";
        } else {
          console.log('No such document!');
          listNameInput.value = "New List";
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
        document.getElementById('listNameInput').value = "New List";
      });
    fetchAndDisplayItems(listId);
  } else {
    console.log('No list ID provided in the URL.');
    document.getElementById('listNameInput').value = "New List";
  }
});

// Declare listItems globally
let itemsList = [];

function displayItems() {
  const selectedItemsContainer = document.querySelector('.selected-items-container');
  selectedItemsContainer.innerHTML = '';

  itemsList.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('shopping-item');
    itemDiv.setAttribute('data-item-id', item.id); // Add data-item-id attribute

    const checkboxSrc = item.isChecked
      ? CHECKBOX_CHECKED_SRC
      : CHECKBOX_EMPTY_SRC;

    itemDiv.innerHTML = `
      <div class='item-header'>
        <img class='checkbox' src='${checkboxSrc}' alt='checkbox' />
        ${item.name}
      </div>
      <img class='delete-item-button' src='./images/create-list/delete-circle-button.png' alt='delete button' />
    `;

    selectedItemsContainer.appendChild(itemDiv);
  });
}

// Get the container that holds all the items
const selectedItemsContainer = document.querySelector('.selected-items-container');

// Attach a single event listener to the container
selectedItemsContainer.addEventListener('click', function (event) {
  const target = event.target;
  const itemDiv = target.closest('.shopping-item');

  if (!itemDiv) return;
  const itemId = itemDiv.getAttribute('data-item-id');

  if (target.classList.contains('delete-item-button')) {
    // Delete button was clicked
    removeItemFromFirestore(itemId);
  } else if (target.classList.contains('checkbox')) {
    // Checkbox was clicked

    // Toggle the checkbox UI
    if (target.src.includes('check-box-empty.png')) {
      target.src = CHECKBOX_CHECKED_SRC;
      target.classList.add('checked');
      setTimeout(() => target.classList.add('shrink'), 200);
    } else {
      target.src = CHECKBOX_EMPTY_SRC;
      target.classList.remove('checked');
      target.classList.remove('shrink');
    }

    // Toggle the isChecked value in Firestore
    toggleIsChecked(itemId);
  }
});

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
  window.location.href = `add-item.html?id=${listId}`;
});

function removeItemFromFirestore(itemId) {
  db.collection('lists').doc(listId).collection('items').doc(itemId).delete()
    .then(() => {
      window.location.href = `create-list.html?id=${listId}`;
    })
    .catch((error) => {
      console.log('Failed to remove item: ', error);
    });
}

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