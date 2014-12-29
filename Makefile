NODE_MODULES = ./node_modules
PACKAGE = ./package.json
SCHEMA = ./sql/schema.sql

all: $(NODE_MODULES)
	grunt

$(NODE_MODULES): $(PACKAGE)
	npm install
