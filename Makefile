setup:
	npm ci

link:
	npm link

start: setup link

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

install-local:
	npm link

build:
	npm run build

.PHONY: test
