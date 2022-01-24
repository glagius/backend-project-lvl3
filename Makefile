install:
	npm ci

link:
	npm link

setup: install link

test:
	npm test

test-watch:
	npm run test:watch

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish

.PHONY: test
