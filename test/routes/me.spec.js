var expect = require('chai')
	.expect;
var utils = require('./utils');
var nock = require('nock');

// Create a Test Suite
describe('/me endpoint:', function () {
	describe('GET requests', function () {
		describe('with correct authentication', function () {
			var err, response, body;

			beforeEach(function (done) {
				nock('http://localhost:5984')
					.get('/nock_users/_design/details/_view/by_email?key=%22j.doe%40example.com%22&include_docs=true')
					.replyWithFile(200, __dirname + '/../data/users/details/by_email/single-user.json');

				utils.requestFactory('GET', '/me', null, null, 'j.doe@example.com', 'test123', function (_err, _response, _body) {
					err = _err;
					response = _response;
					body = _body;

					done();
				});
			});

			afterEach(function () {
				err = null;
				response = null;
				body = null;
			});

			it('should return the user\'s profile as JSON', function () {
				var parsedBody;
				expect(function () {
						parsedBody = JSON.parse(body);
					})
					.to.not.throw(Error);

				expect(parsedBody)
					.to.be.an('object')
					.and.deep.equal({
						_id: '2f44a37787add20a179fb7c95200133b',
						_rev: '1-90e22dc1e0826736180194965ed74397',
						created: 1417957535556,
						email: 'J.Doe@example.com',
						last_updated: 1421164268466,
						roles: [
							'user',
							'admin',
						],
					});
			});

			it('should reply with a 200 header', function () {
				expect(response.statusCode)
					.to.be.an('number')
					.and.equal(200);
			});
		});
	});
});
