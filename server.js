var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = 3000;

var app = express();

//Configure middleware

//Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({extended:true}));
//Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//Connect to the Mongo DB
mongoose.connect("mongodb://localhost/news_scrape");

//Routes
// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    // Make a request for the news section of `ycombinator`
    request("https://www.nintendolife.com", function(error, response, html) {
        // Load the html body from request into cheerio
        var $ = cheerio.load(html);
        // For each element with a "info-wrap" class
        $(".info-wrap").each(function(i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).children(".title").text();
            var link = $(element).children("a").attr("href");
            var summary = $(element).children(".description").text();

            // If this found element had both a title and a link
            if (title && link) {
                // Insert the data in the scrapedData db
                db.scrapedData.insert({
                        title: title,
                        link: link,
                        summary: summary
                    },
                    function(err, inserted) {
                        if (err) {
                            // Log the error if one is encountered during the query
                            console.log(err);
                        }
                        else {
                            // Otherwise, log the inserted data
                            console.log(inserted);
                        }
                    });
            }
        });
    });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
});

app.listen(PORT, function(){
    console.log("App running on port " + PORT + "!");
});

