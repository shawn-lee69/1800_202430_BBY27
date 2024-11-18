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
const userId = getQueryParam('uid') || '';

/*
 * This is a utility function for fetching data from Firestore
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
  // code snippet for spinner
  const spinner = document.querySelector('.spinner-border');
  const selectedItemsContainer = document.querySelector('.selected-items-container');

  // Show the spinner and clear the selected item list div
  if (spinner) {
    spinner.style.display = 'block';
  }
  if (selectedItemsContainer) {
    selectedItemsContainer.innerHTML = '';
  }


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

    // Hide the spinner after fetching is done
    if (spinner) {
      spinner.style.display = 'none';
    }

    displayItems();
  }).catch((error) => {
    console.error('Error fetching items: ', error);

    // Hide the spinner even if an error occurs
    if (spinner) {
      spinner.style.display = 'none';
    }
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
  window.location.href = `add-item.html?id=${listId}&uid=${userId}`;
});


/*
 * Following cluster of codes is for item deleting feature
 */
function removeItemFromFirestore(itemId) {

  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  const listRef = db.collection('lists').doc(listId);
  const itemRef = listRef.collection('items').doc(itemId);

  db.runTransaction(async (transaction) => {
    const listDoc = await transaction.get(listRef);
    const itemDoc = await transaction.get(itemRef);

    if (!listDoc.exists) {
      throw "List does not exist!";
    }

    if (!itemDoc.exists) {
      throw "Item does not exist!";
    }

    const isChecked = itemDoc.data().isChecked || false;
    let totalNumberOfItems = listDoc.data().totalNumberOfItems || 0;
    let checkedNumberOfItems = listDoc.data().checkedNumberOfItems || 0;

    // Calculate new counts ensuring they don't go below zero
    const newTotal = Math.max(totalNumberOfItems - 1, 0);
    const newChecked = isChecked ? Math.max(checkedNumberOfItems - 1, 0) : checkedNumberOfItems;

    // Update counts
    transaction.update(listRef, {
      totalNumberOfItems: newTotal,
      checkedNumberOfItems: newChecked
    });

    // Delete the item
    transaction.delete(itemRef);
  }).then(() => {
    itemsList = itemsList.filter(item => item.id !== itemId);
    displayItems();
  }).catch((error) => {
    console.error("Transaction failed: ", error);
  });
}

// Start of the code for editing list name
const editModal = document.getElementById('editModal');
const closeModalButton = editModal.querySelector('.close');
const saveButton = document.getElementById('saveButton');
const listNameInput = document.getElementById('listNameInput');

// Open the modal and populate the current list name
document.getElementById('edit-button').addEventListener('click', function () {
  if (listId) {
    const docRef = db.collection('lists').doc(listId);

    // Fetch the current list name from Firestore
    docRef.get().then((doc) => {
      if (doc.exists) {
        // Set the current name in the input field
        listNameInput.value = doc.data().name || "New List";
        // Show the modal
        editModal.style.display = 'block';
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

// Close the modal
closeModalButton.addEventListener('click', function () {
  editModal.style.display = 'none';
});

// Save the new list name to Firestore
saveButton.addEventListener('click', function () {
  const newListName = listNameInput.value.trim();

  if (newListName && listId) {
    const docRef = db.collection('lists').doc(listId);

    // Update the list name in Firestore
    docRef.update({
      name: newListName,
      updatedAt: firebase.firestore.Timestamp.fromDate(new Date())
    })
    .then(() => {
      console.log("List name updated successfully!");
      // Update the list name in the UI
      document.querySelector('.list-name').innerText = newListName;
      // Close the modal
      editModal.style.display = 'none';
    })
    .catch((error) => {
      console.error("Error updating list name:", error);
    });
  } else {
    console.log("Please enter a valid list name.");
  }
});

// Close the modal when clicking outside of it
window.addEventListener('click', function (event) {
  if (event.target === editModal) {
    editModal.style.display = 'none';
  }
});

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
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  const listRef = db.collection('lists').doc(listId);
  const itemRef = listRef.collection('items').doc(itemId);

  try {
    await db.runTransaction(async (transaction) => {
      const itemDoc = await transaction.get(itemRef);
      const listDoc = await transaction.get(listRef);

      if (!itemDoc.exists) {
        throw "Item does not exist!";
      }

      if (!listDoc.exists) {
        throw "List does not exist!";
      }

      const currentIsChecked = itemDoc.data().isChecked || false;
      const newIsChecked = !currentIsChecked;

      // Update the item's isChecked status
      transaction.update(itemRef, { isChecked: newIsChecked });

      // Update the checkedNumberOfItems using FieldValue.increment
      const incrementValue = newIsChecked ? 1 : -1;

      // Ensure that checkedNumberOfItems does not go below zero
      let currentCheckedNumberOfItems = listDoc.data().checkedNumberOfItems || 0;
      let newCheckedNumberOfItems = currentCheckedNumberOfItems + incrementValue;
      newCheckedNumberOfItems = Math.max(newCheckedNumberOfItems, 0);

      transaction.update(listRef, { checkedNumberOfItems: newCheckedNumberOfItems });
    });

  } catch (error) {
    console.error("Transaction failed: ", error);
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