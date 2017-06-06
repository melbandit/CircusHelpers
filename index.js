/*
REST_ CRUD
read	GET 	/needs 		get all needs
create	POST 	/needs   		make a new message
read	GET 	/needs/:id 	get message with matching id
update	POST 	/needs/:id 	update message with matching id
delete	delete 	/needs/:id 	delete message with matching id	
*/
var passport = require('passport');

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

var express = require('express');
var session = require('express-session')

var app = express();
var bodyParser = require('body-parser');

app.use(express.static('public'));

//app.use(session({secret: 'keyboard stuff'}));
app.use(session({ secret: '*@((SNHu497264nis$Qh2djud8#' }));
app.use(passport.initialize());
app.use(passport.session());

app.use( bodyParser.json() ); //for parsing JSON data tha comes in with requests
app.use( bodyParser.urlencoded({ extended:true }) );
// app.post('/login', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login' }));

app.use(function (req, res, next) {
	// Website you wish to allow to connect
	res.setHeader('Access-Control-Allow-Origin', '*');

	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

	res.setHeader('Access-Control-Allow-Credentials', true);

	next();
});

app.get('/', function (req, res) {
	res.send('This is an API! You can access stuff here. Sowwy.')
});


app.get('/loggedin', function (req, res) {
	console.log(req.user);
	res.send('logged in?');
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	console.log("we're connnected");
});

var userSchema = mongoose.Schema({ 
	google_id: String,
	google_token: String,
	google_email: String,
	google_name: String,
	image: String,
});


var User = mongoose.model("User", userSchema);


passport.serializeUser(function(user, done) {
	done(null, user);
	// console.log("user", user);
});
passport.deserializeUser(function(obj, done) {
	done(null, obj);
	// console.log("obj", obj);
});

passport.use(new GoogleStrategy({
	clientID: "277625297115-ks16fah4b9eaou0d0q6a1lt8eg740rsl.apps.googleusercontent.com",
	clientSecret: 'tYHXQh0dGky8-hUQy8E9QYus',
	callbackURL: "http://dev.melissasattler.com/auth/google/callback"
},
function(accessToken, refreshToken, profile, done) {
	console.log(profile);
	User.findOne({ 
		google_id: profile.id 
	}, function (err, user) {
		if (err) {
			return handleError(err);
		}
		if (user) {
			console.log("logging in: found existing google acct");
			return done(null, user);
		} else {
			console.log("logging in: could not find existing google acct");
			var newUser = new User();
			newUser.google_id = profile.id;
			// newUser.google.token = token;
			newUser.google_name = profile.displayName;
			// newUser.google.email = profile.emails[0].value;
			if (profile.photos.length && profile.photos[0].value) newUser.image = profile.photos[0].value;

			newUser.save(function(err) {
				if (err) {
					throw err;
				}
				return done(null, newUser);
			});
		}
	});
}
));
app.get(
	'/auth/status',
	function(req, res) {
		// I'm just making up object literals here that hold either info about the user, or loggedIn: false
		if (req.session && req.session.passport && req.session.passport.user) {
			res.send({
				loggedIn: 		true,
				_id: 			req.session.passport.user._id,
				displayName: 	req.session.passport.user.google_name,
				image: 			req.session.passport.user.image,
			})
		} else {
			res.send({
				loggedIn: false
			})
		}
	}
);

var isLoggedIn = function(req) {
	if (req.session && req.session.passport && req.session.passport.user) return true;
	return false;
}

app.get('/auth/google',
	passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback', 
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		res.redirect('/');
		// console.log(req, res);
		console.log("logged in!");
	}
);

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


var needSchema = new Schema({
	id:  Number,
	title:  String,
	content:  String,
	location: String,
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
	deleted_at: { type: Date, default: null },
	completed: Boolean,
	urgent: Number,
	user: String,
	messages: [{  id: Number, 
		created_at: { type: Date, default: Date.now }, 
		updated_at: { type: Date, default: Date.now }, 
		deleted_at: { type: Date, default: Date.now },
		user: String,
		text: String }]
});

