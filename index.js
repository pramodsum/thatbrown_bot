var express = require("express");
var logfmt = require("logfmt");
var request = require('request');
var util = require('util');
var unirest = require('unirest');
var crypto    = require('crypto');
var app = express();

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
        /*&& msg["data"]["subject"]["text"].indexOf(BOT_NAME) >= 0*/) {

        if (bot_id /*&& msg["data"]["subject"]["name"] != BOT_NAME*/) {
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
            // else if(txt.search("ThatBrown review") != -1) {
            //   var private_key = 'cfd2d4b1e7bee9ff103656af5e49b03c';
            //   var dev_id = '5a9b85fd';
            //   var album_id = txt.replace("ThatBrown review ", "");
            //   var hmac = crypto.createHmac('sha256', private_key);
            //   var digest = hmac.digest('base64');

            //   console.dir("hmac: " + digest);

            //   var url = "http://www.bollywoodapi.com/v1/search/albums/" + album_id + "?DeveloperID=" + dev_id + "&Version=1.0";
            //   console.dir("URL: " + url);

            //   var Request = unirest.get(url)
            //     .headers({ 
            //       'Accept': 'application/json',

            //     })
            //     .end(function (response) {
            //       console.dir(response.body);

            //       API.Bots.post(
            //           ACCESS_TOKEN, // Identify the access token
            //           bot_id, // Identify the bot that is sending the message
            //           response.body, // Construct the message
            //           {}, // No pictures related to this post
            //           function(err,res) {
            //               if (err) {
            //                   console.log("[API.Bots.post] Reply Message Error!");
            //               } else {
            //                   console.log("[API.Bots.post] Reply Message Sent!");
            //               }
            //           });
            //     });
            // }
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