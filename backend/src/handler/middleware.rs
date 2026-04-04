use axum::{
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::env;
use crate::domain::models::Claims;
use crate::state::AppState;

pub struct RequireAuth(pub Claims);

impl FromRequestParts<AppState> for RequireAuth {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts.headers.get("Authorization");

        if let Some(auth_val) = auth_header {
            if let Ok(auth_str) = auth_val.to_str() {
                if auth_str.starts_with("Bearer ") {
                    let token = &auth_str[7..];
                    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
                    let token_data = decode::<Claims>(
                        token,
                        &DecodingKey::from_secret(secret.as_bytes()),
                        &Validation::default(),
                    );

                    match token_data {
                        Ok(data) => return Ok(RequireAuth(data.claims)),
                        Err(_) => return Err((StatusCode::UNAUTHORIZED, "Invalid Token".to_string())),
                    }
                }
            }
        }

        Err((StatusCode::UNAUTHORIZED, "Missing Token".to_string()))
    }
}
