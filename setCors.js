// JavaScript source code
var azure = require("azure-storage");

var AZURE_STORAGE_ACCOUNT = "portalvhdsgfh152bhy290k";
var AZURE_STORAGE_ACCESS_KEY = "blSI3p0IIYZJkojYyc27+5Jm82TmjaYbjEthG+f8fTT615DVeBJ2MMc3gNPyW5dSRaPpeWa2cJ/NE7ypqWTvkw==";
var tableSvc = azure.createTableService(AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY);

tableSvc.setServiceProperties({Cors: 
    {
        CorsRule: [{
            AllowedOrigins: ['*'],
            AllowedMethods: ['GET'],
            AllowedHeaders: [],
            ExposedHeaders: [],
            MaxAgeInSeconds: 60
        }]
    }
}, function (err, result) {
    console.log("setServiceProperties callback." + JSON.stringify(result));
    if (err) throw err;
});

	
//service.setServiceProperties(serviceProperties, callback); where serviceProperties = {Cors: {CorsRule: [{AllowedOrigins: [*], ...}]}};


