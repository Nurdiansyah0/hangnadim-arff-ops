use crate::domain::models::Claims;
use crate::repository::user_repository::UserRepository;
use bcrypt::verify;
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use std::env;

#[derive(Clone)]
pub struct AuthService {
    pub repo: UserRepository,
}

impl AuthService {
    pub fn new(repo: UserRepository) -> Self {
        Self { repo }
    }

    pub async fn login(&self, ident: &str, password: &str) -> Result<String, String> {
        let user = self
            .repo
            .find_by_nik_or_email(ident)
            .await
            .map_err(|e| format!("DB Error: {}", e))?
            .ok_or_else(|| "Invalid credentials".to_string())?;

        let valid = verify(password, &user.password_hash).unwrap_or(false);

        if !valid {
            return Err("Invalid credentials".to_string());
        }

        let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let expiration = Utc::now()
            .checked_add_signed(Duration::hours(24))
            .expect("valid timestamp")
            .timestamp() as usize;

        let claims = Claims {
            sub: user.nik.clone(),
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
