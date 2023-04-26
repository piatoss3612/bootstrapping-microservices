resource "azurerm_container_registry" "container_registry" {
  name = var.app_name # special characters unavailable for container registry name and must be unique

  resource_group_name = azurerm_resource_group.flixtube3612.name
  location            = azurerm_resource_group.flixtube3612.location


  admin_enabled = true
  sku           = "Basic"
}

output "registry_hostname" {
  value = azurerm_container_registry.container_registry.login_server
}

output "registry_un" {
  value = azurerm_container_registry.container_registry.admin_username
}

output "registry_pw" {
  value     = azurerm_container_registry.container_registry.admin_password
  sensitive = true
}
