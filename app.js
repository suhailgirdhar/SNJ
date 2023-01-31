const express = require('express');
const bodyparser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session")
const passport = require("passport");
const LocalStrategy = require("passport-local");

const app = express();

app.set("view engine", "ejs");
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
  secret: "secret",
  resave: false ,
  saveUninitialized: true
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/snjusersDB", function(err) {
  if(err) console.log("NOT CONNECTED TO MONGODB OR " + err);
  console.log("Connected to snjusersDB");
})

// ----------- SCHEMAS --------------

const orderSchema = new mongoose.Schema({
  name: String,
  address: String,
  orderProduct: String,
  productSize: String,
  productPrice: Number,
  quantity: Number,
  totalAmount: Number
})

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  orders: [orderSchema]
})

const subscribersSchema = new mongoose.Schema({
  email: String
})

// ------------- MODELS --------------

const snjuser = new mongoose.model("SNJUser", userSchema)

const Order = new mongoose.model("Order", orderSchema)

const Subscriber = new mongoose.model("Subscriber", subscribersSchema)

// ---------- STRATEGIES -------------

const strategy = new LocalStrategy(
  async function(username, password, done) {
    try {
      let a_user = await snjuser.findOne({username: username});
      if (!a_user) return done(null, false);
      if (a_user) {
        if (a_user.password !== password) return done(null, false);
        if (a_user.password === password) return done(null, a_user)
      }
    } catch (error) {
      return done(error, false);
    }
  }
)

passport.use(strategy);

passport.serializeUser(
  function(user, done) {
    done(null, user.id)
  }
)

passport.deserializeUser(
  function(id, done) {
    done(null, id)
  }
)

const isAuthenticated = function(req, res, next) {
  if (!req.user) res.redirect("/login")
  if (req.user) return next();
}

// -------------- VARIABLES ---------------

let name = "";
let address = "";
let orderProduct = "";
let productSize = "";
let productPrice = "";
let quantity = "";
let totalAmount = "";

let liquidSoapDescription = "liquid Soap - Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC";
let liquidDetergentDescription = "liquid Detergent - professor at Hampden-Sydney College in Virginia, looked up one";
let toiletCleanerDescription = "toilet Cleaner - literature, discovered the undoubtable source. Lorem Ipsum";
let productDescription = "";

function loggedInUser(userId) {
  const loggedInUser = snjuser.findById(userId);
  return loggedInUser;
}

// ------------ ROUTES -------------

app
  .get("/", async function(req, res) {
    if (!req.user) {
      res.render("home", {username: "Log in", signup: "Sign up"})
  }
    if (req.user) {
      const loggedInUser = await snjuser.findById(req.user);
      res.render("home", {username: "Hi, " + loggedInUser.username, signup: "Logout"})
    }
  })
  .post("/", function(req, res) {
    if (req.body.button == "subscribeBtn") {
      if (req.body.user == "") {
        res.send("<h3>Please enter a valid e-mail Id</h3>")
      } else {
          subscriberList.push(req.body.user)
          console.log(subscriberList);
          res.render("subscribed", {user: req.body.user})
        }
    } else {
      orderProduct = req.body.button
      res.redirect("/product-review")
    }
  })

app
  .get("/signup", function(req, res) {
    if (req.user) res.redirect("/logout");
    else res.render("signup", {username: "Log in", signup: "Sign up"});
  })
  .post("/signup", async function(req, res) {
    let newUser = await snjuser.findOne({username: req.body.username});
    if (!newUser) {
      snjuser.insertMany({
        username: req.body.username,
        password: req.body.password
      })
      console.log("user added to DB");
      res.redirect("/")
    }
    if (newUser) {
      console.log("user already exist");
      res.redirect("/login")
    }
  })

app
  .get("/login", function(req, res) {
    if (req.user) res.redirect("/profile")
    if (!req.user) res.render("login", {username: "Log in", signup: "Sign up"})
      })
  .post("/login", 
    passport.authenticate("local", {
      failureRedirect: "/login",
      successRedirect: "/products"
      }),
      function (req, res) {
        console.log(req.user)
      }
  )

app.get("/profile", isAuthenticated, async function(req, res) {
  const loggedInUser = await snjuser.findById(req.user);
  res.render("profile", {username: "Hi, " + loggedInUser.username, user: loggedInUser.username, signup: "Logout"});
})

app.get("/products", async function(req, res) {
  const loggedInUser = await snjuser.findById(req.user);
  if (req.user) res.render("products", {username: "Hi, " + loggedInUser.username, signup: "Logout"})
  else res.render("products", {username: "Log in", signup: "Sign up"});
})

