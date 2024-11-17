/*
 * Global constants and functions
 */
// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const listId = getQueryParam('id');


/*
 * Following cluster of codes is for "go back" button navigation feature.
 */
// Ensure that the back button is created after the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  goBackToTheList();
});

function goBackToTheList() {
  const linkAnchor = document.createElement('a');
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  linkAnchor.href = `${basePath}/create-list.html?id=${listId}`;
  linkAnchor.innerHTML = `
      <img src='/images/create-list/back-arrow.png' alt='arrow image for moving back'/>
    `;
  const backArrowDiv = document.querySelector('.back-arrow');
  backArrowDiv.appendChild(linkAnchor);
}


/*
 * Following cluster of codes is for item addition feature.
 */
function addItemToFirestore(itemName) {
  itemName = itemName ? itemName.trim() : '';

  if (itemName) {
    const newItem = {
      name: itemName,
      isChecked: false,
      quantity: 1,
      saleLink: 'https://google.com',
    };

    db.collection('lists').doc(listId).get()
      .then((doc) => {
        if (doc.exists) {
          let currentTotalNumberOfItems = doc.data().totalNumberOfItems || 0;
          // Add the new item to the 'items' subcollection
          db.collection('lists').doc(listId).collection('items').add(newItem)
            .then(() => {
              // Increment the total number of items in the main document
              db.collection('lists').doc(listId).update({
                totalNumberOfItems: currentTotalNumberOfItems + 1
              });
              window.location.href = `create-list.html?id=${listId}`;
            })
            .catch((error) => {
              console.log('Failed to add item: ', error);
            });
        } else {
          console.log('Document does not exist');
        }
      })
      .catch((error) => {
        console.log('Error fetching document:', error);
      });
  } else {
    console.log('No item added.');
  }
}

/*
 * Following cluster of codes is for item search feature.
 */
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
    .sort((a, b) => {
      const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
      const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());

      if (aStartsWith && !bStartsWith) {
        return -1; // a comes before b
      } else if (!aStartsWith && bStartsWith) {
        return 1; // b comes before a
      } else {
        // Both start or don't start with query; sort alphabetically
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }
    })
    .slice(0, 4); // Limit to 4 suggestions
}

// Reference to the list item container
const listItemContainer = document.querySelector('.list-items-container');

// Display search results
function displaySearchResults(results) {
  resultsContainer.innerHTML = ''; // Clear previous results
  resultsContainer.style.display = 'block';

  while (listItemContainer.children.length > 1) {
    listItemContainer.removeChild(listItemContainer.lastChild);
  }

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
      renderPopularItems();
    });
    resultsContainer.appendChild(resultItem);
  });
}

// Update search results and button text in real-time
searchInput.addEventListener('input', event => {
  const query = event.target.value.trim();
  // If the query is an empty string, clear the results and exit
  if (!query) {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    updateAddItemButton('');
    return;
  }

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

  // Set data attribute for event delegation
  itemAddButton.setAttribute('data-item-name', query);
}

// JavaScript to clear the input when the cancel button is clicked
document.getElementById('cancel-button').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('search-input').value = '';
});


/*
 * Following is the cluster of codes for favorite bar feature.
 */
let popularItems = [];


// Function to render popular items
function renderPopularItems() {
  const listItemContainer = document.querySelector('.list-items-container');

  // Remove all child elements except the first one
  while (listItemContainer.children.length > 1) {
    listItemContainer.removeChild(listItemContainer.lastChild);
  }

  // Append popular items
  popularItems.forEach((item) => {
    const itemAddButton = document.createElement('div');
    itemAddButton.classList.add('item-add-button');
    itemAddButton.setAttribute('data-item-name', item); // Adding data attribute for event delegation
    itemAddButton.innerHTML = `
      <img src='./images/add-item/add-circle-green.png' alt='button for adding an item in the list' />
      ${item}
    `;

    listItemContainer.appendChild(itemAddButton);
  });
}

// Fetch the popular items JSON file
fetch('popular-items.json')
  .then(response => response.json())
  .then(data => {
    popularItems = data;
    renderPopularItems();
  })
  .catch(error => console.error('Error loading popular items:', error));


const favoritePopularBar = document.querySelector('.favorite-tab-popular');
const favoriteRecentBar = document.querySelector('.favorite-tab-recent');

favoriteRecentBar.addEventListener('click', () => {
  favoritePopularBar.style.backgroundColor = '#E5E7EB';
  favoritePopularBar.style.color = '#9CA3AF';
  favoriteRecentBar.style.backgroundColor ='#D1D5DB';
  favoriteRecentBar.style.color = '#030712';

  const listItemContainer = document.querySelector('.list-items-container');

  // Remove all child elements except the first one
  while (listItemContainer.children.length > 1) {
    listItemContainer.removeChild(listItemContainer.lastChild);
  }
})

favoritePopularBar.addEventListener('click', () => {
  favoritePopularBar.style.backgroundColor = '';
  favoritePopularBar.style.color = '';
  favoriteRecentBar.style.backgroundColor ='';
  favoriteRecentBar.style.color = '';

  renderPopularItems();
})

/*
 * Event Delegation for 'Add Item' Buttons
 */
listItemContainer.addEventListener('click', function(event) {
  const itemButton = event.target.closest('.item-add-button');

  if (itemButton && listItemContainer.contains(itemButton)) {
    const itemName = itemButton.getAttribute('data-item-name');
    if (itemName) {
      addItemToFirestore(itemName);
    } else {
      console.log('No item name found for this button.');
    }
  }
});