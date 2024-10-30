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


var isListItem = listItems.length > 0;

// Function to render the appropriate content
function renderContent() {
  if (isLoggedIn && isListItem) {
    document.getElementById('listContent').style.display = 'block';
  } else {
    document.getElementById('emptyListContent').style.display = 'block';
  }
  displayListItems();
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
    itemDiv.className = 'list-item';
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

// function addListItem(item) {
//     item.createdAt = new Date().toLocaleString(); // Add current timestamp
//     listItems.push(item);
//     isListItem = listItems.length > 0; // Update isListItem status
//     renderContent(); // Re-render content
// }

renderContent();
