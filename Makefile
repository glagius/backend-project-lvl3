install: install

run:
	bin/page-loader.mjs ${flag} ${path} ${url}

install:
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
