
## Crypto Service

This app provides basic crypto and blockchain-related functions including:

* generating public/private key pairs
* signing transactions
* encrypting / decrypting payloads - supporting both symmetric and asymmetric encryption
* decrypt and re-encrypt with different keys - in a single call

This service is mostly stateless - it holds no user data or keys - but it does hold developer (app) registrations in order to issue api keys
## Starting service

- Create .env file in project's root directory - copy .env.example to .env and replace values
- Generate a public/private Key pair for server's use (see .env.example BASE_PUBLIC_KEY, BASE_PRIVATE_KEY)
- Important: Run Node 12.0 or higher on your local machine

- ### `npm run dev`

  Runs the service in the development mode<br>
Open [http://localhost:8080](http://localhost:8080) to view it in the browser.

- ### `npm run build`
  Builds the app for production into the `dist folder.<br>
- ### `npm run start`

  Runs the app in production mode. Expects that npm run build has been run.<br>

## Environment Config
* Configuration and secrets are stored in .env in the root of the app folder
* .env files are never checked-into the github repo (excluded via .gitignore)

## Example Code
- examples/helpers.ts provides code you can use to generate auth tokens, etc.
- examples/demo.ts contains example code to call the API endpoints.
  To run demo code: 
  
  ```ts-node examples/demo.ts```

