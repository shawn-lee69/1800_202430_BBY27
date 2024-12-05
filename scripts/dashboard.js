// ==========================
// Global variables and initialization
// ==========================

// Boolean indicating if the user is logged in; default is true
var isLoggedIn = true;

// Global variable to store the current user's ID
let userId = null;

// Arrays to store the user's lists and shared lists retrieved from Firestore
let itemsList = [];
let sharedItemsList = [];

// ==========================
// Function to get a query parameter value from the URL
// ==========================
function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Check if 'isLoggedIn' query parameter is false, and update global state accordingly
if (getQueryParameter('isLoggedIn') === 'false') {
  isLoggedIn = false;
}

// ==========================
// Navigation for profile-related elements
// ==========================
/*
 * This block sets up event listeners on elements that should navigate the user
 * to "my-page.html" when clicked. Both elements with class 'profile' and 'profile-span'
 * are targeted. Similarly, elements with class 'tag' and 'tag-span' navigate to "saleinfor.html".
 */
const profileElements = document.querySelectorAll('.profile, .profile-span');
profileElements.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "my-page.html";
  });
});

const profileElement = document.querySelectorAll('.tag, .tag-span');
profileElement.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "saleinfor.html";
  });
});

// ==========================
// Main content rendering logic
// ==========================
/*
 * The renderContent function checks the user's authentication state.
 * If the user is logged in, it fetches and displays their lists from Firestore.
 * If the user is not logged in, it shows an empty content message.
 */
function renderContent() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userID = user.uid;
      userId = user.uid;
      document.getElementById('listContent').style.display = 'block';
      fetchAndDisplayLists(userID); // Fetch the user's lists from Firestore
    } else {
      document.getElementById('emptyListContent').style.display = 'block';
    }
  });
}

// ==========================
// Helper function to format timestamps into user-friendly strings
// ==========================
/*
 * The formatSemanticTime function converts a JavaScript Date into a "semantic" time format
 * (e.g., "Just now", "5 minutes ago", "Yesterday", "2023-03-10") depending on how old it is.
 */
