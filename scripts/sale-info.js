//Sale Information Data selectors
const saleInformationForm = document.querySelector('.sale-information-form');
const itemName = document.querySelector('.item-name');
const itemPrice = document.querySelector('.item-price');
const store = document.querySelector('.store');
const saleDate = document.querySelector('.sale-date');
const confirmButton = document.querySelector('.confirm-btn');



// This function saves the data entered in forms to the 
// firestore database when the "Post Sale" button is clicked
// It also brings up a modal that confirms to users that
// there information has been successfully added.
document.addEventListener('DOMContentLoaded', () => {

  confirmButton.addEventListener('click', (e) => {
    db.collection('Sale-Information')
      .doc()
      .set({
        itemName: itemName.value,
        itemPrice: itemPrice.value,
        store: store.value,
        saleDate: saleDate.value,
      }).then(() => {
        // The function to bring up the modal
        Swal.fire({
          title: "Post Successfully added to \n community flyer",
          icon: "success",
          showCancelButton: true,
          confirmButtonColor: "#45a049",
          cancelButtonColor: "#FCCD2A",
          confirmButtonText: "Return to Lists",
          cancelButtonText: "Add Another Sale"
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.assign("dashboard.html");
          }
        });

      saleInformationForm.reset();
    });
  
    // Function that resets the forms so another sale can be added.3
    confirmButton.addEventListener('click', (e) => {
      console.log("Button clicked");
      e.preventDefault();

    });
  });
});

// This function brings a user back to the dashboard using the back button
// that is found at the top of the page
const profileElements = document.querySelectorAll('#back-button');
profileElements.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
});

// This function brings users to the Community Flyer Board, called "list-of-sales.html"
// by clicking the "Check Community Flyer" button
const community = document.querySelectorAll('#community-btn');
community.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "list-of-sales.html";
  });
});

