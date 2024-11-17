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
                    let userAddress = userDoc.data().address;
                    let userMarket = userDoc.data().preferredMarket;

                    //if the data fields are not empty, then write them in to the form.
                    if (userName != null) {
                        document.getElementById("nameInput").value = userName;
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

//call the function to run it 
populateUserInfo();

document.getElementById('save-button').addEventListener('click', function () {
    //a) get user entered values
    userName = document.getElementById('nameInput').value;       //get the value of the field with id="nameInput"
    userAddress = document.getElementById('addressInput').value;     //get the value of the field with id="schoolInput"
    userMarket = document.getElementById('marketInput').value;       //get the value of the field with id="cityInput"

    //b) update user's document in Firestore
    currentUser.update({
        name: userName,
        address: userAddress,
        preferredMarket: userMarket
    })
        .then(() => {
            console.log("Document successfully updated!");
        })

    //c) disable edit 
    document.getElementById('userInfoFields').disabled = true;
    // This locks the form.
});

document.getElementById('edit-button').addEventListener('click', function () {
    document.getElementById('userInfoFields').disabled = false;
});

document.getElementById('logout').addEventListener('click', function () {
    firebase.auth().signOut().then(() => {
        console.log("User signed out successfully.");

        window.location.href = "welcome.html";
    }).catch((error) => {
        console.error("Error signing out: ", error);
    });
});