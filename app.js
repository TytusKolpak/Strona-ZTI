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
    }
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
            SPOB: req.body.SPOB,
            SP8H: req.body.SP8H,
            JB: req.body.JB,
            DB: req.body.DB
        }
    })
    allWaterInstances.push(WaterInstanceInDB)
    WaterInstanceInDB.save();// umieść w podanej kolekcji
    res.redirect("/adder") //przekieruj do app.get - tam kod kieruje się kiedy urzytkownik prosi o stronę
})

app.post("/resetAdder", (req, res) => {
    Water.deleteMany({ "rating.SPOB": { $lte: 5 } }, function (err) {//każda ma 5 lub mniej, czyli delete all
        if (err) {
            console.log(err);
        } else {
            allWaterInstances = []
            console.log("Deleted all");
        }
    })
    res.redirect("/adder")
})

app.post("/signUpSucces", (req, res) => {
    const inputEmail = req.body.email
    const inputUsername = req.body.username
    const inputPassword = req.body.password
    console.log(inputEmail+" "+inputUsername+" "+inputPassword);
    //ale zanim to to jeszcze input tych danych do pliku
    res.sendFile(__dirname+"/public/html/sighUpSucces.html")
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
    res.render("logIn")
})
app.get("/signUp", (req, res) => {
    res.render("signUp")
})
app.get("/adder", (req, res) => {
    res.render("main", {
        iterationNumber: allWaterInstances.length,
        allWaterInstancesM: allWaterInstances
    })
})

app.listen(process.env.PORT || portNumber, () => {
    console.log("Server is running on port: " + portNumber + " or Heroku.");
})
