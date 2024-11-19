// This function grabs retrieves documents in the Sale-Information collection

function GetSalesData() {
    db.collection("Sale-Information").orderBy("saleDate", "desc").get().then((querySnapshot)=>{
        var SaleInformation = [];
        querySnapshot.forEach(doc => {
            SaleInformation.push(doc.data());

        });
        AddAllDataToTable(SaleInformation);
    });
}


// This function uses firebases onsnapshot method to listen to real time updates
// in the Sale-Information collection

function GetSaleDataRealtime() {
    db.collection("Sale-Information").orderBy("saleDate", "desc").onSnapshot((querySnapshot)=>{
        var SaleInformation = [];
        querySnapshot.forEach(doc => {
            SaleInformation.push(doc.data());
        });
        AddAllDataToTable(SaleInformation);
    });
} 
    



// Recieves an item's details (name, price, date, store) and creates a table row with 
// these details
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

// Clears the table body to prevent duplicates
// Loops over each item in the SaleInformationDocList array and calls
// AddDataToTable to add each item as a row in the table
function AddAllDataToTable(SalesInformationDocList){
    itemNo=0;
    tbody.innerHTML="";
    SalesInformationDocList.forEach(element => {
        var today = new Date();
        today.setDate(today.getDate()-7);
        var sDate = new Date(element.saleDate);
        if (sDate >= today) {
          AddDataToTable(element.itemName, element.itemPrice, element.saleDate, element.store);
        }
    });
}





window.onload = GetSalesData;