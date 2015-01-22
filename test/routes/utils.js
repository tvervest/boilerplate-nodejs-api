
var request = require('request');
var url = require('url');
var config = require('../../lib/utils/config');

module.exports = {
	requestFactory: function (method, endpoint, query, body, username, password, done) {
		return request({
			method: method,
			url: url.format({
				protocol: 'http',
				auth: (username && password) ? (username + ':' + password) : undefined,
				hostname: 'localhost',
				port: config.get('PORT'),
				pathname: endpoint,
				query: query,
			}),
			body: body,
		}, done);
	},
};
