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
var app = express();
var bodyParser = require('body-parser');

app.use(express.static('public'));

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
			return done(err);
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

app.get('/auth/google',
	passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] }));

app.get('/auth/google/callback', 
	passport.authenticate('google', { failureRedirect: '/login' }),
	function(req, res) {
		// req.login(user, function(err) {
		//   if (err) { return next(err); }
		//   return res.redirect('/users/' + req.user.username);
		//   console.log(req.user.username);
		// });
		res.redirect('/');
		// console.log(req, res);
		console.log("logged in!");
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
	console.log("logged out");
});


var needSchema = new Schema({
	id:  Number,
	title:  String,
	content:  String,
	location: String,
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now },
	deleted_at: { type: Date, default: Date.now },
	completed: Boolean,
	urgent: Number,
	user: [{  id: Number, 
		passport: String,
		rating: Number }],
	messages: [{  id: Number, 
		created_at: { type: Date, default: Date.now }, 
		updated_at: { type: Date, default: Date.now }, 
		deleted_at: { type: Date, default: Date.now },
		user: String,
		text: String }]
});

var Need = mongoose.model('Need', needSchema);

// new Need("Hiya!", "melissa");
// new Need("Where are you guys?!", "melissa");
// new Need("Sup?", "melissa");

app.get('/needs', function (req, res) {
	// let results = needs.filter(function (need){
	//   //keep needs that have null for their deleted_at
	//   return need.deleted_at == null;
	//   //or return !need.deleted_at;
	// })

	Need.find({}, function(err, needs) {
		if (!err){ 
				// filter needs to remove deleted needs
				res.send(needs);
		} else {throw err;}
	});
})

app.get('/needs/:id', function (req, res) {
	let results = needs.filter(function(need) {
		return need.id == req.params.id;
	});
	res.json(results[0]);
	//.map to find the id and delete
})

app.delete('/needs/:id', function (req, res) {
	console.log("need deleted"); 
	let results = needs.filter(function(need) {
		return need.id == req.params.id;
	});  
	results[0].deleted_at = new Date().getTime();

	res.json( results[0] );
})

app.post('/needs/:id', function (req, res) {
	console.log("need edited", req.body.content); 
	let results = needs.filter(function(message) {
		return message.id == req.params.id;
	});  
	results[0].updated_at = new Date().getTime();
	results[0].content = req.body.content;

	res.json( results[0] );
})


app.post('/needs', function (req, res) {
	console.log("post need", req.body);
	let newNeed = new Need( {content: req.body.content} );
	console.log(newNeed);
	newNeed.save(function(err) {
		if (err) {
			throw err;
		}
	});
	res.send(newNeed);
})

app.listen(80, function () {
	console.log('Example app listening on port 80!')
})