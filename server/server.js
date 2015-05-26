"use strict";

var _ = require('lodash');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var Promise = require('best-promise');
var fs = require('fs-promise');
var jade = require('jade');
var path = require('path');
var pg = require('pg-promise-strict');
var readYaml = require('read-yaml-promise');
var passport = require('passport');
var extensionServeStatic = require('extension-serve-static');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var LocalStrategy = require('passport-local').Strategy;
var crypto = require('crypto');
var stylus = require('stylus');
var kill9 = require('kill-9');
var estructura = require('./estructura.js');

function md5(text){
    return crypto.createHash('md5').update(text).digest('hex');
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({ secret: 'keyboard cat', resave:false, saveUninitialized:true }));
app.use(passport.initialize());
app.use(passport.session({ secret: 'keyboard cat' }));

function serveText(htmlText,contentTypeText){
    return function(req,res){
        res.setHeader('Content-Type', 'text/'+contentTypeText+'; charset=utf-8');
        res.setHeader('Content-Length', htmlText.length);
        res.end(htmlText);
    }
}

function serveHtmlText(htmlText){
    return serveText(htmlText,'html');
}

function serveErr(req,res,next){
    return function(err){
        if(err.message==='next'){
            next();
        }else{
            console.log('ERROR', err);
            console.log('STACK', err.stack);
            var text='ERROR! '+(err.code||'')+'\n'+err.message+'\n------------------\n'+err.stack;
            res.writeHead(200, {
                'Content-Length': text.length,
                'Content-Type': 'text/plain; charset=utf-8'
            });
            res.end(text);
        }
    }
}

function sendError(res,number,text){
    res.writeHead(number, {
        'Content-Length': text.length,
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(text);
}

app.get('/server.js',function(req,res){
    sendError(res,404,'Cannot GET '+req.path);
});

app.post('/login',
  passport.authenticate('local', { successRedirect: '/index',
                                   failureRedirect: '/login',
                                   failureFlash: true })
);

app.use(function(req,res,next){
    console.log('USE cookie',req.cookies)
    console.log('session',req.session,req.query);
    next();
});

var savedUser={};

passport.serializeUser(function(user, done) {
    savedUser[user.username] = user;
    console.log('SERIALIZE',savedUser,user);
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    console.log('deSERIALIZE',savedUser,username);
    done(null, savedUser[username]);
});

function serveStylus(pathToFile,anyFile){
    return function(req,res,next){
        var regExpExt=/\.css$/g;
        if(anyFile && !regExpExt.test(req.path)){
            console.log('next');
            return next();
        }
        Promise.resolve().then(function(){
            var fileName=(pathToFile+(anyFile?req.path:'')).replace(regExpExt,'.styl');
            return fs.readFile(fileName, {encoding: 'utf8'});
        }).catch(function(err){
            if(anyFile && err.code==='ENOENT'){
                throw new Error('next');
            }
            throw err;
        }).then(function(fileContent){
            var htmlText=stylus.render(fileContent);
            serveText(htmlText,'css')(req,res);
        }).catch(serveErr(req,res,next));
    }
}

function serveJade(pathToFile,anyFile){
    return function(req,res,next){
        console.log('serving',req.path);
        Promise.resolve().then(function(){
            var fileName=pathToFile+(anyFile?req.path+'.jade':'');
            return fs.readFile(fileName, {encoding: 'utf8'})
        }).catch(function(err){
            if(anyFile && err.code==='ENOENT'){
                throw new Error('next');
            }
            throw err;
        }).then(function(fileContent){
            var htmlText=jade.render(fileContent);
            serveHtmlText(htmlText)(req,res);
        }).catch(serveErr(req,res,next));
    }
}

var actualConfig;

var mime = extensionServeStatic.mime;

var validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];
console.log('validExts',validExts);

app.get('/login',serveJade('server/login.jade'));

app.use('/',serveStylus('server',true));

app.use('/unlogged',extensionServeStatic('./server/unlogged', {
    index: [''], 
    extensions:[''], 
    staticExtensions:validExts
}))

app.post('/syncro/put',function(req,res){
    try{
        var user=req.session.passport.user;
        if(!user){
            console.log("NO-LOGUEADO");
            sendError(res,403,'unauth');
        }
        console.log("LOGUEADO");
        Promise.resolve().then(function(){
            return pg.connect(actualConfig.db);
        }).then(function(client){
            return client.query('BEGIN TRANSACTION').execute();
        }).then(function(result){
            var planillas=JSON.parse(req.body.planillas);
            console.log('grabar',planillas);
            return Promise.all(planillas.map(function(planilla){
                return result.client.query('INSERT INTO comun.planillas (orden) VALUES ($1)',[planilla.orden]).execute();
            }));
        }).then(function(results){
            console.log('result planillas',results);
            return results.length?results[0].client.query('COMMIT'):null;
        }).then(function(){
            res.end('gracias');
        }).catch(serveErr(req,res));
    }catch(err){
        console.log("ERROR SYNCRO",err);
        sendError(res,403,'problem '+err.message);
    }
});

app.use(ensureLoggedIn('/login'));

app.use('/',serveJade('server',true));

app.get('/moment.js',extensionServeStatic('./node_modules/moment/', {
    index: [''], 
    extensions:[''], 
    staticExtensions:['js']
}))

app.use('/',extensionServeStatic('./server', {
    index: ['index.html'], 
    extensions:[''], 
    staticExtensions:validExts
}))

function logAndThrow(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
    throw err;
}

readYaml('local-config.yaml',{encoding: 'utf8'}).then(function(localConfig){
    actualConfig=localConfig;
    return new Promise(function(resolve, reject){
        var server=app.listen(localConfig.server.port, function(event) {
            console.log('Listening on port %d', server.address().port);
            resolve();
        });
        app.use(kill9({pid:localConfig.server.killPid}));
    });
}).then(function(){
    return pg.connect(actualConfig.db);
}).then(function(client){
    console.log("CONECTED TO", actualConfig.db.database);
    passport.use(new LocalStrategy(
        function(username, password, done) {
            console.log("TRYING TO CONNECT",username, password);
            client
                .query('SELECT * FROM comun.users WHERE username=$1 AND hashpass=$2',[username, md5(password+username.toLowerCase())])
                .fetchUniqueRow()
                .then(function(data){
                    console.log("LOGGED IN",data.row);
                    done(null, data.row);
                }).catch(logAndThrow).catch(done);
        }
    ));
}).catch(function(err){
    console.log('ERROR',err);
    console.log('STACK',err.stack);
});