// Change this value based on user's login status
// TODO: make this use query parameter passed by login page.
var isLoggedIn = true;


// Array to store list item objects (for now i just hard coded them)
var listItems = [
  {
    name: 'List with Mary',
    currentNumberOfItems: 3,
    maxNumberOfItems: 4,
    createdAt: new Date(2024, 10, 25, 14, 30)
  },
  {
    name: 'Thanksgiving',
    currentNumberOfItems: 3,
    maxNumberOfItems: 7,
    createdAt: new Date(2024, 9, 25, 14, 30)
  }
];


isListItem = listItems.length > 0;

// Function to render the appropriate content
function renderContent() {
  if (isLoggedIn && isListItem) {
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
  const shoppingListDiv = document.querySelector('.shoppingList');
  shoppingListDiv.innerHTML = ''; // Clear any existing items

  listItems.forEach((item, index) => {
    const formattedDate = formatDate(item.createdAt);
    const itemDiv = document.createElement('div');
    itemDiv.innerHTML = `
      <div class='listItem'>
        <div class='listItemContentHeader'>
          <div class='listName'>${item.name}</div>
          <div class='listItemNumberCounter'>${item.currentNumberOfItems} / ${item.maxNumberOfItems}</div>
        </div>
        <div class='listItemContentBottom'>
          <div class='listItemTimeStamp'>${formattedDate}</div>
        </div>
      </div>
    `;
    shoppingListDiv.appendChild(itemDiv);
  });
}

// Function to fetch lists from Firestore and display them
function fetchAndDisplayLists() {
  db.collection('lists').get().then((querySnapshot) => {
    listItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      listItems.push({
        name: data.name,
        currentNumberOfItems: 0, // You can fetch the count of items if needed
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
        console.log('List added with ID: ', docRef.id);
        // Navigate to create-list.html with the new list ID
        window.location.href = `create-list.html?id=${docRef.id}`;
      })
      .catch((error) => {
        console.error('Error adding list: ', error);
      });
  } else {
    console.log('No list name entered.');
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
