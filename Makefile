
gulp = ./node_modules/.bin/gulp

test:
	@LOGLEVEL=fatal DATABASE_PREFIX=nock_ $(gulp) test

.PHONY: test