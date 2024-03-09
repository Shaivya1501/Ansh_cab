var express = require('express');
var router = express.Router();
const userModel = require("./users");
const bookingModel = require("./booking");
const serviceModel = require("./service");


const passport = require("passport");
const localStrategy = require('passport-local');
const { Admin } = require('mongodb');
require('dotenv').config();

const cloudinary = require('cloudinary').v2;


          
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET 
});

passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/register', function (req, res, next) {

  const userData = new userModel({
    username: req.body.username,
    fullname: req.body.fullname,
    email: req.body.email,
    contact: req.body.contact,
    role : req.body.role,
  });

  userModel.register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.send("hello hello ");
      })
    })
    .catch(function (err) {
      // Handle registration failure (e.g., username/email already taken)
      req.flash('error', 'Registration failed. Please choose a different username or email.');
      console.log(err);
      res.redirect('/register');
    });
});

router.post('/booking',  async function (req, res, next){
  const newbooking = new bookingModel({
      Name: req.body.custname,
      taxitype: req.body.cartype,
      email: req.body.email,
      pickuplocation: req.body.pickloc,
      droplocation: req.body.droploc,
      contact: req.body.number,
      date: req.body.date
    });
    await newbooking.save();
    req.flash('success', 'Booking Done created successfully');
    res.redirect('/');
    // res.send('booking done')
})

router.post('/login', passport.authenticate("local", {
  failureRedirect: "/",
  failureFlash: true
}), function (req, res) {
  if (req.user.role === 'admin') {
    res.redirect('/admindashboard');
    // res.send('login done')
  } else {
    res.redirect('/');
    // console.log(req.user.role)
  }
});

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') return next();
  res.redirect('/login');
}

router.get('/adminlogin', function(req,res){
  res.render('adminlogin')
})

router.get('/admindashboard', isAdmin, isLoggedIn, async function(req,res){
  var service = await serviceModel.find({});
  const successMessage = req.flash('success');
  const errorMessage = req.flash('error');
  // console.log(service);
  var admin = userModel.findOne({_id : req.user._id})
  res.render('admindashboard' ,{service , successMessage, errorMessage })
})

router.post('/makeservice', isAdmin, isLoggedIn, function(req,res){
  const serviceimg = req.files.serviceimage;
  cloudinary.uploader.upload(serviceimg.tempFilePath, async function (err, result) {
    // console.log(result)
      // if (err) return next(err);
    const newservice = new serviceModel({
      servicename: req.body.service,
      Servicedescription: req.body.servicedescription,
      seviceimage: result.secure_url,
    });
    await newservice.save();
    req.flash('success', 'Product created successfully');
    res.redirect('/admindashboard');
  })
})


router.post('/service/update/:id', isAdmin , async function(req,res){
  try {
    const service = await serviceModel.findByIdAndUpdate(req.params.id, {
      servicename: req.body.servicename,
      Servicedescription: req.body.servicedescription
    }, { new: true });
    await service.save();

    // Set flash message
    req.flash('success', 'Service details updated successfully');

    res.redirect('/admindashboard');
  } catch (error) {
    // Handle error appropriately
    console.error("Error updating product:", error);
    req.flash('error', 'Failed to update product details');
    res.redirect('/admindashboard');
  }
})

router.get('/service/delete/:id', isAdmin, async function (req, res, next) {
  try {
    const service = await serviceModel.findById(req.params.id);

    // Delete the image from Cloudinary
    const imageURL = service.seviceimage;
    const publicID = imageURL.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicID);

    // Delete the product from the database
    await serviceModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Service deleted successfully');

    res.redirect('/admindashboard');
} catch (error) {
    console.error("Error deleting product:", error);
    req.flash('error', 'Failed to delete service');
    res.redirect('/admindashboard');
}
});


module.exports = router;
