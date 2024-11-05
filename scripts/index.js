// Change this value based on user's login status
// TODO: make this use query parameter passed by login page.
var isLoggedIn = true;

// Function to render the appropriate content
function renderContent() {
  if (isLoggedIn) {
    document.getElementById('listContent').style.display = 'block';
  } else {
    document.getElementById('emptyListContent').style.display = 'block';
  }
  fetchAndDisplayLists();
}

// Helper function to format date as "YYYY-MM-DD"
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to display the list items in the shoppingList div
function displayListItems() {
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');

  const shoppingListDiv = document.querySelector('.shoppingList');
  shoppingListDiv.innerHTML = ''; // Clear any existing items

  listItems.forEach((item, index) => {
    const formattedDate = formatDate(item.createdAt);
    const itemAnchor = document.createElement('a');
    itemAnchor.href = `${basePath}/create-list.html?id=${item.id}`;
    itemAnchor.classList.add('list-item-wrapper');
    itemAnchor.innerHTML = `
      <div class='list-item'>
        <div class='list-item-content-header'>
          <div class='list-name'>${item.name}</div>
          <div class='list-item-number-counter'>${item.currentNumberOfItems} / ${item.maxNumberOfItems}</div>
        </div>
        <div class='list-item-content-bottom'>
          <div class='list-item-time-stamp'>${formattedDate}</div>
        </div>
      </div>
    `;
    shoppingListDiv.appendChild(itemAnchor);
  });
}

// Function to fetch lists from Firestore and display them
function fetchAndDisplayLists() {
  db.collection('lists').get().then((querySnapshot) => {
    listItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listItems.push({
        id: doc.id,
        name: data.name,
        currentNumberOfItems: 0,
        maxNumberOfItems: 0,
        createdAt: data.createdAt.toDate()
      });
    });
    displayListItems();
  });
}


// Function to add a new list to Firestore and navigate to create-list.html
function addListToFirestore() {
  const listName = 'New List'; // You can prompt the user for a name or let them edit it later
  if (listName) {
    const currentTime = new Date();
    const newList = {
      name: listName,
      createdAt: firebase.firestore.Timestamp.fromDate(currentTime),
      updatedAt: firebase.firestore.Timestamp.fromDate(currentTime),
      sharableLink: '' // You can generate a sharable link if needed
    };

    // Add the new list document to Firestore
    db.collection('lists').add(newList)
      .then((docRef) => {
        // Navigate to create-list.html with the new list ID
        window.location.href = `create-list.html?id=${docRef.id}`;
      })
      .catch((error) => {
        console.error('Error adding list: ', error);
      });
  } else {
    console.log('No list created.');
  }
}

// Function to set up the 'add' button event listener
function setupAddListButton() {
  // Select the anchor tag that wraps the 'add' image
  const addLink = document.querySelector('.bottom a');

  if (addLink) {
    addLink.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent default navigation
      addListToFirestore();   // Call the function to add the list and navigate
    });
  }
}

renderContent();
setupAddListButton();
