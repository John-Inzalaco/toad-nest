# Getting Started with Project TOAD running on macOSX


## Overview

We will be setting up a Node.js 18.16.0 development environment on macOSX 13 Ventura.

Older versions of OSX are mostly compatible so follow along as far as you can and then Google search for any problems that you may run into.  There are plenty of people who have run into the same situation.


## Installing Homebrew

First, we need to install [Homebrew](https://brew.sh). Homebrew allows us to install and compile software packages easily from source.

Homebrew comes with a very simple install script. When it asks you to install XCode CommandLine Tools, say yes.

Open Terminal and run the following command:


```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Ensure the next two steps are run to add homebrew to your PATH:
```
(echo; echo 'eval "$(/opt/homebrew/bin/brew shellenv)"') >> /Users/noel/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```



## Installing Node.js

Next we're going to be installing Node using a version manager called [ASDF](https://asdf-vm.com/).

The reason we use ASDF over nvm or others is that ASDF can manage other languages like Ruby, too.

Installing `asdf` is a simple two step process. First you install `asdf`, and then add it to your shell:


```
cd 
git clone https://github.com/excid3/asdf.git ~/.asdf
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.zshrc
echo '. "$HOME/.asdf/completions/asdf.bash"' >> ~/.zshrc
echo 'legacy_version_file = yes' >> ~/.asdfrc
exec $SHELL
```


Then we can install ASDF plugins for each language we want to use. For Node, we can install Node.js for our frontend Javascript.


```
asdf plugin add nodejs
```


Then we can install the latest Node.js for handling Javascript in our apps:


```
asdf install nodejs 18.16.0
asdf global nodejs 18.16.0

which node
#=> /Users/username/.asdf/shims/node
node -v
#=> 18.16.1

# Install yarn
npm install -g yarn
```



## Configuring Git

We'll be using Git for our version control system so we're going to set it up to match our [Github](https://github.com/) account. If you don't already have a Github account, make sure to [register](https://github.com/). It will come in handy for the future.

Replace the example name and email address in the following steps with the ones you used for your Github account.


```
git config --global color.ui true 
git config --global user.name "YOUR NAME" 
git config --global user.email "YOUR@EMAIL.com" 
ssh-keygen -t ed25519 -C "YOUR@EMAIL.com"
```


The next step is to take the newly generated SSH key and add it to your Github account. You want to copy and paste the output of the following command and [paste it here](https://github.com/settings/ssh).


```
cat ~/.ssh/id_ed25519.pub
```


Once you've done this, you can check and see if it worked:


```
ssh -T git@github.com
```


You should get a message like this:


```
Hi <username>! You've successfully authenticated, but GitHub does not provide shell access.
```



## Installing PostgreSQL

You can install [PostgreSQL](http://www.postgresql.org/) server and client from Homebrew:


```
brew install postgresql
```


Once this command is finished, it gives you a couple commands to run. Follow the instructions and run them:


```
# To have launchd start postgresql at login:
brew services start postgresql
```


Now that PostgreSQL is running, we have to create a user and set a default password. In the terminal:


```
/opt/homebrew/Cellar/postgresql@14/14.8_2/bin/createuser -s postgres
```

You can now get into the interactive terminal with this command:


```
sudo -i -u <machine username> psql postgres
```


Once inside the interactive terminal, to set the password for the postgres user:


```
postgres=# \password postgres
```


Note: we assume the local postgres password is simply ‘postgres’ (no quotes).

Enter your password when prompted.  Now, we just need to create our dashboard_development database:


```
postgres=# CREATE DATABASE dashboard_development;
```


While we we are here, we should create our testing databases:


```
postgres=# CREATE DATABASE test_nest_dashboard;
```



```
postgres=# CREATE DATABASE test_nest_reporting;
```


Now that the required databases are created, we can exit back out to our normal user terminal.


```
postgres=# \q
```


By exiting from the postgres console, we find ourselves  back at our normal user console.  Now it’s time to import the staging database to our local PostgreSQL instance.  We do this so that we can make all of the changes we want, without impacting anyone else.  Plus, if something catastrophic happens, we can just delete the database and begin again.


## Importing the Dashboard Database

Get the value of config/application.yml out of your 1Password account.  If you do not have an account, contact your manager immediately.

Copy+paste the value of DATABASE_URL from the next_staging section.  The url has a very standard format


```
postgres://username:password@host:port/dbname
```


Take the values from this URL and drop them into the following command:


```
pg_dump -U "<DB_USERNAME>" -h "<DB_HOST>" -d "<DB_NAME>" -p 5432 -F c -v -f dashboard_backup.dmp --exclude-table-data '*version*'
```


When you enter this command into your terminal, you will be asked for a password.  When prompted, enter the password given in the postgres:// URL above.  Once you hit enter, and all values are entered properly, then your database will begin to dump values onto your screen.  **_<span style="text-decoration:underline;">THIS COMMAND WILL TAKE SOME TIME TO COMPLETE!</span>_**

When the dump has complete, you now need to import the data into your postgresql instance.  Fortunately for us, this is an easy command line exercise:


```
pg_restore --verbose --clean --no-acl --no-owner -h localhost -U postgres -d dashboard_development dashboard_backup.dmp
```


This may prompt you for your postgres password, set in the previous section, to complete.


## Setting up the Project TOAD Repository

Checking out the Project TOAD repository is pretty standard.  The project is located in Github ([https://github.com/mediavine/nest-typescript-starter](https://github.com/mediavine/nest-typescript-starter)) and we use the SSH protocol to clone the repository.  The following command will clone our repository to a subdirectory called ./project-toad:


```
git clone git@github.com:mediavine/nest-typescript-starter.git project-toad
```


We can step into our directory:


```
cd project-toad
```


And use yarn to initialize and download dependencies, run scripts, etc:


```
yarn install
```


We have to make sure our environment variables are setup.  We rely on a .env file to control our environment variables.  So, copy the .env.example file to .env


```
cp .env.example .env
```


Fill in any values that you want to change/define.  One of the more typical practices is to set the REPORTING_DATABASE_URL value to the same format as the database url we exported:


```
REPORTING_DATABASE_URL=postgres://username:password@host:port/dbname
```


Once these values are set, we can initialize Prisma, our ORM tool.


```
yarn run prisma:generate
```


From here we are free to run the app!


```
# Runs Nest in watch mode
$ yarn start
```



## Testing


```
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```



##  Testing Setup

With the goal of rewriting the existing Rails API and maintaining the existing behavior, we have the advantage of having a working implementation to develop against. Our testing approach leverages this fact.

```mermaid
flowchart TD
    Jest[Jest Test Runner] -->|fetch if<br/>USE_RAILS_API=true| Rails[Rails API]
    Jest[Jest Test Runner] -->|fetch if<br/>USE_RAILS_API=false| Nest[Nest API]
    Rails --> DashboardDb[(test_nest_dashboard<br/>DB)]
    Rails --> ReportingDb[(test_nest_reporting<br/>DB)]
    Nest --> DashboardDb
    Nest --> ReportingDb
```

Our tests can run against the existing Rails API or the Nest API we are actively implementing. The API the tests run against can be toggled to the Rails API or the Nest API by setting the [USE_RAILS_API environment variable in jest.setup.js](https://github.com/mediavine/nest-typescript-starter/blob/main/jest.setup.js#L9). This guarantees the Nest API and the Rails API have exactly the same behavior, at least for all test cases we write.


###  Setting Up Dashboard Rails API for Testing

For this testing setup to work, both the Nest API and the Rails API need to be pointed at the same databases, since the tests seed specific data for each test case and expect the API to be running against that data. The `test_nest_dashboard` and `test_nest_reporting` databases are used in our tests. Thus, we just need to point the Rails API at these databases for the tests. In the `default` section of [database.yml](https://github.com/mediavine/dashboard/blob/09be7fff82e6da9ae238283bf26f7f5fd39742bc/config/database.yml#L24), set


```
user: postgres
password: postgres
host: localhost
database: dashboard_development
```


and in the `default` section of [reportingDatabase.yml](https://github.com/mediavine/dashboard/blob/09be7fff82e6da9ae238283bf26f7f5fd39742bc/config/reportingDatabase.yml#L5), set


```
host: localhost
username: postgres
password: postgres
database: test_nest_reporting
```


Now simply run `rails s -p 5000` as normal and our tests can be run against the Rails API.


### Strategies for Dealing with Dynamic Data

Our whole test suite runs within the same database schema. This approach has some drawbacks, mostly relating to losing the ability to hardcode ids and other fields that must be unique. Isolating every test in its own schema, however, would come with too much overhead at scale.

Thus, we have to have ways of dealing with these unique fields. For ids, we generally just let the database generate them. For other fields, we will usually use node's `randomUUID` function, oftentimes using the same random uuid through a single test to ensure all created resources' unique fields are essentially namespaced with that random uuid.

Data that changes every test run can make snapshots difficult. [Property Matchers](https://jestjs.io/docs/snapshot-testing#property-matchers) can help with this in some cases, but we will oftentimes do a pre-processing step replacing dynamic values with a placeholder before recording a snapshot. This has the added benefit over property matchers of asserting the exact value matches in the response vs the field just matching a regex. See the [getSite.test.ts](https://github.com/mediavine/nest-typescript-starter/blob/main/test/getSite.test.ts)'s `processSiteResponseBody` function for a fairly extreme example of this strategy.

If there aren't too many fields that need to be asserted on, it can also work to just do a regular old expect().toEqual() assertion and skip snapshotting.


## Implementing a Route

For re-implementing a route, we are generally following a test driven development approach. For new functionality, TDD is not necessarily always a recommended approach (although not necessarily bad if a spec is sufficiently detailed), but in this case where we have a functioning version of the API that already exists and we need to acquaint ourselves with its functionality anyways, it makes a lot of sense. The process for re-implementing a new route usually looks like this:



* Write tests against the existing Rails API for the route in [./test](https://github.com/mediavine/nest-typescript-starter/blob/main/test)
    * Cover all core functionality (oftentimes this will involve snapshotting the response body), error scenarios (401, 404, etc), and permissioning logic based on roles where applicable (The route can be accessed with role X but not role Y)
    * Tests will generally follow a format of
        * Seed some initial data in the database (a site, a user with a particular role, etc.). Some helper functions for this are present in [./test/__helpers.ts] for commonly needed resources.
        * Make API calls.
        * Assert the response is as expected, usually a snapshot and/or a status code check for error scenarios.
* Once you are confident in all existing functionality being covered with tests, write a route in a NestJS Controller/Service, porting over the Rails code.
* Make all tests pass. You can run Jest in watch mode (`yarn test --watch`) and comment/uncomment the `process.env.USE_RAILS_API = 'true';` line in [jest.setup.js](https://github.com/mediavine/nest-typescript-starter/blob/ebae2550038c6ad20b61eecb73d764a4d83d2940/jest.setup.js#L9) to go back and forth between the Rails API and the Nest API if any changes need to be made to the tests while developing.
* Run `yarn test --coverage` to confirm you have covered all new functionality with tests.

## Updating Prisma with DB Changes


For the time being, database migrations are still managed in the Rails app. We use [Prisma](https://www.prisma.io/docs/concepts) as our database ORM. Prisma can introspect an existing Postgres schema and output a schema.prisma file, which in turn is used to generate a TypeScript Prisma database client. In order to update our database client with any changes pushed in migrations to the Rails app, do the following:


### Updating Dashboard DB



* Pull in latest changes from [https://github.com/mediavine/dashboard](https://github.com/mediavine/dashboard)
* Run migrations in Rails repo (`RAILS_ENV=development rake db:migrate`)
* Run `yarn prisma:pull:dashboard` in the Nest repo, which should update [./prisma/dashboard.prisma](https://github.com/mediavine/nest-typescript-starter/blob/main/prisma/dashboard.prisma) with the schema changes from the migrations.
* Run `yarn prisma:generate:dashboard` to update you local generated Prisma client
* Commit changes

### Updating Reporting DB

* The reporting database by default runs against the dev environment in AWS, so assuming the migrations have been applied to that environment, it is not necessary to run migrations locally. It does not look like the reporting database often has migrations anyways.
* Run `yarn prisma:pull:reporting` in the Nest repo, which should update [./prisma/reporting.prisma](https://github.com/mediavine/nest-typescript-starter/blob/main/prisma/reporting.prisma) with the schema changes from the migrations.
* Run `yarn prisma:generate:reporting` to update you local generated Prisma client
* Commit changes

## Run UI with Rails API and Node API


We have a docker-compose file and an nginx.conf file that can allow splitting traffic from between the Rails and Node APIs, similar to how it is done in production.



* Install Docker for Mac
* Run `docker-compose up` at the root of this repo. This will start nginx. The nginx.conf can be edited to adjust which routes go where.
* Modify the `REACT_APP_API` env var in the `dashboard-redesign-ui` repo to be `http://localhost:5000/api/v1`

Note that presently, the UI is very slow if attempting to run the UI locally with the entire production database copied.


## Commits

We use (Conventional Commits)[[https://www.conventionalcommits.org/en/v1.0.0/](https://www.conventionalcommits.org/en/v1.0.0/)]. You can run the command


```
yarn dlx git-cz
```


to run a wizard that will prompt you for information and automatically generate a properly formatted commit message.
