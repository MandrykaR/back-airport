# NodeJS v.22.1.0

## Dev Build

```bash
docker-compose --env-file .env_local up --watch --build
```

## Dev start

```bash
docker-compose --env-file .env_local up --watch
```

### Adding new dependency
```bash
docker-compose down
docker-compose build --no-cache
docker-compose --env-file .env_local up --watch
```
