/* node server.js
  webbserver som tillåter uppladdning av filer till azure storage
  dessa environment variabler måste sättas innan servern startas:
set AZURE_STORAGE_ACCOUNT=portalvhdsgfh152bhy290k
set AZURE_STORAGE_ACCESS_KEY=[key from azure]
  
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
var AZURE_STORAGE_ACCESS_KEY = process.env.AZURE_STORAGE_ACCESS_KEY;
var hostName = "https://" + AZURE_STORAGE_ACCOUNT + ".blob.core.windows.net";
var partitionKey = "photos";

var fixedTufuSave = function (desPath, callback) {
    var encodeData = this.codec.encode(this.imageData, this.quality);
    fs.open(desPath ? desPath : this.src, 'w+', function (err, fd) {
        if (err) {
            callback(err);
            return;
        }
        console.log("dd" + encodeData.data.length);
        fs.write(fd, encodeData.data, 0, encodeData.data.length, 0, function (err) {
            if (err) {
                callback(err);
                return;
            }
            fs.close(fd, function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                console.log("fil sparad och stängd");
                //reset quality
                this.quality = 100;
                callback(null);
            });
        });
    });
    return this;
};

//så här ska det se ut numer. det bortkommenterade är gammalt.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//app.use(bodyParser({ defer: true }));

//lägg uppladdade filer i speciella mappar, som skapas här.
var uploadDir = "upload";
var thumbPrefix = "t_";
var thumbDir = thumbPrefix + uploadDir;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(thumbDir)) {
    fs.mkdirSync(thumbDir);
}

//statiska html-filer ligger i public/
app.use(express.static(path.join(__dirname, 'public')));
console.log("public=" + path.join(__dirname, 'public'));

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
//edit.html postar hit
app.post('/update', function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) throw err;

        var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);

        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(fields.partitionkey),//obligatorisk
            RowKey: entGen.String(fields.rowkey),//obligatorisk
            description: entGen.String(fields.description),
        };
        tableSvc.mergeEntity(tableName, task, function (error, result, response) {
            if (err) throw err;
            //efter post, visa list.html        
            var fullUrl = req.protocol + '://' + req.get('host');
            console.log("url=" + fullUrl);
            res.redirect(fullUrl + "/list.html");
        });
    });
    
});//slut update

app.post('/delete', function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) throw err;

        var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);

        var entGen = azure.TableUtilities.entityGenerator;
        var task = {
            PartitionKey: entGen.String(fields.partitionkey),//obligatorisk
            RowKey: entGen.String(fields.rowkey)//obligatorisk
        };//obs! måste ta bort blob me.
        tableSvc.deleteEntity(tableName, task, function (error, result, response) {
            if (err) throw err;
            var fullUrl = req.protocol + '://' + req.get('host');
            res.redirect(fullUrl + "/list.html");
        });
    });
});//slut delete

app.post('/upload', function (req, res, next) {

    var form = new formidable.IncomingForm();
    //Formidable uploads to operating systems tmp dir by default
    form.uploadDir = uploadDir;       //set upload directory
    form.keepExtensions = true;     //keep file extension

    form.parse(req, function(err, fields, files) {
//        res.writeHead(200, { 'content-type': 'text/plain' });

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
        var tableWritten = false;

//initiera blobanvändning
        var blobService = azure.createBlobService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
        //console.log(blobService);

//spara URL'er och metainfo i tabell
        var saveRow = function (callback) {
            if (tableWritten) {
                console.log('det hände verkligen');
                callback(null);
                return;
            }
            tableWritten = true;
            console.log('nu ska vi spara i tabell');
            var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
            tableSvc.createTableIfNotExists(tableName, function (error, result, response) {
                if (error) {
                    callback(error);
                    return;
                }

                var entGen = azure.TableUtilities.entityGenerator;
                var task = {
                    PartitionKey: entGen.String(partitionKey),//obligatorisk
                    RowKey: entGen.String(uuid()),//obligatorisk
                    description: entGen.String('take out the trash'),
                    imgURL: entGen.String(urlOrginal),
                    thumbURL: entGen.String(urlThumbnail),
                };

                tableSvc.insertEntity(tableName, task, function (error, result, response) {
                    callback(error);//anropa alltid oavsett fel eller ej
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
                        console.log('rad sparad i tabell1');
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
                        console.log('rad sparad i tabell2');
                    });
                }
                fs.unlink(thumbfil, function (err) {
                    if (err) throw err;
                    console.log('fil raderad ' + thumbfil);
                });
            });
        });//orginalJPG.save
        var fullUrl = req.protocol + '://' + req.get('host');
        res.redirect(fullUrl + "/list.html");
    });//form.parse

});//app.post('/upload'

app.get('/sas', function (req, res) {
	var startDate = new Date();
	var expiryDate = new Date(startDate);
	expiryDate.setMinutes(startDate.getMinutes() + 10000);
	startDate.setMinutes(startDate.getMinutes() - 100);

	var sharedAccessPolicy = {
		AccessPolicy: {
			Permissions: azure.TableUtilities.SharedAccessPermissions.QUERY,
			Start: startDate,
			Expiry: expiryDate
		},
	};
	res.send("<p>hej</p>");
	/*
	var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
	var tableSAS = tableSvc.generateSharedAccessSignature(table, sharedAccessPolicy);
	var html = "<b>SAS</b>" + tableSAS + "<br>" + "<b>host</b>" + tableSAS.host + "<br>";
	res.send(html);
	//var host = tableSvc.host;
	//console.log("tableSAS:" + tableSAS);
	//https://portalvhdsgfh152bhy290k.table.core.windows.net/photos?st=2015-03-28T20%3A41%3A10Z&se=2015-03-29T00%3A01%3A10Z&sp=r&sv=2014-02-14&tn=photos&sig=yf8MoYRO8kAO4NF89krvZDLjLycVgOBHA%2FC%2FCIc0vV0%3D
	//console.log("host:" + host);
	*/
});

app.get('/', function (req, res) {
    var fullUrl = req.protocol + '://' + req.get('host');
    //console.log("url=" + fullUrl);
    res.redirect(fullUrl + "/list.html");
});



app.listen(process.env.PORT || 1337);
