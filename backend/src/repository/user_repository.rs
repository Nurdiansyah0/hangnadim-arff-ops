use crate::domain::models::User;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[derive(Clone)]
pub struct UserRepository {
    db: Pool<Postgres>,
}

impl UserRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, Error> {
        // Query JOIN untuk mengambil data User + Role ID pertama dari personnel_roles
        sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.username, u.email, u.password_hash, u.personnel_id, u.created_at, u.updated_at,
                (SELECT role_id FROM personnel_roles WHERE personnel_id = u.personnel_id LIMIT 1) as role_id
            FROM users u 
            WHERE u.email = $1 OR u.username = $2
            "#
        )
        .bind(ident)
        .bind(ident)
        .fetch_optional(&self.db)
        .await
    }

    pub async fn get_user_by_id(&self, id: Uuid) -> Result<Option<User>, Error> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.username, u.email, u.password_hash, u.personnel_id, u.created_at, u.updated_at,
                (SELECT role_id FROM personnel_roles WHERE personnel_id = u.personnel_id LIMIT 1) as role_id
            FROM users u 
            WHERE u.id = $1
            "#
        )
        .bind(id)
        .fetch_optional(&self.db)
        .await
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>, Error> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.username, u.email, u.password_hash, u.personnel_id, u.created_at, u.updated_at,
                (SELECT role_id FROM personnel_roles WHERE personnel_id = u.personnel_id LIMIT 1) as role_id
            FROM users u
            "#
        )
        .fetch_all(&self.db)
        .await
    }

    pub async fn create_user(
        &self,
        username: &str,
        email: &str,
        password_hash: &str,
        personnel_id: Option<Uuid>,
    ) -> Result<User, Error> {
        sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (username, email, password_hash, personnel_id) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, username, email, password_hash, personnel_id, created_at, updated_at,
            (SELECT NULL::int) as role_id
            "#
        )
        .bind(username)
        .bind(email)
        .bind(password_hash)
        .bind(personnel_id)
        .fetch_one(&self.db)
        .await
    }

    pub async fn delete_user(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }
}
