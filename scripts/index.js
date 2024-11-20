// Change this value based on user's login status
var isLoggedIn = true;
let userId = null;

function getQueryParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

if (getQueryParameter('isLoggedIn') === 'false') {

  isLoggedIn = false;
}

// add navigations for nav bottom buttons by selecting all elements that should navigate to "myPage.html"
const profileElements = document.querySelectorAll('.profile, .profile-span');
profileElements.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "myPage.html";
  });
});

const profileElement = document.querySelectorAll('.tag, .tag-span');
profileElement.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "saleinfor.html";
  });
});



function renderContent() {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userID = user.uid;
      userId = user.uid;
      document.getElementById('listContent').style.display = 'block';
      fetchAndDisplayLists(userID);
    } else {
      document.getElementById('emptyListContent').style.display = 'block';
    }
  });
}

// Helper function to format date dynamically
function formatSemanticTime(createdAt) {
  const now = new Date();
  const diffInMs = now - createdAt; // Difference in milliseconds
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInYears >= 1) {
    return `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays > 1) {
    return `${String(createdAt.getDate()).padStart(2, '0')}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${createdAt.getFullYear()}`;
  } else if (diffInHours >= 1) {
    return `${diffInHours} hour ago`;
  } else if (diffInHours >= 2) {
    return `${diffInHours} hours ago`;
  } else if (diffInMinutes >= 1) {
    return `${diffInMinutes} minute ago`;
  } else if (diffInMinutes >= 2) {
    return `${diffInMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

// Function to display the list items in the shoppingList div
function displayListItems() {
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');

  const shoppingListDiv = document.querySelector('.shoppingList');
  shoppingListDiv.innerHTML = ''; // Clear any existing items

  if (!itemsList || itemsList.length === 0) {
    // Create a message element
    const emptyMessage = document.createElement('div');
    emptyMessage.classList.add('empty-message');
    emptyMessage.textContent = 'List is empty';

    // Append the message to the shopping list div
    shoppingListDiv.appendChild(emptyMessage);
    return; // Exit the function since there's nothing to display
  }

  itemsList.forEach((item) => {
    const semanticTime = formatSemanticTime(item.createdAt);
    const itemAnchor = document.createElement('a');
    itemAnchor.href = `${basePath}/create-list.html?id=${item.id}&uid=${userId}`;
    itemAnchor.classList.add('list-item-wrapper');

    // determine if the CSS for completed items should be applied
    const isCompleted = item.totalNumberOfItems === item.checkedNumberOfItems;
    const listItemClass = isCompleted ? 'list-item completed' : 'list-item';

    itemAnchor.innerHTML = `
      <div class='${listItemClass}'>
        <div class='list-item-content-header'>
          <div class='list-name'>${item.name}</div>
          <div class='list-item-number-counter'>${item.checkedNumberOfItems} / ${item.totalNumberOfItems}</div>
        </div>
        <div class='list-item-content-bottom'>
          <div class='list-item-time-stamp'>${semanticTime}</div>
        </div>
      </div>
    `;
    shoppingListDiv.appendChild(itemAnchor);
  });
}

// Function to fetch lists from Firestore and display them
function fetchAndDisplayLists(userId) {
  // code snippet for spinner
  const spinner = document.querySelector('.spinner-border');
  const shoppingListDiv = document.querySelector('.shoppingList');

  // Show the spinner and clear the shopping list div
  if (spinner) {
    spinner.style.display = 'block';
  }
  if (shoppingListDiv) {
    shoppingListDiv.innerHTML = '';
  }

  db.collection('lists').where('userID', '==', userId).get().then((querySnapshot) => {
    itemsList = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      itemsList.push({
        id: doc.id,
        name: data.name,
        totalNumberOfItems: data.totalNumberOfItems,
        checkedNumberOfItems: data.checkedNumberOfItems,
        createdAt: data.createdAt.toDate()
      });
    });

    // Hide the spinner after fetching is done
    if (spinner) {
      spinner.style.display = 'none';
    }

    displayListItems();
  }).catch((error) => {
    console.error('Error fetching lists: ', error);

    // Hide the spinner even if an error occurs
    if (spinner) {
      spinner.style.display = 'none';
    }
  });
}


// Function to add a new list to Firestore and navigate to create-list.html
function addListToFirestore() {
  // Ensure the user is authenticated
  firebase.auth().onAuthStateChanged(user => {

    if (user) {
      // Get the user ID
      const userID = user.uid;
      const listName = 'New List'; // Prompt the user for a name or let them edit it later

      if (listName) {
        const currentTime = new Date();
        const newList = {
          name: listName,
          createdAt: firebase.firestore.Timestamp.fromDate(currentTime),
          updatedAt: firebase.firestore.Timestamp.fromDate(currentTime),
          userID: userID,  // Store the user ID in the list document
          totalNumberOfItems: 0, // At first there is no item in the list
          checkedNumberOfItems: 0, // At first no item is crossed off
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
      window.location.href = "create-list.html";
      console.error("User is not authenticated. Please log in first.");
    }
  });
}


// Function to set up the 'add' button event listener
function setupAddListButton() {
  // navigate users when they either click the image area or text
  const addElements = document.querySelectorAll('.create-list-link, .add-span');

  addElements.forEach(element => {
    element.addEventListener('click', () => {
      addListToFirestore();
    });
  });
}

renderContent();
setupAddListButton();
