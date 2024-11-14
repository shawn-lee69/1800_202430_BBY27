/*
 * Global constants and functions
 */
const DEFAULT_LIST_NAME = "New List";
const CHECKBOX_EMPTY_SRC = './images/create-list/check-box-empty.png';
const CHECKBOX_CHECKED_SRC = './images/create-list/check-box-checked.png';

let listName = DEFAULT_LIST_NAME;

// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const listId = getQueryParam('id');

/*
 * This is a utility function for accessing Firestore
 */
function getFirestoreDocument(collection, docId) {
  return db.collection(collection).doc(docId).get()
    .then(doc => {
      if (doc.exists) {
        return doc.data();
      } else {
        console.log('No such document!');
        return null;
      }
    })
    .catch(error => {
      console.error(`Error getting document from ${collection}/${docId}:`, error);
      return null;
    });
}


/*
 * Following cluster of codes is responsible for fetching lists from DB
 */
// Declare itemsList globally
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

// Function to fetch items from Firestore and display them
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

// Ensure code runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {

  const listNameElement = document.querySelector('.list-name');

  // Check if listNameElement exists before using it
  if (!listNameElement) {
    console.warn('Element with class "list-name" not found');
  }

  if (listId) {
    // Fetch the list from Firestore
    getFirestoreDocument('lists', listId).then(listData => {
      if (listData) {
        listName = listData.name || DEFAULT_LIST_NAME;
      } else {
        listName = DEFAULT_LIST_NAME;
      }
      listNameElement.innerText = listName;
    });
    fetchAndDisplayItems(listId);
  } else {
    console.log('No list ID provided in the URL.');
      listNameElement.innerText = DEFAULT_LIST_NAME;
  }
});


/*
 * Following snippet of code navigates user to add-item page when add item button is clicked.
 */
document.getElementById('item-add-button').addEventListener('click', function(event) {
  window.location.href = `add-item.html?id=${listId}`;
});


/*
 * Following cluster of codes is for item deleting feature
 */
function removeItemFromFirestore(itemId) {
  db.collection('lists').doc(listId).collection('items').doc(itemId).delete()
    .then(() => {
      // Remove the item from itemsList and re-render the items
      itemsList = itemsList.filter(item => item.id !== itemId);
      displayItems();
    })
    .catch((error) => {
      console.log('Failed to remove item: ', error);
    });
}


/*
 * Following cluster of codes is for list sharing feature
 */
// Show the overlay when the share button is clicked
document.getElementById('share-button').addEventListener('click', function () {
  document.getElementById('share-overlay').classList.remove('hidden');
});

// Hide the overlay when the close button is clicked
function closeShareOverlay() {
  document.getElementById('share-overlay').classList.add('hidden');
}

// Example functions for sharing options
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert("Link copied to clipboard!"))
    .catch((error) => console.error("Failed to copy link: ", error));
}

function shareOnWhatsApp() {
  const url = `https://wa.me/?text=${encodeURIComponent(window.location.href)}`;
  window.open(url, '_blank');
}

function shareViaMessages() {
  window.open(`sms:?body=${encodeURIComponent(window.location.href)}`);
}

function shareViaEmail() {
  window.open(`mailto:?subject=Check out this list&body=${encodeURIComponent(window.location.href)}`);
}


/*
 * Following cluster of codes is for item toggling(crossing-off) feature
 */
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
      setTimeout(() => target.classList.add('shrink'), 100);
    } else {
      target.src = CHECKBOX_EMPTY_SRC;
      target.classList.remove('checked');
      target.classList.remove('shrink');
    }

    // Toggle the isChecked value in Firestore
    toggleIsChecked(itemId);
  }
});

async function toggleIsChecked(itemId) {
  try {
    const itemData = await getFirestoreDocument(`lists/${listId}/items`, itemId);

    if (itemData) {
      const currentValue = itemData.isChecked;
      const docRef = db.collection('lists').doc(listId).collection('items').doc(itemId);
      await docRef.update({ isChecked: !currentValue });
      console.log('Toggled successfully');
    } else {
      console.log('No such item');
    }
  } catch (error) {
    console.error('Error toggling:', error);
  }
}



/*
 * Following cluster of codes is for list deletion function.
 */
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
      getFirestoreDocument('lists', listId).then(listData => {
        if (listData) {
          // Update the global listName variable
          listName = listData.name || DEFAULT_LIST_NAME;

          // Set the modal message with the list name
          const modalMessage = deleteModal.querySelector('p');
          modalMessage.innerHTML = `Delete list <br>"${listName}"?`;

          // Show the modal
          deleteModal.style.display = 'block';
        } else {
          console.log("No such document!");
        }
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

function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function removeListFromFirestore(listId) {
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  try {
    await db.collection('lists').doc(listId).delete();
    await pause(1000); // Wait for 1 second (1000 milliseconds)
    window.location.href = 'index.html';
  } catch (error) {
    console.log('Failed to remove list: ', error);
  }
}