// Reference to Firestore collection
/* const SalesInformationCollection = db.collection("Sales-Information");

// Fetch data from Firestore
SalesInformationCollection.get().then((snapshot) => {
    snapshot.forEach((doc) => {
        // Each `doc` represents a document in Firestore
        console.log(doc.id, "=>", doc.data());
        displayUser(doc.data());
    });
}).catch((error) => {
    console.error("Error fetching documents: ", error);
}); */

function GetSalesData() {
    db.collection("Sale-Information").get().then((querySnapshot)=>{
        var SaleInformation = [];
        querySnapshot.forEach(doc => {
            SaleInformation.push(doc.data());

        });
        AddAllDataToTable(SaleInformation);
    });
}

function GetSaleDataRealtime() {
    db.collection("Sale-Information").onSnapshot((querySnapshot)=>{
        var SaleInformation = [];
        querySnapshot.forEach(doc => {
            SaleInformation.push(doc.data());
        });
        AddAllDataToTable(SaleInformation);
    });
}



// Filling the Table
var itemNo=0;
var tbody = document.getElementById('tbody1');

function AddDataToTable(Item,Price,Date,Store){
    var trow = document.createElement('tr');
    var td1 = document.createElement('td');
    var td2 = document.createElement('td');
    var td3 = document.createElement('td');
    var td4 = document.createElement('td');

    td1.innerHTML = Item;
    td2.innerHTML = Price;
    td3.innerHTML = Date;
    td4.innerHTML = Store;

    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);

    tbody.appendChild(trow);


}

function AddAllDataToTable(SalesInformationDocList){
    itemNo=0;
    tbody.innerHTML="";
    SalesInformationDocList.forEach(element => {
        AddDataToTable(element.itemName, element.itemPrice, element.saleDate, element.store)
    });
}

window.onload = GetSalesData;