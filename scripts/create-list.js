let listName = "New List";

const CHECKBOX_EMPTY_SRC = './images/create-list/check-box-empty.png';
const CHECKBOX_CHECKED_SRC = './images/create-list/check-box-checked.png';

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
          // Update the global listName variable
          listName = doc.data().name || "New List";

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
        const listNameElement = document.querySelector('.list-name');

        // Check if listNameElement exists before using it
        if (!listNameElement) {
          console.warn('Element with class "list-name" not found');
          return;
        }

        if (doc.exists) {
          const listData = doc.data();
          listName = listData.name || "New List";
          listNameElement.innerText = listName;
        } else {
          console.log('No such document!');
          listNameElement.innerText = "New List";
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
        const listNameElement = document.querySelector('.list-name');
        if (listNameElement) {
          listNameElement.innerText = "New List";
        } else {
          console.warn('Element with class "list-name" not found');
        }
      });
    fetchAndDisplayItems(listId);
  } else {
    console.log('No list ID provided in the URL.');
    const listNameElement = document.querySelector('.list-name');
    if (listNameElement) {
      listNameElement.innerText = "New List";
    } else {
      console.warn('Element with class "list-name" not found');
    }
  }
});

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

document.getElementById('item-add-button').addEventListener('click', function(event) {
  window.location.href = `add-item.html?id=${listId}`;
});

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

// Modal elements
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