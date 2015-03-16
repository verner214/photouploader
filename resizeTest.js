//se denna kod för att spara till fil istället för stream.
//http://stackoverflow.com/questions/18317904/stream-uploaded-file-to-azure-blob-storage-with-node

var tufu = require("tufu");
var orginalJPG = tufu("c:\\tmp\\dorr1.jpg");

orginalJPG.resize(100, 100);
orginalJPG.save("c:\\tmp\\dorr1_liten.jpg");
