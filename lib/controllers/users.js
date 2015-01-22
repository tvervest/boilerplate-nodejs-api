(function () {
	'use strict';

	var async          = require('async');
	var _              = require('lodash');
	var log            = require('../utils/log');
	var User           = require('../models/users');
	var mail           = require('../utils/mail');
	var bodyvalidator  = require('../utils/bodyvalidator');
	var Authentication = require('../utils/authentication');

	module.exports = {
		currentUser: [
			Authentication.ensureAuthenticated('basic', 'user'),
			function(req, res, next) {
				return res.status(200).json(req.user.publicObject());
			},
		],

		list: [
			bodyvalidator({
				type: 'object',
				properties: {
					page: {
						description: 'indicates the page offset to return, default value is 0',
						type: 'string',
						pattern: /^\d+$/,
						required: false,
						min: 0,
					},
					limit: {
						description: 'the maximum number of results per page',
						type: 'string',
						pattern: /^\d+$/,
						required: false,
						min: 0,
					},
				},
			}),
			Authentication.ensureAuthenticated('basic', 'admin'),
			function(req, res, next) {
				var page = req.validatedInput.page || 0;
				var limit = Math.max(0, Math.min(req.validatedInput.limit || 100, 1000));
				User.list(page, limit, function (err, result) {
					if (err) {
						return next(err);
					}

					return res.status(200).json(_.map(result, function (user) {
						return user.publicObject();
					}));
				})
			},
		],

		get: [
			bodyvalidator({
				type: 'object',
				properties: {
					uuid: {
						description: 'the target user\'s uuid',
						type: 'string',
						required: true,
					},
				},
			}),
			Authentication.ensureAuthenticated('basic', 'admin'),
			function(req, res, next) {
				User.findById(req.validatedInput.uuid, function (err, result) {
					if (err) {
						return next(err);
					}

					return res.status(200).json(result.publicObject());
				})
			},
		],

		update: [
			function (req, res, next) {
				req.body.uuid = req.params.uuid;
				next();
			},
			bodyvalidator({
				type: 'object',
				properties: {
					uuid: {
						description: 'the target user\'s uuid',
						type: 'string',
						required: true,
					},
					_rev: {
						description: 'the revision on which the update is based',
						type: 'string',
						required: true,
					},
					email: {
						description: 'the user\'s email address',
						type: 'string',
						format: 'email',
						required: true,
					},
					roles: {
						description: 'the user\'s roles',
						type: 'array',
						required: true,
						items: {
							type: 'string',
							enum: User.ROLES,
						},
					},
					password: {
						description: 'the user\'s new password',
						type: 'string',
						required: false,
					},
				},
			}),
			Authentication.ensureAuthenticated('basic', 'admin'),
			function(req, res, next) {
				User.findById(req.validatedInput.uuid, function (err, user) {
					user._rev = req.validatedInput._rev;
					user.email = req.validatedInput.email;
					user.roles = req.validatedInput.roles;

					function storeUser() {
						user.save(function (err, result) {
							if (err) {
								return next(err);
							}

							return res.status(200).json(result.publicObject());
						});
					}

					if (req.validatedInput.password) {
						user.setPassword(req.validatedInput.password, function (err) {
							if (err) {
								return next(err);
							}

							return storeUser();
						});
					} else {
						storeUser();
					}
				});
			},
		],

		create: [
			bodyvalidator({
				type: 'object',
				properties: {
					email: {
						description: 'the user\'s email address',
						type: 'string',
						format: 'email',
						required: true,
					},
					roles: {
						description: 'the user\'s roles',
						type: 'array',
						required: true,
						items: {
							type: 'string',
							enum: User.ROLES,
						},
					},
				},
			}),
			Authentication.ensureAuthenticated('basic', 'admin'),
			function(req, res, next) {
				var user = new User({
					email: req.validatedInput.email,
					roles: req.validatedInput.roles,
				});

				async.waterfall([
					user.save.bind(user),
					function (user, next) {
						//mail.sendInviteConfirmation(user, function (err) {
							return next(err, user);
						//});
					},
				], function (err, user) {
					if (err) {
						return next(err);
					}

					return res.status(201).json(user.publicObject());
				});
			},
		],

		delete: [
			bodyvalidator({
				type: 'object',
				properties: {
					uuid: {
						description: 'the target user\'s uuid',
						type: 'string',
						required: true,
					},
					_rev: {
						description: 'the revision on which the update is based',
						type: 'string',
						required: true,
					},
				},
			}),
			Authentication.ensureAuthenticated('basic', 'admin'),
			function(req, res, next) {
				User.findById(req.validatedInput.uuid, function (err, user) {
					user._rev = req.validatedInput._rev;

					user.delete(function (err) {
						if (err) {
							return next(err);
						}

						return res.status(204).send();
					});
				});
			},
		],
	};
})();