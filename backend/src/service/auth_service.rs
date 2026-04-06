use crate::domain::models::{User, Claims};
use crate::repository::user_repository::UserRepository;
use bcrypt::verify;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::env;
use async_trait::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait UserRepoTrait: Send + Sync {
    async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, sqlx::Error>;
    async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error>;
    async fn create_user(&self, username: &str, email: &str, pw: &str, personnel_id: Option<Uuid>) -> Result<User, sqlx::Error>;
    async fn delete_user(&self, id: Uuid) -> Result<(), sqlx::Error>;
}

#[async_trait]
impl UserRepoTrait for UserRepository {
    async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, sqlx::Error> {
        self.find_by_username_or_email(ident).await
    }
    async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error> {
        self.get_all_users().await
    }
    async fn create_user(&self, u: &str, e: &str, p: &str, pid: Option<Uuid>) -> Result<User, sqlx::Error> {
        self.create_user(u, e, p, pid).await
    }
    async fn delete_user(&self, id: Uuid) -> Result<(), sqlx::Error> {
        self.delete_user(id).await
    }
}
#[derive(Clone)] 
pub struct AuthService {
    pub repo: std::sync::Arc<dyn UserRepoTrait>,
}

impl AuthService {
    pub fn new(repo: std::sync::Arc<dyn UserRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn login(&self, ident: &str, password: &str) -> Result<String, String> {
        let user = self.repo.find_by_username_or_email(ident).await
            .map_err(|e| format!("DB Error: {}", e))?
            .ok_or_else(|| "Username/email salah".to_string())?;

        let valid = verify(password, &user.password_hash).unwrap_or(false);
        if !valid { return Err("Password salah".to_string()); }

        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let expiration = Utc::now().checked_add_signed(Duration::hours(24)).unwrap().timestamp() as usize;

        let claims = Claims {
            sub: user.id.to_string(),
            personnel_id: user.personnel_id,
            role_id: user.role_id,
            exp: expiration,
        };

        encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
            .map_err(|e| format!("Token error: {}", e))
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;

    struct MockUserRepo {
        user_to_return: Option<User>,
        simulation_error: bool,
    }

    #[async_trait]
    impl UserRepoTrait for MockUserRepo {
        async fn find_by_username_or_email(&self, _ident: &str) -> Result<Option<User>, sqlx::Error> {
            if self.simulation_error {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(self.user_to_return.clone())
        }
        async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error> { Ok(vec![]) }
        async fn create_user(&self, _:&str, _:&str, _:&str, _:Option<Uuid>) -> Result<User, sqlx::Error> { todo!() }
        async fn delete_user(&self, _:Uuid) -> Result<(), sqlx::Error> { Ok(()) }
    }

    // Helper untuk membuat user tiruan
    fn create_mock_user(hashed_pass: &str, personnel_id: Option<Uuid>, role_id: Option<i32>) -> User {
        User {
            id: Uuid::new_v4(),
            username: "tester".to_string(),
            email: "test@mail.com".to_string(),
            password_hash: hashed_pass.to_string(),
            personnel_id,
            role_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // ---------------------------------------------------------------------------
    // 1. HAPPY PATH (Skenario Sukses)
    // ---------------------------------------------------------------------------

    #[tokio::test]
    async fn test_login_success_with_complete_rbac() {
        let hashed = bcrypt::hash("password123", 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed, Some(Uuid::new_v4()), Some(1))), // Admin
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "password123").await;
        assert!(result.is_ok(), "Harus berhasil login dan mendapatkan JWT token.");
        
        // Memastikan output adalah string token (JWT format: xxxx.yyyy.zzzz)
        let token = result.unwrap();
        assert_eq!(token.split('.').count(), 3, "Token harus memiliki 3 bagian (Header, Payload, Signature)");
    }

    // ---------------------------------------------------------------------------
    // 2. NEGATIVE PATH (Skenario Gagal Logis)
    // ---------------------------------------------------------------------------

    #[tokio::test]
    async fn test_login_wrong_password() {
        let hashed = bcrypt::hash("password123", 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed, Some(Uuid::new_v4()), Some(1))),
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "salah_pass").await;
        assert_eq!(result.err(), Some("Password salah".to_string()), "Harus menolak password yang salah.");
    }

    #[tokio::test]
    async fn test_login_user_not_found() {
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: None,
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("ghost_user", "password123").await;
        assert_eq!(result.err(), Some("Username/email salah".to_string()), "Harus menolak user yang tidak terdaftar di database.");
    }

    #[tokio::test]
    async fn test_login_empty_credentials() {
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: None,
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("", "").await;
        assert_eq!(result.err(), Some("Username/email salah".to_string()), "Input kosong harus diperlakukan sebagai user tidak ditemukan/salah input.");
    }

    // ---------------------------------------------------------------------------
    // 3. EDGE CASES / ANOMALY (Skenario Tidak Wajar & Inkonsistensi Relasi)
    // ---------------------------------------------------------------------------

    #[tokio::test]
    async fn test_login_user_without_personnel_id() {
        let hashed = bcrypt::hash("password123", 4).unwrap();
        // Skenario: User terdaftar tapi belum dikaitkan ke data Personnel HR
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed, None, Some(1))), 
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "password123").await;
        assert!(result.is_ok(), "Harus tetap bisa mendapatkan token meskipun tidak memiliki personnel_id.");
    }

    #[tokio::test]
    async fn test_login_user_without_role() {
        let hashed = bcrypt::hash("password123", 4).unwrap();
        // Skenario: User dan Personnel ada, tapi Role ID nya None (belum di-assign RBAC)
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed, Some(Uuid::new_v4()), None)), 
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "password123").await;
        // Secara bisnis, login boleh berhasil namun API handler nanti yang akan mem-blokirnya saat validasi bearer token.
        assert!(result.is_ok(), "User tanpa Role bisa login, tapi tidak bisa akses endpoint manapun nantinya.");
    }

    // ---------------------------------------------------------------------------
    // 4. DEPENDENCY FAILURES (Skenario Infrastructure Error)
    // ---------------------------------------------------------------------------

    #[tokio::test]
    async fn test_login_database_timeout_or_error() {
        // Skenario: Koneksi ke PostgreSQL putus atau query error
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: None,
            simulation_error: true 
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "password123").await;
        let err_msg = result.unwrap_err();
        assert!(err_msg.contains("DB Error"), "Harus memberikan pesan error database yang jelas, bukan panic abort.");
    }
}
