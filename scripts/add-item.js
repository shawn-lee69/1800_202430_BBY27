// JavaScript to clear the input when the cancel button is clicked
document.getElementById('cancel-button').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('search-input').value = '';
});

