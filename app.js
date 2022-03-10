require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { userInfo } = require("os");
const req = require("express/lib/request");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const { serializeUser } = require('passport/lib');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(bodyParser.urlencoded({extended : true}));
app.set("view engine","ejs");
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    facebookId : String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);


passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      //console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.listen(3000, function(){
    console.log("Server started and running at port 3000");
})

app.get("/",function(req,res){
    res.render("home");
})

app.get('/auth/google', 
  passport.authenticate('google', {
    scope: ['profile']
  })
);

app.get('/auth/google/secrets', 
    passport.authenticate("google", { failureRedirect: '/login' }),
    function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
});

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/submit", function(req,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }
    else
    {
        res.redirect("/login");
    }
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/logout", function(req,res){
    req.logout();
    res.redirect("/");
})

app.get("/secrets", function(req,res){
    
    User.find({secret:{$ne: null}}, function(err,foundUsers){
        if(!foundUsers)
        {
            res.send("No secrets");
        }
        else
        {
            res.render("secrets",{UsersWithSecret: foundUsers})
        }
    })
        
})


app.post("/register", function(req,res){

    User.register({username : req.body.username}, req.body.password, function(err,user){
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
    
})

app.post("/login", function(req,res){
    const user = new User({
        email : req.body.username,
        password : req.body.password
    })

    req.login(user, function(err){
        if(err)
        {
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.post("/submit", function(req,res){
    //console.log(req.user);

    User.findById(req.user.id, function(err,foundUser){
        if(err)
        {
            console.log(err);
        }
        else{
            foundUser.secret=req.body.secret;
            foundUser.save();
            res.redirect("/secrets");
        }
    })
})

