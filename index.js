var express = require("express");
var logfmt = require("logfmt");
var request = require('request');
var util = require('util');
var unirest = require('unirest');
var crypto    = require('crypto');
var app = express();

/************************************************************************
 * Getting the google calendar/passport Oauth configured and set up:
 ***********************************************************************/

// var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

// // API Access link for creating client ID and secret:
// // https://code.google.com/apis/console/
// var GOOGLE_CLIENT_ID = "956631596569-o6vkaeqqtaq25vkm88h6a1m8mmd1ja6n.apps.googleusercontent.com";
// var GOOGLE_CLIENT_SECRET = "x3sB6IR_kSrGXEjeqKR_xH09";


// // Passport session setup.
// //   To support persistent login sessions, Passport needs to be able to
// //   serialize users into and deserialize users out of the session.  Typically,
// //   this will be as simple as storing the user ID when serializing, and finding
// //   the user by ID when deserializing.  However, since this example does not
// //   have a database of user records, the complete Google profile is
// //   serialized and deserialized.
// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(obj, done) {
//   done(null, obj);
// });


// // Use the GoogleStrategy within Passport.
// //   Strategies in Passport require a `verify` function, which accept
// //   credentials (in this case, an accessToken, refreshToken, and Google
// //   profile), and invoke a callback with a user object.
// passport.use(new GoogleStrategy({
//     clientID: GOOGLE_CLIENT_ID,
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://127.0.0.1:3000/auth/google/callback"
//   },
//   function(accessToken, refreshToken, profile, done) {
//     // asynchronous verification, for effect...
//     process.nextTick(function () {
      
//       // To keep the example simple, the user's Google profile is returned to
//       // represent the logged-in user.  In a typical application, you would want
//       // to associate the Google account with a user record in your database,
//       // and return that user instead.
//       return done(null, profile);
//     });
//   }
// ));

// var app = express.createServer();

// // configure Express
// app.configure(function() {
//   app.set('views', __dirname + '/views');
//   app.set('view engine', 'ejs');
//   app.use(express.logger());
//   app.use(express.cookieParser());
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(express.session({ secret: 'keyboard cat' }));
//   // Initialize Passport!  Also use passport.session() middleware, to support
//   // persistent login sessions (recommended).
//   app.use(passport.initialize());
//   app.use(passport.session());
//   app.use(app.router);
//   app.use(express.static(__dirname + '/public'));
// });


// app.get('/', function(req, res){
//   res.render('index', { user: req.user });
// });

// app.get('/account', ensureAuthenticated, function(req, res){
//   res.render('account', { user: req.user });
// });

// app.get('/login', function(req, res){
//   res.render('login', { user: req.user });
// });

// // GET /auth/google
// //   Use passport.authenticate() as route middleware to authenticate the
// //   request.  The first step in Google authentication will involve
// //   redirecting the user to google.com.  After authorization, Google
// //   will redirect the user back to this application at /auth/google/callback
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/userinfo.profile',
//                                             'https://www.googleapis.com/auth/userinfo.email'] }),
//   function(req, res){
//     // The request will be redirected to Google for authentication, so this
//     // function will not be called.
//   });

// // GET /auth/google/callback
// //   Use passport.authenticate() as route middleware to authenticate the
// //   request.  If authentication fails, the user will be redirected back to the
// //   login page.  Otherwise, the primary route function function will be called,
// //   which, in this example, will redirect the user to the home page.
// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {
//     res.redirect('/');
//   });

// app.get('/logout', function(req, res){
//   req.logout();
//   res.redirect('/');
// });

// app.listen(3000);


// // Simple route middleware to ensure user is authenticated.
// //   Use this route middleware on any resource that needs to be protected.  If
// //   the request is authenticated (typically via a persistent login session),
// //   the request will proceed.  Otherwise, the user will be redirected to the
// //   login page.
// function ensureAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) { return next(); }
//   res.redirect('/login');
// }

// app.use(logfmt.requestLogger());

/************************************************************************
 * Basic site stuff
 ***********************************************************************/

