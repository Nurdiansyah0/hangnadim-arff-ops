use crate::domain::models::Claims;
use crate::state::AppState;
use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};
use jsonwebtoken::{DecodingKey, Validation, decode};
use std::env;

pub struct RequireAuth(pub Claims);

impl FromRequestParts<AppState> for RequireAuth {
    type Rejection = (StatusCode, String);

    async fn from_request_parts(
        parts: &mut Parts,
        _state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts.headers.get("Authorization");

        if let Some(auth_val) = auth_header
            && let Ok(auth_str) = auth_val.to_str()
            && let Some(token) = auth_str.strip_prefix("Bearer ")
        {
            let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
            let token_data = decode::<Claims>(
                token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::default(),
            );

            match token_data {
                Ok(data) => return Ok(RequireAuth(data.claims)),
                Err(_) => {
                    return Err((StatusCode::UNAUTHORIZED, "Invalid Token".to_string()));
                }
            }
        }

        Err((StatusCode::UNAUTHORIZED, "Missing Token".to_string()))
    }
}
