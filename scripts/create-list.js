
// ==========================
// Global constants and functions
// ==========================

// Default name for a new list if none is provided
const DEFAULT_LIST_NAME = "New List";

// Paths to checkbox images for checked and unchecked states
const CHECKBOX_EMPTY_SRC = '../images/create-list/check-box-empty.png';
const CHECKBOX_CHECKED_SRC = '../images/create-list/check-box-checked.png';

// A variable to hold the current list's name; defaults to DEFAULT_LIST_NAME
let listName = DEFAULT_LIST_NAME;


// ==========================
// Function to extract query parameters from the URL
// ==========================
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Extract the list ID and user ID from URL query parameters
const listId = getQueryParam('id');
const userId = getQueryParam('uid') || '';

// ==========================
// Utility function to fetch a single document from Firestore
// ==========================
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


// ==========================
// Items fetching and displaying logic
// ==========================
/*
 * The following block of code is responsible for:
 * 1. Fetching items for the current list from Firestore
 * 2. Displaying them in the DOM
 */

// Global array to store the list items currently displayed
let itemsList = [];

// Function to display items in the ".selected-items-container" element
function displayItems() {
  const selectedItemsContainer = document.querySelector('.selected-items-container');
  selectedItemsContainer.innerHTML = '';

  itemsList.forEach((item) => {
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('shopping-item');
    // Store the item ID as a data attribute for easy reference later
    itemDiv.setAttribute('data-item-id', item.id);

    // Determine which checkbox image to display based on 'isChecked'
    const checkboxSrc = item.isChecked ? CHECKBOX_CHECKED_SRC : CHECKBOX_EMPTY_SRC;

    // Construct the inner HTML for the item
    itemDiv.innerHTML = `
      <div class='item-header'>
        <img class='checkbox' src='${checkboxSrc}' alt='checkbox' />
        ${item.name}
      </div>
      <img class='delete-item-button' src='../images/create-list/delete-circle-button.png' alt='delete button' />
    `;

    // Append the item to the container
    selectedItemsContainer.appendChild(itemDiv);
  });
}

// Function to fetch items from Firestore and then display them
function fetchAndDisplayItems(listId) {
  // Show a loading spinner while fetching data
  const spinner = document.querySelector('.spinner-border');
  const selectedItemsContainer = document.querySelector('.selected-items-container');

  if (spinner) {
    spinner.style.display = 'block';
  }
  if (selectedItemsContainer) {
    selectedItemsContainer.innerHTML = '';
  }

  // Fetch all items for the given list from the 'items' subcollection in Firestore
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

    // Once data is fetched, hide the spinner
    if (spinner) {
      spinner.style.display = 'none';
    }

    // Display the fetched items in the UI
    displayItems();
  }).catch((error) => {
    console.error('Error fetching items: ', error);

    // Hide the spinner even if there's an error
    if (spinner) {
      spinner.style.display = 'none';
    }
  });
}

// Ensure that the page content is fully loaded before executing certain scripts
document.addEventListener('DOMContentLoaded', function () {
  const listNameElement = document.querySelector('.list-name');

  // If the element for displaying the list name doesn't exist, log a warning
  if (!listNameElement) {
    console.warn('Element with class "list-name" not found');
  }

  // If a list ID is present, fetch the list name and items
  if (listId) {
    // Fetch the list document from Firestore and update the UI with its name
    getFirestoreDocument('lists', listId).then(listData => {
      if (listData) {
        listName = listData.name || DEFAULT_LIST_NAME;
      } else {
        listName = DEFAULT_LIST_NAME;
      }
      listNameElement.innerText = listName;
    });

    // Fetch and display the items for this list
    fetchAndDisplayItems(listId);
  } else {
    console.log('No list ID provided in the URL.');
    listNameElement.innerText = DEFAULT_LIST_NAME;
  }
});


// ==========================
// Navigation to add-item page
// ==========================
/*
 * When user clicks the add-item button, navigate to add-item page with list & user IDs
 */
document.getElementById('item-add-button').addEventListener('click', function (event) {
  window.location.href = `add-item.html?id=${listId}&uid=${userId}`;
});

// ==========================
// Item deletion feature
// ==========================
/*
 * This section handles removing an item from the Firestore database and updating the UI.
 */
