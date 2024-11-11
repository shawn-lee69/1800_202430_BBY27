
// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Ensure that the back button is created after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  goBackToTheList();
});

const listId = getQueryParam('id');

// JavaScript to clear the input when the cancel button is clicked
document.getElementById('cancel-button').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('search-input').value = '';
});

function addItemToFirestore(itemName) {
  itemName = itemName ? itemName.trim() : '';

  if (itemName) {
    const newItem = {
      name: itemName,
      isChecked: false,
      quantity: 1,
      saleLink: 'https://google.com',
    };

    db.collection('lists').doc(listId).collection('items').add(newItem)
      .then(() => {
        window.location.href = `create-list.html?id=${listId}`;
      })
      .catch((error) => {
        console.log('Failed to add item: ', error);
      });
  } else {
    console.log('No item added.');
  }
}

function goBackToTheList() {
  const linkAnchor = document.createElement('a');
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  linkAnchor.href = `${basePath}/create-list.html?id=${listId}`;
  linkAnchor.innerHTML = `
      <img src='images/create-list/back-arrow.png' alt='arrow image for moving back'/>
    `;
  const backArrowDiv = document.querySelector('.back-arrow');
  backArrowDiv.appendChild(linkAnchor);
}

function setupAddItemButton() {
  const addButton = document.querySelector('.item-add-button');

  if (addButton) {
    addButton.addEventListener('click', function(event) {
      const itemName = searchInput.value.trim();
      addItemToFirestore(itemName);
    });
  }
}

setupAddItemButton();


//codes related to search features
let groceryItems = [];

// Fetch the grocery items JSON file
fetch('common-grocery-items.json')
  .then(response => response.json())
  .then(data => groceryItems = data)
  .catch(error => console.error('Error loading grocery items:', error));


// Elements
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const itemAddButton = document.querySelector('.item-add-button');


// Search function
function searchCommonGroceryItems(query) {
  if (!query) return [];
  return groceryItems
    .filter(item => item.toLowerCase().includes(query.toLowerCase()))
    .sort()
    .slice(0, 4); // Limit to 4 suggestions
}

// Display search results
function displaySearchResults(results) {
  resultsContainer.innerHTML = ''; // Clear previous results
  resultsContainer.style.display = 'block';

  if (results.length === 0) {
    noResultItem.addEventListener('click', () => {
      const query = searchInput.value.trim();
      updateAddItemButton(query);
      resultsContainer.innerHTML = '';
      resultsContainer.style.display = 'none';
    });
    resultsContainer.appendChild(noResultItem);
    return;
  }

  results.forEach(item => {
    const resultItem = document.createElement('div');
    resultItem.textContent = item;
    resultItem.addEventListener('click', () => {
      searchInput.value = item;         // Update input field
      updateAddItemButton(item);        // Update 'add item' button
      resultsContainer.innerHTML = '';  // Clear search results
      resultsContainer.style.display = 'none';
    });
    resultsContainer.appendChild(resultItem);
  });
}

// Update search results and button text in real-time
searchInput.addEventListener('input', event => {
  const query = event.target.value.trim();
  const results = searchCommonGroceryItems(query);

  // Display results and update button text
  displaySearchResults(results);

  // Update the 'add item' button
  updateAddItemButton(query);

  // Create and update the add button with the search query
  itemAddButton.innerHTML = ''; // Clear existing content

  const addIcon = document.createElement('img'); // Define addIcon here
  addIcon.src = './images/add-item/add-circle-green.png';
  addIcon.alt = 'button for adding an item in the list';

  itemAddButton.appendChild(addIcon);
  itemAddButton.appendChild(document.createTextNode(` ${query || ' '}`));
});

function updateAddItemButton(query) {
  itemAddButton.innerHTML = ''; // Clear existing content

  const addIcon = document.createElement('img');
  addIcon.src = './images/add-item/add-circle-green.png';
  addIcon.alt = 'Add item button';

  itemAddButton.appendChild(addIcon);
  itemAddButton.appendChild(document.createTextNode(` ${query || ' '}`));
}