// ==========================
// Global Constants and Functions
// ==========================

// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Extract the list ID and user ID from the query parameters
const listId = getQueryParam('id');
const userId = getQueryParam('uid') || '';
const userRef = userId ? db.collection("users").doc(userId) : null;


// ==========================
// Back Button Navigation Feature
// ==========================
// This ensures the back button functionality is set up once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  goBackToTheList();
});

// Function to create a "go back" button linking to the create-list page
function goBackToTheList() {
  const linkAnchor = document.createElement('a');
  const basePath = window.location.pathname.split('/').slice(0, -1).join('/');
  linkAnchor.href = `${basePath}/create-list.html?id=${listId}&uid=${userId}`;
  linkAnchor.innerHTML = `
      <img src='/images/create-list/back-arrow.png' alt='arrow image for moving back'/>
    `;
  const backArrowDiv = document.querySelector('.back-arrow');
  backArrowDiv.appendChild(linkAnchor);
}


// ==========================
// Item Addition Feature
// ==========================

// Function to add an item to Firestore
function addItemToFirestore(itemName) {
  itemName = itemName ? itemName.trim() : '';

  if (itemName) {
    const newItem = {
      name: itemName,
      isChecked: false,
      quantity: 1,
      saleLink: 'https://google.com', // This field is for future updates
    };

    // Fetch the current shopping list document
    db.collection('lists').doc(listId).get()
      .then((doc) => {
        if (doc.exists) {
          let currentTotalNumberOfItems = doc.data().totalNumberOfItems || 0;
          // Add the new item to the 'items' subcollection
          return db.collection('lists').doc(listId).collection('items').add(newItem)
            .then(() => {
              // Increment the total number of items in the main document
              db.collection('lists').doc(listId).update({
                totalNumberOfItems: currentTotalNumberOfItems + 1
              });
              // Show success feedback using SweetAlert
              Swal.fire({
                title: "Item Successfully\n Added!",
                showDenyButton: true,
                confirmButtonText: "Go Back to List",
                confirmButtonColor: "#347928",
                denyButtonText: `Add more items`,
                denyButtonColor: "#F3F4F6",
                imageUrl: "../images/create-list/success.png",
                imageWidth: 100,
                imageHeight: 'auto',
                imageAlt: "successfully added item",
                customClass: {
                  confirmButton: 'custom-confirm-button',
                  denyButton: 'custom-deny-button',
                  popup: 'custom-rounded-popup',
                  title: 'custom-title',
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  // Navigate user back to create-list page when user clicks confirm button
                  window.location.href = `create-list.html?id=${listId}&uid=${userId}`;
                }
              });
            })
            .then(() => {
              // Add the item to the user's recent items list for easier future additions
              return userRef.get();
            })
            .then((doc) => {
              if (doc.exists) {
                let userData = doc.data();
                let recentItems = userData.recentItems || [];
                recentItems.unshift(newItem); // Add the new item to the beginning of the recent items array

                // Remove duplicate items by name
                recentItems = recentItems.filter((item, index, self) =>
                    index === self.findIndex((t) => (
                      t.name === item.name
                    ))
                );

                // Keep and show only the most recent 5 items
                if (recentItems.length > 5) {
                  recentItems = recentItems.slice(0, 5);
                }
                return userRef.update({ recentItems }); // Update the user document with the trimmed recent items
              } else {
                console.log("User document not found!");
              }
            })
        } else {
          console.log('Document does not exist');
        }
      })
      .catch((error) => {
        console.log('Failed to add item: ', error); // Log any errors that occur
      });
  } else {
    console.log('No item added.'); // Log if the item name is invalid or empty
  }
}



// ==========================
// Search Feature
// ==========================

// Initialize an array to hold grocery items for search suggestions
let groceryItems = [];

// Fetch the grocery items JSON file and store it in the `groceryItems` array
fetch('../common-grocery-items.json')
  .then(response => response.json())
  .then(data => groceryItems = data)
  .catch(error => console.error('Error loading grocery items:', error));

// DOM Elements for the search functionality
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const itemAddButton = document.querySelector('.item-add-button');

// Function to search for grocery items based on user input
function searchCommonGroceryItems(query) {
  if (!query) return []; // If no query is provided, return an empty array

  return groceryItems
    .filter(item => item.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {

      // Sort results prioritizing those that start with the query
      const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase());
      const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase());

      if (aStartsWith && !bStartsWith) {
        return -1; // a comes first
      } else if (!aStartsWith && bStartsWith) {
        return 1; // b comes first
      } else {
        // Fallback: Sort alphabetically
        return a.toLowerCase().localeCompare(b.toLowerCase());
      }
    })
    .slice(0, 4); // Limit to 4 suggestions
}

// Reference to the list item container
const listItemContainer = document.querySelector('.list-items-container');

