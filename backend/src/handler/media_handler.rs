use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Multipart, State},
    http::StatusCode,
    routing::post,
};
use serde::Serialize;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

#[derive(Serialize)]
pub struct UploadResponse {
    pub file_path: String,
}

pub fn media_routes(state: AppState) -> Router {
    Router::new()
        .route("/upload", post(upload_file))
        .route("/upload-chunk", post(upload_chunk))
        .with_state(state)
}

async fn upload_file(
    State(_state): State<AppState>,
    RequireAuth(_claims): RequireAuth,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let upload_dir = "uploads";
    if !Path::new(upload_dir).exists() {
        fs::create_dir_all(upload_dir)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    if let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    {
        let file_name = field.file_name().unwrap_or("unknown").to_string();
        let data = field
            .bytes()
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        let ext = Path::new(&file_name)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("bin");
        let unique_name = format!("{}.{}", Uuid::new_v4(), ext);
        let save_path = format!("{}/{}", upload_dir, unique_name);

        fs::write(&save_path, data)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        return Ok(Json(UploadResponse {
            file_path: format!("/uploads/{}", unique_name),
        }));
    }

    Err((StatusCode::BAD_REQUEST, "No file provided".to_string()))
}

async fn upload_chunk(
    State(_state): State<AppState>,
    RequireAuth(_claims): RequireAuth,
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    let mut upload_id = String::new();
    let mut chunk_index = 0;
    let mut total_chunks = 0;
    let mut file_name = String::new();
    let mut chunk_data = Vec::new();

    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?
    {
        let name = field.name().unwrap_or("").to_string();
        if name == "upload_id" {
            upload_id = field.text().await.unwrap_or_default();
        } else if name == "chunk_index" {
            chunk_index = field
                .text()
                .await
                .unwrap_or_else(|_| "0".to_string())
                .parse()
                .unwrap_or(0);
        } else if name == "total_chunks" {
            total_chunks = field
                .text()
                .await
                .unwrap_or_else(|_| "0".to_string())
                .parse()
                .unwrap_or(0);
        } else if name == "file_name" {
            file_name = field.text().await.unwrap_or_default();
        } else if name == "chunk" {
            chunk_data = field
                .bytes()
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
                .to_vec();
        }
    }

    if upload_id.is_empty() || chunk_data.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Missing upload metadata or data".to_string(),
        ));
    }

    let temp_dir = format!("uploads/temp/{}", upload_id);
    fs::create_dir_all(&temp_dir)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let chunk_path = format!("{}/part_{}", temp_dir, chunk_index);
    fs::write(&chunk_path, chunk_data)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Check if all chunks are uploaded
    let mut uploaded_count = 0;
    let mut dir = fs::read_dir(&temp_dir)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    while dir
        .next_entry()
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .is_some()
    {
        uploaded_count += 1;
    }

    if uploaded_count == total_chunks {
        // Merge chunks
        let ext = Path::new(&file_name)
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("bin");
        let unique_name = format!("{}.{}", Uuid::new_v4(), ext);
        let final_dir = "uploads/maintenance";
        fs::create_dir_all(final_dir)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        let final_path = format!("{}/{}", final_dir, unique_name);

        let mut final_file = fs::OpenOptions::new()
            .create(true)
            .write(true)
            .append(true)
            .open(&final_path)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        for i in 0..total_chunks {
            let part_path = format!("{}/part_{}", temp_dir, i);
            let part_data = fs::read(&part_path)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
            use tokio::io::AsyncWriteExt;
            final_file
                .write_all(&part_data)
                .await
                .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
        }

        // Cleanup temp
        fs::remove_dir_all(&temp_dir).await.ok();

        return Ok(Json(UploadResponse {
            file_path: format!("/uploads/maintenance/{}", unique_name),
        }));
    }

    Ok(Json(UploadResponse {
        file_path: String::from("CHUNKING"), // Still processing
    }))
}
