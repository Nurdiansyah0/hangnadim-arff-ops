use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error, FromRow};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct AuditLog {
    pub id: Uuid,
    pub table_name: String,
    pub action: String,
    pub old_data: Option<serde_json::Value>,
    pub new_data: Option<serde_json::Value>,
    pub changed_by: Option<Uuid>,
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

#[async_trait]
pub trait ComplianceRepoTrait: Send + Sync {
    async fn get_audit_logs(&self, limit: i64) -> Result<Vec<AuditLog>, Error>;
    async fn get_sop_documents(&self) -> Result<Vec<DocumentSOP>, Error>;
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
            "SELECT id, table_name, action, old_data, new_data, changed_by, created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1"
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
}
