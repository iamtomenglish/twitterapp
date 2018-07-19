'use strict'
// Dependencies =========================
const Twit = require('twit')
const ura = require('unique-random-array')
const config = require('./config')
const strings = require('./helpers/strings')
const sentiment = require('./helpers/sentiment')

const Twitter = new Twit({
  consumer_key: config.twitter.consumerKey,
  consumer_secret: config.twitter.consumerSecret,
  access_token: config.twitter.accessToken,
  access_token_secret: config.twitter.accessTokenSecret
})

// Frequency
const retweetFrequency = config.twitter.retweet
const favoriteFrequency = config.twitter.favorite
//  username
const username = config.twitter.username

// RANDOM QUERY STRING  =========================

let qs = ura(strings.queryString)
let qsSq = ura(strings.queryStringSubQuery)
let rt = ura(strings.resultType)

// https://dev.twitter.com/rest/reference/get/search/tweets
// A UTF-8, URL-encoded search query of 500 characters maximum, including operators.
// Queries may additionally be limited by complexity.

// RETWEET BOT ==========================

// find latest tweet according the query 'q' in params

// result_type: options, mixed, recent, popular
// * mixed : Include both popular and real time results in the response.
// * recent : return only the most recent results in the response
// * popular : return only the most popular results in the response.

let retweet = function () {
  var paramQS = qs()
  paramQS += qsSq()
  var paramRT = rt()
  var params = {
    q: paramQS + paramBls(),
    result_type: paramRT,
    lang: 'en'
  }

  Twitter.get('search/tweets', params, function (err, data) {
    if (!err) { // if there no errors
      try {
        // grab ID of tweet to retweet
        // run sentiment check ==========
        var retweetId = data.statuses[0].id_str
        var retweetText = data.statuses[0].text

        // setup http call
        var httpCall = sentiment.init()

        httpCall.send('txt=' + retweetText).end(function (result) {
          var sentim = result.body.result.sentiment
          var confidence = parseFloat(result.body.result.confidence)
          console.log(confidence, sentim)
          // if sentiment is Negative and the confidence is above 75%
          //if (sentim === 'Negative' && confidence >= 75) {
            //console.log('RETWEET NEG NEG NEG', sentim, retweetText)
            //return
          //}
        })
      } catch (e) {
        console.log('retweetId DERP!', e.message, 'Query String:', paramQS)
        return
      }
            // Tell TWITTER to retweet
      Twitter.post('statuses/retweet/:id', {
        id: retweetId
      }, function (err, response) {
        if (response) {
          console.log('RETWEETED!', ' Query String:', paramQS)
        }
                // if there was an error while tweeting
        if (err) {
          console.log('RETWEET ERROR! Duplication maybe...:', err, 'Query String:', paramQS)
        }
      })
    } else { console.log('Something went wrong while SEARCHING...') }
  })
}

// retweet on bot start
retweet()
// retweet in every x minutes
setInterval(retweet, 1000 * 60 * retweetFrequency)

// STREAM API for interacting with a USER =======
// set up a user stream
var stream = Twitter.stream('user')

// REPLY-FOLLOW BOT ============================

// what to do when someone follows you?
stream.on('follow', followed)

// ...trigger the callback
function followed (event) {
  console.log('Follow Event now RUNNING')
        // get USER's twitter handle (screen name)
  var screenName = event.source.screen_name


// function definition to tweet back to USER who followed
function tweetNow (tweetTxt) {
  var tweet = {
    status: tweetTxt
  }

  const screenName = tweetTxt.search(username)

  if (screenName !== -1) {
    console.log('TWEET SELF! Skipped!!')
  } else {
    Twitter.post('statuses/update', tweet, function (err, data, response) {
      if (err) {
        console.log('Cannot Reply to Follower. ERROR!: ' + err)
      } else {
        console.log('Reply to follower. SUCCESS!')
      }
    })
  }
}

// function to generate a random tweet tweet
function ranDom (arr) {
  var index = Math.floor(Math.random() * arr.length)
  return arr[index]
}

function paramBls () {
  var ret = ''
  var arr = strings.blockedStrings
  var i
  var n
  for (i = 0, n = arr.length; i < n; i++) {
    ret += ' -' + arr[i]
  }
  return ret
}
}