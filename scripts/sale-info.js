//Sale Information Data
const saleInformationForm = document.querySelector('.sale-information-form');
const itemName = document.querySelector('.item-name');
const itemPrice = document.querySelector('.item-price');
const store = document.querySelector('.store');
const saleDate = document.querySelector('.sale-date');
const confirmButton = document.querySelector('.confirm-btn');




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
            window.location.assign("create-list.html");
          }
        });

      saleInformationForm.reset();
    });
  

    confirmButton.addEventListener('click', (e) => {
      console.log("Button clicked");
      e.preventDefault();

    });
  });
});

// add navigations for nav bottom buttons by selecting all elements that should navigate to "myPage.html"
const profileElements = document.querySelectorAll('#back-button');
profileElements.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
});

// function to bring user to the list of sales page
const community = document.querySelectorAll('#community-btn');
community.forEach(element => {
  element.addEventListener("click", () => {
    window.location.href = "list-of-sales.html";
  });
});

