# Chapter03

## Build docker image

```sh
$ docker build -t node-app .
```

## Run docker container

```sh
$ docker run -d -p 3000:3000 node-app
```

## container list

```sh
$ docker ps
CONTAINER ID   IMAGE      COMMAND                  CREATED         STATUS         PORTS                    NAMES
b8acf48d4d75   node-app   "docker-entrypoint.s…"   9 minutes ago   Up 9 minutes   0.0.0.0:3000->3000/tcp   infallible_sammet
```

## container logs

```sh
$ docker logs b8ac

> example-1@1.0.0 start
> node index.js

Example app listening at http://localhost:3000
```

---

## Azure Container Registry

### [slide](https://docs.google.com/presentation/d/1Si9r9WFxZOfu71FrFkwC7zTkUJrCy3kLsPJz0xglIEI/edit?usp=sharing)
