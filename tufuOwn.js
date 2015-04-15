/* tufuOwn, egna tillägg till tufu-modulen*/

//var path = require('path');var uuid = require('node-uuid');
var fs = require('fs-extra');
var tufu = require("tufu");

//1. klipper kanter så att proportionerna stämmer. 2. scala om med samma faktor i höjd och bredd.
tufu.prototype.cutAndResize = function (newWidth, newHeight) {
    var width = this.imageData.width;
    var height = this.imageData.height;

    var widthRatio = width / newWidth;
    var heightRatio = height / newHeight;

    if (widthRatio > heightRatio) {//bilden för bred, sidorna ska bort
        var tmpWidth = newWidth * heightRatio;
        this.cut(Math.floor((width - tmpWidth) / 2), 0, tmpWidth, height);
    }
    else {
        var tmpHeight = newHeight * widthRatio;
        this.cut(0, Math.floor((height - tmpHeight) / 2), width, tmpHeight);
    }
    this.resize(newWidth, newHeight);
}

//skriver över den save-function som redan finns. denna gör close vilket inte ordinarie gör.
tufu.prototype.save = function (desPath, callback) {
    var encodeData = this.codec.encode(this.imageData, this.quality);
    fs.open(desPath ? desPath : this.src, 'w+', function (err, fd) {
        if (err) {
            return callback(err);
        }
        console.log("save, fil = " + desPath + ", size = " + encodeData.data.length);
        fs.write(fd, encodeData.data, 0, encodeData.data.length, 0, function (err) {
            if (err) {
                return callback(err);
            }
            fs.close(fd, function (err) {
                if (err) {
                    return callback(err);
                }
                console.log("save, fil = " + desPath + ", sparad och stängd");
                //reset quality
                this.quality = 100;
                return callback(null);
            });
        });
    });
    return this;
};

module.exports = tufu;

