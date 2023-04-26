terraform {
  backend "azurerm" {
    resource_group_name  = "flixtube3612-terraform"
    storage_account_name = "flixtube3612terraform"
    container_name       = "terraform-state"
    key                  = "terraform.tfstate"
  }
}
