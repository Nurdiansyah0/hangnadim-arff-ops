use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use serde_json::Value;

#[async_trait]
pub trait SuperuserRepoTrait: Send + Sync {
    async fn execute_raw_sql(&self, sql: &str) -> Result<Value, Error>;
}

#[derive(Clone)]
pub struct SuperuserRepository {
    db: Pool<Postgres>,
}

impl SuperuserRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl SuperuserRepoTrait for SuperuserRepository {
    async fn execute_raw_sql(&self, sql: &str) -> Result<Value, Error> {
        let lower_sql = sql.trim().to_lowercase();
        
        // Cek jika perintah adalah DQL (SELECT)
        if lower_sql.starts_with("select") || lower_sql.starts_with("with") {
            // Gunakan fitur native PostgreSQL untuk me-return hasil SELECT bebas dalam format JSON
            let wrapped_sql = format!("SELECT json_agg(row_to_json(t)) FROM ({}) t", sql);
            let result: Option<Value> = sqlx::query_scalar(&wrapped_sql)
                .fetch_optional(&self.db)
                .await?;
            
            return Ok(result.unwrap_or(serde_json::json!([])));
        } 
        
        // Untuk DML/DDL (CREATE, DROP, INSERT, UPDATE, DELETE dsb)
        let result = sqlx::query(sql).execute(&self.db).await?;
        
        Ok(serde_json::json!({
            "message": "Query executed successfully",
            "rows_affected": result.rows_affected()
        }))
    }
}
