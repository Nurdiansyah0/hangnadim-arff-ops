use crate::domain::models::User;
use sqlx::{Pool, Postgres, Error};

#[derive(Clone)]
pub struct UserRepository {
    db: Pool<Postgres>,
}

impl UserRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, Error> {
        sqlx::query_as::<_, User>(
            "SELECT id, name, username, email, password_hash, role_id, created_at, updated_at FROM users WHERE email = $1 OR username = $2"
        )
        .bind(ident)
        .bind(ident)
        .fetch_optional(&self.db)
        .await
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>, Error> {
        sqlx::query_as::<_, User>(
            "SELECT id, name, username, email, password_hash, role_id, created_at, updated_at FROM users"
        )
        .fetch_all(&self.db)
        .await
    }

    pub async fn create_user(
        &self,
        name: &str,
        username: &str,
        email: &str,
        password_hash: &str,
        role_id: i32,
    ) -> Result<User, Error> {
        sqlx::query_as::<_, User>(
            "INSERT INTO users (name, username, email, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, username, email, password_hash, role_id, created_at, updated_at"
        )
        .bind(name)
        .bind(username)
        .bind(email)
        .bind(password_hash)
        .bind(role_id)
        .fetch_one(&self.db)
        .await
    }

    pub async fn update_user(
        &self,
        id: uuid::Uuid,
        name: &str,
        role_id: i32,
    ) -> Result<User, Error> {
        sqlx::query_as::<_, User>(
            "UPDATE users SET name = $1, role_id = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, username, email, password_hash, role_id, created_at, updated_at"
        )
        .bind(name)
        .bind(role_id)
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    pub async fn delete_user(&self, id: uuid::Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }
}
