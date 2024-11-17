var currentUser;               //points to the document of the user who is logged in
function populateUserInfo() {
    firebase.auth().onAuthStateChanged(user => {
        // Check if user is signed in:
        if (user) {

            //go to the correct user document by referencing to the user uid
            currentUser = db.collection("users").doc(user.uid)
            //get the document for current user.
            currentUser.get()
                .then(userDoc => {
                    //get the data fields of the user
                    let userName = userDoc.data().name;
                    let userEmail = userDoc.data().email;
                    let userAddress = userDoc.data().address;
                    let userMarket = userDoc.data().preferredMarket;

                    //if the data fields are not empty, then write them in to the form.
                    if (userName != null) {
                        document.getElementById("nameInput").value = userName;
                    }
                    if (userName != null) {
                        document.getElementById("emailInput").value = userEmail;
                    }
                    if (userAddress != null) {  // Corrected from userSchool to userAddress
                        document.getElementById("addressInput").value = userAddress;
                    }
                    if (userMarket != null) {  // Corrected from userCity to userMarket
                        document.getElementById("marketInput").value = userMarket;
                    }

                })
        } else {
            // No user is signed in.
            console.log("No user is signed in");
        }
    });
}

function updateUserInfo() {
    document.getElementById('userInfoFields').disabled = false;
}

function saveUserInfo() {
    //a) get user entered values
    userName = document.getElementById('nameInput').value;
    userEmail = document.getElementById('emailInput').value;
    userAddress = document.getElementById('addressInput').value;
    userMarket = document.getElementById('marketInput').value;

    //b) update user's document in Firestore
    currentUser.update({
        name: userName,
        email: userEmail,
        address: userAddress,
        preferredMarket: userMarket
    })
        .then(() => {
            console.log("Document successfully updated!");
            //c) disable edit 
            document.getElementById('userInfoFields').disabled = true;
            // This locks the form.
        })
        .catch((error) => {
            console.error("Error updating document: ", error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    //call the function to run it 
    populateUserInfo();

    document.getElementById('edit-button').addEventListener('click', function () {
        updateUserInfo();
    });

    document.getElementById('save-button').addEventListener('click', function () {
        saveUserInfo();
    });

    document.getElementById('logout').addEventListener('click', function () {
        firebase.auth().signOut().then(() => {
            console.log("User signed out successfully.");
            window.location.href = "welcome.html";
        }).catch((error) => {
            console.error("Error signing out: ", error);
        });
    });

    document.getElementById('back-arrow').addEventListener('click', function () {
        window.location.href = "index.html";
    });
});



