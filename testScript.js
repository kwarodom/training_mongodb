
var east = db.getSiblingDB('East');
var west = db.getSiblingDB('West');

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