/* node server.js
  webbserver som tillåter uppladdning av filer till azure storage
  dessa environment variabler måste sättas innan servern startas:
set AZURE_STORAGE_ACCOUNT=portalvhdsgfh152bhy290k
set AZURE_STORAGE_ACCESS_KEY=blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==
  
obs! bra länk som är rätt och inte fel!, http://azure.microsoft.com/sv-se/develop/nodejs/
obs! om hur man laddar upp och skapar fil innan, http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node
också en länk som har rätt information, http://azure.microsoft.com/sv-se/documentation/articles/storage-nodejs-how-to-use-table-storage/
*/
var express = require("express");
var azure = require("azure-storage");
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var formidable = require('formidable');
var path = require('path');     //used for file path
var fs = require('fs-extra');    //File System-needed for renaming file etc
var tufu = require("tufu");//gör thumbnails
var uuid = require('node-uuid');

var app = express();
var containerName = "photos";
var tableName = "photos";
var AZURE_STORAGE_ACCOUNT = "portalvhdsgfh152bhy290k";
var AZURE_STORAGE_ACCESS_KEY = "blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==";
var hostName = "https://" + AZURE_STORAGE_ACCOUNT + ".blob.core.windows.net";
var partitionKey = "photos";

var fixedTufuSave = function (desPath, callback) {
    var encodeData = this.codec.encode(this.imageData, this.quality);
    fs.open(desPath ? desPath : this.src, 'w+', function (err, fd) {
        if (err) callback(err);
        console.log("dd" + encodeData.data.length);
        fs.write(fd, encodeData.data, 0, encodeData.data.length, 0, function (err) {
            if (err) callback(err);
            fs.close(fd, function (err) {
                if (err) callback(err);
                console.log("fil sparad och stängd");
                //reset quality
                this.quality = 100;
                callback(null);
            });
        });
    });
    return this;
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//app.use(bodyParser({ defer: true }));

var uploadDir = "upload";
var thumbPrefix = "t_";
var thumbDir = thumbPrefix + uploadDir;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir);
}

app.get('/', function (req, res) {
    res.send(
    '<a href="/upload">ladda upp bilder, helst jpg</a></br>' +
    '<a href="/show">visa JSON</a></br>' +
    '<a href="/show2">visa alla blobbar</a></br>' +
    'slut.</br>'
    );
});

app.get('/show', function (req, res) {
    var query = new azure.TableQuery()
      .top(5)
      .where('PartitionKey eq ?', partitionKey);

    var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
        if (error) {
            res.end(JSON.stringify(error));
            return;
        }
        res.writeHead(200, { 'content-type': 'text/plain' });
        var resultat = result.entries;
//        res.write(JSON.stringify(resultat[0]["imgURL"]["_"]) + '\n\n');
        res.send('<img src="' + resultat[0]["imgURL"]["_"] + '">');
        /*
        for (var r = 0; r < 5; r++) {
            res.write(resultat[r].imgURL['_'] + '</br>');
            res.write('</br>');
        }
        */
        //res.end();
    });
});

//res.write kan anropas föera ggr, res.send en gång (gör res.end implicit antagligen)
app.get('/show2', function (req, res) {
    var query = new azure.TableQuery()
      .top(5)
      .where('PartitionKey eq ?', partitionKey);

    var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    tableSvc.queryEntities(tableName, query, null, function (error, result, response) {
        if (error) {
            res.writeHead(200, { 'content-type': 'text/plain' });
            res.end(JSON.stringify(error));
            return;
        }
        res.writeHead(200, { 'content-type': 'text/plain' });

        res.send(mybody);
    });
});

app.get('/upload', function (req, res) {
    res.send(
    '<form action="/upload" method="post" enctype="multipart/form-data">' +
    '<input type="file" name="fileUploaded" />' +
    '<input type="submit" value="Upload" />' +
    '</form>'
    );
});

app.post('/upload', function (req, res, next) {

    var form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = uploadDir;       //set upload directory
    form.keepExtensions = true;     //keep file extension

    form.parse(req, function(err, fields, files) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.write('received upload:' + files.fileUploaded.name + '\n\n');

//debug
        console.log("form.bytesReceived");
        console.log("file size: " + JSON.stringify(files.fileUploaded.size));
        console.log("file path: "+JSON.stringify(files.fileUploaded.path));
        console.log("file name: "+JSON.stringify(files.fileUploaded.name));
        console.log("file type: "+JSON.stringify(files.fileUploaded.type));
        console.log("lastModifiedDate: " + JSON.stringify(files.fileUploaded.lastModifiedDate));

//URL'er
        var urlOrginal = null;
        var urlThumbnail = null;

//initiera blobanvändning
        var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
        //console.log(blobService);

//spara URL'er och metainfo i tabell
        var saveRow = function(callback) {
            console.log('nu ska vi spara i tabell');
            var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
            tableSvc.createTableIfNotExists(tableName, function (error, result, response) {
                if (error) callback(error);

                var entGen = azure.TableUtilities.entityGenerator;
                var task = {
                    PartitionKey: entGen.String(partitionKey),//obligatorisk
                    RowKey: entGen.String(uuid()),//obligatorisk
                    description: entGen.String('take out the trash'),
                    imgURL: entGen.String(urlOrginal),
                    thumbURL: entGen.String(urlThumbnail),
                };

                tableSvc.insertEntity(tableName, task, function (error, result, response) {
                    callback(error);
                });
            });
        }

//thumbnail
        var orginalJPG = tufu(files.fileUploaded.path);
        orginalJPG.save = fixedTufuSave;//egen savemetod ersätter den befintliga
        orginalJPG.resize(100, 100);
        var thumbfil = thumbPrefix + files.fileUploaded.path;

//spara stora filen i blob (kan vi göra efter resize lyckats)
        console.log('nu ska vi spara orginalfilen i BLOB');
        blobService.createBlockBlobFromLocalFile(containerName, files.fileUploaded.name, files.fileUploaded.path,
            function (error, result, response) {
                if (error) throw error;
                console.log('result:' + result);
                urlOrginal = blobService.getUrl(containerName, files.fileUploaded.name, null, hostName);
                console.log('urlOrginal:' + urlOrginal);
                if (urlThumbnail) {
                    saveRow(function (err) {
                        if (err) throw err;
                        console.log('rad sparad i tabell');
                    });
                }
                fs.unlink(files.fileUploaded.path, function (err) {
                    if (err) throw err;
                    console.log('fil raderad ' + files.fileUploaded.path);
                });
            }
        );

//save thumbnail och spara i blob.
        console.log('nu ska vi spara thumbnail på DISK');
        orginalJPG.save(thumbfil, function (err) {
            if (err) throw err;//senare kanske bara avbryta här men låta webbservern leva vidare
            console.log('nu ska vi spara thumbnail i BLOB');
            blobService.createBlockBlobFromLocalFile(containerName, "t_" + files.fileUploaded.name, thumbfil,
                function (error) {
                if (error) throw error;
                urlThumbnail = blobService.getUrl(containerName, "t_" + files.fileUploaded.name, null, hostName);;
                if (urlOrginal) {
                    saveRow(function (err) {
                        if (err) throw err;
                        console.log('rad sparad i tabell');
                    });
                }
                fs.unlink(thumbfil, function (err) {
                    if (err) throw err;
                    console.log('fil raderad ' + thumbfil);
                });
            });
        });//orginalJPG.save
        res.end();
    });//form.parse

});//app.post('/upload'

app.listen(process.env.PORT || 1337);
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

*/