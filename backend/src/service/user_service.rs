use crate::domain::models::User;
use crate::repository::user_repository::UserRepository;
use bcrypt::{hash, DEFAULT_COST};

#[derive(Clone)]
pub struct UserService {
    pub repo: UserRepository,
}

impl UserService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>, String> {
        self.repo.get_all_users().await.map_err(|e| e.to_string())
    }

    pub async fn create_user(
        &self,
        name: &str,
        nik: &str,
        email: &str,
        password: &str,
        role_id: i32,
    ) -> Result<User, String> {
        let hashed = hash(password, DEFAULT_COST).map_err(|e| e.to_string())?;
        self.repo
            .create_user(name, nik, email, &hashed, role_id)
            .await
            .map_err(|e| e.to_string())
    }

    // Proxy the update down to repository
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

    // Proxy the delete down to repository
    pub async fn delete_user(&self, id: uuid::Uuid) -> Result<(), String> {
        self.repo.delete_user(id).await.map_err(|e| e.to_string())
    }
}
