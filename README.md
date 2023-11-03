# CAP-NET-MEL-Web-Back

## Software Versions
Node v16.16.0 (includes npm 8.11.0)
NestJs v8.1.0
MongoDB v5.0.9

## Prerequisites and Installations
Node v10 or above (includes npm)

## NodeJS
-Download NodeJs from official document depending upon the OS:
```bash
<https://nodejs.org/en/download/>
```

-Download NodeJs using apt command in Linux Terminal:
```bash
$ curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

-Download NodeJs using yum package management system:

Update the local repository to ensure you install the latest versions of Node.js and npm.
```bash
$ sudo yum update
```
Add the NodeSource repository to the system:
```bash
$ curl –sL https://rpm.nodesource.com/setup_16.x | sudo bash -
```
Output will prompt you to use the following command if you want to install Node.js and npm:
```bash
$ sudo yum install –y nodejs
```
Verify the installed software
```bash
$ node –version
$ npm –version
```

## NestJS
[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

```bash
$ npm i -g @nestjs/cli
```

## MongoDB

- Download MongoDB using Linux Terminal:

```bash
Import the public key used by the package management system.
$ sudo apt-get install gnupg

$ wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add - (This operation returns OK)
```

Create a list file for MongoDB:
```bash
$ echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
```

Reload local package database.
```bash
$ sudo apt-get update
```

```bash
Install the latest stable version of MongoDB packages.
$ sudo apt-get install -y mongodb-org
```

- Download MongoDB using the yum package manager:

Create a repo file /etc/yum.repos.d/mongodb-org-4.2.repo and add following line in it.

```bash
[mongodb-org-5.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/5.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-5.0.asc
```

Install the latest stable version of MongoDB.
```bash
$ sudo yum install -y mongodb-org
```

To install a specific release of MongoDB, specify each component package individually and append the version number to the package name.
```bash
$ sudo yum install -y mongodb-org-5.0.9 mongodb-org-database-5.0.9 mongodb-org-server-5.0.9 mongodb-org-shell-5.0.9 mongodb-org-mongos-5.0.9 mongodb-org-tools-5.0.9
```

## PM2 setup with node.js and npm 
- Install Git (if not install while setup PM2)
```bash
    $ sudo apt-get install git 
```
```bash
 $ sudo apt-get install build-essential
 $ sudo apt-get install curl openssl libssl-dev
``` 
- Install PM2 
```bash
$ sudo npm install pm2 -g
```

## Installing Project Dependencies
```bash
$ npm install
```

## Running the app in different environments 
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev 
```
project will start running on localhost:3000

```bash
# staging mode
$ npm run start:staging
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
### Reference links
- pm2 =<https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps>
- Node.js - <https://nodejs.org/en/download/>
- Nestjs - <https://docs.nestjs.com/>
- MongoDB - <https://docs.mongodb.com/v4.4/tutorial/install-mongodb-on-ubuntu/>  
- Mongoose - <https://www.npmjs.com/package/mongoose>
sudo
## License

Nest is [MIT licensed](LICENSE).
