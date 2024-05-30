# Bootstrapping your Auth0 tenant

This guide walks you through the steps required to bootstrap your Auth0 tenant to create the necessary resources for this sample application to work.

## Step 0: Clone the repo

> [!NOTE]  
> Node.js v20 or later is required to run this script

Clone [this repo](https://github.com/auth0-developer-hub/auth0-b2b-saas-starter) locally and install the dependencies:

```shell
npm i
```

## Step 1: Install the Auth0 CLI

You will need to install the [Auth0 CLI](https://github.com/auth0/auth0-cli). It will be used by the bootstrap script to create the resources needed for this sample in your Auth0 tenant.

You can confirm that you've correctly installed the CLI by running the following command:

```shell
auth0 --version
auth0 version 1.4.0 54e9a30eeb58a4a7e40e04dc19af6869036bfb32
```

You should see the CLI version number printed out.

Once you've validated the CLI has been installed, you will need to login:

```shell
auth0 login --scopes "update:tenant_settings,create:connections,create:client_grants,create:email_templates,update:guardian_factors"
```

Be sure to select **As a user** when prompted: *"How would you like to authenticate?"*. This take you through a flow to securely retrieve a Management API token for your Auth0 tenant.

## Step 2: Run the Bootstrap Script

Behind the scenes, the bootstrap script will use the Auth0 CLI to provision the resources required for this sample application.

```shell
npm run auth0:bootstrap
```

Once the script has successfully completed, a `.env.local` file containing the environment variables will be written to the root of your project directory.