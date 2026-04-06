use crate::domain::models::{User, Claims};
use crate::repository::user_repository::UserRepository;
use bcrypt::verify;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::env;
use async_trait::async_trait;

#[async_trait]
pub trait UserRepoTrait: Send + Sync {
    async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, sqlx::Error>;
    async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error>;
    async fn create_user(&self, name: &str, username: &str, email: &str, pw: &str, role: i32) -> Result<User, sqlx::Error>;
    async fn update_user(&self, id: uuid::Uuid, name: &str, role: i32) -> Result<User, sqlx::Error>;
    async fn delete_user(&self, id: uuid::Uuid) -> Result<(), sqlx::Error>;
}

#[async_trait]
impl UserRepoTrait for UserRepository {
    async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, sqlx::Error> {
        self.find_by_username_or_email(ident).await
    }
    async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error> {
        self.get_all_users().await
    }
    async fn create_user(&self, n: &str, u: &str, e: &str, p: &str, r: i32) -> Result<User, sqlx::Error> {
        self.create_user(n, u, e, p, r).await
    }
    async fn update_user(&self, id: uuid::Uuid, n: &str, r: i32) -> Result<User, sqlx::Error> {
        self.update_user(id, n, r).await
    }
    async fn delete_user(&self, id: uuid::Uuid) -> Result<(), sqlx::Error> {
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
        // VALIDASI INPUT (Negative Path)
        if ident.is_empty() {
            return Err("Username/email tidak boleh kosong".to_string());
        }

        let user = self
            .repo
            .find_by_username_or_email(ident)
            .await
            .map_err(|e| format!("DB Error: {}", e))?
            .ok_or_else(|| "Username/email salah".to_string());

        let user = match user {
            Ok(u) => u,
            Err(e) => return Err(e),
        };

        let valid = verify(password, &user.password_hash).unwrap_or(false);
        if !valid {
            return Err("Password salah".to_string());
        }

        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("valid timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: user.username.clone(),
            role_id: user.role_id,
            exp: expiration,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_ref()),
        )
        .map_err(|e| format!("Token creation error: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

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
        async fn get_all_users(&self) -> Result<Vec<User>, sqlx::Error> { todo!() }
        async fn create_user(&self, _:&str, _:&str, _:&str, _:&str, _:i32) -> Result<User, sqlx::Error> { todo!() }
        async fn update_user(&self, _:Uuid, _:&str, _:i32) -> Result<User, sqlx::Error> { todo!() }
        async fn delete_user(&self, _:Uuid) -> Result<(), sqlx::Error> { todo!() }
    }

    fn create_mock_user(hashed_pass: &str) -> User {
        User {
            id: Uuid::new_v4(),
            name: "Test User".to_string(),
            username: "tester".to_string(),
            email: "test@mail.com".to_string(),
            password_hash: hashed_pass.to_string(),
            role_id: 1,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    // --- A. HAPPY PATH ---
    #[tokio::test]
    async fn test_login_success_happy_path() {
        let hashed = bcrypt::hash("password123", 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed)),
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        
        let result = service.login("tester", "password123").await;
        assert!(result.is_ok()); // Harus berhasil dapat token
    }

    // --- B. NEGATIVE PATH ---
    #[tokio::test]
    async fn test_login_error_user_not_found() {
        let mock_repo = std::sync::Arc::new(MockUserRepo { user_to_return: None, simulation_error: false });
        let service = AuthService::new(mock_repo);
        let result = service.login("ghost", "password").await;
        assert_eq!(result.err(), Some("Username/email salah".to_string()));
    }

    #[tokio::test]
    async fn test_login_error_wrong_password() {
        let hashed = bcrypt::hash("benar", 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed)),
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        let result = service.login("tester", "salah_pass").await;
        assert_eq!(result.err(), Some("Password salah".to_string()));
    }

    #[tokio::test]
    async fn test_login_error_empty_input() {
        let mock_repo = std::sync::Arc::new(MockUserRepo { user_to_return: None, simulation_error: false });
        let service = AuthService::new(mock_repo);
        let result = service.login("", "password").await;
        assert_eq!(result.err(), Some("Username/email tidak boleh kosong".to_string()));
    }

    // --- C. EDGE CASES ---
    #[tokio::test]
    async fn test_login_edge_case_very_long_password() {
        let long_pass = "a".repeat(100);
        let hashed = bcrypt::hash(&long_pass, 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed)),
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        let result = service.login("tester", &long_pass).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_login_edge_case_special_chars() {
        let spec_pass = "!@#$%^&*()_+-=[]{}|;':\",.<>?/\\";
        let hashed = bcrypt::hash(spec_pass, 4).unwrap();
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: Some(create_mock_user(&hashed)),
            simulation_error: false
        });
        let service = AuthService::new(mock_repo);
        let result = service.login("tester", spec_pass).await;
        assert!(result.is_ok());
    }

    // --- E. DEPENDENCY FAILURE ---
    #[tokio::test]
    async fn test_login_dependency_db_timeout() {
        let mock_repo = std::sync::Arc::new(MockUserRepo { 
            user_to_return: None,
            simulation_error: true // Simulasikan database mati/timeout
        });
        let service = AuthService::new(mock_repo);
        let result = service.login("tester", "password").await;
        assert!(result.unwrap_err().contains("DB Error"));
    }
}
