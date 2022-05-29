//paczki
//Baza danych mongoDB
const mongoose = require("mongoose")       //taka baza
mongoose.connect("mongodb://localhost:27017/WaterDB", { useNewUrlParser: true })

const express = require("express")
const bodyParser = require("body-parser")
const request = require("request")
const https = require("https")
const { options } = require("request")
const { response } = require("express")
//Embeded Java Script - funkcje z dynamicznym HTMLem
const ejs = require('ejs');
const { strict } = require("assert")
const { off } = require("process")
const { redirect, render } = require("express/lib/response")

const app = express()
const portNumber = 3000

app.set('view engine', 'ejs');
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
var allWaterInstances = []
var currentUser = ''
var msgColor = 'black'
var mainPageWaterInstances = []

const waterSchema = new mongoose.Schema({
    name: String,
    type: String,
    imgUrl: String,
    rating: {
        IT: Number,
        TA8H: Number,
        BQ: Number,
        BD: Number
    },
    owner: String
    //coś w sytlu "mail dodającego - poźniej pola wody będą dopasowywane ze wspólnej kolekcji urzytkownikom po ich mailu"
})
const Water = mongoose.model("wc1", waterSchema)

const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String
})
const User = mongoose.model("uc1", userSchema)

const reviewSchema = new mongoose.Schema({
    gradedWaterId: String,
    grader: String,
    opinion: String,
    rating: {
        IT: Number,
        TA8H: Number,
        BQ: Number,
        BD: Number
    }
})
const Review = mongoose.model("rc1", reviewSchema)

app.post("/addInstance", (req, res) => {
    console.log(req.body);
    //create object of that class
    const WaterInstanceInDB = new Water({
        name: req.body.newWaterInstanceName,
        type: req.body.newWaterInstanceType,
        imgUrl: req.body.imgUrl,
        rating: {
            IT: req.body.IT,
            TA8H: req.body.TA8H,
            BQ: req.body.BQ,
            BD: req.body.BD
        },
        owner: currentUser
    })
    allWaterInstances.push(WaterInstanceInDB)
    WaterInstanceInDB.save();// umieść w podanej kolekcji
    res.redirect("/adder") //przekieruj do app.get - tam kod kieruje się kiedy urzytkownik prosi o stronę
})

app.post("/putInstanceOnMainPage", (req, res) => {
    console.log(req.body);
    Water.updateOne({ "_id": req.body.instance_id }, { owner: 'none' }, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log('powodzenie, doszło do zmiany ownera dla ' + req.body.instance_id);
            // render("/mainPage")
            res.redirect("/")//to jest zle
        }
    })
})

app.post("/addReview", (req, res) => {
    console.log(req.body);
    const ReviewInDB = new Review({
        gradedWaterId: req.body._id,
        grader: currentUser,
        opinion: req.body.writtenOpinion,
        rating: {
            IT: req.body.IT,
            TA8H: req.body.TA8H,
            BQ: req.body.BQ,
            BD: req.body.BD
        },
    })
    ReviewInDB.save()
    res.redirect("/")
})

