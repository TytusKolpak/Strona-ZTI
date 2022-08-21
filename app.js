// separate adder from revievs and find out how to log out current user


//important for this config to be as early as posible
require('dotenv').config()
//paczki
//Baza danych mongoDB
const mongoose = require("mongoose")       //taka baza
//mongoose.connect("mongodb://localhost:27017/WaterDB", { useNewUrlParser: true })
//mongoose.connect('mongodb+srv://Tytus:767944370123@cluster0.nkwrl.mongodb.net/WaterDB')

const express = require("express")
const bodyParser = require("body-parser")
const request = require("request")
const http = require("http")
const { options } = require("request")
const { response } = require("express")
const ejs = require('ejs');
const { strict } = require("assert")
const { off } = require("process")
const { redirect, render } = require("express/lib/response")
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const { LOADIPHLPAPI } = require('dns')

const app = express()
const portNumber = 3000

app.set('view engine', 'ejs');
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

//used?
app.use(session({
    secret: "ff",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb+srv://" + process.env.MONGO_USER + ":" + process.env.MONGO_PASSWORD + "@" + process.env.MONGO_CLUSTER + "/" + process.env.MONGO_DB, { useNewUrlParser: true })

var allWaterInstances = []
var loggedUser = ""
var mainPageWaterInstances = []
var darkModeEnabled = false


const waterSchema = new mongoose.Schema({
    name: String,
    type: String,
    imgUrl: String,
    rating: {
        IT: Number, //initial taste
        TA8H: Number, //taster after 8h
        BQ: Number, //bottle quality
        BD: Number, //bottle design
        MC: Number, //mineral contert
        P: Number, //price
        A: Number, //availability
    },
    owner: String,
    onMainPage: Boolean
    //coś w sytlu "mail dodającego - poźniej pola wody będą dopasowywane ze wspólnej kolekcji urzytkownikom po ich mailu"
})
const Water = mongoose.model("wc1", waterSchema)

const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String
})

userSchema.plugin(passportLocalMongoose)

const User = mongoose.model("uc1", userSchema)

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const reviewSchema = new mongoose.Schema({
    gradedWaterId: String,
    grader: String,
    opinion: String,
    rating: {
        IT: Number,
        TA8H: Number,
        BQ: Number,
        BD: Number,
        MC: Number,
        P: Number,
        A: Number,
    }
})
const Review = mongoose.model("rc1", reviewSchema)

app.post("/addInstance", (req, res) => {
    //create object of that class
    if (req.body.newWaterInstanceName === "" || req.body.newWaterInstanceType === "" || req.body.imgUrl === "") {
        res.sendFile(__dirname + "/public/html/additionFail.html")
    } else {
        const WaterInstanceInDB = new Water({
            name: req.body.newWaterInstanceName,
            type: req.body.newWaterInstanceType,
            imgUrl: req.body.imgUrl,
            rating: {
                IT: req.body.IT,
                TA8H: req.body.TA8H,
                BQ: req.body.BQ,
                BD: req.body.BD,
                MC: req.body.MC,
                P: req.body.P,
                A: req.body.A
            },
            owner: loggedUser
        })

        console.log("Added: " + WaterInstanceInDB);
        allWaterInstances.push(WaterInstanceInDB)
        WaterInstanceInDB.save();// umieść w podanej kolekcji
        res.redirect("/adder") //przekieruj do app.get - tam kod kieruje się kiedy urzytkownik prosi o stronę
    }

})

app.post("/putInstanceOnMainPage", (req, res) => {
    Water.updateOne({ "_id": req.body.instance_id }, { onMainPage: true }, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    })
})

app.post("/takeInstanceFromMainPage", (req, res) => {
    Water.updateOne({ "_id": req.body.instance_id }, { onMainPage: false }, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/adder")
        }
    })
})

app.post("/addReview", (req, res) => {
    console.log(req.body);
    //absolutely no this way xd, you gots to send a guy to a place where he can grade those shits with sliders
    const ReviewInDB = new Review({
        gradedWaterId: req.body.instance_id,
        grader: loggedUser,
        opinion: req.body.writtenOpinion,
        rating: {
            IT: req.body.IT,
            TA8H: req.body.TA8H,
            BQ: req.body.BQ,
            BD: req.body.BD,
            MC: req.body.MC,
            P: req.body.P,
            A: req.body.A
        },
    })
    ReviewInDB.save()

    Water.findOne({ "_id": req.body.instance_id }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            Review.find({ "gradedWaterId": req.body.instance_id }, (err, foundItems) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render("reviewer", {
                        NameM: foundItem.name,
                        TypeM: foundItem.type,
                        ImageM: foundItem.imgUrl,
                        iterationNumber: foundItems.length,
                        allReviewInstancesM: foundItems,
                        loggedUserM: loggedUser,
                        instance_idM: foundItem._id,
                        darkModeEnabledM: darkModeEnabled,
                    })
                }
            })
        }
    })
})

