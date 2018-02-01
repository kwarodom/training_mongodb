var dbList = db.adminCommand('listDatabases').databases;
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
print(dbList)