function removeItemFromFirestore(itemId) {
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  const listRef = db.collection('lists').doc(listId);
  const itemRef = listRef.collection('items').doc(itemId);

  db.runTransaction(async (transaction) => {
    // Retrieve the current list and the specific item from Firestore
    const listDoc = await transaction.get(listRef);
    const itemDoc = await transaction.get(itemRef);

    if (!listDoc.exists) {
      throw "List does not exist!";
    }

    if (!itemDoc.exists) {
      throw "Item does not exist!";
    }

    // Check if the item is currently checked
    const isChecked = itemDoc.data().isChecked || false;

    // Retrieve counts for total and checked items from the list
    let totalNumberOfItems = listDoc.data().totalNumberOfItems || 0;
    let checkedNumberOfItems = listDoc.data().checkedNumberOfItems || 0;

    // Calculate the new counts after item deletion
    const newTotal = Math.max(totalNumberOfItems - 1, 0);
    const newChecked = isChecked ? Math.max(checkedNumberOfItems - 1, 0) : checkedNumberOfItems;

    // Update the main list's item counts
    transaction.update(listRef, {
      totalNumberOfItems: newTotal,
      checkedNumberOfItems: newChecked
    });

    // Delete the item from Firestore
    transaction.delete(itemRef);
  }).then(() => {
    // Remove the deleted item from the itemsList array
    itemsList = itemsList.filter(item => item.id !== itemId);

    // Show a success popup using SweetAlert
    Swal.fire({
      title: "Item Successfully\n Deleted!",
      showConfirmButton: false,
      timer: 1000,
      imageUrl: "../images/create-list/success.png",
      imageWidth: 100,
      imageHeight: 'auto',
      imageAlt: "successfully deleted item",
      customClass: {
        popup: 'custom-rounded-popup',
        title: 'custom-title',
      }
    })

    // Re-display the updated item list
    displayItems();
  }).catch((error) => {
    console.error("Transaction failed: ", error);
  });
}


// ==========================
// List sharing feature
// ==========================
/*
 * The following code controls the overlay that appears for sharing the list,
 * as well as various methods of sharing (e.g., copy link, WhatsApp).
 */

// Show the share overlay when the share button is clicked
document.getElementById('share-button').addEventListener('click', function () {
  document.getElementById('share-overlay').classList.remove('hidden');
});

// Hide the share overlay
function closeShareOverlay() {
  document.getElementById('share-overlay').classList.add('hidden');
}

// Copy the current page link to clipboard and show a success message
function copyLink() {
  navigator.clipboard.writeText(window.location.href)
    .then(() => Swal.fire({
      title: "Link copied to\n clipboard!",
      showConfirmButton: false,
      timer: 1200,
      imageUrl: "../images/create-list/success.png",
      imageWidth: 100,
      imageHeight: 'auto',
      customClass: {
        popup: 'custom-rounded-popup',
      }
    }))
    .catch((error) => console.error("Failed to copy link: ", error));
}

// Share the current page link via WhatsApp
function shareOnWhatsApp() {
  const url = `https://wa.me/?text=${encodeURIComponent(window.location.href)}`;
  window.open(url, '_blank');
}

// Share the current page link via SMS
function shareViaMessages() {
  window.open(`sms:?body=${encodeURIComponent(window.location.href)}`);
}

// Share the current page link via Email
function shareViaEmail() {
  window.open(`mailto:?subject=Check out this list&body=${encodeURIComponent(window.location.href)}`);
}


// ==========================
// Toggle items (cross-off or check) feature
// ==========================
/*
 * Clicking the checkbox toggles the isChecked state of the item in Firestore,
 * updates the UI checkbox state, and adjusts the count of checked items in the list.
 */
const selectedItemsContainer = document.querySelector('.selected-items-container');

// Event delegation for the selected items container
// This allows handling clicks on dynamically generated elements
selectedItemsContainer.addEventListener('click', function (event) {
  const target = event.target;
  const itemDiv = target.closest('.shopping-item');

  if (!itemDiv) return; // If the click is not on a shopping-item element, exit

  const itemId = itemDiv.getAttribute('data-item-id');

  // If the delete button was clicked, remove the item
  if (target.classList.contains('delete-item-button')) {
    removeItemFromFirestore(itemId);
  }
  // If the checkbox was clicked, toggle the isChecked state
  else if (target.classList.contains('checkbox')) {
    // Update the checkbox image in the UI immediately
    if (target.src.includes('check-box-empty.png')) {
      target.src = CHECKBOX_CHECKED_SRC;
      target.classList.add('checked');
      setTimeout(() => target.classList.add('shrink'), 100);
    } else {
      target.src = CHECKBOX_EMPTY_SRC;
      target.classList.remove('checked');
      target.classList.remove('shrink');
    }

    // Update the Firestore document with the new isChecked value
    toggleIsChecked(itemId);
  }
});

