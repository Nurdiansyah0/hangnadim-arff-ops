use crate::repository::superuser_repository::SuperuserRepoTrait;
use std::sync::Arc;
use serde_json::Value;

#[derive(Clone)]
pub struct SuperuserService {
    pub repo: Arc<dyn SuperuserRepoTrait>,
}

impl SuperuserService {
    pub fn new(repo: Arc<dyn SuperuserRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn execute_raw_sql(&self, query: &str) -> Result<Value, String> {
        if query.trim().is_empty() {
            return Err("Query tidak boleh kosong".to_string());
        }

        self.repo.execute_raw_sql(query).await.map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;

    struct MockSuperuserRepo;

    #[async_trait]
    impl SuperuserRepoTrait for MockSuperuserRepo {
        async fn execute_raw_sql(&self, sql: &str) -> Result<Value, sqlx::Error> {
            if sql.to_lowercase().starts_with("select") {
                Ok(serde_json::json!([{"mock": "data"}]))
            } else {
                Ok(serde_json::json!({"rows_affected": 1}))
            }
        }
    }

    #[tokio::test]
    async fn test_execute_sql_success() {
        let repo = Arc::new(MockSuperuserRepo);
        let service = SuperuserService::new(repo);
        
        let select_res = service.execute_raw_sql("SELECT * FROM users").await;
        assert!(select_res.is_ok());

        let create_res = service.execute_raw_sql("CREATE TABLE test_table (id INT)").await;
        assert!(create_res.is_ok());
    }

    #[tokio::test]
    async fn test_execute_sql_empty() {
        let repo = Arc::new(MockSuperuserRepo);
        let service = SuperuserService::new(repo);
        
        let res = service.execute_raw_sql("   ").await;
        assert!(res.is_err());
    }
}
