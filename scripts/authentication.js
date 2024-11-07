
var ui = new firebaseui.auth.AuthUI(firebase.auth());

var uiConfig = {
    callbacks: {
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {

            var user = authResult.user;
            if (authResult.additionalUserInfo.isNewUser) {
                db.collection("users").doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    address: "",
                    preferredMarket: "Walmart",
                    completedList: null,
                    notificationSettings: true

                }).then(function () {
                    console.log("New user added to firestore");
                    window.location.assign("index.html");
                    
                }).catch(function (error) {
                    console.log("Error adding new user: " + error);
                });
            } else {
                window.location.assign("index.html");
                
                return true;
            }
            return false;
        },
        uiShown: function () {

            document.getElementById('loader').style.display = 'block';
        }
    },


    signInFlow: 'popup',
    signInSuccessUrl: "index.html",
    signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],

};

//Direction when the user clicks 'continue as guest' button

const guestLoginButton = document.getElementById('guestLogin');

guestLoginButton.addEventListener('click', (e) => {
    console.log(window.location.pathname);
    // window.location.href = window.location.pathname + "?isLoggedIn=false";
    window.location.href = `/index.html?isLoggedIn=false`;

});

ui.start('#firebaseui-auth-container', uiConfig);