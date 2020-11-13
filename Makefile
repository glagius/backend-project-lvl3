install: install-deps

run:
	bin/index.js ${flag} ${path} ${url}

install-deps:
	npm ci

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish

install-local:
	npm link

.PHONY: test
