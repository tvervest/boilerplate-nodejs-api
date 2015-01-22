var expect = require('chai')
	.expect;
var timekeeper = require('timekeeper');
var nock = require('nock');

var Users = require('../../lib/models/users');

// Create a Test Suite
describe('Users model:', function () {
	describe('a new instance', function () {
		var topic;
		var creationTime = 1421971200;

		beforeEach(function () {
			timekeeper.freeze(new Date(creationTime));
			topic = new Users({
				roles: ['user'],
				email: 'test@example.com',
			});
			timekeeper.reset();
		});

		afterEach(function () {
			topic = null;
		});

		it('should set the password to false by default', function () {
			expect(topic.password)
				.to.be.a('boolean')
				.and.equal(false);
		});

		it('should set the creation time', function () {
			expect(topic.created)
				.to.be.a('number')
				.and.equal(creationTime);
		});
	})
});
