use crate::domain::models::ExtinguishingAgent;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Clone)]
pub struct InventoryRepository {
    db: Pool<Postgres>,
}

impl InventoryRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn get_all_agents(&self) -> Result<Vec<ExtinguishingAgent>, Error> {
        sqlx::query_as::<_, ExtinguishingAgent>(
            "SELECT id, name, brand, min_requirement, unit, inventory_level, last_procurement_year, created_at, updated_at FROM extinguishing_agents"
        )
        .fetch_all(&self.db)
        .await
    }

    pub async fn update_inventory_level(&self, id: Uuid, new_level: BigDecimal) -> Result<(), Error> {
        sqlx::query!(
            "UPDATE extinguishing_agents SET inventory_level = $1, updated_at = NOW() WHERE id = $2",
            new_level, id
        )
        .execute(&self.db)
        .await?;
        Ok(())
    }

    pub async fn create_agent(
        &self,
        name: &str,
        brand: Option<&str>,
        min_requirement: BigDecimal,
        unit: &str,
        inventory_level: BigDecimal,
        last_procurement_year: Option<&str>,
    ) -> Result<ExtinguishingAgent, Error> {
        sqlx::query_as::<_, ExtinguishingAgent>(
            r#"
            INSERT INTO extinguishing_agents (name, brand, min_requirement, unit, inventory_level, last_procurement_year) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id, name, brand, min_requirement, unit, inventory_level, last_procurement_year, created_at, updated_at
            "#
        )
        .bind(name)
        .bind(brand)
        .bind(min_requirement)
        .bind(unit)
        .bind(inventory_level)
        .bind(last_procurement_year)
        .fetch_one(&self.db)
        .await
    }
}
