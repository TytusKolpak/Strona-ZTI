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
        SPOB: Number,
        SP8H: Number,
        JB: Number,
        DB: Number
    }
})
//create Class   in     chosen collection
const Water = mongoose.model("wc1", waterSchema)

app.post("/adder", (req, res) => {
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
    res.redirect("/dodawanie.html") //przekieruj do app.get - tam kod kieruje się kiedy urzytkownik prosi o stronę
})

app.post("/resetAdder", (req, res) => {
    Water.deleteMany({"rating.SPOB" :{$lte:5}}, function(err){//każda ma 5 lub mniej, czyli delete all
        if (err) {
            console.log(err);
        } else {
            allWaterInstances=[]
            console.log("Deleted all");
        }
    })
    res.redirect("/dodawanie.html")
})


//tu się zaczyna po wejściu na stronę
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html")
})

//to obsługuje pozostałe
app.get("/index.html", (req, res) => {
    res.sendFile(__dirname + "/public/html/index.html")
})
app.get("/kontakt.html", (req, res) => {
    res.sendFile(__dirname + "/public/html//kontakt.html")
})
app.get("/logowanie.html", (req, res) => {
    res.sendFile(__dirname + "/public/html/logowanie.html")
})
app.get("/rejestracja.html", (req, res) => {
    res.sendFile(__dirname + "/public/html/rejestracja.html")
})
app.get("/dodawanie.html", (req, res) => {
    res.render("main", {
        iterationNumber: allWaterInstances.length,
        allWaterInstancesM: allWaterInstances
    })
})


app.post("/rejestracja.html", (req, res) => {
    const inputEmail = req.body.email
    const inputUsername = req.body.username
    const inputPassword = req.body.password;

    console.log("User's input Email   : " + inputEmail + ",")
    console.log("User's input Username: " + inputUsername + ",")
    console.log("User's input Password: " + inputPassword + ",")


    const data = {
        members: [
            {
                email_address: inputEmail,
                status: "subscribed",
                merge_fields: {
                    FNAME: inputUsername,
                    PHONE: inputPassword
                }
            }
        ]
    }

    const jsonData = JSON.stringify(data)
    const url = "https://us14.api.mailchimp.com/3.0/lists/c57d0e69d2"

    const options = {
        method: "POST",
        auth: "tytus1:39ea43e005ddc02bc7ff0bbef797a66a-us14",
    }

    const request = https.request(url, options, (response) => {

        if (response.statusCode === 200) {
            res.sendFile(__dirname + "/public/html/powodzenieRej.html")
        } else {
            res.sendFile(__dirname + "/public/html/niePowodzenieRej.html")
        }


        res.on("data", (data) => {
            console.log(JSON.parse(data));
        })
    })

    request.write(jsonData)
    request.end()
})

app.post("/niePowodzenieRej", (req, res) => {
    res.redirect("/")
})

app.listen(process.env.PORT || portNumber, () => {
    console.log("Server is running on port: " + portNumber + " or Heroku.");
})

//API key for mail monkey
//39ea43e005ddc02bc7ff0bbef797a66a-us14
//unique audience c57d0e69d2
//1. git add.
//2. git commit -m "któryś commit"
//3, git push heroku master