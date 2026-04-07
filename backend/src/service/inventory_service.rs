use crate::domain::models::ExtinguishingAgent;
use crate::repository::inventory_repository::InventoryRepository;
use std::sync::Arc;
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Clone)]
pub struct InventoryService {
    pub repo: Arc<InventoryRepository>,
}

impl InventoryService {
    pub fn new(repo: Arc<InventoryRepository>) -> Self {
        Self { repo }
    }

    pub async fn get_all_agents(&self) -> Result<Vec<ExtinguishingAgent>, String> {
        self.repo.get_all_agents().await.map_err(|e| e.to_string())
    }

    pub async fn update_inventory_level(&self, id: Uuid, new_level: BigDecimal) -> Result<(), String> {
        self.repo.update_inventory_level(id, new_level).await.map_err(|e| e.to_string())
    }

    pub async fn create_agent(
        &self,
        name: &str,
        brand: Option<&str>,
        min_requirement: BigDecimal,
        unit: &str,
        inventory_level: BigDecimal,
        last_procurement_year: Option<&str>,
    ) -> Result<ExtinguishingAgent, String> {
        self.repo
            .create_agent(name, brand, min_requirement, unit, inventory_level, last_procurement_year)
            .await
            .map_err(|e| e.to_string())
    }
}
