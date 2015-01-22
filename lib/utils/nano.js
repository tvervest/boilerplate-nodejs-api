var nano   = require('nano');
var url    = require('url');
//var process	= require('process');
var config = require('./config');
var log    = require('./log');

try {
	var databaseURL = config.get('DATABASE:URL');
	var parsedURL = url.parse(databaseURL);

	var username = config.get('DATABASE:USERNAME');
	var password = config.get('DATABASE:PASSWORD');

	if (username && password) {
		parsedURL.auth = username + ':' + password;
	}

	module.exports = nano({
		url: url.format(parsedURL),
		/*
		log: function (id, args) {
			log.info({
				id: id,
				args: args,
			}, 'couchdb request');
		},
		*/
	});

	log.info('Connecting to database on ' + databaseURL + (username && password ? ' as ' + username : ''));
} catch (err) {
	// log the error and re-throw it
	log.error({err: err});
	throw err;
}