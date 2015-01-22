module.exports = (function () {
	var uuid = require('node-uuid');
	var log  = require('./log');

	return function (req, res, next) {
		var start = Date.now();

		req.id = uuid.v4();
		req.log = log.child({
			req_id: req.id,
		});

		req.log.info({
			req: req,
			session: req.session,
			time_start: start,
		}, 'incoming request');

		function writelog() {
			res.removeListener('finish', writelog);
			res.removeListener('close', writelog);

			var end = Date.now();

			req.log.info({
				res: res,
				time_end: end,
				time_response: end - start,
			}, 'request handled');
		}

		res.on('finish', writelog);
		res.on('close', writelog);

		next();
	};
})();