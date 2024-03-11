var express = require('express');
var router = express.Router();
const userModel = require("./users");
const bookingModel = require("./booking");
const serviceModel = require("./service");
const taxiModel = require("./taxi");
const reviewModel = require("./review");
const queriesModel = require("./queries");

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
router.get('/', async function(req, res, next) {
  try {
    var service = await serviceModel.find({});
    var taxi = await taxiModel.find({});
    var review = await reviewModel.find({});
    res.render('index',{service, taxi, review} );
  } catch (error) {
    console.error("Error:", error);
    req.flash('error', 'Failed to update review details');
    res.redirect('/');
  }
 
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

//  about route
router.get('/about', function(req,res){
  res.render('about')
})

//  taxi route
router.get('/taxi', async function(req,res){
  var taxi = await taxiModel.find({});
  res.render('taxi', {taxi});
})

//  contact route
router.get('/contact', async function(req,res){
  res.render('contact');
})


//  service route
router.get('/service', async function(req,res){
  var service = await serviceModel.find({});

  res.render('service', {service});
})

router.get('/admindashboard', isAdmin, isLoggedIn, async function(req, res) {
  try {
      var service = await serviceModel.find({});
      var taxi = await taxiModel.find({});
      var review = await reviewModel.find({});
      var queries = await queriesModel.find({});
      var booking = await bookingModel.find({});


      const successMessage = req.flash('success');
      const errorMessage = req.flash('error');

      // Fetch admin user with increased timeout
      var admin = await userModel.findOne({_id: req.user._id}).maxTimeMS(30000); // Adjust timeout value as needed

      res.render('admindashboard', { service, successMessage, errorMessage, taxi, admin, review, queries, booking});
  } catch (error) {
      console.error("Error fetching admin user:", error);
      req.flash('error', 'Failed to load admin dashboard');
      res.redirect('/'); // Redirect to home or another appropriate page
  }
});

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


router.get('/carprofile', async function (req, res, next) {
  res.render('carprofile')
});

router.post('/addtaxi', isAdmin, isLoggedIn, function(req, res) {
  const taxiImage1 = req.files ? req.files.taxiImage1 : null;
  const taxiImage2 = req.files ? req.files.taxiImage2 : null;
  const taxiImage3 = req.files ? req.files.taxiImage3 : null;

  // Check if all images are present
  if (!taxiImage1 || !taxiImage2 || !taxiImage3) {
      req.flash('error', 'Please upload all three images');
      return res.redirect('/admindashboard');
  }

  // Upload each image to Cloudinary
  Promise.all([
      uploadToCloudinary(taxiImage1),
      uploadToCloudinary(taxiImage2),
      uploadToCloudinary(taxiImage3)
  ]).then(async ([image1Url, image2Url, image3Url]) => {
      try {
          // Save the image URLs in your database
          const newtaxi = new taxiModel({
              taxiimage1: image1Url,
              taxiimage2: image2Url,
              taxiimage3: image3Url,
              taxiname: req.body.taxiname,
              taxitype: req.body.taxitype,
              taxifare: req.body.taxiFare,
              sittingcapecity: req.body.sittingCapecity,
              taxidescription: req.body.taxiDescription
          });
          await newtaxi.save();
          req.flash('success', 'taxi created successfully');
          res.redirect('/admindashboard');
      } catch (err) {
          console.error("Error saving image URLs in database:", err);
          // Handle error as needed
          req.flash('error', 'Failed to create taxi');
          res.redirect('/admindashboard');
      }
  }).catch(err => {
      console.error("Error uploading images to Cloudinary:", err);
      // Handle error as needed
      req.flash('error', 'Failed to upload images');
      res.redirect('/admindashboard');
  });
});

function uploadToCloudinary(image) {
  return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(image.tempFilePath, (err, result) => {
          if (err) {
              console.error("Error uploading image to Cloudinary:", err);
              reject(err);
          } else {
              resolve(result.secure_url);
          }
      });
  });
}

