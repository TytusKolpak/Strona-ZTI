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

const app = express()
const portNumber = 3000

app.set('view engine', 'ejs');
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))
var allWaterInstances = []
var currentUser = ' '
var msgColor = 'black'

//create a blueprint for objects - a schema
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
//create Class   in     chosen collection
const Water = mongoose.model("wc1", waterSchema)

//create a blueprint for objects - a schema
const userSchema = new mongoose.Schema({
    email: String,
    username: String,
    password: String
})
//create Class   in     chosen collection
const User = mongoose.model("uc1", userSchema)

app.post("/add", (req, res) => {
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

app.post("/showInstances", (req, res) => {
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

//tu się zaczyna po wejściu na stronę
app.get("/", (req, res) => {
    res.render("mainPage")
})
//to obsługuje pozostałe
app.get("/mainPage", (req, res) => {
    res.render("mainPage")
})
app.get("/contact", (req, res) => {
    res.render("contact")
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
app.get("/adder", (req, res) => {
    msgColor = 'black'
    res.render("main", {
        currentUser: currentUser,
        iterationNumber: allWaterInstances.length,
        allWaterInstancesM: allWaterInstances,
        msgColor: msgColor
    })
})

app.listen(process.env.PORT || portNumber, () => {
    console.log("Server is running on port: " + portNumber + " or Heroku.");
})