// Function to toggle the 'isChecked' status of an item in Firestore
async function toggleIsChecked(itemId) {
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  const listRef = db.collection('lists').doc(listId);
  const itemRef = listRef.collection('items').doc(itemId);

  try {
    await db.runTransaction(async (transaction) => {
      // Get the current item and list
      const itemDoc = await transaction.get(itemRef);
      const listDoc = await transaction.get(listRef);

      if (!itemDoc.exists) {
        throw "Item does not exist!";
      }

      if (!listDoc.exists) {
        throw "List does not exist!";
      }

      // Determine the new checked state
      const currentIsChecked = itemDoc.data().isChecked || false;
      const newIsChecked = !currentIsChecked;

      // Update the item's isChecked field
      transaction.update(itemRef, { isChecked: newIsChecked });

      // Update the checkedNumberOfItems count accordingly
      const incrementValue = newIsChecked ? 1 : -1;
      let currentCheckedNumberOfItems = listDoc.data().checkedNumberOfItems || 0;
      let newCheckedNumberOfItems = currentCheckedNumberOfItems + incrementValue;
      newCheckedNumberOfItems = Math.max(newCheckedNumberOfItems, 0);

      transaction.update(listRef, { checkedNumberOfItems: newCheckedNumberOfItems });
    });
  } catch (error) {
    console.error("Transaction failed: ", error);
  }
}


// ==========================
// Editing the list name feature
// ==========================
/*
 * This code shows a modal allowing the user to change the name of the current list.
 */
const editModal = document.getElementById('editModal-1');
const closeModalButton = editModal.querySelector('.close');
const saveButton = document.getElementById('saveButton-1');
const listNameInput = document.getElementById('listNameInput-1');
const modalOverlay = document.getElementById('editModal-1-overlay');

