var gulp = require('gulp');
var watch = require('gulp-watch');
var mocha = require('gulp-mocha');
var cover = require('gulp-coverage');
var gutil = require('gulp-util');
var debug = require('gulp-debug');
var server = require('./gulp/startserver');

var noop = function () {};

function logError(err) {
	gutil.log(gutil.colors.red(err.message));
}

gulp.task('test', function (done) {
	var nock = require('nock');
	//nock.recorder.rec();

	function runTests(done) {
		done = done || noop;

		gulp.src('test{,/**}/*.spec.js')
			.pipe(server.start({
				DATABASE_PREFIX: 'nock_',
			}))
			.on('error', function (err) {
				logError(err);
				done();
			})
			.pipe(mocha({
				reporter: 'spec',
			}))
			.on('error', logError)
			.on('end', function () {
				console.log('end');
				server.stop(done);
			});
	}

	runTests(function () {
		gutil.log('Watching for changes...');
		watch([
			'{,**/}*.json',
			'test{,/**}/*.spec.js',
			'lib{,/**}/*.js',
		], function () {
			runTests(function () {
				gutil.log('Watching for changes...');
			});
		});
	});
});

gulp.task('cover', function (done) {
	//var nock = require('nock');
	//nock.recorder.rec();

	gulp.src('test{,/**}/*.spec.js')
		.pipe(server.start({
			DATABASE_PREFIX: 'nock_',
		}))
		.on('error', function (err) {
			logError(err);
			done();
		})
		.pipe(cover.instrument({
			pattern: 'lib{,/**}/*.js',
			debugDirectory: 'lib-cov',
		}))
		.pipe(mocha({
			reporter: 'spec',
		}))
		.on('error', function (err) {
			logError(err);
			server.stop(done);
		})
		.pipe(cover.gather())
		.pipe(cover.format({
			reporter: 'html',
		}))
		.pipe(gulp.dest('reports'))
		.on('end', function () {
			server.stop(done);
		});
});
