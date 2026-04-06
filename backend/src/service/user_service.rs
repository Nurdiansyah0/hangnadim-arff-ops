use crate::domain::models::User;
use crate::service::auth_service::UserRepoTrait; // Import Trait dari AuthService
use bcrypt::{hash, DEFAULT_COST};
use std::sync::Arc;

#[derive(Clone)]
pub struct UserService {
    // Ganti UserRepository menjadi Arc<dyn UserRepoTrait>
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
        name: &str,
        username: &str,
        email: &str,
        password: &str,
        role_id: i32,
    ) -> Result<User, String> {
        let hashed = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
        self.repo
            .create_user(name, username, email, &hashed, role_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_user(
        &self,
        id: uuid::Uuid,
        name: &str,
        role_id: i32,
    ) -> Result<User, String> {
        self.repo
            .update_user(id, name, role_id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn delete_user(&self, id: uuid::Uuid) -> Result<(), String> {
        self.repo.delete_user(id).await.map_err(|e| e.to_string())
    }
}
