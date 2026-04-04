use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, put},
    Json, Router,
};
use serde::Deserialize;
use crate::{auth::RequireAuth, models::User, AppState};

pub fn users_routes(state: AppState) -> Router<AppState> {
    Router::new()
        .route("/", get(list_users).post(create_user))
        .route("/{id}", put(update_user).delete(delete_user))
        .with_state(state)
}

#[derive(Deserialize)]
pub struct CreateUserPayload {
    pub name: String,
    pub nik: String,
    pub email: String,
    pub password: String,
    pub role_id: i32,
}

// RACI: Manager ARFF (1), Admin (7), TL Shift (2) might have admin rights for users
async fn list_users(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<User>>, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 && claims.role_id != 2 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    let users = sqlx::query_as::<_, User>(
        "SELECT id, name, nik, email, password_hash, role_id, created_at, updated_at FROM users"
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(users))
}

async fn create_user(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateUserPayload>,
) -> Result<Json<User>, (StatusCode, String)> {
    if claims.role_id != 1 && claims.role_id != 7 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    let password_hash = bcrypt::hash(&payload.password, 12).unwrap();

    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (name, nik, email, password_hash, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, nik, email, password_hash, role_id, created_at, updated_at"
    )
    .bind(&payload.name)
    .bind(&payload.nik)
    .bind(&payload.email)
    .bind(&password_hash)
    .bind(&payload.role_id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(user))
}

async fn update_user() -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "Not implemented yet") }
async fn delete_user() -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "Not implemented yet") }
