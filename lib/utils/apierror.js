(function () {
	var util = require('util');
	
	function APIError(code, message) {
		APIError.super_.call(this);
		this.status = code;
		this.message = message;
	}

	util.inherits(APIError, Error);

	APIError.prototype.name = 'APIError';

	module.exports = APIError;

})();