app.post("/viewReviews", (req, res) => {
    Water.findOne({ "_id": req.body.instance_id }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            Review.find({ "gradedWaterId": req.body.instance_id }, (err, foundItems) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render("reviewer", {
                        NameM: foundItem.name,
                        TypeM: foundItem.type,
                        ImageM: foundItem.imgUrl,
                        iterationNumber: foundItems.length,
                        allReviewInstancesM: foundItems,
                        loggedUserM: loggedUser,
                        instance_idM: foundItem._id,
                        darkModeEnabledM: darkModeEnabled,
                    })
                }
            })
        }
    })
})

app.post("/showOrDeleteInstances", (req, res) => {
    //difference is such that no deletion occurs if there is no id specified -
    //which it isn't when just show my collection is clicked
    if (req.body.instance_id !== undefined) {
        Water.deleteOne({ "_id": req.body.instance_id }, (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Deleted: " + req.body.instance_id);
            }
        })
    } else {
        console.log('No id given, just showing all instances');
    }

    Water.find({ "owner": loggedUser }, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            allWaterInstances = foundItems
            //wczytaj do lokalnego arraya pozycje z kolekcji wody wc1 oznaczonej jako model Water
        }
    })
    res.redirect("/adder")
})

app.post("/signUpAttempt", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.sendFile(__dirname + "/public/html/signUpFail.html")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.sendFile(__dirname + "/public/html/signUpSucces.html")
            })
        }
    })
})

app.post("/logInAttempt", (req, res) => {

    if (loggedUser === "") {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        })
        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    loggedUser = req.body.username
                    res.redirect('/adder');
                    console.log("Logged user: \"" + loggedUser + "\"");
                })
            }
        })
    } else {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('/');
            loggedUser = ""
        });
    }

})

app.post("/giveOpinion", (req, res) => {
    //so we'd need to redirect o adder, with below contents sent
    //in some way so that this instance will be ranked
    Water.findOne({ "_id": req.body.instance_id }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            res.render("reviewer", {
                //instance_id: req.body.instance_id,
                NameM: foundItem.name,
                TypeM: foundItem.type,
                ImageM: foundItem.imgUrl,
                darkModeEnabledM: darkModeEnabled,
            })
        }
    })
})

app.post("/passwordRegeneration", (req,res) => {
    res.render("regenerate",{
        destinationEmail : req.body.email,
        darkModeEnabledM: darkModeEnabled,
    })
})

app.post("/dark", (req,res) =>{
    darkModeEnabled = !darkModeEnabled
    res.redirect("/mainPage")
})

app.get("/", (req, res) => {
    res.redirect("/mainPage")
})

app.get("/mainPage", (req, res) => {
    Water.find({ "onMainPage": true }, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            mainPageWaterInstances = foundItems
            res.render("mainPage", {
                allWaterInstancesM: mainPageWaterInstances,
                loggedUserM: loggedUser,
                darkModeEnabledM: darkModeEnabled,
            })
        }
    })
})

app.get("/logIn", (req, res) => {
    res.render("logIn", {
        loggedUserM: loggedUser,
        darkModeEnabledM: darkModeEnabled,
    })
})

app.get("/signUp", (req, res) => {
    res.render("signUp",{
        darkModeEnabledM: darkModeEnabled,
    })
})

app.get("/adder", (req, res) => {
    if (req.isAuthenticated() && loggedUser !== "") {
        //prepare by recolllecting all of the user's water instances
        Water.find({ "owner": loggedUser }, function (err, foundItems) {
            if (err) {
                console.log(err);
            } else {
                res.render("adder", {
                    loggedUserM: loggedUser,
                    allWaterInstancesM: foundItems,
                    darkModeEnabledM: darkModeEnabled,
                })
            }
        })
    } else {
        res.redirect("/logIn")
    }
})

app.listen(process.env.PORT || portNumber, () => {
    console.log("Server is running on port: " + portNumber + " or Heroku.");
})