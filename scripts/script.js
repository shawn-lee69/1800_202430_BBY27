function logout() {
    firebase.auth().signOut().then(() => {
        
        console.log("logging out user");
      }).catch((error) => {
        
      });
}
