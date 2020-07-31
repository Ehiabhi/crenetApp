var express = require("express");
var path = require("path");
var mongoose = require("mongoose");
var config = require("./config/database");
var bodyParser = require("body-parser");
var session = require("express-session");
var expressValidator = require("express-validator");
var connectFlash = require("connect-flash");
var fileUpload = require("express-fileupload");

//Connect to db
mongoose.connect(config.database);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connected to MongoDB");
})

// Init app
var app = express();

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Set public folder
app.use(express.static(path.join(__dirname, "public")));

// Set Global error variables
app.locals.errors = null;

// Get Page Model
var Page = require("./models/page");

// Get all pages to pass to header.ejs
Page.find({}).sort({ sorting: 1 }).exec(function (err, pages) {
    if (err) {
        console.log(err);
    } else {
        app.locals.pages = pages;
    }
});

// Get Category Model
var Category = require("./models/category");

// Get all categories to pass to header.ejs
Category.find(function (err, categories) {
    if (err) {
        console.log(err);
    } else {
        app.locals.categories = categories;
    }
});

// Express fileUpload middleware
//BECAUSE BODY PARSER DOESN'T HANDLE FILE UPLOAD FUNCTIONALITY
app.use(fileUpload());

//Body Parser middleware
app.use(bodyParser.urlencoded(({ extended: false })));
app.use(bodyParser.json());

//Express Session Middleware
app.use(session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
}))

// Express Validator middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    },
    customValidators: {
        isImage: function (value, filename) {
            var extension = (path.extname(filename)).toLowerCase();
            switch (extension) {
                case ".jpg":
                    return ".jpg";
                case ".jpeg":
                    return ".jpg";
                case ".png":
                    return ".png";
                case "":
                    return ".jpg";
                default:
                    return false;
            }
        }
    }
}));


//Express Messages Middleware
app.use(require("connect-flash")());
app.use(function (req, res, next) {
    res.locals.messages = require("express-messages")(req, res);
    next();
});

app.get("*", function (req, res, next) {
    res.locals.cart = req.session.cart;
    // res.locals.user = req.user || null;
    next();
});

//Set routes
var adminPages = require("./routes/admin_pages");
var adminCategories = require("./routes/admin_categories");
var pages = require("./routes/pages");
var adminProducts = require("./routes/admin_products");
var products = require("./routes/products");
var cart = require("./routes/cart");


app.use("/admin/pages", adminPages);
app.use("/admin/categories", adminCategories);
app.use("/admin/products", adminProducts);
app.use("/products", products);
app.use("/cart", cart);
app.use("/", pages);


//Start the Server
var port = 3000;
app.listen(port, function () {
    console.log("Server started at " + port);
})