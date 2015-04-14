/* node server.js
  webbserver som tillåter uppladdning av filer till azure storage
  dessa environment variabler måste sättas innan servern startas:
set AZURE_STORAGE_ACCOUNT=portalvhdsgfh152bhy290k
set AZURE_STORAGE_ACCESS_KEY=[key från azure]
  
obs! bra länk som är rätt och inte fel!, http://azure.microsoft.com/sv-se/develop/nodejs/
obs! om hur man laddar upp och skapar fil innan, http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node
  */
var express = require("express");
var azure = require("azure-storage");
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var formidable = require('formidable');
var path = require('path');     //used for file path
var fs = require('fs-extra');    //File System-needed for renaming file etc
var tufu = require("tufu");//gör thumbnails

var app = express();
var containerName = "photos";
var AZURE_STORAGE_ACCOUNT = "portalvhdsgfh152bhy290k";
var AZURE_STORAGE_ACCESS_KEY = process.env.AZURE_STORAGE_ACCESS_KEY;
var hostName = "https://" + AZURE_STORAGE_ACCOUNT + ".blob.core.windows.net";

var fixedTufuSave = function (desPath) {
    var encodeData = this.codec.encode(this.imageData, this.quality);
    fs.open(desPath ? desPath : this.src, 'w+', function (err, fd) {
        if (err)
            console.log(err);
        else {
            fs.writeSync(fd, encodeData.data, 0, encodeData.data.length);
            fs.closeSync(fd);
        }
        console.log("end of fs.open own");
    });
    //reset quality
    this.quality = 100;
    console.log("end of fs.open2 own");
    return this;
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//app.use(bodyParser({ defer: true }));

/*
app.get('/start', function (req, res) {
    res.send(
    '<a href="/upload">ladda upp bilder, helst jpg</a></br>' +
    '<a href="/show">visa JSON</a></br>' +
    '<a href="/show2">visa alla blobbar</a></br>' +
    'slut.</br>'
    );
});

app.get('/upload', function (req, res) {
    res.send(
    '<form action="/upload" method="post" enctype="multipart/form-data">' +
    '<input type="file" name="fileUploaded" />' +
    '<input type="submit" value="Upload" />' +
    '</form>'
    );
});
*/
/*
app.get('/', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    //console.log("url=" + fullUrl);
    res.redirect(fullUrl + "/list.html");
});
*/


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
    '<a href="/upload">ladda upp med stream</a></br>' +
    '<a href="/show">visa alla blobar</a></br>'
    );
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
        res.write('received upload:\n\n');
        //debug
        console.log("form.bytesReceived");
        console.log("file size: " + JSON.stringify(files.fileUploaded.size));
        console.log("file path: "+JSON.stringify(files.fileUploaded.path));
        console.log("file name: "+JSON.stringify(files.fileUploaded.name));
        console.log("file type: "+JSON.stringify(files.fileUploaded.type));
        console.log("lastModifiedDate: "+JSON.stringify(files.fileUploaded.lastModifiedDate));

        var orginalJPG = tufu(files.fileUploaded.path);
        orginalJPG.save = fixedTufuSave;

        orginalJPG.resize(100, 100);
        var thumbfil = thumbPrefix + files.fileUploaded.path;
        orginalJPG.save(thumbfil);
        /*
        var bs = azure.createBlobService();
        bs.createBlockBlobFromFile('c', 'test.png', path, function (error) { });
        res.send("OK");
        */
        var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
        console.log(blobService);
        blobService.createBlockBlobFromLocalFile(containerName, files.fileUploaded.name,
            thumbfil, function (error) {
                if (error) throw error;
                /*
                fs.unlink(thumbfil, function (err) {
                    if (err) throw err;
                    console.log('successfully deleted ' + thumbfil);
                });
                */
            });

        res.end();
        console.log("end of function");
    });

});
//Formidable changes the name of the uploaded file
//Rename the file to its original name
/*
fs.rename(files.fileUploaded.path, files.fileUploaded.name, function(err) {
    if (err)
        throw err;
    console.log('renamed complete');  
});
*/
/*
app.post('/upload', function (req, res) {
    var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
    var form = new multiparty.Form();

    form.on('part', function(part) {
        if (part.filename) {

            var size = part.byteCount - part.byteOffset;
            var name = part.filename;

            blobService.createBlockBlobFromStream(containerName, name, part, size, function (error) {
                if (error) {
                    res.send(error);
                } else {
                    //res.send('inget gick fel när blob skapades! nu lista innehåll');
                    blobService.listBlobsSegmented(containerName, null, function (error, result, response) {
                        if (!error) {
                            var url = blobService.getUrl(containerName, name, null, hostName);
                            res.send(url);
                            //res.send(JSON.stringify(result));
                            //res.send('inget gick fel när blob listades2!');
                            //console.log(JSON.stringify(result));
                            //console.log(result);
                        }
                        else {
                            res.send(error);
                        }
                    });
                }
            });
        } else {//annat formulärselement än fil, vad gör handlePart?
            form.handlePart(part);
        }
    });
    form.parse(req);//aha, efter detta så kan eventen fyras av.
    //res.send('OK');
});
*/
/* från länken högst upp, dvs frågan i overflow där svaret är /upload ovan.
app.post('/upload', function (req, res) {
    var path = req.files.snapshot.path;
    var bs= azure.createBlobService();
    bs.createBlockBlobFromFile('c', 'test.png', path, function (error) { });
    res.send("OK");
});
*/
app.listen(process.env.PORT || 1337);


/*

var tufu = require("tufu");
var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");

orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");
*/
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