/*, från http://www.devtxt.com/blog/azure-table-storage-library-for-nodejs-frustrations
//funktionen förbereder ett object att läggas in i table storage. allt blir string.
function applyAzureProperties(obj) {
  var entGen = azure.TableUtilities.entityGenerator;
  var azureObj = {
    PartitionKey: entGen.String("someEntity"),
    RowKey: entGen.String(obj.id)//someID that you consider the primary key in the table.
  };
  //iterate all properties on the object, and
  //create on the Azure entity, with its value as String type.
  for (var propertyName in obj) {        
    azureObj[propertyName] = entGen.String(obj[propertyName]);        
  }
  return azureObj;
}

//och tvärtom tar bort azurespecifik data vid hämtning
function convertObjectForAzure(azureTableEntity) 
{
  var obj = {};
  for (var propertyName in azureTableEntity) {
    if(["PartitionKey","RowKey"].indexOf(propertyName)==-1){
       obj[propertyName] = azureTableEntity[propertyName]["_"];
    }
  }
  return obj;
}

//res.write kan anropas föera ggr, res.send en gång (gör res.end implicit antagligen)
app.get('/show2', function (req, res) {
    var query = new azure.TableQuery()
      .where('PartitionKey eq ?', partitionKey);

    var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
        if (error) {
            res.writeHead(200, { 'content-type': 'text/plain' });
            res.end(JSON.stringify(error));
            return;
        }
        res.writeHead(200, { 'content-type': 'text/plain' });
        res.write(JSON.stringify(result));
        res.end();
    });
});

app.get('/show', function (req, res) {
    var query = new azure.TableQuery()
//      .top(5)
      .where('PartitionKey eq ?', partitionKey);

    var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
        if (error) {
            res.end(JSON.stringify(error));
            return;
        }
        //res.writeHead(200, { 'content-type': 'text/plain' });
        var resultat = result.entries;
        //res.write(JSON.stringify(resultat[0]["imgURL"]["_"]) + '\n\n');
        var bodyhtml = '<a href="/upload">ladda upp bilder, helst jpg</a></br>';
        //bodyhtml += '<img src="' + resultat[0]["thumbURL"]["_"] + '">';
        
        for (var r = 0; r < resultat.length; r++) {
            if (resultat[r]["imgURL"] && resultat[r]["thumbURL"])
                bodyhtml += '<a href="' + resultat[r]["imgURL"]["_"] + '"><img src="' + resultat[r]["thumbURL"]["_"] + '"/></a>';
        }
        
        res.send(bodyhtml);
        //res.end();
    });
});

*/