function formatSemanticTime(createdAt) {
  const now = new Date();
  const diffInMs = now - createdAt; // Difference in milliseconds
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInYears = Math.floor(diffInDays / 365);

  // Determine appropriate time format based on difference
  if (diffInYears >= 1) {
    // Format as YYYY-MM-DD for dates older than a year
    return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays > 1) {
    // For multiple days in the past, format as DD-MM-YYYY
    return `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
  } else if (diffInHours === 1) {
    return `${diffInHours} hour ago`;
  } else if (diffInHours > 1) {
    return `${diffInHours} hours ago`;
  } else if (diffInMinutes === 1) {
    return `${diffInMinutes} minute ago`;
  } else if (diffInMinutes > 1) {
    return `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

// ==========================
// Displaying the user's own lists
// ==========================
/*
 * The displayListItems function updates the UI to show the user's own lists.
 * If there are no items, it shows a "List is empty" message.
 */
function displayListItems() {
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  const shoppingListDiv = document.querySelector('.shoppingList');

  // Clear any existing items
  shoppingListDiv.innerHTML = '';

  // If no lists found, show an empty message
  if (!itemsList || itemsList.length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-message');
    emptyMessage.textContent = 'List is empty';
    shoppingListDiv.appendChild(emptyMessage);
    return;
  }

  // Iterate through each list and create corresponding DOM elements
  itemsList.forEach((item) => {
    const semanticTime = formatSemanticTime(item.createdAt);
    const itemAnchor = document.createElement('a');
    itemAnchor.href = `${basePath}/create-list.html?id=${item.id}&uid=${userId}`;
    itemAnchor.classList.add('list-item-wrapper');

    // Determine if the list is complete (all items checked off)
    const isCompleted = item.totalNumberOfItems === item.checkedNumberOfItems;
    const listItemClass = isCompleted ? 'list-item completed' : 'list-item';

    // Determine the counter text (e.g., "2/5" or "empty")
    let itemCounterText;
    if (item.totalNumberOfItems === 0 && item.checkedNumberOfItems === 0) {
      itemCounterText = 'empty';
    } else {
      itemCounterText = `${item.checkedNumberOfItems} / ${item.totalNumberOfItems}`;
    }

    // If the list is shared, display a shared icon
    const sharedIconHTML = item.isSharedWithOthers ? `
      <img src="../images/dashboard/shared-button.png" alt="this list is shared list">
    ` : '';

    // Construct the inner HTML for the list item
    itemAnchor.innerHTML = `
      <div class='${listItemClass}'>
        <div class='list-item-content-header'>
          <div class='list-name'>${item.name}</div>
          <div class='list-item-number-counter'>${itemCounterText}</div>
        </div>
        <div class='list-item-content-bottom'>
          ${sharedIconHTML}
          <div class='list-item-time-stamp'>${semanticTime}</div>
        </div>
      </div>
    `;

    // Append the constructed element to the shopping list container
    shoppingListDiv.appendChild(itemAnchor);
  });

  // Style the counters for empty lists
  document.querySelectorAll('.list-item-number-counter').forEach(counter => {
    if (counter.textContent.trim() === 'empty') {
      counter.style.color = 'rgba(119,119,119,0.45)';
      counter.style.fontWeight = 'bold';
      counter.style.fontSize = '1rem';
    }
  });
}

// ==========================
// Displaying the shared lists
// ==========================
/*
 * The displaySharedListItems function updates the UI to show lists shared with the user.
 * If there are shared lists, it adds a title "Shared with Me" above them.
 */
function displaySharedListItems() {
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  const sharedShoppingListDiv = document.querySelector('.shared-shopping-list');

  // Clear any existing items
  sharedShoppingListDiv.innerHTML = '';

  // If there are shared items, create a title section
  if (sharedItemsList && sharedItemsList.length !== 0) {
    const sharedListSectionTitle = document.createElement('div');
    sharedListSectionTitle.classList.add('listContainerTitle');
    sharedListSectionTitle.textContent = 'Shared with Me';

    // Insert the title before the shared shopping list items
    document.querySelector('.listContainer').insertBefore(sharedListSectionTitle, sharedShoppingListDiv);
  }

  // Iterate through each shared list item and construct UI elements
  sharedItemsList.forEach((item) => {
    const semanticTime = formatSemanticTime(item.createdAt);
    const itemAnchor = document.createElement('a');
    itemAnchor.href = `${basePath}/create-list.html?id=${item.id}&uid=${userId}`;
    itemAnchor.classList.add('list-item-wrapper');

    // Determine if the shared list is complete
    const isCompleted = item.totalNumberOfItems === item.checkedNumberOfItems;
    const listItemClass = isCompleted ? 'shared-list-item completed' : 'shared-list-item';

    // Determine the counter text for the shared list
    let itemCounterText;
    if (item.totalNumberOfItems === 0 && item.checkedNumberOfItems === 0) {
      itemCounterText = 'empty';
    } else {
      itemCounterText = `${item.checkedNumberOfItems} / ${item.totalNumberOfItems}`;
    }

    // Construct the shared list item's HTML
    itemAnchor.innerHTML = `
      <div class='${listItemClass}'>
        <div class='list-item-content-header'>
          <div class='list-name'>${item.name}</div>
          <div class='shared-list-item-number-counter'>${itemCounterText}</div>
        </div>
        <div class='list-item-content-bottom'>
          <div class='list-item-time-stamp'>${semanticTime}</div>
        </div>
      </div>
    `;

    sharedShoppingListDiv.appendChild(itemAnchor);
  });

  // Style the counters for empty shared lists
  document.querySelectorAll('.list-item-number-counter').forEach(counter => {
    if (counter.textContent.trim() === 'empty') {
      counter.style.color = 'rgba(119,119,119,0.45)';
      counter.style.fontWeight = 'bold';
      counter.style.fontSize = '1rem';
    }
  });
}

// ==========================
// Fetching and displaying all lists from Firestore
// ==========================
/*
 * The fetchAndDisplayLists function:
 * 1. Shows a spinner while data is loading.
 * 2. Fetches the user's lists from Firestore.
 * 3. Sorts them so that incomplete lists appear first.
 * 4. Hides the spinner and displays the lists in the UI.
 * 5. Additionally fetches lists shared with the user and displays them.
 */
function fetchAndDisplayLists(userId) {
  const spinner = document.querySelector('.spinner-border');
  const shoppingListDiv = document.querySelector('.shoppingList');
  const sharedShoppingListDiv = document.querySelector('.shared-shopping-list');

  // Show the spinner and clear the areas before fetching
  if (spinner) {
    spinner.style.display = 'block';
  }
  if (shoppingListDiv) {
    shoppingListDiv.innerHTML = '';
  }
  if (sharedShoppingListDiv) {
    sharedShoppingListDiv.innerHTML = '';
  }

  // Fetch lists owned by the user
  db.collection('lists').where('userID', '==', userId).get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      itemsList.push({
        id: doc.id,
        name: data.name,
        totalNumberOfItems: data.totalNumberOfItems,
        checkedNumberOfItems: data.checkedNumberOfItems,
        createdAt: data.createdAt.toDate(),
        isSharedWithOthers: data.isSharedWithOthers || false
      });
    });

    // Sort the lists: incomplete first, then by recency
    itemsList.sort((a, b) => {
      const aIsComplete = a.totalNumberOfItems === a.checkedNumberOfItems;
      const bIsComplete = b.totalNumberOfItems === b.checkedNumberOfItems;

      if (aIsComplete && !bIsComplete) {
        return 1; // a is complete, b is not; b comes first
      } else if (!aIsComplete && bIsComplete) {
        return -1; // a is not complete, b is; a comes first
      } else {
        // Both are either complete or incomplete; sort by createdAt descending
        return b.createdAt - a.createdAt;
      }
    });

    // Hide the spinner after fetching is done
    if (spinner) {
      spinner.style.display = 'none';
    }

    // Display the fetched lists
    displayListItems();
  }).catch((error) => {
    console.error('Error fetching lists: ', error);
    // Hide spinner even if an error occurred
    if (spinner) {
      spinner.style.display = 'none';
    }
  });

  // Fetch the user's shared lists from Firestore
  db.collection("users").doc(userId).get().then((userDoc) => {
    if (!userDoc.exists) {
      console.warn('User document does not exist');
      return;
    }

    // Safely retrieve sharedLists from the userDoc
    const sharedLists = userDoc.data().sharedLists || [];
    if (Array.isArray(sharedLists) && sharedLists.length > 0) {
      const fetchPromises = sharedLists.filter(id => id).map((id) =>
        db.collection('lists').doc(id).get().then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            sharedItemsList.push({
              id: doc.id,
              name: data.name,
              totalNumberOfItems: data.totalNumberOfItems,
              checkedNumberOfItems: data.checkedNumberOfItems,
              createdAt: data.createdAt.toDate(),
            });
          }
        }).catch((error) => {
          console.error(`Error fetching shared list with ID ${id}:`, error);
        })
      );

      // Wait until all shared lists are fetched
      Promise.all(fetchPromises).then(() => {
        // Sort shared lists similarly: incomplete first, then by recency
        sharedItemsList.sort((a, b) => {
          const aIsComplete = a.totalNumberOfItems === a.checkedNumberOfItems;
          const bIsComplete = b.totalNumberOfItems === b.checkedNumberOfItems;

          if (aIsComplete && !bIsComplete) {
            return 1;
          } else if (!aIsComplete && bIsComplete) {
            return -1;
          } else {
            return b.createdAt - a.createdAt;
          }
        });

        // Display the shared lists
        displaySharedListItems();
      });
    } else {
      console.log('No shared lists found for the user.');
    }
  }).catch((error) => {
    console.error('Error fetching user document:', error);
  });
}