app.post("/viewReviews", (req, res) => {

    var waterNameInReview
    var waterTypeInReview
    var waterImgInReview

    Water.findOne({ "_id": req.body.instance_id }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            waterNameInReview = foundItem.name
            waterTypeInReview = foundItem.type
            waterImgInReview = foundItem.imgUrl
        }
    })

    Review.find({ "gradedWaterId": req.body.instance_id }, (err, foundItems) => {
        if (err) {
            console.log(err);
        } else {
            res.render("main", {
                waterNameInReview: waterNameInReview,
                waterTypeInReview: waterTypeInReview,
                waterImgInReview: waterImgInReview,
                usageMode: 'revievView',
                currentUser: currentUser,
                iterationNumber: foundItems.length,
                allWaterInstancesM: foundItems,//for further clarification it's not water but reviews of water
                msgColor: msgColor,
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

    Water.find({ "owner": currentUser }, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            allWaterInstances = foundItems
            //wczytaj do lokalnego arraya pozycje z kolekcji wody wc1 oznaczonej jako model Water
        }
    })
    res.redirect("/adder")
})

app.post("/resetAdder", (req, res) => {
    //każda ma 5 lub mniej, czyli delete all
    //później trzba będzie dodać waruenk tego kto jest właścicielem
    Water.deleteMany({ "owner": currentUser }, function (err) {
        if (err) {
            console.log(err);
        } else {
            allWaterInstances = []
        }
    })

    res.redirect("/adder")
})

app.post("/signUpAttempt", (req, res) => {

    //when someone tries to create an account with a taken name it should turn back error taken name
    User.findOne({ "username": req.body.username }, function (err, foundItem) {
        if (err) {
            console.log(err);
        } else {
            if (foundItem !== null) {//if already exists
                res.sendFile(__dirname + "/public/html/signUpFail.html")
            } else {
                //create object of that class
                const UserInstanceInDB = new User({
                    email: req.body.email,
                    username: req.body.username,
                    password: req.body.password
                })
                UserInstanceInDB.save();// and save it in database
                res.sendFile(__dirname + "/public/html/signUpSucces.html")
            }
        }
    })
})

app.post("/logInAttempt", (req, res) => {

    User.findOne({ "username": req.body.username }, function (err, foundItem) {
        var myResponse = 'ok'
        if (err) {
            console.log(err);
        } else {
            if (foundItem !== null) {
                if (foundItem.password === req.body.password) {
                    currentUser = foundItem.username
                    myResponse = currentUser
                    allWaterInstances = []
                    msgColor = 'black'
                } else {
                    msgColor = 'red'
                    myResponse = 'Invalid password'
                }
            } else {
                msgColor = 'red'
                myResponse = 'There is no such user'
            }
        }

        res.render("logIn", {
            currentUser: myResponse,
            msgColor: msgColor
        })
    })
})

app.post("/giveOpinion", (req, res) => {
    //so we'd need to redirect o adder, with below contents sent
    //in some way so that this instance will be ranked
    Water.findOne({ "_id": req.body.instance_id }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            res.render("main", {//tak na prawdę do addera, ale tak jest łatwiej
                instance_id: req.body.instance_id,
                defaultNameValue: foundItem.name,
                defaultTypeValue: foundItem.type,
                defaultImgValue: foundItem.imgUrl,
                currentUser: currentUser,
                msgColor: 'black',
                iterationNumber: 0,
                usageMode: 'review'
            })
        }
    })
})

//tu się zaczyna po wejściu na stronę (działa dobrze ale trzeba przeładować - bo najpierw renderuje a potem dodaje)
app.get("/", (req, res) => {
    //belonging to main page is dictated by ovner if is none - then it is on main page
    Water.find({ "owner": 'none' }, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            mainPageWaterInstances = foundItems//przypisz odpowiednie do strony głównej

            res.render("mainPage", { //wypisz te specjalne z userem none na strone główną
                currentUser: currentUser,
                iterationNumber: mainPageWaterInstances.length,
                allWaterInstancesM: mainPageWaterInstances,
                msgColor: msgColor
            })
        }
    })
})
//to obsługuje pozostałe
app.get("/mainPage", (req, res) => {
    res.redirect("/")
})
app.get("/logIn", (req, res) => {
    res.render("logIn", {
        currentUser: currentUser,
        msgColor: msgColor
    })
})
app.get("/signUp", (req, res) => {
    res.render("signUp")
})
app.get("/adder", (req, res) => {//trzeba zreloadować baze
    Water.find({ "owner": currentUser }, function (err, foundItems) {
        if (err) {
            console.log(err);
        } else {
            allWaterInstances = foundItems
            //wczytaj do lokalnego arraya pozycje z kolekcji wody wc1 oznaczonej jako model Water
        }
    })
    msgColor = 'black'
    res.render("main", {
        defaultNameValue: '',
        defaultTypeValue: '',
        defaultImgValue: '../images/Puste.png',
        currentUser: currentUser,
        iterationNumber: allWaterInstances.length,
        allWaterInstancesM: allWaterInstances,
        msgColor: msgColor,
        usageMode: 'adder'
    })
})

app.listen(process.env.PORT || portNumber, () => {
    console.log("Server is running on port: " + portNumber + " or Heroku.");
})
