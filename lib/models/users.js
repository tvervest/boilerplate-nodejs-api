(function () {
	'use strict';

	var _            = require('lodash');
	var bcrypt       = require('bcrypt');
	var async        = require('async');
	var APIError     = require('../utils/apierror');
	var log          = require('../utils/log');
	var nano         = require('../utils/nano');
	var config       = require('../utils/config');
	var db           = nano.use(config.get('DATABASE:PREFIX') + 'users');

	function User(data) {
		this.__data = {
			password: false,
			created: (new Date()).getTime(),
		};

		if (data) {
			_.extend(this.__data, data);
		}
	}

	User.Roles = [
		'user',
		'admin',
	];

	User.list = function (page, limit, done) {
		var options = {
			limit: limit,
			skip: limit * page,
			include_docs: true,
		};

		db.view('details', 'by_email', options, function (err, body) {
			if (err) {
				return done(err);
			}

			return done(null, _.chain(body.rows)
				.pluck('doc')
				.map(function (doc) {
					return doc ? new User(doc) : false;
				})
				.value());
		}.bind(this));
	};

	User.findById = function (id, done) {
		if (_.isArray(id)) {
			if (id.length === 0) {
				return done(null, []);
			}

			db.fetch({
				keys: id,
			}, function (err, body) {
				if (err) {
					return done(err);
				}

				if (!body) {
					return done(new APIError(404, 'a user with the given ID could not be found'));
				}

				return done(null, _.map(body.rows, function (row) {
					return new User(row.doc);
				}));
			}.bind(this));
		} else {
			db.get(id, function (err, body) {
				if (err) {
					return done(err);
				}

				if (!body) {
					return done(new APIError(404, 'a user with the given ID could not be found'));
				}

				return done(null, new User(body));
			}.bind(this));
		}
	};

	User.findByEmail = function (email, done) {
		var options = {
			key: email,
			include_docs: true,
		};

		db.view('details', 'by_email', options, function (err, body) {
			if (err) {
				return done(err);
			}

			if (body.rows.length === 0) {
				return done(new APIError(404, 'a user with the given email address could not be found'));
			}

			return done(null, new User(body.rows[0].doc));
		}.bind(this));
	}

	User.prototype = {
		publicObject: function() {
			var result = _.pick(this.__data, [
				'_id',
				'_rev',
				'roles',
				'email',
				'last_updated',
				'created',
			]);
			return result;
		},

		validate: function(done) {
			var requiredFields = [
				'created',
				'roles',
				'email',
				'last_updated',
				'password',
			];

			for (var i in requiredFields) {
				var field = requiredFields[i];
				if (this.__data[field] === undefined) {
					return done(new APIError(500, 'Missing required field in User model: ' + field));
				}
			}

			this.__data.roles = _.filter(this.__data.roles, function (role) {
				return _.contains(User.Roles, role);
			});
			done(null, true);
		},

		verifyPassword: function (password, done) {
			if (!this.__data.password) {
				return done(null, false);
			}

			bcrypt.compare(password, this.__data.password, function (err, match) {
				if (err) {
					return done(err);
				}

				return done(null, match);
			});
		},

		ensureUniqueEmail: function (done) {
			if (!this.email) {
				return done(null, null);
			}

			User.findByEmail(this.email, function (err, user) {
				if (err && err.status !== 404) {
					return done(err);
				}

				if (!user) {
					return done(null, true);
				}

				return done(null, user.__data._id === this.__data._id);
			}.bind(this));
		},

		delete: function(done) {
			this.__data._deleted = true;
			this.__data.last_updated = (new Date()).getTime();
			this.save(done);
		},

		save: function(done) {
			async.series([
				function (next) {
					this.ensureUniqueEmail(function (err, unique) {
						if (err) {
							return next(err);
						}

						if (unique) {
							return next();
						}

						return next(new APIError('400', 'a user with the given email address already exists'));
					});
				}.bind(this),
				function (next) {
					this.__data.last_updated = (new Date()).getTime();
					this.validate(next);
				}.bind(this),
			], function (err) {
				if (err) {
					return done(err);
				}

				db.insert(this.__data, function (err, result) {
					if (err) {
						return done(err);
					}

					this.__data._id = result.id;
					this.__data._rev = result.rev;

					done(null, this);
				}.bind(this));
			}.bind(this));
		},

		/** Getters & setters **/

		get _id () {
			return this.__data._id;
		},

		set _rev (revision) {
			this.__data._rev = revision;
		},

		get _rev () {
			return this.__data._rev;
		},

		set roles (roles) {
			this.__data.roles = roles;
		},

		get roles () {
			return this.__data.roles;
		},

		set email (email) {
			this.__data.email = email;
		},

		get email () {
			return this.__data.email;
		},

		get lastUpdated () {
			return this.__data.last_updated;
		},

		get created() {
			return this.__data.created;
		},

		get password () {
			return this.__data.password;
		},

		get isAdmin () {
			return _.contains(this.roles, 'admin');
		},

		setPassword: function (password, done) {
			async.waterfall([
				bcrypt.genSalt.bind(this),
				function (salt, next) {
					bcrypt.hash(password, salt, next);
				}.bind(this),
			], function (err, hash) {
				if (err) {
					return done(err);
				}

				this.__data.password = hash;
				done();
			}.bind(this));
		},
	};

	module.exports = User;
})();