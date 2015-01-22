'use strict';

var _             = require('lodash');
var passport      = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var User          = require('../models/users');
var APIError      = require('../utils/apierror');
var log           = require('../utils/log');

module.exports = {
	basicStrategy: new BasicStrategy(
		function (username, password, done) {
			User.findByEmail(username.toLowerCase(), function (err, user) {
				if (err) {
					if (err.status === 404) {
						return done(null, false, {
							message: 'Incorrect username or password'
						});
					}

					return done(err);
				}

				if (!user) {
					return done(null, false, {
						message: 'Incorrect username or password'
					});
				}

				if (user.activationToken) {
					return done(null, false, {
						message: 'Account activation required'
					});
				}

				user.verifyPassword(password, function (err, result) {
					if (err) {
						return done(err);
					}

					if (result) {
						return done(null, user);
					} else {
						return done(null, false, {
							message: 'Incorrect username or password'
						});
					}
				});
			});
		}
	),

	serializeUser: function (user, done) {
		done(null, user._id);
	},

	deserializeUser: function (id, done) {
		User.findById(id, done);
	},

	ensureAuthenticated: function (strategy, role) {
		return function (req, res, next) {
			passport.authenticate(strategy, function (err, user, info) {
				if (err) {
					return next(err);
				}

				if (!user) {
					return next(new APIError(400, info.message || 'Incorrect username or password'));
				}

				if (!_.contains(user.roles, role)) {
					return next(new APIError(401, 'unauthorized'));
				}

				req.logIn(user, next);
			})(req, res, next);
		};
	},

	csrf: function (req) {
		var token = (req.body && req.body._csrf) || (req.query && req.query._csrf) || (req.headers['x-csrf-token']) || (req.headers['x-xsrf-token']);
		return token;
	}
};
