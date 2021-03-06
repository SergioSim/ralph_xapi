# -- Docker
# Get the current user ID to use for docker run and docker exec commands
DOCKER_UID           = $(shell id -u)
DOCKER_GID           = $(shell id -g)
DOCKER_USER          = $(DOCKER_UID):$(DOCKER_GID)
COMPOSE              = DOCKER_USER=$(DOCKER_USER) docker-compose
COMPOSE_RUN          = $(COMPOSE) run --rm
COMPOSE_TEST_RUN     = $(COMPOSE_RUN)
COMPOSE_TEST_RUN_APP = $(COMPOSE_TEST_RUN) app

# ==============================================================================
# RULES

default: help

.env:
	cp .env.dist .env
	cp ./PythonBuddySandboxed/api/config.js.sample ./PythonBuddySandboxed/api/config.js

# -- Docker/compose
bootstrap: ## bootstrap the project for development
bootstrap: \
  .env \
  build \
  dev
.PHONY: bootstrap
build: ## build the app container
	@$(COMPOSE) build pythonbuddysandbox
	@$(COMPOSE) build app
.PHONY: build

dev: ## start app
	@$(COMPOSE) up -d app
	npm start --prefix ./PythonBuddySandboxed/
.PHONY: dev

# Nota bene: Black should come after isort just in case they don't agree...
lint: ## lint back-end python sources
lint: \
  lint-isort \
  lint-black \
  lint-flake8 \
  lint-pylint \
  lint-bandit
.PHONY: lint

lint-black: ## lint back-end python sources with black
	@echo 'lint:black started…'
	@$(COMPOSE_TEST_RUN_APP) black event
.PHONY: lint-black

lint-flake8: ## lint back-end python sources with flake8
	@echo 'lint:flake8 started…'
	@$(COMPOSE_TEST_RUN_APP) flake8
.PHONY: lint-flake8

lint-isort: ## automatically re-arrange python imports in back-end code base
	@echo 'lint:isort started…'
	@$(COMPOSE_TEST_RUN_APP) isort --recursive --atomic .
.PHONY: lint-isort

lint-pylint: ## lint back-end python sources with pylint
	@echo 'lint:pylint started…'
	@$(COMPOSE_TEST_RUN_APP) pylint --ignore event/migrations event
.PHONY: lint-pylint

lint-bandit: ## lint back-end python sources with bandit
	@echo 'lint:bandit started…'
	@$(COMPOSE_TEST_RUN_APP) bandit -qr --skip B101 event
.PHONY: lint-bandit

logs: ## display app logs (follow mode)
	@$(COMPOSE) logs -f app
.PHONY: logs

status: ## an alias for "docker-compose ps"
	@$(COMPOSE) ps
.PHONY: status

test: ## run back-end tests
	bin/pytest
.PHONY: test

watch: ## run npm watch to recompile frontend on changes
	docker-compose run --rm -uroot app npm run watch --prefix ./frontend
.PHONY: watch

# -- Misc
help:
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help
