//se denna kod för att spara till fil istället för stream.
//http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node

var tufu = require("tufu");
//IMG_0008.JPG
//var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");
var orginalJPG = tufu("c:\\temp\\bilder\\br.JPG");
//IMG_0011.JPG


//obs! gör funktion som anpassar bild till önskad bredd och höjd. 
//1. klipper kanter så att bilden har rätt proportioner
//2. skalar om.
var width = orginalJPG.imageData.width;
var height = orginalJPG.imageData.height;

console.log(width + ":" + height);

var diff = width - height;

if (diff > 0) {//bredare än hög -> klipp på sidorna
    orginalJPG.cut(Math.floor(diff / 2), 0, height, height);
}
else {
    orginalJPG.cut(0, Math.floor(-diff / 2), width, width);
}

orginalJPG.resize(100, 100);

orginalJPG.quality = 92;
orginalJPG.save("c:\\temp\\bilder\\zzz.jpg");


/*
orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");

*/
