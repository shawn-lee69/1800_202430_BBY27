

 // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDLzHDBsObO3YfM0k-JPfg98e1TTfLqy0E",
    authDomain: "bby27---samepage.firebaseapp.com",
    projectId: "bby27---samepage",
    storageBucket: "bby27---samepage.firebasestorage.app",
    messagingSenderId: "719101573057",
    appId: "1:719101573057:web:b6bc05616169155d4d2140",
    measurementId: "G-K7CKGQPSBG"
  };

  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  
  const db = firebase.firestore(); // Initialize Firestore



  //Sale Information Data

  const saleInformationForm = document.querySelector('.sale-information-form');
  const itemName = document.querySelector('.item-name');
  const itemPrice = document.querySelector('.item-price');
  const store = document.querySelector('.store');
  const saleDate = document.querySelector('.sale-date');
  const confirmButton = document.querySelector('.confirm-btn');
  
  

  confirmButton.addEventListener('click', (e) => {
    db.collection('Sale-Information')
    .doc()
    .set({
        itemName: itemName.value,
        itemPrice: itemPrice.value,
        store: store.value,
        saleDate: saleDate.value,
    }).then(() => {
        saleInformationForm.reset();
    });

    confirmButton.addEventListener('click', (e) => {
        console.log("Button clicked");  
        e.preventDefault();
        
    });
  }); 