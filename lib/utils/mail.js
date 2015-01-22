'use strict';

module.exports = (function () {
	var config   = require('./config');
	var log      = require('./log');
	var _        = require('lodash');
	var mandrill = require('mandrill-api/mandrill');

	var client = new mandrill.Mandrill(config.get('MANDRILL:KEY'));

	function sendTemplate(template, subject, to, attachments, done) {
		if (done === undefined) {
			// attachments is an optional parameter
			done = attachments;
			attachments = [];
		}

		var message = {
			subject: subject,
			from_email: config.get('MANDRILL:FROM:EMAIL'),
			from_name: config.get('MANDRILL:FROM:NAME'),
			subaccount: config.get('MANDRILL:SUBACCOUNT'),
			to: _.map(to, function (recipient) {
				if (_.isString(recipient)) {
					return recipient;
				} else {
					return {
						email: recipient.user.email,
						name: [recipient.user.firstname, recipient.user.lastname].join(' '),
					};
				}
			}),
			track_opens: true,
			track_clicks: true,
			preserve_recipients: true,
			global_merge_vars: [{
				name: 'WEB_INTERFACE_URL',
				content: config.get('WEB:INTERFACE:URL'),
			}],
			merge_vars: _.map(to, function (recipient) {
				var result = {
					rcpt: _.isString(recipient) ? recipient : recipient.user.email,
					vars: [],
				};

				if (_.isObject(recipient)) {
					result.vars.push({
						name: 'FNAME',
						content: recipient.user.firstname,
					});
					result.vars.push({
						name: 'LNAME',
						content: recipient.user.lastname,
					});
					result.vars = result.vars.concat(recipient.vars || []);
				}

				return result;
			}),
			attachments: attachments,
		};

		client.messages.sendTemplate({
			template_name: template,
			template_content: [],
			message: message
		}, function(result) {
			done(null, result);
		}, function(err) {
			message.err = err;
			log.error(message, 'A mandrill error occurred');
			done(err);
		});
	}

	return {
//		sendInviteConfirmation: function (user, done) {
//			return sendTemplate('my-api-account-confirm', 'You have been invited!', [{
//				user: user,
//				vars: [{
//					name: 'ACTIVATE_ACCOUNT_URL',
//					content: config.get('WEB:INTERFACE:URL') + '/#/activate?token=' + user.activationToken,
//				}]
//			}], done);
//		},
	};
})();