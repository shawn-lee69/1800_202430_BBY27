let groceryItems = [];

fetch('common-grocery-items.json')
  .then(response => response.json())
  .then(data => groceryItems = data)
  .catch(error => console.error('Error loading grocery items:', error));