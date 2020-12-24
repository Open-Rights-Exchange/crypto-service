
## Crypto Service

This app is an Express(Node) server that provides a traditional Restful HTTP API that serves GET and POST requests

It provides basic crypto and blockchain-related functions including:

* generating public/private key pairs
* signing transactions
* encrypting / decrypting payloads - supporting both symmetric and asymmetric encryption
* decrypt and re-encrypt with different keys - in a single call

This service is mostly stateless - it holds no user data or keys - but it does hold developer (app) registrations in order to issue api keys
## Running on local machine

1. Create .env file in project's root directory from .env.staging value in LastPass
2. Important: Run Node 12.0 or higher on your local machine

## Environment Config
* Configuration and secrets are stored in .env in the root of the app folder
* .env files are never checked-into the github repo (excluded via .gitignore)


### `npm run dev`

Runs the app in the development mode<br>
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

### `npm run build`

Builds the app for production into the `dist folder.<br>

### `npm run start`

Runs the app in production mode. Expects that npm run build has been run.<br>


## Deploying to server

We are using CircleCI to build and deploy this app to Google Cloud

* When you push an update to github master or staging branch, it will trigger a build on CircleCI <br>
* The circleci build script in circle.yml will replace the Google App Service name and .env files for prod or staging<br>
* The Google app project name is defined in circle.yml
* The Google App Engine service name is defined in the scripts/config/prod.app.yaml and .../staging.app.yaml files. The app.yaml file in the project root is replace with this.<br>

