var bunyan = require('bunyan');
var config = require('./config');

module.exports = bunyan.createLogger({
	name: 'my-api',
	level: config.get('LOGLEVEL'),
	serializers: {
		req: bunyan.stdSerializers.req,
		res: bunyan.stdSerializers.res,
		err: bunyan.stdSerializers.err,
	},
});