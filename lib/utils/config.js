var nconf = require('nconf');

module.exports = nconf
	.argv({
		'PORT': {
			alias: 'port',
		},
		'DATABASE.URL': {
			alias: 'db-url',
		},
		'DATABASE.USERNAME': {
			alias: 'db-user',
		},
		'DATABASE.PASSWORD': {
			alias: 'db-pass',
		},
		'DATABASE.PREFIX': {
			alias: 'db-prefix',
		},
		'REDIS.URL': {
			alias: 'redis-url',
		},
		'PUBLIC': {
			alias: 'public',
		},
		'SESSION.SECRET': {
			alias: 'session-secret',
		},
		'SILENT': {
			alias: 'silent',
		},
		'LOGLEVEL': {
			alias: 'loglevel',
		},
		'WEB.INTERFACE.URL': {
			alias: 'web-interface-url',
		},
		'MANDRILL.KEY': {
			alias: 'mandrill-key',
		},
		'MANDRILL.FROM.EMAIL': {
			alias: 'mandrill-from-email',
		},
		'MANDRILL.FROM.NAME': {
			alias: 'mandrill-from-name',
		},
	})
	.env('_')
	.file({
		file: __dirname + '/../../config.json'
	});