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
        personnel_id: Uuid,
        username: &str,
        email: &str,
        password: &str,
    ) -> Result<User, String> {
        let hashed = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
        self.repo
            .create_user(personnel_id, username, email, &hashed)
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

        async fn create_user(&self, pid: Uuid, u: &str, e: &str, p: &str) -> Result<User, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(User {
                id: Uuid::new_v4(),
                personnel_id: pid,
                username: u.to_string(),
                email: e.to_string(),
                password_hash: p.to_string(),
                status: Some("ACTIVE".to_string()),
                last_login_at: None,
                created_at: Some(Utc::now()),
                updated_at: Some(Utc::now()),
                role_id: None,
                full_name: Some("Test User".to_string()),
                nip_nik: Some("123456".to_string()),
            })
        }

        async fn delete_user(&self, _id: Uuid) -> Result<(), sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(())
        }

        async fn get_user_profile(&self, id: Uuid) -> Result<Option<crate::domain::models::UserProfile>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::RowNotFound); }
            Ok(Some(crate::domain::models::UserProfile {
                id,
                username: "testuser".to_string(),
                email: "test@example.com".to_string(),
                full_name: Some("Test User".to_string()),
                position_name: Some("Guard".to_string()),
                role_name: Some("Admin".to_string()),
                role_id: Some(1),
                created_at: Some(chrono::Utc::now()),
            }))
        }

        async fn get_user_permissions(&self, _user_id: Uuid) -> Result<Vec<String>, sqlx::Error> {
            Ok(vec![])
        }

        async fn get_full_profile(&self, id: Uuid) -> Result<Option<crate::domain::models::FullProfileResponse>, sqlx::Error> {
            Ok(Some(crate::domain::models::FullProfileResponse {
                personal: crate::domain::models::User {
                    id,
                    personnel_id: Uuid::new_v4(),
                    username: "tester".to_string(),
                    email: "test@mail.com".to_string(),
                    password_hash: "".to_string(),
                    status: Some("ACTIVE".to_string()),
                    last_login_at: None,
                    created_at: Some(Utc::now()),
                    updated_at: Some(Utc::now()),
                    role_id: Some(1),
                    full_name: Some("Tester".to_string()),
                    nip_nik: Some("123".to_string()),
                },
                position: Some("Guard".to_string()),
                role: Some("Admin".to_string()),
                certifications: vec![],
            }))
        }

        async fn get_operational_context(&self, _id: Uuid) -> Result<crate::domain::models::OperationalContextResponse, sqlx::Error> {
            Ok(crate::domain::models::OperationalContextResponse {
                shift_name: Some("Normal".to_string()),
                shift_start: None,
                shift_end: None,
                duty_position: Some("WATCHROOM".to_string()),
                assigned_vehicle: Some("V1".to_string()),
                assigned_vehicle_id: None,
                duty_status: "ACTIVE".to_string(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_user_success() {
        let repo = Arc::new(MockUserRepo { should_fail: false });
        let service = UserService::new(repo);
        
        let res = service.create_user(Uuid::new_v4(), "operator", "ops@mail.com", "pass123").await;
        assert!(res.is_ok(), "Harus berhasil membuat user baru");
    }

    #[tokio::test]
    async fn test_create_user_db_error() {
        let repo = Arc::new(MockUserRepo { should_fail: true });
        let service = UserService::new(repo);
        
        let res = service.create_user(Uuid::new_v4(), "operator", "ops@mail.com", "pass123").await;
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
