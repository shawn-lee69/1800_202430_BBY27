
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
