# Advanced Instructions
This file contains steps that you can take for advanced configuration of your local environment. These instructions assume you've already run the Getting Started instructions located in the project's main README.md file.

## Use `caddy` to mimick a production environment locally

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
*  start date: May  9 19:54:18 2024 GMT
*  expire date: May 10 07:54:18 2024 GMT
*  subjectAltName: host "fake-production-url.com" matched cert's "fake-production-url.com"
*  issuer: CN=Caddy Local Authority - ECC Intermediate
*  SSL certificate verify ok.
