// Global variable to store the current user's Firestore document reference
var currentUser;

// Function to populate user information from Firestore
function populateUserInfo() {
     // Listen for changes in authentication state
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Reference the current user's Firestore document
            currentUser = db.collection("users").doc(user.uid)
            currentUser.get()
                .then(userDoc => {
                    // Retrieve user data from the Firestore document
                    let userName = userDoc.data().name;
                    let userEmail = userDoc.data().email;
                    let userAddress = userDoc.data().address;
                    let userMarket = userDoc.data().preferredMarket;
                    
                    // Populate input fields with retrieved data if not null
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

// Function to enable input fields for editing user information
function updateUserInfo() {
    document.getElementById('userInfoFields').disabled = false;
}

// Function to save updated user information to Firestore
function saveUserInfo() {
    // Retrieve updated values from input fields
    userName = document.getElementById('nameInput').value;
    userEmail = document.getElementById('emailInput').value;
    userAddress = document.getElementById('addressInput').value;
    userMarket = document.getElementById('marketInput').value;

    // Update Firestore document with new values
    currentUser.update({
        name: userName,
        email: userEmail,
        address: userAddress,
        preferredMarket: userMarket
    })
        .then(() => {
            console.log("Document successfully updated!");
            document.getElementById('userInfoFields').disabled = true;
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
}

// Set up event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    populateUserInfo(); // Populate user info on page load

    // Event listener for the edit button
    document.getElementById('edit-button').addEventListener('click', function () {
        updateUserInfo(); // Enable form fields for editing
        const elements = document.querySelectorAll('.form-control');
        elements.forEach(element => {
            element.style.border = '1px solid #3575FF';
        });
        document.getElementById('edit-button').style.display = "none";
        document.getElementById('save-button').style.display = "block";
    });

    // Event listener for the save button
    document.getElementById('save-button').addEventListener('click', function () {
        Swal.fire({
            title: "Successfully\n Saved!",
            showConfirmButton: false,
            timer: 1200,
            imageUrl: "../images/create-list/success.png",
            imageWidth: 100,
            imageHeight: 'auto',
            customClass: {
                popup: 'custom-rounded-popup',
            }
        })
        saveUserInfo(); // Save updated info to Firestore
        const elements = document.querySelectorAll('.form-control');
        elements.forEach(element => {
            element.style.border = '1px solid #f9f9f9';
        });
        document.getElementById('edit-button').style.display = "block";
        document.getElementById('save-button').style.display = "none";
    });

    // Event listener for the logout button
    document.getElementById('logout').addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
            console.log("User signed out successfully.");
            window.location.href = "index.html"; // Redirect to login page
        }).catch((error) => {
            console.error("Error signing out: ", error);
        });
    });

    // Event listener for the back button
    document.getElementById('back-arrow').addEventListener('click', function () {
        window.location.href = "dashboard.html";
    });
});



