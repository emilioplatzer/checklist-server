var Promise = require('best-promise');
var fs = require('fs-promise');
var pg = require('pg-promise-strict');
var readYaml = require('read-yaml-promise');

var actualConfig;
var client;

readYaml('local-config.yaml',{encoding: 'utf8'}).then(function(localConfig){
    actualConfig=localConfig;
    return pg.connect(actualConfig.db);
}).then(function(clientFromPool){
    client = clientFromPool;
    return fs.readFile('./server/install/'+process.argv[2],{encoding:'utf8'});
}).then(function(content){
    var p=Promise.resolve('ARRANCAR');
    var sentencias=content.split(';');
    console.log('content',sentencias);
    var saltear=Number(process.argv[3])||0;
    while(sentencias.length){
        var sentencia=sentencias.shift();
        (function(sentencia){
            p=p.then(function(result){
                console.log(result);
                console.log(sentencia);
                return client.query(sentencia).execute();
            });
        }(sentencia));
    }
    return p;
}).then(function(content){
    console.log('ok');
    process.exit();
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});