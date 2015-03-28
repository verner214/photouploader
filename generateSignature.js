/*
om hur man skapar shared access signature, https://msdn.microsoft.com/en-us/library/azure/dn140255.aspx
exempel, https://msdn.microsoft.com/en-us/library/azure/dn140256.aspx
blogg, ngn som gjort det (fast den andra varianten) http://blogs.interknowlogy.com/2014/12/01/azure-storage-tables/
om crypto-js, http://www.kongsli.net/2011/03/16/creating-azure-blob-storage-shared-access-signatures-using-javascript/

https://myaccount.table.core.windows.net/MyTable?
    $filter=PartitionKey%20eq%20'Coho%20Winery'&
    sv=2012-02-12&
    tn=MyTable&
    st=2012-02-09T08%3a49Z&
    se=2012-02-10T08%3a49Z&
    sp=r&
    si=YWJjZGVmZw%3d%3d&
    sig=jDrr6cna7JPwIaxWfdH0tT5v9dc%3d&
    spk=Coho%20Winery&
    srk=Auburn&
    epk=Coho%20Winery&
    erk=Seattle

var signatureString = “r” + "\n"
               “” + "\n"
               “2012-12-01” + "\n"
               /portalvhdsgfh152bhy290k/photos + "\n"
               “” + "\n"
               “2014-02-14” + "\n"
               “” + "\n"
               “” + "\n"
               “” + "\n"
               “” + "\n"
               “”

https://portalvhdsgfh152bhy290k.table.core.windows.net/photos?$filter=PartitionKey%20eq%20'photos'&sv=2014-02-14&tn=photos&se=2030-02-01&sp=r&sig=jDrr6cna7JPwIaxWfdH0tT5v9dc%3d
*/
var account = "portalvhdsgfh152bhy290k";

var table = "photos";
var AZURE_STORAGE_ACCOUNT = "portalvhdsgfh152bhy290k";
var AZURE_STORAGE_ACCESS_KEY = "blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==";
var hostName = "https://" + AZURE_STORAGE_ACCOUNT + ".blob.core.windows.net";

var CryptoJS = require("crypto-js");
var stringToSign = "r\n\n2030-12-01\n/portalvhdsgfh152bhy290k/photos\n\n2014-02-14\n\n\n\n\n";
var secretKey = "blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==";
var signature = CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(CryptoJS.enc.Utf8.parse(stringToSign), CryptoJS.enc.Base64.parse(secretKey)));
console.log(signature);

//och nu genererad signature istället
var azure = require("azure-storage");
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
var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);
var tableSAS = tableSvc.generateSharedAccessSignature(table, sharedAccessPolicy);
var host = tableSvc.host;
console.log("tableSAS:" + tableSAS);
//https://portalvhdsgfh152bhy290k.table.core.windows.net/photos?st=2015-03-28T20%3A41%3A10Z&se=2015-03-29T00%3A01%3A10Z&sp=r&sv=2014-02-14&tn=photos&sig=yf8MoYRO8kAO4NF89krvZDLjLycVgOBHA%2FC%2FCIc0vV0%3D
console.log("host:" + host);
/*
iv9YNqpR/e0f0mlyKJJdSuWRd35n2RePVRUHhgKXrdA=
tableSAS:st=2015-03-28T21%3A38%3A15Z&se=2015-04-04T20%3A58%3A15Z&sp=r&sv=2014-02
-14&tn=photos&sig=vEP2KMQH%2FEXOLGFqH08b63TZ%2F8%2B0h%2FZq1D5pb85bK1I%3D
host:[object Object]

process.env['AZURE_STORAGE_ACCOUNT'] = "[MY_ACCOUNT_NAME]";
process.env['AZURE_STORAGE_ACCESS_KEY'] = "[MY_ACCESS_KEY]";

var azure = require('azure-storage');
var blobs = azure.createBlobService();

var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);

blobs.getBlobUrl('[CONTAINER_NAME]', "[BLOB_NAME]", {
    AccessPolicy: {
        Start: Date.now(),
        Expiry: azure.date.minutesFromNow(60),
        Permissions: azure.Constants.BlobConstants.SharedAccessPermissions.READ
    }
});
*/