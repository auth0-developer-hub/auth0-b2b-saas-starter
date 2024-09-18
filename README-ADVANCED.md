# Advanced Instructions
This file contains steps that you can take for advanced configuration of your local environment. These instructions assume you've already run the Getting Started instructions located in the project's main README.md file.

## Mimick a production environment locally, with https (using Caddy as an example)

This section guides you through setting up a reverse proxy server to enable local HTTPS development for your project. The process involves installing Caddy, creating a configuration file (Caddyfile), setting up local domain resolution, and running Caddy. 

This setup allows you to access your local development server via HTTPS using a custom domain, mimicking a production environment while working locally. It's particularly useful for testing features that require secure connections or specific domain configurations.

### Instructions:

1. Install Caddy using your operating system's package manager. Check out Caddy's installation instructions for specific steps. For example, on OSX using homebrew, you could use the following command:
```shell
brew install caddy nss
```
2. Create a file called Caddyfile in the /auth0-b2b-saas-starter/ directory on your local machine. If you have cloned the repo to a different directory, make sure to use that instead.

```shell
cd ~/Developer/auth0-b2b-saas-starter
touch Caddyfile
```
3. Open the `Caddyfile` in your favorite code editor or IDE.
4. Enter the following values in the Caddyfile.
```bash
fake-production-url.com:443 {
	reverse_proxy 127.0.0.1:3000
	tls internal
}
```
5. Add the following line to the end of /etc/hosts 
NOTE: you have to use superuser to edit the hosts file
Example: `sudo vi /etc/hosts` or `sudo code /etc/hosts`)
```shell
# SaaStart
127.0.0.1 fake-production-url.com
```
6. In a new terminal window, navigate to the repository folder and use the `caddy run` command to start the process.
```shell
cd ~/work/assemble
caddy run # You will have to enter your password or touch ID to approve the keychain addition
```

In some cases you might get the error message “ERROR pki.ca.local failed to install root certificate”, but that's not an indication that Caddy is not working.

### Testing Caddy
1. Run the following cURL command:
```shell
 curl -vI https://fake-production-url.com
```

Amongst the overall output, you should be able to see the following lines included:
```shell
* Server certificate:
*  subject: [NONE]
*  start date: {unix-style timestamp}
*  expire date: {unix-style timestamp}
*  subjectAltName: host "fake-production-url.com" matched cert's "fake-production-url.com"
*  issuer: CN=Caddy Local Authority - ECC Intermediate
*  SSL certificate verify ok.
```

---

## Use an email platform for managing transactional email while developing (using Mailtrap as an example)

This section guides you through setting up an email platform for easy local testing and development.

When simulating a production environment on your personal development environment, it can also be helpful to test email delivery and manage transactional emails without actually sending emails to real users. This can be achieved with an email platform of your choice, with this guide focusing on [Mailtrap.io](https://mailtrap.io) as one example. These services can act as a “fake” SMTP email provider, collecting and displaying the email messages it was supposed to send without actually delivering them. This allows you to test email functionality while creating organizations and inviting users while using any email addresses you want, even those that aren't real. This makes a solution like this ideal for troubleshooting and testing SaaStart.

> [!IMPORTANT]
> You must use an email domain that actually exists and has an MX record for testing. For example, using `acme.com` will work, but `acmeairlines.net` will not, as it lacks a valid MX record.

### Step 1: Set Up a Mailtrap Account

1. **Sign Up:** Go to [Mailtrap.io](https://mailtrap.io) and sign up for an account. You can use your Google account for quick registration.
2. Choose the **Email Testing** option during the sign-up process.
3. **Create an Inbox:** Once signed in, go to [Mailtrap Inboxes](https://mailtrap.io/inboxes) and select **My Inbox**. This is where intercepted email messages will be displayed.
4. **Obtain SMTP Credentials:** Open your inbox and click on **Show Credentials** to reveal the SMTP setup details. You'll need the host, port, username, and password to configure Mailtrap as your SMTP provider in Auth0.

### Step 2: Configure Auth0 to Use Mailtrap

1. **Access Your Auth0 Tenant:** Log in to your Auth0 dashboard and navigate to your tenant.
2. **Set Up the Email Provider:** Go to **Branding > Email Providers** in the Auth0 dashboard. Enable **Use my own email provider** and select **SMTP**.
3. **Populate SMTP Details:** Enter the SMTP credentials you obtained from Mailtrap:
     - **Host:** Use the host provided by Mailtrap.
     - **Port:** Use port `587` or `2525`.
     - **Username and Password:** Enter the credentials from Mailtrap.
4. Click **Save** to apply the settings.

> [!IMPORTANT]
> When entering the "From" email address in the SMTP Provider Settings, **do not** include `auth0.com` or `okta.com` in the email subdomain, as this will prevent the setup from working.

### Step 3: Test Email Delivery in Auth0

1. **Send a Test Email:** After configuring Mailtrap as your SMTP provider, click on **Send Test Email** in the Auth0 dashboard. You can use any email address for testing, even a fake one.
2. **Verify Email in Mailtrap:** Go back to your Mailtrap inbox and verify that the test email has been received. You can now inspect the email content, subject, and other details to ensure everything is working correctly.