// Function to display search results in the DOM
function displaySearchResults(results) {
  resultsContainer.innerHTML = ''; // Clear previous results
  resultsContainer.style.display = 'block'; // Show the results container

  if (results.length === 0) {
    // No results found, clear and hide the results container
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    return;
  }

  // Populate results container with matching items
  results.forEach(item => {
    const resultItem = document.createElement('div');
    resultItem.textContent = item;
    resultItem.addEventListener('click', () => {
      searchInput.value = item;         // Set search input to the clicked item
      updateAddItemButton(item);        // Update the add-item button with the item
      resultsContainer.innerHTML = '';  // Clear search results
      resultsContainer.style.display = 'none'; // Hide the results container

      // // reset the additional item list to 'popular' items
      // favoritePopularBar.style.backgroundColor = '';
      // favoritePopularBar.style.color = '';
      // favoriteRecentBar.style.backgroundColor ='';
      // favoriteRecentBar.style.color = '';
      // renderPopularItems();
    });
    resultsContainer.appendChild(resultItem); // Add the item to the results container
  });
}

// Update search results and button text in real-time
searchInput.addEventListener('input', event => {
  const query = event.target.value.trim();
  // If the query is an empty string, clear the results and exit
  if (!query) {
    resultsContainer.innerHTML = '';
    resultsContainer.style.display = 'none';
    updateFirstAddItemButton('');
    return;
  }

  const results = searchCommonGroceryItems(query); // Get matching results

  // Display results and update button text
  displaySearchResults(results);

  // Update the 'add item' button
  updateFirstAddItemButton(query);

  // Create and update the add button with the search query
  itemAddButton.innerHTML = ''; // Clear existing content

  const addIcon = document.createElement('img'); // Define addIcon here
  addIcon.src = '../images/add-item/add-circle-green.png';
  addIcon.alt = 'button for adding an item in the list';

  itemAddButton.appendChild(addIcon);
  itemAddButton.appendChild(document.createTextNode(` ${query || ' '}`));
});


// Reference to the first item-add-button
const firstItemAddButton = document.getElementById('first-item-add-button');

// Update the first add button with the default or current query
function updateFirstAddItemButton(query) {
  firstItemAddButton.innerHTML = ''; // Clear existing content

  const addIcon = document.createElement('img');
  addIcon.src = '../images/add-item/add-circle-green.png';
  addIcon.alt = 'Add item button';

  firstItemAddButton.appendChild(addIcon);
  firstItemAddButton.appendChild(document.createTextNode(` ${query || ' '}`));

  // Set data attribute for event delegation
  firstItemAddButton.setAttribute('data-item-name', query);
}

// Initialize the first add button
updateFirstAddItemButton('');

// Add event listener to the first item-add-button
firstItemAddButton.addEventListener('click', function(event) {
  const itemName = firstItemAddButton.getAttribute('data-item-name');
  if (itemName) {
    addItemToFirestore(itemName);
  } else {
    console.log('No item name found for this button.');
  }
});

// Update other add item buttons
function updateAddItemButton(query) {
  itemAddButton.innerHTML = ''; // Clear existing content

  const addIcon = document.createElement('img');
  addIcon.src = '../images/add-item/add-circle-green.png';
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


// ==========================
// Favorite Bar Feature
// ==========================

// Arrays to hold popular and recent items
let popularItems = [];
let recentItems = [];

// Function to render recent items
function renderRecentItems() {
  // Append recent items
  recentItems.forEach((item) => {
    const itemAddButton = document.createElement('div');
    itemAddButton.classList.add('item-add-button');
    itemAddButton.setAttribute('data-item-name', item.name); // Adding data attribute for event delegation
    itemAddButton.innerHTML = `
      <img src='../images/add-item/add-circle-green.png' alt='button for adding an item in the list' />
      ${item.name}
    `;

    listItemContainer.appendChild(itemAddButton);
  });
}

// Function to render popular items
function renderPopularItems() {
  const listItemContainer = document.querySelector('.list-items-container');

  // Remove all child elements in the listItemContainer
  listItemContainer.innerHTML = '';

  // Append popular items
  popularItems.forEach((item) => {
    const itemAddButton = document.createElement('div');
    itemAddButton.classList.add('item-add-button');
    itemAddButton.setAttribute('data-item-name', item); // Adding data attribute for event delegation
    itemAddButton.innerHTML = `
      <img src='../images/add-item/add-circle-green.png' alt='button for adding an item in the list' />
      ${item}
    `;

    listItemContainer.appendChild(itemAddButton);
  });
}

// Fetch the popular items JSON file
fetch('../popular-items.json')
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

  // Fetch recent items ahead
  userRef.get()
    .then((user) => {
      if (user.exists) {
        recentItems = user.data().recentItems || [];

        // Clear and render recent items only after data is fetched
        const listItemContainer = document.querySelector('.list-items-container');
        while (listItemContainer.children.length > 1) {
          listItemContainer.removeChild(listItemContainer.lastChild);
        }

        renderRecentItems();
      } else {
        console.log('No user document found.');
      }
    })
    .catch((error) => {
      console.error('Error fetching user document:', error);
    });
})

favoritePopularBar.addEventListener('click', () => {
  favoritePopularBar.style.backgroundColor = '';
  favoritePopularBar.style.color = '';
  favoriteRecentBar.style.backgroundColor ='';
  favoriteRecentBar.style.color = '';

  renderPopularItems();
})


// ==========================
// Event Delegation for 'Add Item' Buttons
// ==========================

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
