// Initialize FirebaseUI Auth instance
var ui = new firebaseui.auth.AuthUI(firebase.auth());

// Configuration object for FirebaseUI authentication
var uiConfig = {
    callbacks: {
        // Callback triggered after a successful sign-in
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {

            var user = authResult.user;

            // Check if the user is new
            if (authResult.additionalUserInfo.isNewUser) {
                // Create a new document in Firestore for the new user with default fields
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
                // Redirect existing users to the dashboard
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

ui.start('#firebaseui-auth-container', uiConfig);