// When the edit button is clicked, open the modal and populate the current list name
document.getElementById('edit-button').addEventListener('click', function () {
  if (listId) {
    const docRef = db.collection('lists').doc(listId);

    // Fetch the current list name from Firestore
    docRef.get().then((doc) => {
      if (doc.exists) {
        // Set the current name in the input field
        listNameInput.value = doc.data().name || "New List";

        // If the list is shared and the user is not the owner, prevent editing
        if (doc.data().isSharedWithOthers && userId !== doc.data().userID) {
          Swal.fire({
            title: "You cannot edit shared list!",
            showConfirmButton: false,
            timer: 1000,
            customClass: {
              popup: 'custom-rounded-popup-no-img',
              title: 'custom-title',
            }
          })
          return;
        }
        // If the user owns the list, show the edit modal
        else if (userId === doc.data().userID) {
          editModal.style.display = 'block';
          modalOverlay.style.display = 'block';
        }

        // Close modal when the close button is clicked
        closeModalButton.addEventListener('click', () => {
          editModal.style.display = 'none';
          modalOverlay.style.display = 'none';
        });

        // Show a success message when the save button is clicked (before actually saving)
        saveButton.addEventListener('click', () => {
          Swal.fire({
            title: "New list name\n Saved!",
            showConfirmButton: false,
            timer: 1200,
            imageUrl: "../images/create-list/success.png",
            imageWidth: 100,
            imageHeight: 'auto',
            customClass: {
              popup: 'custom-rounded-popup',
            }
          })
          editModal.style.display = 'none';
          modalOverlay.style.display = 'none';
        })
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

// Close the modal when the close button is clicked
closeModalButton.addEventListener('click', function () {
  editModal.style.display = 'none';
});

// Save the new list name to Firestore when the save button is clicked
saveButton.addEventListener('click', function () {
  const newListName = listNameInput.value.trim();

  if (newListName && listId) {
    const docRef = db.collection('lists').doc(listId);

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

// ==========================
// List deletion feature
// ==========================
/*
 * The following code handles showing a confirmation modal and deleting the list.
 */
const deleteModal = document.getElementById('deleteModal');
const deleteSuccessModal = document.getElementById('delete-success-modal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');
const cancelDeleteButton = document.getElementById('cancelDeleteButton');

// Show the delete confirmation modal when the delete button is clicked
const deleteListButton = document.getElementById('delete-list-button');

if (deleteListButton) {
  deleteListButton.addEventListener('click', function () {
    if (listId) {
      getFirestoreDocument('lists', listId).then(listData => {
        if (listData) {
          // If the list is shared and the user is not the owner, prevent deletion
          if (listData.isSharedWithOthers && userId !== listData.userID) {
            Swal.fire({
              title: "You cannot delete shared list!",
              showConfirmButton: false,
              timer: 1000,
              customClass: {
                popup: 'custom-rounded-popup-no-img',
                title: 'custom-title',
              }
            })
            return;
          }

          // Update the global listName variable
          listName = listData.name || DEFAULT_LIST_NAME;

          // Set the confirmation message with the list name
          const modalMessage = deleteModal.querySelector('p');
          modalMessage.innerHTML = `Delete list <br>"${listName}"?`;

          // Show the delete confirmation modal
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

// If user confirms deletion, delete the list and show success modal
confirmDeleteButton.addEventListener('click', function () {
  removeListFromFirestore(listId);
  deleteSuccessModal.style.display = 'block';
  deleteModal.style.display = 'none';
});

// If user cancels deletion, hide the modal
cancelDeleteButton.addEventListener('click', function () {
  deleteModal.style.display = 'none';
});

// Close the delete modal if user clicks outside it
window.addEventListener('click', function (event) {
  if (event.target === deleteModal) {
    deleteModal.style.display = 'none';
  }
});

// A helper function to pause execution for a given number of milliseconds
function pause(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Actually remove the list from Firestore and then redirect the user
async function removeListFromFirestore(listId) {
  if (!listId) {
    console.error("Error: listId is empty or undefined.");
    return;
  }

  try {
    // Delete the list document
    await db.collection('lists').doc(listId).delete();
    // Wait for 1 second before redirecting
    await pause(1000);
    // Redirect the user to the dashboard
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.log('Failed to remove list: ', error);
  }
}

// ==========================
// Navigation to the sales page
// ==========================
/*
 * When certain buttons are clicked, navigate to "list-of-sales.html".
 */
const profileElements = document.querySelectorAll('.btn, #sale-button');
profileElements.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "list-of-sales.html";
  });
});

// ==========================
// Share list with a specific user by their email
// ==========================
/*
 * This function reads the email input, checks if the user exists in Firestore,
 * and adds the current list to their 'sharedLists'.
 */
function shareListButton() {
  const recipientInput = document.getElementById('recipient-input').value.trim();

  db.collection("users").where("email", "==", recipientInput).get()
    .then((querySnapshot) => {
      // If no user found with that email, show error
      if (querySnapshot.empty) {
        Swal.fire({
          title: "Sorry, we could not find the user",
          showConfirmButton: false,
          timer: 1000,
          customClass: {
            popup: 'custom-rounded-popup-no-img',
            title: 'custom-title',
          }
        })
      } else {
        // If user found, add the list to their 'sharedLists'
        querySnapshot.forEach((doc) => {
          // Prevent sharing the list with oneself
          if (userId === doc.id) {
            Swal.fire({
              title: "Sorry, you cannot share this with yourself",
              showConfirmButton: false,
              timer: 1000,
              customClass: {
                popup: 'custom-rounded-popup-no-img',
                title: 'custom-title',
              }
            })
            return;
          }

          let sharedLists = doc.data().sharedLists;
          sharedLists.unshift(listId);

          db.collection("users").doc(doc.id).update({ sharedLists })
            .then(() => {
              Swal.fire({
                title: "List Successfully\n Shared!",
                showConfirmButton: false,
                timer: 1000,
                imageUrl: "../images/create-list/success.png",
                imageWidth: 100,
                imageHeight: 'auto',
                imageAlt: "successfully shared list",
                customClass: {
                  popup: 'custom-rounded-popup',
                  title: 'custom-title',
                }
              })
              closeShareOverlay();
            })
            .catch((error) => {
              Swal.fire({
                title: "Sorry, something went wrong",
                showConfirmButton: false,
                timer: 1000,
                customClass: {
                  popup: 'custom-rounded-popup-no-img',
                  title: 'custom-title',
                }
              })
            });
        })
      }
    })
    .catch((error) => {
      console.error("Error fetching user:", error);
    });
}
