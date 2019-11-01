// Dependencies ===========================================
// Express
const express = require("express");
// Handlebars
const exphbs = require("express-handlebars");
// Mongoose
const mongoose = require("mongoose");
// Axios
const axios = require("axios");
// Cheerio
const cheerio = require("cheerio");


// Initialize Express
const app = express();
app.use(express.static('public'));
// Port
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Require all models
const db = require("./models");
// Use handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
// Make public a static folder

// If deployed, use the deployed database. Otherwise use the local database
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/allthenews";
// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Routes =================================================
// home
app.get("/", function (req, res) {
    db.Article.find({ saved: false }).then(function (articles) {
        res.render("index", { articles: articles });
    });
});
// saved
app.get("/saved", function (req, res) {
    db.Article.find({ saved: true }).then(function (articles) {
        res.render("index", { articles: articles });
    });
});
// scrape
app.get("/scrape", function (req, res) {
    axios.get("http://old.reddit.com/r/webdev/").then(function (response) {
        const $ = cheerio.load(response.data);

        $("a.title").each(function (i, element) {
            const entry = {
                title: $(this).text(),
                link: $(this).attr("href")
            }

            db.Article.create(entry)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });

        res.redirect('/');
    });
});
app.get("/api/clear", function (req, res) {
    db.Article.deleteMany({ saved: false }).then(function (articles) {
        res.render("index", { articles: articles });
    });
});

app.put("/api/article/:id", function (req, res) {
    console.log("data:", req.body.saved);
    db.Article.update(
        { _id: req.params.id },
        { $set: { saved: req.body.saved } },
        function (error, saved) {
            if (error) {
                console.log(error);
                return res.send(error);
            }
            console.log(saved);
            res.send(saved);
        }
    );
});

app.delete("/api/articles/:id", function (req, res) {
    db.Article.deleteOne({ _id: req.params.id }).then(function (results) {
        res.json(results);
    });
});

app.get("/api/notes/:id", function (req, res) {
    db.Article.find({ _id: req.params.id }).then(function (note) {
        res.json(note);
    });
});

app.post("/api/notes/", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.body._articleId }, { $push: { note: dbNote._id } }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.delete("/api/notes/:id", function (req, res) {
    db.Note.deleteOne({ _id: req.params.id }).then(function (results) {
        res.json(results);
    });
});


// Listen on port 3000
app.listen(PORT, function () {
    console.log("App running on port: " + PORT);
});
