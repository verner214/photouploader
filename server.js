/* node server.js
  webbserver som tillåter uppladdning av filer till azure storage
  dessa environment variabler måste sättas innan servern startas:
set AZURE_STORAGE_ACCOUNT=portalvhdsgfh152bhy290k
set AZURE_STORAGE_ACCESS_KEY=blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==
  
obs! bra länk som är rätt och inte fel!, http://azure.microsoft.com/sv-se/develop/nodejs/
obs! om hur man laddar upp och skapar fil innan, http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node
  */
var express = require("express");
var azure = require("azure-storage");
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var formidable = require('formidable');
var path = require('path');     //used for file path
var fs =require('fs-extra');    //File System-needed for renaming file etc
var tufu = require("tufu");//gör thumbnails

var app = express();
var containerName = "photos";
var AZURE_STORAGE_ACCOUNT = "portalvhdsgfh152bhy290k";
var AZURE_STORAGE_ACCESS_KEY = "blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==";
var hostName = "https://" + AZURE_STORAGE_ACCOUNT + ".blob.core.windows.net";

app.use(bodyParser({ defer: true }));

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
    form.uploadDir = "";       //set upload directory
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

        orginalJPG.resize(100, 100);
        orginalJPG.save("t_" + files.fileUploaded.path);

        res.end();
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