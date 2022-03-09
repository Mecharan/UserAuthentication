require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { userInfo } = require("os");
const req = require("express/lib/request");
const bcrypt = require("bcrypt");
const saltRounds = 12;


const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
})



const User = mongoose.model("User", userSchema);


app.listen(3000, function(){
    console.log("Server started and running at port 3000");
})

app.get("/",function(req,res){
    res.render("home");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})


app.post("/register", function(req,res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email : req.body.username,
            password : hash
        })
        newUser.save(function(err){
            if(err)
                console.log(err);
            else
                res.render("secrets");
        })
    });
    
})

app.post("/login", function(req,res){
    User.findOne({email : req.body.username}, function(err,foundUser){
        if(err)
            console.log(err);
        else if(foundUser)
        {
            bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
                if(result)
                    res.render("secrets");
            });
            
        }
    })
})

// try nvm for node version management
