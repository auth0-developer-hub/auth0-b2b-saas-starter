# **SaaStart** from Auth0 by Okta

A secure and high-performance starting point for building B2B SaaS web applications.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/auth0-developer-hub/auth0-b2b-saas-starter&repository-name=auth0-saas-starter&external-id=b2b-saas-starter-template&integration-ids=oac_7V7TGP5JUHCpSncpiy3XWwL0)

## Overview

![image](https://github.com/auth0-developer-hub/auth0-b2b-saas-starter/assets/6372810/e8ab12fe-d95b-4e11-8e9e-242eb9c547b6)

> Ready to begin? Jump ahead to the [Getting Started](#getting-started) section.

This sample application provides developers with a solid foundation to kickstart their journey into building a business-to-business software-as-a-service (B2B SaaS) application. With a carefully selected stack of well-documented and widely adopted technologies, along with seamless integration with Auth0 for identity and login management, this starter kit aims to streamline the development process, enabling you to focus on building out your core product instead of worrying about the complexities of SaaS identity management and secure customer onboarding.

It incorporates best practices and industry-standard technologies to provide a robust and scalable solution for building secure software, with all the capabilities you need to be competitive, resilient, and scalable. The project includes the architecture and components you need to get started, authentication and authorization powered by Auth0, and deployment instructions that make it easy to move to staging or production when you're ready.

## Target use case

Use this to bootstrap a SaaS application with the following commonly needed capabilities:

- Multi-tenancy with a single pool of users in a shared user database (see: [Multiple Organization Architecture](https://auth0.com/docs/get-started/architecture-scenarios/multiple-organization-architecture#users-shared-between-organizations))
- Sign up with tenant ([Organization](https://auth0.com/docs/manage-users/organizations)) creation
- Logged in / Logged out product landing page experience
- User management with invitation workflows, create/delete user capabilities, and RBAC roles
- Self-service user profile management, password reset, and MFA configuration
- Self-service Enterprise Single Sign-On (SSO) configuration using
  - OIDC
  - SAML
- Ability for end-users to verify domain ownership before associating their email domains with [home realm discovery](https://auth0.com/docs/authenticate/login/auth0-universal-login/identifier-first#define-home-realm-discovery-identity-providers)
- Just-in-time user provisioning OR automatic directory sync with SCIM _(coming soon)_
- API client management with self-service create/delete capabilities _(coming soon)_
- Configurable security policies:
  - Enforce MFA
  - Session lifetime _(coming soon)_
  - Break-glass access for admin roles _(coming soon)_

## Getting Started

### Prerequisites

1. Node.js v20 or later is required to run the bootstrapping process. We recommend using [`nvm`](https://github.com/nvm-sh/nvm) to manage node versions in your development environment. Click these links to [learn how to install nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#install--update-script) or [how to use nvm](https://github.com/nvm-sh/nvm?tab=readme-ov-file#usage) to make sure you're using Node 20+ in your development environment.
2. You must have [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) or a comparable package manager installed in your development environment. These instructions assume that you're using `npm`, which is automatically included as part of the Node.js installation from prerequisite 1.
3. Create a new Auth0 tenant. This tenant will be configured automatically by our bootstrapping command during the installation process. You can sign up for a free Auth0 account at [https://auth0.com/signup](https://auth0.com/signup?utm_source=github&utm_medium=thirdpartyutm_campaign=saastart). See [Create Tenants](https://auth0.com/docs/get-started/auth0-overview/create-tenants) in the Auth0 docs if you need help.

> [!IMPORTANT]
> Creating a new tenant before you continue is **highly recommended** so that you don't accidentally change the configuration in any existing Auth0 projects you might have.

### Step One: Clone and install dependencies

1. Clone this repo to your development environment. Navigate to a directory where you want to work in a terminal program, and run the following command:

   ```shell
   git clone https://github.com/auth0-developer-hub/auth0-b2b-saas-starter.git
   ```

2. Navigate into the directory by typing the following command:

   ```shell
   cd auth0-b2b-saas-starter
   ```

3. Install dependencies for the project using your favorite package manager. For example, if you're using npm, type:

   ```shell
   npm install
   ```

### Step Two: Install and Log in with the Auth0 CLI

This project uses the Auth0 CLI to make setting up your tenant a lot easier, by scripting away as much manual work as possible. If you want to familiarize yourself with the Auth0 CLI, read [Auth0 CLI Basics](https://developer.auth0.com/resources/labs/tools/auth0-cli-basics).

1. You will need to install the Auth0 CLI. It will be used by the bootstrap script to create the resources needed for this sample in your Auth0 tenant. Instructions for installation are available at the [Auth0 CLI github repo](https://github.com/auth0/auth0-cli).

   **For example**, users on OSX using [Homebrew](https://brew.sh/) can run the following command to install the CLI:

   ```shell
   brew tap auth0/auth0-cli && brew install auth0
   ```

   You can confirm whether or not the CLI is correctly installed by running the following command:

   ```shell
   auth0 --version
   ```

   A successful installation will result in a response with the CLI version number printed out, like this:

   ```shell
   auth0 version 1.4.0 54e9a30eeb58a4a7e40e04dc19af6869036bfb32
   ```

2. Log in by entering the following command and following the instructions to choose a specific tenant to authenticate with:

   ```shell
   auth0 login --scopes "update:tenant_settings,create:connections,create:client_grants,create:email_templates,update:guardian_factors"
   ```

   Be sure to select `As a user` when prompted: `How would you like to authenticate?`. This will take you through a flow that will securely retrieve a Management API token for your Auth0 tenant.

   > **Warning**
   >
   > At the **Authorize App** step, be sure to select the correct tenant. This is the tenant that will be bootstrapped in the next steps.

### Step Three: Bootstrap the Auth0 tenant

This step will create and update entities in your Auth0 tenant. The provided script will use the Auth0 CLI to provision the resources required for this sample application:

- Creating the appropriate clients (called Applications in Auth0)
- Creating admin and member roles,
- Creating actions for setting roles and security policies
- Creating email and login templates
- Enabling MFA factors

Finally, it will save environment variables for your tenant in the application directory.

> **Warning**
>
> Only run the following command on a newly created tenant to avoid changing existing configuration or introducing conflicting elements to your existing Auth0 tenants!
>
> If you are creating a new Auth0 tenant at this point in the process, go back to step 2 in order to ensure you're logged into the correct Auth0 tenant.

Run the following command:

```shell
npm run auth0:bootstrap
```

Once the script has successfully completed, a `.env.local` file containing the environment variables will be written to the root of your project directory.

### Step Four: Run the sample application

1. Run the development server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

   > Note: If you're running the application on a different port, adjust the provided localhost URL accordingly.

   You can proceed to interact with the app as if you were a user: create an account, navigate to the settings, explore the identity capabilities.

3. Start editing to build your own SaaS application - for example, modify `app/page.tsx`. The browser will hot-reload to show changes as you edit the file.

## Learn More

To learn more about Auth0, take a look at the following resources:

- [Understand how Auth0 Organizations Work](https://auth0.com/docs/manage-users/organizations/organizations-overview) - learn about how this project achieves multi-tenancy
- [Customize](https://auth0.com/docs/customize) - learn how to brand and internationalize all Auth0 interactions with your end-users

## Contributing

See [CONTRIBUTING](./CONTRIBUTING.md) for information.

Questions? Feedback? Drop us a line in the [Auth0 Community](https://community.auth0.com/t/saastart-b2b-saas-reference-app/136654)
