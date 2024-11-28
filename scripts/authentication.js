
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
                    preferredMarket: "",
                    completedList: null,
                    notificationSettings: true,
                    recentItems: [],
                    sharedLists: [],
                }).then(function () {
                    console.log("New user added to firestore");
                    window.location.assign("dashboard.html");
                    
                }).catch(function (error) {
                    console.log("Error adding new user: " + error);
                });
            } else {
                window.location.assign("dashboard.html");
                
                return true;
            }
            return false;
        },
        uiShown: function () {
        }
    },


    signInFlow: 'popup',
    signInSuccessUrl: "dashboard.html",
    signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],

};

//Direction when the user clicks 'continue as guest' button

const guestLoginButton = document.getElementById('guestLogin');

guestLoginButton.addEventListener('click', (e) => {
    // window.location.href = window.location.pathname + "?isLoggedIn=false";
    window.location.href = `/pages/dashboard.html?isLoggedIn=false`;

});

ui.start('#firebaseui-auth-container', uiConfig);