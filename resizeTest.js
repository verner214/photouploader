//se denna kod för att spara till fil istället för stream.
//http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node

var tufu = require("tufu");
//IMG_0008.JPG
//var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");
var orginalJPG = tufu("c:\\temp\\bilder\\br.JPG");
//IMG_0011.JPG
console.log(orginalJPG.imageData.width);

if (orginalJPG.imageData.width > orginalJPG.imageData.height) {
	var diff = orginalJPG.imageData.width - orginalJPG.imageData.height;
	orginalJPG.cut(Math.floor((orginalJPG.imageData.width - orginalJPG.imageData.height)/2), 0, orginalJPG.imageData.height, orginalJPG.imageData.height);
}
orginalJPG.quality = 92;
orginalJPG.save("c:\\temp\\bilder\\zzz.jpg");


/*
orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");

*/
