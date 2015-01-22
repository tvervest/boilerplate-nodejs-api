var through = require('through2');
var cp = require('child_process');
var psTree = require('ps-tree');
var _ = require('lodash');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

const noop = function () {};
const PLUGIN_NAME = 'gulp-startserver';

module.exports = function () {
	var server;
	var isStopping = false;
	var isStarting = false;

	function kill(pid, signal, callback) {
		signal = signal || 'SIGKILL';

		var killTree = true;
		if (killTree) {
			psTree(pid, function (err, children) {
				[pid].concat(
						children.map(function (p) {
							return p.PID;
						})
					)
					.forEach(function (tpid) {
						try {
							process.kill(tpid, signal);
						} catch (ex) {}
					});
				(callback || noop)();
			});
		} else {
			try {
				process.kill(pid, signal);
			} catch (ex) {}
			(callback || noop)();
		}
	}

	function startServer(env, done) {
		gutil.log('starting server...');
		isStarting = true;

		server = cp.spawn('node', [
			'index.js',
		], {
			env: _.defaults(process.env, env || {}),
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		server.stdout.on('data', function (data) {
			//gutil.log('server output:', gutil.colors.dim(data.toString()));
			if (isStarting) {
				data = JSON.parse(data.toString('utf8'));

				if (data && data.msg.match(/.*started server.*/)) {
					gutil.log('server started');
					isStarting = false;
					done();
					done = noop;
				}
			}
		});

		server.stderr.on('data', function (data) {
			done(new PluginError(PLUGIN_NAME, data.toString()));
			done = noop;
			isStarting = false;
		});
	}

	return {
		start: function (env) {
			return through({
				objectMode: true,
			}, null, function (done) {
				if (server) {
					return done(new PluginError(PLUGIN_NAME, 'server already started'));
				} else {
					startServer(env, done);
				}
			});
		},

		stop: function (done) {
			if (server && !isStopping) {

				gutil.log('stopping server...');
				isStopping = true;

				server.on('close', function () {
					gutil.log('server stopped');
					isStopping = false;
					server = null;

					done();
				});

				kill(server.pid);
			} else {
				(done || noop)();
			}
		},
	};
}();
