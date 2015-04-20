/* node server.js
*/
var express = require("express");
var bodyParser = require('body-parser'); //connects bodyParsing middleware
var formidable = require('formidable');
var path = require('path');     //used for file path
var fs = require('fs-extra');    //File System-needed for renaming file etc
var async = require("async");

var app = express();

//så här ska det se ut numer. det bortkommenterade är gammalt.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//statiska html-filer ligger i public/
app.use(express.static(path.join(__dirname, 'public')));
console.log("public=" + path.join(__dirname, 'public'));

//edit.html postar hit.
app.post('/update', function (req, res, next) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        if (err) throw err;

        console.log("fields.description = " + fields.description);
        console.log("fields.hidden = " + fields.hidden);
        console.log("fields.sortorder = " + fields.sortorder);
    });
    res.end("hej");
});//slut update


app.listen(process.env.PORT || 1337);
