use crate::domain::models::WatchroomLog;
use crate::repository::watchroom_repository::WatchroomRepoTrait;
use std::sync::Arc;
use uuid::Uuid;
use serde_json::Value;

#[derive(Clone)]
pub struct WatchroomService {
    pub repo: Arc<dyn WatchroomRepoTrait>,
}

impl WatchroomService {
    pub fn new(repo: Arc<dyn WatchroomRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_logs(&self) -> Result<Vec<WatchroomLog>, String> {
        self.repo.get_all_logs().await.map_err(|e| e.to_string())
    }

    pub async fn create_log(
        &self,
        actor_id: Option<Uuid>,
        entry_type: Option<&str>,
        description: &str,
        payload: Option<Value>,
        photo_url: Option<&str>,
    ) -> Result<WatchroomLog, String> {
        self.repo
            .create_log(actor_id, entry_type, description, payload, photo_url)
            .await
            .map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::Utc;
    use serde_json::json;

    struct MockWatchroomRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl WatchroomRepoTrait for MockWatchroomRepo {
        async fn get_all_logs(&self) -> Result<Vec<WatchroomLog>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_log(
            &self,
            a: Option<Uuid>,
            t: Option<&str>,
            d: &str,
            p: Option<Value>,
            ph: Option<&str>,
        ) -> Result<WatchroomLog, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(WatchroomLog {
                id: Uuid::new_v4(),
                actor_id: a,
                entry_type: t.map(|x| x.to_string()),
                description: d.to_string(),
                payload: p,
                photo_url: ph.map(|x| x.to_string()),
                created_at: Utc::now(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_log_success() {
        let repo = Arc::new(MockWatchroomRepo { should_fail: false });
        let service = WatchroomService::new(repo);
        let payload = Some(json!({"event": "shift_change"}));
        
        let res = service.create_log(Some(Uuid::new_v4()), Some("INFO"), "Testing log", payload, None).await;
        assert!(res.is_ok(), "Harus bisa simpan log ke watchroom");
    }

    #[tokio::test]
    async fn test_get_all_logs_success() {
        let repo = Arc::new(MockWatchroomRepo { should_fail: false });
        let service = WatchroomService::new(repo);
        let res = service.get_all_logs().await;
        assert!(res.is_ok());
    }
}