// ==========================
// Adding a new list to Firestore
// ==========================
/*
 * The addListToFirestore function creates a new list document in Firestore and then redirects the
 * user to "create-list.html" with the new list ID.
 */
function addListToFirestore() {
  // Ensure the user is authenticated before creating a list
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userID = user.uid;
      const listName = 'New List'; // Default new list name

      if (listName) {
        const currentTime = new Date();
        const newList = {
          name: listName,
          createdAt: firebase.firestore.Timestamp.fromDate(currentTime),
          updatedAt: firebase.firestore.Timestamp.fromDate(currentTime),
          userID: userID,  // Store the user ID in the list document
          totalNumberOfItems: 0, // At first there is no item in the list
          checkedNumberOfItems: 0, // At first no item is crossed off
          isSharedWithOthers: false,
        };

        // Add the new list document to Firestore
        db.collection('lists').add(newList)
          .then((docRef) => {
            // Navigate to create-list.html with the new list ID
            window.location.href = `create-list.html?id=${docRef.id}&uid=${userID}`;
          })
          .catch((error) => {
            console.error('Error adding list: ', error);
          });
      } else {
        console.log('No list created.');
      }
    } else {
      // If user is not authenticated, redirect them to create-list.html anyway
      window.location.href = "create-list.html";
      console.error("User is not authenticated. Please log in first.");
    }
  });
}

// ==========================
// Setting up the "Add List" button
// ==========================
/*
 * The setupAddListButton function sets click event listeners on elements that should trigger
 * the creation of a new list and navigation to the "create-list.html" page.
 */
function setupAddListButton() {
  const addElements = document.querySelectorAll('.create-list-link, .add-span');

  addElements.forEach(element => {
    element.addEventListener('click', () => {
      addListToFirestore();
    });
  });
}

// ==========================
// Initial page load
// ==========================
/*
 * On page load, render the content (fetch user state and lists) and set up the add list button.
 */
renderContent();
setupAddListButton();