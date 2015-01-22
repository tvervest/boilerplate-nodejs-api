var express = require('express');
var path = require('path');
var _ = require('lodash');
var redisUrl = require('redis-url');
var config = require('./utils/config');
var APIError = require('./utils/apierror');
var log = require('./utils/log');
var Authentication = require('./utils/authentication');
var requestLogger = require('./utils/requestlogger');

// Middleware
var passport = require('passport');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var RedisStore = require('connect-redis')(session);

// Controllers
var Users = require('./controllers/users');

// Include missing root certificates as used by common browsers
require('ssl-root-cas')
	.inject();

// Initiate express app
var app = express();

app.use(cookieParser());

// setup session - optionally backed with redis
var sessionSettings = {
	secret: config.get('SESSION:SECRET'),
	resave: false,
	saveUninitialized: false,
	cookie: {
		maxAge: 30 * 60 * 1000, // 30 minutes
	},
};

if (config.get('REDIS:URL')) {
	log.info({
		url: config.get('REDIS:URL')
	}, 'using redis as session store');
	sessionSettings.store = new RedisStore({
		client: redisUrl.connect(config.get('REDIS:URL')),
	});
}
app.use(session(sessionSettings));
app.use(requestLogger);

switch (config.get('ENV')) {
case 'production':
	// Add csrf support
	app.use(csrf());
	app.use(function (req, res, next) {
		res.cookie('XSRF-TOKEN', req.csrfToken());
		next();
	});

	app.use(function (req, res, next) {
		if (req.headers['x-forwarded-proto'] !== 'https') {
			return res.redirect(['https://', req.get('Host'), req.url].join(''));
		}
		next();
	});
	break;

default:
	require('longjohn');
}

// host static directories
var publicDirs = config.get('PUBLIC');
if (publicDirs !== false) {
	var basedir = path.resolve(__dirname, '..');

	if (!_.isArray(publicDirs)) {
		publicDirs = [publicDirs];
	}

	_.forEach(publicDirs, function (publicDir) {
		var directory = path.resolve(basedir, publicDir);
		log.info({
			directory: directory,
		}, 'sharing public directory');
		app.use(express.static(directory));
	});
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true,
}));

// setup passport authentication
app.use(passport.initialize());
app.use(passport.session());

passport.use(Authentication.basicStrategy);
passport.serializeUser(Authentication.serializeUser);
passport.deserializeUser(Authentication.deserializeUser);

app.get('/me', Users.currentUser);
app.get('/users', Users.list);
app.put('/users', Users.create);
app.get('/users/:uuid', Users.get);
app.post('/users/:uuid', Users.update);
app.delete('/users/:uuid', Users.delete);

app.all('*', function (req, res, next) {
	return next(new APIError(404, 'endpoint does not exist'));
});

// error handler
app.use(function badTokenErrorHandler(err, req, res, next) {
	if (err.code !== 'EBADCSRFTOKEN') {
		return next(err);
	}

	// handle CSRF token errors here
	return next(new APIError(403, 'session has expired or form tampered with'));
});

app.use(function couchdbErrorHandler(err, req, res, next) {
	switch (err.error) {
	case 'conflict':
		return next(new APIError(409, 'revision is out of date'));

	case 'not_found':
		return next(new APIError(404, err.reason));

	default:
		next(err);
	}
});

app.use(function catchAllErrorHandler(err, req, res, next) {
	if (!(err instanceof APIError) || err.status === 500) {
		res.status(500)
			.json({
				code: 500,
				error: 'An internal server error occurred',
			});
		req.log.error({
			err: err,
		}, 'request error');
	} else {
		res.status(err.status)
			.json({
				code: err.status,
				error: err.message,
			});
		if (err.status < 400 || err.status >= 500) {
			req.log.error({
				err: err,
			}, 'request error');
		} else {
			req.log.info({
				err: err,
			}, 'request error');
		}
	}
});

module.exports = function () {
	var port = config.get('PORT');

	return app.listen(port)
		.on('listening', function () {
			log.info({
				port: port,
			}, 'started server');
		});
};
