use axum::{
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    routing::post,
    Json, Router,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;

use crate::models::{Claims, User};
use crate::AppState;

#[derive(Serialize, Deserialize)]
pub struct AuthPayload {
    pub ident: String, // email or nik
    pub password: String,
}

#[derive(Serialize)]
pub struct AuthBody {
    pub access_token: String,
    pub token_type: String,
}

#[derive(Serialize)]
pub struct AuthError {
    pub message: String,
}

pub fn auth_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/login", post(login))
        .with_state(state)
}

async fn login(
    State(state): State<AppState>,
    Json(payload): Json<AuthPayload>,
) -> Result<Json<AuthBody>, (StatusCode, Json<AuthError>)> {
    let user_opt: Option<User> = sqlx::query_as::<_, User>(
        "SELECT id, name, nik, email, password_hash, role_id, created_at, updated_at FROM users WHERE email = $1 OR nik = $2"
    )
    .bind(&payload.ident)
    .bind(&payload.ident)
    .fetch_optional(&state.db)
    .await
    .map_err(|_| (StatusCode::INTERNAL_SERVER_ERROR, Json(AuthError { message: "DB Error".to_string() })))?;

    if let Some(user) = user_opt {
        if bcrypt::verify(&payload.password, &user.password_hash).unwrap_or(false) {
            let claims = Claims {
                sub: user.id.to_string(),
                role_id: user.role_id,
                exp: (chrono::Utc::now() + chrono::Duration::hours(24)).timestamp() as usize,
            };

            let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
            let token = encode(
                &Header::default(),
                &claims,
                &EncodingKey::from_secret(secret.as_bytes()),
            )
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(AuthError {
                        message: "Token creation error".to_string(),
                    }),
                )
            })?;

            return Ok(Json(AuthBody {
                access_token: token,
                token_type: "Bearer".to_string(),
            }));
        }
    }

    Err((
        StatusCode::UNAUTHORIZED,
        Json(AuthError {
            message: "Invalid credentials".to_string(),
        }),
    ))
}

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
