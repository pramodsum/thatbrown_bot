var express = require("express"),
  logfmt = require("logfmt"),
  request = require('request'),
  util = require('util'),
  unirest = require('unirest'),
  crypto = require('crypto'),
  http = require("http"),
  request = require("request"),
  app = express();

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
 * Russell Peters Quotes
 ***********************************************************************/

var rp_quotes = [ 
    "Just for the record my Arab friends, i dont do any Arab jokes in my act. Its not that i dont think you are funny. It's just .. I dont know, i dont wanna..... die?", 
    "Indian people, we are proud of our cheapness. You are never gonna insult us by calling us cheap. Thats the best part, you know. You walk up to an Indian guy \"You guys are cheap\" .. \"Thank you for noticing, thank you. Thank you very much. Thank you\" \"That guy just called you cheap\" \"No, no, no. He pronounced it cheap. But what he was saying was - smart. Very smart he was\".",
    "Our cheapness changed the world. Indians are so dedicated to being so cheap for so long, that Indian people actually created the number zero. You know how much dedication that took? That means, back in the day some Indian guy was looking at the numeric system. \"*indian accent* 1 2 3 4 5 6 7 8 9.. Hmmm.. None of those are the amounts I want to pay\". Then his friend came along and drew a circle. \"Whats that?\" \"Nothing\" \"Whats inside of it?\" \"Nothing\" \"Whats its value?\" \"Nothing... *Sniff* Its beautiful (shedding a tear). We shall call it (jeero)zero. Take it and go\".",
    "TOO good.. TOOOOO good. First Class. A1. Fantastic. Mind blasting\".\"You mean mind blowing\".\"No, no anything can blow your mind, it BLASTED my mind\"",
    "Just for funnnnnn",
    "Somebody gonna get-a-hurt real bad!",
];

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

// Utility function that downloads a URL and invokes
// callback with the data.
function download(url, callback) {
  http.get(url, function(res) {
    var data = "";
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on("end", function() {
      callback(data);
    });
  }).on("error", function() {
    callback(null);
  });
}

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
             * Russell Peters
             ***********************************************************************/
            else if(txt.search("Russel Peters") != -1 || txt.search("russel peters") != -1 || txt.search("Russel peters") != -1 || txt.search("Russell Peters") != -1 || txt.search("russell peters") != -1 || txt.search("Russell peters") != -1) {
              var message = rp_quotes[Math.floor(Math.random() * rp_quotes.length)];
              API.Bots.post(
                  ACCESS_TOKEN, // Identify the access token
                  bot_id, // Identify the bot that is sending the message
                  message, // Construct the message
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

            else if(txt.search("next bus") != -1) {
              var url = "http://mbus.pts.umich.edu/text/index.php?&route=Bursley-Baits#Bursley-Baits"

              // var Request = unirest.get("https://scrapeit.p.mashape.com/scrape/" + url)
              //   .headers({ 
              //     "X-Mashape-Authorization": "iR2g3eyxXH6tK1tZELkkVJikSMeafCWC"
              //   })
              //   .end(function (response) {
              //     console.log(response);
              // });
               
              request({
                uri: url,
              }, function(error, response, body) {
                console.log("BODY: \n" + body);
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