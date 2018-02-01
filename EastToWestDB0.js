mongod --dbpath C:\MongoDBStorage

// -------------------------------------------------
// import Northwind CSV collections to "East" database
mongoimport --drop --type csv --headerline -d East -c categories      --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/categories.csv"
mongoimport --drop --type csv --headerline -d East -c customers       --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/customers.csv"
mongoimport --drop --type csv --headerline -d East -c emp-territories --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/emp-territories.csv"
mongoimport --drop --type csv --headerline -d East -c employees       --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/employees.csv"
mongoimport --drop --type csv --headerline -d East -c order-details   --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/order-details.csv"
mongoimport --drop --type csv --headerline -d East -c orders          --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/orders.csv"
mongoimport --drop --type csv --headerline -d East -c products        --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/products.csv"
mongoimport --drop --type csv --headerline -d East -c regions         --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/regions.csv"
mongoimport --drop --type csv --headerline -d East -c shippers        --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/shippers.csv"
mongoimport --drop --type csv --headerline -d East -c suppliers       --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/suppliers.csv"
mongoimport --drop --type csv --headerline -d East -c territories     --file "/Users/kwarodom/Workspace/NoSQL+MongoDB/NorthwindCSV/territories.csv"

// -------------------------------------------------
// List all databases: show dbs
printjson(db.adminCommand('listDatabases'));

// print it out neatly
var dbList = db.adminCommand('listDatabases');
print ("Database Names:");
var filler = "                         ";
var space = filler.length;
for (var db = 0; db < dbList.length; db++) {
	var line = "";
	for (var prop in dbList[db]) { // name, sizeOnDisk, empty
		var item = prop + " : " + dbList[db][prop];
		item += filler.substring(0, space - item.length);
		line += item;
	}
	print(line);
}

// -------------------------------------------------
// set references to databases
var east = db.getSiblingDB('East');
var west = db.getSiblingDB('West');

// -------------------------------------------------
// list all collection names in a database: show collections
east.getCollectionNames();

// -------------------------------------------------
// copy "products" collection from "East" database to "West" database
// and embed "categories" into "products"

// read products from "products" collection in "East" database
var productCursor = east.products.find();
while (productCursor.hasNext()) {
	var product = productCursor.next(); // read a product object

	// look for its category from "categories" collection
	var categoryCursor = east.categories.find( { CategoryID: product.CategoryID })

	// add the category name into the product object
	product.CategoryName = categoryCursor.next().CategoryName;

	// remove the category id from the product object
	delete product.CategoryID;

	// insert the product object into "products" collection in "west" database
	west.products.insert(product);
}

// in case that there is any error,
// you may remove all data from "products" collection
west.getCollection('products').remove({});

// or drop "products" collection entirely
west.getCollection('products').drop();

// in case that you forget to remove the category id from the product object,
// you may do that by updating "products" collection using $unset to remove it.
west.products.update(
    { }                            // find every members
  , {$unset: { CategoryID: 1 } }   // remove CategoryID
  , { multi: true }                // update every members found
);

// -------------------------------------------------
// replace SupplierID in "products" collection with Supplier object

// read suppliers from "suppliers" collection in "East" database
var supplierCursor = east.suppliers.find();
while (supplierCursor.hasNext()) {
    // read a supplier object from the collection
	var supplier = supplierCursor.next();
    // create another supplier object to be embedded into a product
	// by copying information from the above supplier object
	var embeddedSupplier = {
		ID: supplier.SupplierID,
		Name: supplier.CompanyName,
		City: supplier.City,
		Country: supplier.Country
	}

	// update supplier information in "products" collection
	west.products.update(
	  { SupplierID: supplier.SupplierID },    // look for the products using the supplier id
	  { $set: { Supplier: embeddedSupplier }, // add the embedded supplier object
	    $unset: { SupplierID: 1 } },          // remove the supplier id
	  { multi: true })                        // do this for every products found
}

// -------------------------------------------------
// copy employees from East to West
var employeeCursor = east.employees.find();
employeeCursor.forEach( function(employee) { west.employees.insert(employee) } )

// -------------------------------------------------
// copy territories from East to West
// and replace RegionID with Region (RegionDescription)
var territoryCursor = east.territories.find();
territoryCursor.forEach(function(territory) {
	var regionCursor = east.regions.find( { RegionID: territory.RegionID })
	territory.RegionName = regionCursor.next().RegionDescription;
	delete territory.RegionID;
	west.territories.insert(territory);
});

// -------------------------------------------------
// push territories inside employees
var territoryCursor = east.territories.find();
territoryCursor.forEach( function (territory) {
	var employeeCursor =
	       east.getCollection('emp-territories')
		       .find( { TerritoryID: territory.TerritoryID } );
	while (employeeCursor.hasNext()) {
		var empID = employeeCursor.next().EmployeeID;
		west.employees.update(
		    { EmployeeID: empID },
			{ $push: { Territories: territory } } )
	}
} )

// -------------------------------------------------
// do not need "territories" collection anymore. Drop it.
west.territories.drop()

// -------------------------------------------------
// Array Manipulation
db.test.insert( { name: "joe" })
j = db.test.findOne( { name: "joe" }, { _id : 1 } )
db.test.update ( { _id: 1 } , { $set: { comment: [ "first" ] } } )   // create an array with an element
db.test.update ( { _id: 1 } , { $push: { comment: "second" } } )     // append an element into the array
db.test.update ( { _id: 1 } , { $addToSet: { comment: "second" } } ) // append if not exists
db.test.update ( { _id: 1 } , { $pull: { comment: "second" } } )     // pull an element out
db.test.update ( { _id: 1 } , { $pop: { comment: 1 } } )             // pop the last element
db.test.update ( { _id: 1 } , { $set: { "comment.0" : "only" } } )   // change an element at the position
db.test.update ( { comment: "only" } , { $set: { "comment.$" : "head" } } ) // change the element found

// replace CustomerID with Customer { ID, Contact, City, Country }
// replace EmployeeID with Employee { ID, Name (first+''+last), City, Country }
// replace ShipVia with ShipperName(CompanyName)
// ***** *****

// copy orders from East to West
var orderCursor = east.orders.find();
while (orderCursor.hasNext()) {
	var order = orderCursor.next(); // read an order object

	// look for its details in "order-details" collection
	var detailsCursor = east.getCollection('order-details')
	       .find( { OrderID: order.OrderID })
    var details = [ ];
	while (detailsCursor.hasNext()) {
		var lineItem = detailsCursor.next();
		delete lineItem._id;
		delete lineItem.OrderID;
		details.push( lineItem );
	}
	order.LineItems = details;

	// insert the product object into "products" collection in "west" database
	west.orders.insert(order);
}

// in case of error, drop "orders" and rebuild
west.orders.drop();
