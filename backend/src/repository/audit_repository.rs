use crate::domain::models::AuditLog;
use async_trait::async_trait;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;

#[async_trait]
pub trait AuditRepoTrait: Send + Sync {
    async fn get_logs(&self, offset: i64, limit: i64) -> Result<(Vec<AuditLog>, i64), Error>;
    async fn delete_log(&self, id: Uuid) -> Result<(), Error>;
    async fn rollback_log(&self, id: Uuid) -> Result<(), Error>;
}

#[derive(Clone)]
pub struct AuditRepository {
    db: Pool<Postgres>,
}

impl AuditRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl AuditRepoTrait for AuditRepository {
    async fn get_logs(&self, offset: i64, limit: i64) -> Result<(Vec<AuditLog>, i64), Error> {
        let logs: Vec<AuditLog> = sqlx::query_as(
            r#"
            SELECT 
                a.*,
                p.full_name as actor_name
            FROM audit_logs a
            LEFT JOIN personnels p ON a.actor_id = p.id
            ORDER BY a.created_at DESC
            LIMIT $1 OFFSET $2
        "#,
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.db)
        .await?;

        let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM audit_logs")
            .fetch_one(&self.db)
            .await?;

        Ok((logs, total.0))
    }

    async fn delete_log(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM audit_logs WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await?;
        Ok(())
    }

    async fn rollback_log(&self, id: Uuid) -> Result<(), Error> {
        // 1. Fetch the log entry
        let log: AuditLog = sqlx::query_as("SELECT * FROM audit_logs WHERE id = $1")
            .bind(id)
            .fetch_one(&self.db)
            .await?;

        let table = log.table_name;
        let action = log.action;
        let original = log.original_data;
        let new_data = log.new_data;

        let mut tx = self.db.begin().await?;

        match action.as_str() {
            "UPDATE" => {
                if let Some(data) = original {
                    // Revert UPDATE: Set the record back to 'original_data'
                    // We assume 'id' column exists in all audited tables
                    if let Some(record_id) = data.get("id").and_then(|v| v.as_str()) {
                        let _query = format!(
                            "UPDATE {} SET (id, updated_at) = (id, NOW()) WHERE id = '{}'",
                            table, record_id
                        );
                        // This is a simplified revert. For a deep revert, we'd need to map all columns.
                        // However, SQLx doesn't easily support dynamic UPDATE from JSONB without complex logic.
                        // A safer way: DELETE then INSERT if we have the full original object.
                        sqlx::query(&format!("DELETE FROM {} WHERE id = $1", table))
                            .bind(Uuid::parse_str(record_id).map_err(|_| Error::RowNotFound)?)
                            .execute(&mut *tx)
                            .await?;

                        sqlx::query(&format!(
                            "INSERT INTO {} SELECT * FROM jsonb_populate_record(NULL::{}, $1)",
                            table, table
                        ))
                        .bind(data)
                        .execute(&mut *tx)
                        .await?;
                    }
                }
            }
            "INSERT" => {
                if let Some(data) = new_data {
                    // Revert INSERT: DELETE the newly created record
                    if let Some(record_id) = data.get("id").and_then(|v| v.as_str()) {
                        sqlx::query(&format!("DELETE FROM {} WHERE id = $1", table))
                            .bind(Uuid::parse_str(record_id).map_err(|_| Error::RowNotFound)?)
                            .execute(&mut *tx)
                            .await?;
                    }
                }
            }
            "DELETE" => {
                if let Some(data) = original {
                    // Revert DELETE: Re-INSERT the original data
                    sqlx::query(&format!(
                        "INSERT INTO {} SELECT * FROM jsonb_populate_record(NULL::{}, $1)",
                        table, table
                    ))
                    .bind(data)
                    .execute(&mut *tx)
                    .await?;
                }
            }
            _ => {}
        }

        tx.commit().await?;
        Ok(())
    }
}
