use async_trait::async_trait;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::{Error, FromRow, Pool, Postgres, Row};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct AuditLog {
    pub id: i32,
    pub table_name: String,
    pub action: String,
    pub original_data: Option<serde_json::Value>,
    pub new_data: Option<serde_json::Value>,
    pub user_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct DocumentSOP {
    pub id: Uuid,
    pub title: String,
    pub version: String,
    pub file_path: Option<String>,
    pub category: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InventoryAlert {
    pub id: Uuid,
    pub name: String,
    pub inventory_level: Decimal,
    pub min_requirement: Decimal,
    pub deficit: Decimal,
    pub percentage: f64,
}

#[async_trait]
pub trait ComplianceRepoTrait: Send + Sync {
    async fn get_audit_logs(&self, limit: i64) -> Result<Vec<AuditLog>, Error>;
    async fn get_sop_documents(&self) -> Result<Vec<DocumentSOP>, Error>;
    async fn get_inventory_alerts(&self) -> Result<Vec<InventoryAlert>, Error>;
}

#[derive(Clone)]
pub struct ComplianceRepository {
    db: Pool<Postgres>,
}

impl ComplianceRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl ComplianceRepoTrait for ComplianceRepository {
    async fn get_audit_logs(&self, limit: i64) -> Result<Vec<AuditLog>, Error> {
        // Karena audit_logs dipartisi, kita ambil dari parent table 'audit_logs'
        // Postgres akan otomatis nge-scan partisi yang relevan (atau semua jika limit)
        sqlx::query_as::<_, AuditLog>(
            "SELECT id, table_name, action, original_data, new_data, user_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1"
        )
        .bind(limit)
        .fetch_all(&self.db)
        .await
    }

    async fn get_sop_documents(&self) -> Result<Vec<DocumentSOP>, Error> {
        sqlx::query_as::<_, DocumentSOP>(
            "SELECT id, title, version, file_path, category, created_at FROM documents ORDER BY created_at DESC"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn get_inventory_alerts(&self) -> Result<Vec<InventoryAlert>, Error> {
        let rows = sqlx::query(
            r#"
            SELECT id, name, inventory_level, min_requirement,
                   (min_requirement - inventory_level) as deficit,
                   ((inventory_level::numeric / min_requirement::numeric) * 100) as percentage
            FROM extinguishing_agents
            WHERE inventory_level < min_requirement
            ORDER BY percentage ASC
            "#,
        )
        .fetch_all(&self.db)
        .await?;

        let mut alerts = Vec::new();
        for row in rows {
            let id: Uuid = row.get("id");
            let name: String = row.get("name");
            let inventory_level: Decimal = row.get("inventory_level");
            let min_requirement: Decimal = row.get("min_requirement");
            let deficit: Decimal = row.get("deficit");
            let percentage: f64 = row.get("percentage");

            alerts.push(InventoryAlert {
                id,
                name,
                inventory_level,
                min_requirement,
                deficit,
                percentage,
            });
        }

        Ok(alerts)
    }
}