app.get('/', function(req, res) {
  res.send('ThatBrown Groupme Bot');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var GroupMe = require('./lib/groupme');
var API = GroupMe.Stateless;

/************************************************************************
 * Read the access token from the command line.
 ***********************************************************************/

var ACCESS_TOKEN = process.argv[2];

/************************************************************************
 * Getting the bot configured and set up:
 ***********************************************************************/

var USER_ID  = process.argv[3];
var BOT_NAME = 'ThatBrown';

/************************************************************************
 * Set up the message-based IncomingStream and the HTTP push
 ***********************************************************************/

var bot_id = null;

var retryCount = 3;

// Constructs the IncomingStream, identified by the access token and 
var incoming = new GroupMe.IncomingStream(ACCESS_TOKEN, USER_ID, null);

/*
// This logs the status of the IncomingStream
incoming.on('status', function() {
    var args = Array.prototype.slice.call(arguments);
    var str = args.shift();
    console.log("[IncomingStream 'status']", str, args);
});
*/

// This waits for the IncomingStream to complete its handshake and start listening.
// We then get the bot id of a specific bot.
incoming.on('connected', function() {
    console.log("[IncomingStream 'connected']");

    API.Bots.index(ACCESS_TOKEN, function(err,ret) {
        if (!err) {
            var botdeets;
            for (var i = 0; i < ret.length; i++) {
                if (ret[i].name == BOT_NAME) {
                    bot_id = ret[i].bot_id;
                }
            }
            console.log("[API.Bots.index return] Firing up bot!", bot_id);
        }
    });

});

// This waits for messages coming in from the IncomingStream
// If the message contains @BOT, we parrot the message back.
incoming.on('message', function(msg) {
    console.log("[IncomingStream 'message'] Message Received");

    if (msg["data"] 
        && msg["data"]["subject"] 
        && msg["data"]["subject"]["text"]
        /*&& msg["data"]["subject"]["text"].indexOf(BOT_LISTENS_FOR) >= 0*/) {

        if (bot_id && msg["data"]["subject"]["name"] != BOT_NAME) {
            var txt = msg["data"]["subject"]["text"];

            /************************************************************************
             * TBS hype
             ***********************************************************************/
            if(txt.search("TBS") != -1 || txt.search("tbs") != -1 || txt.search("Tbs") != -1|| txt.search("tbreezy") != -1) {
              API.Bots.post(
                  ACCESS_TOKEN, // Identify the access token
                  bot_id, // Identify the bot that is sending the message
                  "#tbreezy2014", // Construct the message
                  {}, // No pictures related to this post
                  function(err,res) {
                      if (err) {
                          console.log("[API.Bots.post] Reply Message Error!");
                      } else {
                          console.log("[API.Bots.post] Reply Message Sent!");
                      }
                  });
            }

            /************************************************************************
             * Late response
             ***********************************************************************/
            else if(txt.search("late") != -1) {
              API.Bots.post(
                  ACCESS_TOKEN, // Identify the access token
                  bot_id, // Identify the bot that is sending the message
                  "Don't be late... or somebody gonna get-a-hurt real bad!", // Construct the message
                  {}, // No pictures related to this post
                  function(err,res) {
                      if (err) {
                          console.log("[API.Bots.post] Reply Message Error!");
                      } else {
                          console.log("[API.Bots.post] Reply Message Sent!");
                      }
                  });
            }

            /************************************************************************
             * Bollywood API stuff
             ***********************************************************************/
            else if(txt.search("ThatBrown review") != -1) {
              var private_key = 'cfd2d4b1e7bee9ff103656af5e49b03c';
              var dev_id = '5a9b85fd';
              var album_id = txt.replace("ThatBrown review ", "");
              var hmac = crypto.createHmac('sha256', private_key);
              var digest = hmac.digest('base64');

              console.dir("hmac: " + digest);

              var url = "http://www.bollywoodapi.com/v1/search/albums/" + album_id + "?DeveloperID=" + dev_id + "&Version=1.0";
              console.dir("URL: " + url);

              var Request = unirest.get(url)
                .headers(digest)
                .end(function (response) {
                  console.dir(response.body);

                  API.Bots.post(
                      ACCESS_TOKEN, // Identify the access token
                      bot_id, // Identify the bot that is sending the message
                      response.body, // Construct the message
                      {}, // No pictures related to this post
                      function(err,res) {
                          if (err) {
                              console.log("[API.Bots.post] Reply Message Error!");
                          } else {
                              console.log("[API.Bots.post] Reply Message Sent!");
                          }
                      });
                });
            }

            /************************************************************************
             * Bro Speak
             ***********************************************************************/
            else {
              var url = "http://brospeak.com/?api=yeah&input=" + txt;
              var Request = unirest.get(url)
                .end(function (response) {
                  console.dir("Text: " + txt + "\nBroSpeak: " + response.body);

                  API.Bots.post(
                      ACCESS_TOKEN, // Identify the access token
                      bot_id, // Identify the bot that is sending the message
                      response.body, // Construct the message
                      {}, // No pictures related to this post
                      function(err,res) {
                          if (err) {
                              console.log("[API.Bots.post] Reply Message Error!");
                          } else {
                              console.log("[API.Bots.post] Reply Message Sent!");
                          }
                      });
                });
            }
        }
    }

});

// This listens for the bot to disconnect
incoming.on('disconnected', function() {
    console.log("[IncomingStream 'disconnect']");
    if (retryCount > 3) {
        retryCount = retryCount - 1;
        incoming.connect();    
    }
})

// This listens for an error to occur on the Websockets IncomingStream.
incoming.on('error', function() {
    var args = Array.prototype.slice.call(arguments);
    console.log("[IncomingStream 'error']", args);
    if (retryCount > 3) {
        retryCount = retryCount - 1;
        incoming.connect();    
    }
})


// This starts the connection process for the IncomingStream
incoming.connect();