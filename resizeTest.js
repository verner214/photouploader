//se denna kod f�r att spara till fil ist�llet f�r stream.
//http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node

var thumbnail100 = function() {
    var width = orginalJPG.imageData.width;//sen, anv�nd resize
    var height = orginalJPG.imageData.height;

    console.log(width + ":" + height);

    var diff = width - height;

    if (diff > 0) {//bredare �n h�g -> klipp p� sidorna
        orginalJPG.cut(Math.floor(diff / 2), 0, height, height);
    }
    else {
        orginalJPG.cut(0, Math.floor(-diff / 2), width, width);
    }

    orginalJPG.resize(100, 100);

    orginalJPG.quality = 92;
    orginalJPG.save("c:\\temp\\bilder\\zzz.jpg");
}
//obs! g�r funktion som anpassar bild till �nskad bredd och h�jd. 
//1. klipper kanter s� att bilden har r�tt proportioner
//2. skalar om.
var cutAndResize = function(mytufu, newWidth, newHeight) {
    var width = mytufu.imageData.width;
    var height = mytufu.imageData.height;

    var widthRatio = width / newWidth;
    var heightRatio = height / newHeight;
    console.log(width + ":" + height);
    console.log(widthRatio + ":" + heightRatio);

    if (widthRatio > heightRatio) {//bilden f�r bred, sidorna ska bort
        var tmpWidth = newWidth * heightRatio;
        mytufu.cut(Math.floor((width - tmpWidth) / 2), 0, tmpWidth, height);
    }
    else {
        var tmpHeight = newHeight * widthRatio;
        mytufu.cut(0, Math.floor((height - tmpHeight) / 2), width, tmpHeight);
    }
    mytufu.resize(newWidth, newHeight);
}


var tufu = require("tufu");
//IMG_0008.JPG
//var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");
var orginalJPG = tufu("c:\\temp\\bilder\\br2.JPG");
//IMG_0011.JPG
cutAndResize(orginalJPG, 300, 400);
orginalJPG.quality = 92;
orginalJPG.save("c:\\temp\\bilder\\zzz.jpg");

/*
orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");

*/
