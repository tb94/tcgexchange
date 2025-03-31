# TCGexchange

## How does it work?
A Nodejs server (using express) responds at https://localhost:3000, a sqlite database responds on port 3306.

### Without Docker

```
$ npm install
$ npm run dev
```

### With Docker

docker compose up --build