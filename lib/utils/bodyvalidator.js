var revalidator = require('revalidator');
var url         = require('url');
var _           = require('lodash');
var APIError    = require('./apierror');

function getRequestBody(req) {
	switch (req.method) {
		case 'GET':
		case 'DELETE':
			return _.chain({})
				.merge(req.query || {})
				.merge(req.params || {})
				.value();

		case 'POST':
		case 'PUT':
			return req.body || {};
	}

	return false;
}

module.exports = function bodyValidator(schema) {
	return function (req, res, next) {
		if (schema) {
			var data = getRequestBody(req);
			if (data === false) {
				return next(new APIError(400, 'bodyValidator does not support ' + req.method + ' requests'));
			}

			var result = revalidator.validate(data, schema);
			if (!result.valid) {
				return next(new APIError(400, [
					result.errors[0].property,
					result.errors[0].message,
				].join(' ')));
			}

			req.validatedInput = data;
		}
		return next();
	}
}
