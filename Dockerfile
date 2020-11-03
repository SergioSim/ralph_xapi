# -- Base image --
FROM python:3.8-slim as base

# Upgrade pip to its latest release to speed up dependencies installation
#RUN pip install --upgrade pip
RUN python -m pip install --upgrade pip ;\
    apt-get update && \
    apt-get install -y gcc default-libmysqlclient-dev curl gnupg ca-certificates iproute2 && \
    curl -L https://deb.nodesource.com/setup_12.x | bash  && \
    apt-get update -y  && \
    apt-get install -y nodejs && \
    npm install npm@latest -g && \
    rm -rf /var/lib/apt/lists/*

# -- Builder --
FROM base as builder

WORKDIR /build

COPY . /build/

RUN python setup.py install

# -- Core --
FROM base as core

COPY --from=builder /usr/local /usr/local

WORKDIR /app

# -- Development --
FROM core as development

# Copy all sources, not only runtime-required files
COPY . /app/

# Uninstall event_to_xapi_for_ralph and re-install it in editable mode along with development
# dependencies
RUN pip uninstall -y ralph_xapi ; \
    pip install -e .[dev] ; \
    cd frontend && npm install && \
    cp -r node_modules/tinymce/skins static/frontend/ && cd ..

# To install new npm packages have to login as root and run npm install package.
# Are there better options ?

# Un-privileged user running the application
USER ${DOCKER_USER:-1000}


# -- Production --
FROM core as production

# Un-privileged user running the application
USER ${DOCKER_USER:-1000}

ENTRYPOINT ralph_xapi