router.get('/taxi/delete/:id', isAdmin, async function (req, res, next) {
  try {
      // Find the taxi document by ID
      const taxi = await taxiModel.findById(req.params.id);

      // Extract URLs of all three images
      const imageUrls = [taxi.taxiimage1, taxi.taxiimage2, taxi.taxiimage3];

      // Delete each image from Cloudinary
      await Promise.all(imageUrls.map(async (imageUrl) => {
          const publicID = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicID);
      }));

      // Delete the taxi document from the database
      await taxiModel.findByIdAndDelete(req.params.id);

      // Set flash message
      req.flash('success', 'Taxi deleted successfully');

      res.redirect('/admindashboard');
  } catch (error) {
      console.error("Error deleting taxi:", error);
      req.flash('error', 'Failed to delete taxi');
      res.redirect('/admindashboard');
  }
});

router.get('/carprofile/:id', async function (req, res, next) {
  try {
      var taxi = await taxiModel.findById(req.params.id);
      res.render('carprofile', { taxi }); // Use res.render() to render a view with data
  } catch (error) {
      console.error("Error fetching taxi profile:", error);
      res.status(500).send('Internal Server Error'); // Send a 500 error response if an error occurs
  }
});

router.post('/makereview', isAdmin, isLoggedIn, function(req,res){
  const reviewimg = req.files.rimage;
  cloudinary.uploader.upload(reviewimg.tempFilePath, async function (err, result) {
    // console.log(result)
      // if (err) return next(err);
    const newreview = new reviewModel({
      reviewname: req.body.rname,
      review: req.body.wreview,
      reviewimage: result.secure_url,
    });
    await newreview.save();
    req.flash('success', 'Review added successfully');
    res.redirect('/admindashboard');
  })
})

router.get('/review/delete/:id', isAdmin, async function (req, res, next) {
  try {
    const review = await reviewModel.findById(req.params.id);

    // Delete the image from Cloudinary
    const imageURL = review.reviewimage;
    const publicID = imageURL.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicID);

    // Delete the product from the database
    await reviewModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Review deleted successfully');

    res.redirect('/admindashboard');
} catch (error) {
    console.error("Error deleting review:", error);
    req.flash('error', 'Failed to delete review');
    res.redirect('/admindashboard');
}
});

router.post('/updatereview/:id', isAdmin , async function(req,res){
  try {
    const review = await reviewModel.findByIdAndUpdate(req.params.id, {
      reviewname: req.body.reviewname,
      review: req.body.reviewtype
    }, { new: true });
    await review.save();

    // Set flash message
    req.flash('success', 'Review details updated successfully');

    res.redirect('/admindashboard');
  } catch (error) {
    // Handle error appropriately
    console.error("Error updating review:", error);
    req.flash('error', 'Failed to update review details');
    res.redirect('/admindashboard');
  }
})

router.post('/queries', async function(req,res){
    const newqueries= new queriesModel({
      queriename: req.body.name,
      query: req.body.message,
      Phone: req.body.mobile,
    });
    await newqueries.save();
    req.flash('success', 'Review added successfully');
    res.redirect('/');
})

router.get('/delete/query/:id', isAdmin, async function (req, res, next) {
  try {
    // Delete the product from the database
    await queriesModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Query deleted successfully');

    res.redirect('/admindashboard');
} catch (error) {
    console.error("Error deleting Query:", error);
    req.flash('error', 'Failed to delete Query');
    res.redirect('/admindashboard');
}
});

router.get('/rejectbooking/:id', isAdmin, async function (req, res, next) {
  try {
    // Delete the product from the database
    await bookingModel.findByIdAndDelete(req.params.id);

    // Set flash message
    req.flash('success', 'Booking deleted successfully');

    res.redirect('/admindashboard');
} catch (error) {
    console.error("Error deleting Booking:", error);
    req.flash('error', 'Failed to delete Booking');
    res.redirect('/admindashboard');
}
});


router.get('/confirmbooking/:id', isAdmin, async function (req, res, next) {
  try {
    const booking = await bookingModel.findByIdAndUpdate(req.params.id, {
      bookingstatus : true
    }, { new: true });
    await booking.save();

    // Set flash message
    req.flash('success', 'Bookinhg confirm successfully');

    res.redirect('/admindashboard');
  } catch (error) {
    // Handle error appropriately
    console.error("Error accepting booking:", error);
    req.flash('error', 'Failed to accept booking');
    res.redirect('/admindashboard');
  }
})




module.exports = router;
