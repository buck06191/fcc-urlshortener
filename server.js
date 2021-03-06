'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const dns = require('dns');
const bodyParser = require('body-parser')
const { URL } = require('url');
mongoose.connect(process.env.MONGODB_URI);

var Schema = mongoose.Schema;


var urlSchema = new Schema({
  original_url: {type: String, required: true},
  short_url: {type: Number, unique: true, required: true} 
});

var Url = mongoose.model('Url', urlSchema); 


var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));


/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/error', function(req, res){
  res.sendFile(process.cwd() + '/views/error.html');
});


  
app.route("/api/shorturl/new").post(postHandler);

function uploadToMongo(urlObject, done){
  let countQuery = Url.estimatedDocumentCount();
  countQuery.exec((err, urlCount) => {
    if (err) return console.log(err);
    
    urlObject.short_url = urlCount + 1;
    let url = Url(urlObject);
    
    url.save(function(err, data){
      if (err) {
        return done(err)
      };
      done(null, data);
    });
  });
}


function postHandler(req, res){

  let myUrl = new URL(req.body.url);
  let hostname = myUrl.hostname+myUrl.pathname;
  dns.resolve(hostname.slice(0, -1), (err) => {
    if (err){
      console.log(err);
      return res.json({"error": "invalid url"});
    }
    uploadToMongo({original_url: req.body.url}, function(err, data){
      if (err) return console.log(err);
      res.json(data);
    });

  });
}

app.get("/api/shorturl/:short_url", getHandler);

function getHandler(req, res){
  let short_url = req.params.short_url;
  retrieveUrl(short_url, function (err, record){
    if (err) {
      console.log(err);
      return res.redirect('/error')
    } else if (record === null ){
      console.log("Short id not found.");
      return res.redirect('/error')
    }
    res.redirect(record.original_url);

  });

}

function retrieveUrl(short_url, done){
  Url.findOne({short_url: short_url}, (err, data) =>{
    if (err){
      return done(err);
    };
  done(null, data);
  });
}


app.listen(port, function () {
  console.log('Node.js listening ...');
});