/*
user: req.session.passport.user.google_name,
title: req.body.title,
content: req.body.content,
time: req.body.time,
location: req.body.location,
urgent: req.body.urgent
*/

var Need = mongoose.model('Need', needSchema);

app.get('/needs', function (req, res) {
	Need.find({deleted_at: null}, function(err, needs) {
		if (!err){ 
			// filter needs to remove deleted needs
			res.send(needs);
		} else {throw err;}
	});
})

app.get('/needs/:id', function (req, res) {
	// console.log(req.params.id);
	Need.findByIdAndRemove({_id: req.params.id}, function(err, needs) {
		if (!err){ 
			// filter needs to remove deleted needs
			res.send(needs);
		} else {throw err;}
	});

	//.map to find the id and delete
})

app.delete('/needs/:id', function (req, res) {
	if (!isLoggedIn(req)) { // check the deleting user is the creating user
		res.send(401, {message: "fuck off"});
		return;
	}
	Need.findOne({_id: req.params.id}, function(err, need) {
		if (!err){ 
			// filter needs to remove deleted needs
			if (need.user == req.session.passport.user.google_name) {
				need.deleted_at = Date.now();
				need.save(function (err, need) {
				    if (err) {
				        res.status(500).send(err)
				    }
				    res.send(need);
				});
			} else {
				res.send(401, {message: "not yours to delete, fuck off"});
				return;
			}
		} else {throw err;}
	});
})

app.post('/needs/:id', function (req, res) {
	Need.findById({_id: req.params.id}, function(err, need) {

		if (!isLoggedIn(req)) { // check the editing user is the creating user
			res.send(401, {message: "fuck off"});
			return;
		}
		if (err) {
	        res.status(500).send(err);
	    } else {

	    	if (need.user == req.session.passport.user.google_name) {

		        // Update each attribute with any possible attribute that may have been submitted in the body of the request
		        // If that attribute isn't in the request body, default back to whatever it was before.
		        need.title = req.body.title || need.title;
		        need.content = req.body.content || need.content;
		        need.time = req.body.time || need.time;
		        need.location = req.body.location || need.location;
		        need.urgent = req.body.urgent || need.urgent;

		        need.updated_at = Date.now();
		        
		        // Save the updated document back to the database
		        need.save(function (err, need) {
		            if (err) {
		                res.status(500).send(err)
		            }
		            res.send(need);
		        });
		    } else {
				res.send(401, {message: "not yours to edit, fuck off"});
				return;
			}
	    }
	});
})

app.get("/test", function(req, res){
	res.send( passport );
})

app.post('/needs', function (req, res) { // add user

	if (!isLoggedIn(req)) {
		res.send(401, {message: "fuck off"});
		return;
	}

	console.log("POST NEED:", req);
	let newNeed = new Need( {
		user: req.session.passport.user.google_name,
		title: req.body.title,
		content: req.body.content,
		time: req.body.time,
		location: req.body.location,
		urgent: req.body.urgent
	});
	//console.log(newNeed);
	newNeed.save(function(err) {
		if (err) {
			throw err;
		}
	});
	res.send(newNeed);
})

app.post('/needs/:id/messages', function (req, res) { // add user

	if (!isLoggedIn(req)) {
		res.send(401, {message: "fuck off"});
		return;
	}

	Need.findOne({_id: req.params.id}, function(err, need) {
		if (!err){ 
			console.log("found need to add message to")
			var newMessage = {text: req.body.message, user: req.session.passport.user.google_name };
			need.messages.push(newMessage);
			need.save(function(err) {
				if (err) {
					throw err;
				}
				res.send(newMessage);
			});
			
		} else {throw err;}
	});
	//console.log(newNeed);
	//newNeedMessage.save(function(err) {
	//	if (err) {
	//		throw err;
	//	}
	//});
	// res.send(newNeedMessage);
})

app.listen(80, function () {
	console.log('Example app listening on port 80!')
})