var east = db.getSiblingDB('East');
var west = db.getSiblingDB('West');

printjson(db.getSiblingDB('East').getCollectionNames())
