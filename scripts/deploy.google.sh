#!/usr/bin/env bash

# This is run by circle.yml script as part of continuous integration
# to run manually, pass in a --version=$SERVICE_VERSION argument
    # deploy to AppEngine
    # where $1 = --version=$SERVICE_VERSION
    # where $2 = --project=$project_id
    gcloud -q app deploy app.yaml --promote $1 $2 --verbosity=info
    # Run our E2E Test
    #- python e2e_test.py

