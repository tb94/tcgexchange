# TCGexchange

## How does it work?

A Nodejs server (using express) responds at https://localhost:3000 with a sqlite database

### Initializing a database

```
$ npx sequelize-cli db:migrate
```

### Without Docker

```
$ npm install
$ npm run dev
```

### With Docker

```
docker compose up --build
```
