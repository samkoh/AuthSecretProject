//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//LOCALHOST
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });

//(2) Create Database SChema
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;
//Need to create this before creating database model
//Encrypt the password field
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

//(3) Create database model
const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    const userContent = new User({
        email: req.body.username,
        password: req.body.password
    });
    userContent.save(function (err) {
        if (!err) {
            res.render("secrets");
        } else {
            res.render(err);
        }
    });
});

app.post("/login", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
                else {
                    console.log("user not found");
                }
            }
        }
    });
});


app.listen(3000, function () {
    console.log("Server started on port 3000");
});