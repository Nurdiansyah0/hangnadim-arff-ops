use crate::domain::models::User;
use crate::service::auth_service::UserRepoTrait; 
use bcrypt::{hash, DEFAULT_COST};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct UserService {
    pub repo: Arc<dyn UserRepoTrait>,
}

impl UserService {
    pub fn new(repo: Arc<dyn UserRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>, String> {
        self.repo.get_all_users().await.map_err(|e| e.to_string())
    }

    pub async fn create_user(
        &self,
        username: &str,
        email: &str,
        password: &str,
        personnel_id: Option<Uuid>,
    ) -> Result<User, String> {
        let hashed = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
        self.repo
            .create_user(username, email, &hashed, personnel_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn delete_user(&self, id: Uuid) -> Result<(), String> {
        self.repo.delete_user(id).await.map_err(|e| e.to_string())
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

    struct MockUserRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl UserRepoTrait for MockUserRepo {
        async fn find_by_username_or_email(&self, _i: &str) -> Result<Option<User>, sqlx::Error> { Ok(None) }
        
        async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            // Simulasi kembalikan 1 user kosong
            Ok(vec![])
        }

        async fn create_user(&self, u: &str, e: &str, p: &str, pid: Option<Uuid>) -> Result<User, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(User {
                id: Uuid::new_v4(),
                username: u.to_string(),
                email: e.to_string(),
                password_hash: p.to_string(),
                personnel_id: pid,
                role_id: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }

        async fn delete_user(&self, _id: Uuid) -> Result<(), sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_create_user_success() {
        let repo = Arc::new(MockUserRepo { should_fail: false });
        let service = UserService::new(repo);
        
        let res = service.create_user("operator", "ops@mail.com", "pass123", None).await;
        assert!(res.is_ok(), "Harus berhasil membuat user baru");
    }

    #[tokio::test]
    async fn test_create_user_db_error() {
        let repo = Arc::new(MockUserRepo { should_fail: true });
        let service = UserService::new(repo);
        
        let res = service.create_user("operator", "ops@mail.com", "pass123", None).await;
        assert!(res.is_err(), "Harus gagal jika database error/timeout");
    }

    #[tokio::test]
    async fn test_get_all_users_success() {
        let repo = Arc::new(MockUserRepo { should_fail: false });
        let service = UserService::new(repo);
        
        let res = service.get_all_users().await;
        assert!(res.is_ok(), "Harus berhasil mengambil data seluruh list users");
    }
}
