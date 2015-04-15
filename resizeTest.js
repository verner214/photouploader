//se denna kod för att spara till fil istället för stream.
//http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node

//js-fil för att testa tufuOwn.js

//IMG_0008.JPG
var tufu = require("./tufuOwn.js");

//var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");
var mediumJPG = tufu("c:\\temp\\bilder\\br2.JPG");
mediumJPG.cutAndResize(300, 400);
mediumJPG.quality = 92;
mediumJPG.save("c:\\temp\\bilder\\zzb.jpg", function (err) {
    if (err) throw err;
});

var smallJPG = tufu("c:\\temp\\bilder\\br2.JPG");
smallJPG.cutAndResize(100, 100);
smallJPG.quality = 92;
//orginalJPG.save("c:\\temp\\bilder\\zzb100.jpg");
smallJPG.save("c:\\temp\\bilder\\zzb100.jpg", function (err) {
    if (err) throw err;
});


/*
orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");
*/
