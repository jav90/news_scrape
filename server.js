var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var logger = require("morgan");
var cheerio = require("cheerio");
var axios = require("axios");
var db = require("./models");

var PORT = 3000;

var app = express();

//Configure middleware

app.use(logger("dev"));
//Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({extended:true, useNewUrlParser:true}));
//Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//Connect to the Mongo DB
mongoose.connect("mongodb://localhost/news_scrape");

//Routes
// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    axios.get("https://www.nintendolife.com").then(function(response){

        // Load the html body from request into cheerio
        const $ = cheerio.load(response.data);
        // For each element with a "info-wrap" class
        $(".info-wrap").each(function(i, element) {

            //console.log($(element).find(".description").text());

            let result = {};

            // Save the text and href of each link enclosed in the current element
            result.title = $(element).find("a").children(".title").text();
            result.link = $(element).find("p").children("a").attr("href");
            result.summary = $(element).find(".description").text();
            console.log(result);

            //result.title ="a";
            //result.link ="b";
            //result.summary = "c";

            db.Article.create(result)
                .then(function(dbArticle){
                    console.log(dbArticle)
                })
                .catch(function(err){
                    console.log(err);
                    //return res.json(err);
                });
        });
        // Send a "Scrape Complete" message to the browser
        res.send("Scrape Complete");
    });
});

app.get("/articles/:id", function(req, res){
    db.Article.findOne({_id: req.params.id})
        .populate("Comments")
        .then(function(dbArticle){
            res.json(dbArticle);
        })
        .catch(function(err){
            res.json(err);
        });
});

app.post("/articles/:id", function(req, res){
    db.Comments.create(req.body)
        .then(function(dbComments){
            return db.Article.findOneAndUpdate({_id: req.params.id}, {comments: dbComments._id}, {new: true});
        })
        .then(function(dbArticle){
            res.json(dbArticle);
        })
        .catch(function(err){
            res.json(err);
        });
});

app.listen(PORT, function(){
    console.log("App running on port " + PORT + "!");
});

