//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//***md5 */
// const md5 = require("md5");
// const encrypt = require('mongoose-encryption');

//****bcrypt */
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

//**Set up Session */
app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

//**Initialized passport & session */
app.use(passport.initialize());
app.use(passport.session());

//LOCALHOST
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true });

//(2) Create Database SChema
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

//**Passport Mongoose Setting. Perform hash * salt function before save to database*/
userSchema.plugin(passportLocalMongoose);

// const secret = process.env.SECRET;
//Need to create this before creating database model
//Encrypt the password field
// userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

//(3) Create database model
const User = mongoose.model("User", userSchema);

//**Create serialize and deserialize cookies session */
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    // if (req.isAuthenticated()) {
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
    //Find secret fields from all the users that are not empty
    User.find({ "secret": { $ne: null } }, function (err, foundUsers) {
        if (err) {
            console.log(err);
        } else {
            if (foundUsers) {
                //pass the found user's secret
                res.render("secrets", { usersWithSecrets: foundUsers });
            }
        }
    });
});

app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.post("/submit", function (req, res) {
    const submittedSecret = req.body.secret;

    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = submittedSecret;
                foundUser.save(function () {
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout", function (req, res) {
    req.logout(function (err) {
        if (!err) {
            res.redirect("/");
        }
    });
});

// //***THIS IS USING HASH + SALT AUTHENTICATION */
// app.post("/register", function (req, res) {

//     bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
//         const userContent = new User({
//             email: req.body.username,
//             //**md5 */
//             //password: md5(req.body.password)
//             password: hash
//         });
//         userContent.save(function (err) {
//             if (!err) {
//                 res.render("secrets");
//             } else {
//                 res.render(err);
//             }
//         });
//     });
// });

//***THIS IS USING PASSPORT.JS */
app.post("/register", function (req, res) {
    //the register comes from passport package
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});

//***THIS IS USING HASH + SALT AUTHENTICATION */
// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     //**md5**/
//     //const password = md5(req.body.password);
//     const password = req.body.password;

//     User.findOne({ email: username }, function (err, foundUser) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUser) {
//                 //****md5****
//                 // if (foundUser.password === password) {
//                 //     res.render("secrets");
//                 // }
//                 // else {
//                 //     console.log("user not found");
//                 // }
//                 bcrypt.compare(password, foundUser.password, function (err, result) {
//                     if (result === true) {
//                         res.render("secrets");
//                     }
//                     else {
//                         console.log("wrong password");
//                     }
//                 });
//             }
//         }
//     });
// });



//**THIS IS USING PASSPORT.JS */
app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    })
});

app.listen(3000, function () {
    console.log("Server started on port 3000");
});