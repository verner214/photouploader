var fs = require('fs');    //File System-needed for renaming file etc
var tufu = require("./tufuOwn");//gör thumbnails


var krympmapp = "c:\\temp\\skakrympas\\";
var width = 300;
var height = 400;

var fileArr = fs.readdirSync(krympmapp);
console.log("antal filer=" + fileArr.length);

for (var n = 0; n < fileArr.length; n++) {
    console.log(fileArr[n]);
    var tfu = tufu(fileArr[n]);
    tfu.cutAndResize(width, height);
    tfu.save("k_" + fileArr[n], function (err) {
        console.log("err=" + JSON.stringify(err));
    });
}

//cutAndResize