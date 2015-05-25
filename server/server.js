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

function md5(text){
    return crypto.createHash('md5').update(text).digest('hex');
}

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({ secret: 'keyboard cat', resave:false, saveUninitialized:true }));
app.use(passport.initialize());
app.use(passport.session({ secret: 'keyboard cat' }));

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

function serveHtmlText(htmlText){
    return function(req,res){
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Length', htmlText.length);
        res.end(htmlText);
    }
}

function serveErr(req,res){
    return function(err){
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

function serveJade(fileName){
    return function(req,res){
        Promise.resolve().then(function(){
            return fs.readFile(fileName, {encoding: 'utf8'})
        }).then(function(fileContent){
            var htmlText=jade.render(fileContent);
            serveHtmlText(htmlText)(req,res);
        }).catch(serveErr(req,res));
    }
}

var mime = extensionServeStatic.mime;

var validExts=[
    'html',
    'jpg','png','gif',
    'css','js','manifest'];
console.log('validExts',validExts);

app.get('/login',serveJade('server/login.jade'));

app.use('/unlogged',extensionServeStatic('./server/unlogged', {
    index: [''], 
    extensions:[''], 
    staticExtensions:validExts
}))

app.use(ensureLoggedIn('/login'));

app.get('/index',serveJade('server/index.jade'));

app.use('/',extensionServeStatic('./server', {
    index: ['index.html'], 
    extensions:[''], 
    staticExtensions:validExts
}))

var actualConfig;

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
    });
}).then(function(){
    return pg.connect(actualConfig.db);
}).then(function(client){
    console.log("CONECTED TO", actualConfig.db.database);
    passport.use(new LocalStrategy(
        function(username, password, done) {
            console.log("TRYING TO CONNECT",username, password);
            client
                .query('SELECT * FROM inter.users WHERE username=$1 AND hashpass=$2',[username, md5(password+username.toLowerCase())])
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