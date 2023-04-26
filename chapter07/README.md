# chapter07

## Initialize working directory

```sh
$ terraform init
```

## Updrade

```sh
$ terraform init --upgrade
```

## Create execution plan

```sh
$ terraform plan -var="app_version=1.0.0" -var="client_id=<client_id>" -var="client_secret=<client_secret>"
```

## Execute plan

```sh
$ terraform apply -var="app_version=1.0.0" -var="client_id=<client_id>" -var="client_secret=<client_secret>" -auto-approve
```

## Destroy

```sh
$ terraform destroy
```
