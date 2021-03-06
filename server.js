
var dotenv = require('dotenv').config({path: __dirname + '/EnvironmentVariables.env'});

var os = require("os");
var hostname = os.hostname();
const fs = require('fs');
var key, cert;

if(hostname.substring(0, 3) == "ip-"){
  //AWS server:
  key = fs.readFileSync('/etc/letsencrypt/live/dailyreadings.cloudns.asia/privkey.pem');
  cert = fs.readFileSync('/etc/letsencrypt/live/dailyreadings.cloudns.asia/fullchain.pem');
} else {
  //localhost:
  key = fs.readFileSync('./keyStore/server-key.pem');
  cert = fs.readFileSync('./keyStore/server-cert.pem');
}

const https = require('https');

var cors = require('cors');

var express = require('express'),
  app = express(),
  port = 50001,
  mongoose = require('mongoose'),
  dailyReadings = require('./api/models/dailyReadingsModel'), //created model loading here
  bodyParser = require('body-parser');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger_output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// CORS support
app.use(cors());

// mongoose instance connection url connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/dailyReadingsDB'); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', require('./api/routes/dailyReadingsRoutes'));

// we do not use separate files anymore for routes, because swagger creation will not be complete
//app.use('/', require('./api/routes/dailyReadingsRoutesNoAuth'));

//var routes = require('./api/routes/dailyReadingsRoutes'); //importing routes
//routes(app); //register the route

app.use(function(req, res) {
  res.status(404).send({url: req.originalUrl + ' not found'})
});

//app.listen(port);
const server = https.createServer({key: key, cert: cert , secureProtocol: 'TLSv1_2_method'}, app);
server.listen(port);


console.log('dailyReadings RESTful API server started on: ' + port);