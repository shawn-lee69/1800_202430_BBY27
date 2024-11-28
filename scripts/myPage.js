var currentUser;               
function populateUserInfo() {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {

            currentUser = db.collection("users").doc(user.uid)
            currentUser.get()
                .then(userDoc => {
                    let userName = userDoc.data().name;
                    let userEmail = userDoc.data().email;
                    let userAddress = userDoc.data().address;
                    let userMarket = userDoc.data().preferredMarket;

                    if (userName != null) {
                        document.getElementById("nameInput").value = userName;
                    }
                    if (userName != null) {
                        document.getElementById("emailInput").value = userEmail;
                    }   
                    if (userAddress != null) {  
                        document.getElementById("addressInput").value = userAddress;
                    }
                    if (userMarket != null) {  
                        document.getElementById("marketInput").value = userMarket;
                    }

                })
        } else {

            console.log("No user is signed in");
        }
    });
}

function updateUserInfo() {
    document.getElementById('userInfoFields').disabled = false;
}

function saveUserInfo() {

    userName = document.getElementById('nameInput').value;
    userEmail = document.getElementById('emailInput').value;
    userAddress = document.getElementById('addressInput').value;
    userMarket = document.getElementById('marketInput').value;
    
    currentUser.update({
        name: userName,
        email: userEmail,
        address: userAddress,
        preferredMarket: userMarket
    })
        .then(() => {
            console.log("Document successfully updated!");
            document.getElementById('userInfoFields').disabled = true;
            // document.querySelector('.form-control').style.fontWeight = bold;
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    populateUserInfo();

    document.getElementById('edit-button').addEventListener('click', function () {
      updateUserInfo();
      const elements = document.querySelectorAll('.form-control');
      elements.forEach(element => {
        element.style.border = '1px solid #3575FF';
      });
      document.getElementById('edit-button').style.display = "none";
      document.getElementById('save-button').style.display = "block";
    });

    document.getElementById('save-button').addEventListener('click', function () {
        Swal.fire({
            title: "Successfully\n Saved!",
            showConfirmButton: false,
            timer: 1200,
            imageUrl: "./images/create-list/success.png",
            imageWidth: 100,
            imageHeight: 'auto',
            customClass: {
                popup: 'custom-rounded-popup',
            }    
          })
        saveUserInfo();
      const elements = document.querySelectorAll('.form-control');
      elements.forEach(element => {
        element.style.border = '1px solid #f9f9f9';
      });
      document.getElementById('edit-button').style.display = "block";
      document.getElementById('save-button').style.display = "none";
    });

    document.getElementById('logout').addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
            console.log("User signed out successfully.");
            window.location.href = "index.html";
        }).catch((error) => {
            console.error("Error signing out: ", error);
        });
    });

    document.getElementById('back-arrow').addEventListener('click', function () {
        window.location.href = "dashboard.html";
    });
});



