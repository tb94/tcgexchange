# TCGexchange

## How does it work?

A Nodejs server (using express) responds at https://localhost:3000 with a sqlite database

### Initialize Dev Dependencies

```
$ npm install

```


### Initializing a database

```
$ npx sequelize-cli db:migrate

```


### Without Docker

```
$ npm run dev

```

### With Docker

```
$ docker compose up --build

```

### Linting

```
$ npm run lint
```
#### Auto Fix
```
$ npm run lint:fix
```
This may have undesireable effects, use at your own risk.
