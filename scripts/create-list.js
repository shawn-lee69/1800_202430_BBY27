
const checkboxes = document.querySelectorAll('.checkbox');

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener('click', function () {
    if (this.src.includes('check-box-empty.png')) {
      this.src = './images/create-list/check-box-checked.png';
      this.classList.add('checked'); // Enlarge effect

      // Ensure it shrinks back after the animation finishes
      setTimeout(() => this.classList.add('shrink'), 200);
    } else {
      this.src = './images/create-list/check-box-empty.png';
      this.classList.remove('checked'); // Reset
      this.classList.remove('shrink'); // Remove shrink class
    }
  });
});



// Function to get query parameters from the URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Ensure code runs after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  const listId = getQueryParam('id');

  if (listId) {
    // Fetch the list from Firestore
    db.collection('lists').doc(listId).get()
      .then((doc) => {
        const listNameInput = document.getElementById('listNameInput');
        if (!listNameInput) {
          console.warn('Element with ID "listNameInput" not found'); // TODO: must work on input when letting users change list name
          return;
        }

        if (doc.exists) {
          const listData = doc.data();
          // Set the default name as "New List" if no name is in Firestore
          listNameInput.value = listData.name || "New List";
        } else {
          console.log('No such document!');
          // If the document doesn't exist, set a default name
          listNameInput.value = "New List";
        }
      })
      .catch((error) => {
        console.log('Error getting document:', error);
        // Set a default name in case of an error
        document.getElementById('listNameInput').value = "New List";
      });
  } else {
    console.log('No list ID provided in the URL.');
    // Set a default name if no list ID is provided
    document.getElementById('listNameInput').value = "New List";
  }
});