app
  .get("/product-review", isAuthenticated, async function(req, res) {
    const loggedInUser = await snjuser.findById(req.user)
    res.render("product-review", {
      orderProduct: orderProduct,
      username: "Hi, " + loggedInUser.username,
      signup: "Logout"
    })
  })
  .post("/product-review", function(req, res) {
    // console.log("orderProduct: " + orderProduct);

    if (req.body.pack === "pack1") {
      productSize = "75 ml";
      productPrice = "100"
    } else if (req.body.pack === "pack2") {
      productSize = "150 ml";
      productPrice = "170"
    } else if (req.body.pack === "pack3") {
      productSize = "300 ml";
      productPrice = "250"
    }

    if (orderProduct === "LiquidSoap") {
      productDescription = liquidSoapDescription
    } else if (orderProduct === "LiquidDetergent") {
      productDescription = liquidDetergentDescription
    } else if (orderProduct === "ToiletCleaner") {
      productDescription = toiletCleanerDescription
    }
    // console.log("productDescription: " + productDescription);

    res.redirect("/product-review/product")
  })

app
  .get("/product-review/product", isAuthenticated, async function (req, res) {
    const loggedInUser = await snjuser.findById(req.user);
    res.render("product-review-product", {
    orderProduct: orderProduct,
    productSize: productSize,
    productPrice: productPrice,
    productDescription: productDescription,
    username: "Hi, " + loggedInUser.username,
    signup: "Logout"
    })
  })
  .post("/product-review/product", function (req, res){
    quantity = req.body.quantity;
    name = req.body.name;
    address = req.body.addressLine1 + " " + req.body.addressLine2 + " " + req.body.addressLine3;
    res.redirect("/product-review/product/confirmation");
  })

app
  .get("/product-review/product/confirmation", isAuthenticated, async function(req, res){
    const loggedInUser = await snjuser.findById(req.user);
    res.render("confirmation", {
      username: "Hi, " + loggedInUser.username,
      signup: "Logout",
      orderBy: loggedInUser.username,
      name: name,
      address: address,
      orderProduct: orderProduct,
      productSize: productSize,
      productPrice: productPrice,
      quantity: quantity,
      totalAmount: Number(quantity) * Number(productPrice)
      })
  })
  .post("/product-review/product/confirmation", isAuthenticated, async function(req, res){
    const newOrder = await new Order({
      name: name,
      address: address,
      orderProduct: orderProduct,
      productSize: productSize,
      productPrice: productPrice,
      quantity: quantity,
      totalAmount: totalAmount,
    })
    await newOrder.save();
    
    const loggedInUser = await snjuser.findById(req.user);
    
    // console.log(loggedInUser);

    console.log(loggedInUser.orders);

    const orderList =  await loggedInUser.orders
    
    orderList.push(newOrder)

    // console.log( "new order list :" + orderList);

    await snjuser.findByIdAndUpdate(req.user, {orders: orderList})

    const newOrderList = await snjuser.findById(req.user)

    console.log("user's new order list: " + newOrderList.orders);

    res.send("order confirmed")
  })

app
  .post("/subscribe", async function(req, res) {
    
    const subscribedUser = await Subscriber.findOne({email: req.body.subscriberEmail});
    if (subscribedUser) res.send("user already subscribed.")
    if (!subscribedUser) {
      const newSubscriber = new Subscriber({
        email: req.body.subscriberEmail
      })
      newSubscriber.save(function() {
        console.log("new subscriber");
      });
      const loggedInUser = await snjuser.findById(req.user);
      if (loggedInUser) res.render("subscribed", {newSubscriber: req.body.subscriberEmail, username: "Hi, " + loggedInUser.username, signup: "Logout"})
      if (!loggedInUser) res.render("subscribed", {newSubscriber: req.body.subscriberEmail, username: "Log in", signup: "Sign up"})
    }
  })


app.get("/refill", async function(req, res) {

  if (!req.user) res.render("refill", {username: "Log in", signup: "Sign up"})    
  if (req.user) {
    const loggedInUser = await snjuser.findById(req.user);
    res.render("refill", {username: "Hi, " + loggedInUser.username, signup: "Logout"})
  }

  // const loggedInUser = await snjuser.findById(req.user);
  // res.render("refill", {username: loggedInUser})
})

app.get("/consultancy", async function(req, res) {
  if (!req.user) res.render("consultancy", {username: "Log in", signup: "Sign up"})    
  if (req.user) {
    const loggedInUser = await snjuser.findById(req.user);
    res.render("consultancy", {username: "Hi, " + loggedInUser.username, signup: "Logout"})
  }
})

app.get("/contact", function(req, res) {
  res.redirect("/")
})

app.get("/logout", isAuthenticated, function(req, res) {
  req.logout(function(err){
    if(err) console.log(err);
  });
  res.redirect("/");
})



app.listen(3000, function(req, res) {
  console.log("Server is running on port 3000!");
});
