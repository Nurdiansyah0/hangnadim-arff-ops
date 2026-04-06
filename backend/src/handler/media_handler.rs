use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    extract::{Multipart, State},
    http::StatusCode,
    routing::post,
    Json, Router,
};
use serde::Serialize;
use uuid::Uuid;
use std::path::Path;
use tokio::fs;

#[derive(Serialize)]
pub struct UploadResponse {
    pub file_path: String,
}

pub fn media_routes(state: AppState) -> Router {
    Router::new()
        .route("/upload", post(upload_file))
        .with_state(state)
}

async fn upload_file(
    State(_state): State<AppState>,
    RequireAuth(_claims): RequireAuth,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let upload_dir = "uploads";
    if !Path::new(upload_dir).exists() {
        fs::create_dir_all(upload_dir).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    if let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let file_name = field.file_name().unwrap_or("unknown").to_string();
        let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let ext = Path::new(&file_name).extension().and_then(|s| s.to_str()).unwrap_or("bin");
        let unique_name = format!("{}.{}", Uuid::new_v4(), ext);
        let save_path = format!("{}/{}", upload_dir, unique_name);

        fs::write(&save_path, data).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        return Ok(Json(UploadResponse {
            file_path: format!("/uploads/{}", unique_name),
        }));
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}
