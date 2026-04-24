use crate::domain::models::{ChangePasswordRequest, Claims, ProfileUpdateRequest};
use crate::state::AppState;
use axum::{
    Json, Router,
    extract::{Extension, Multipart, State},
    response::IntoResponse,
    routing::{post, put},
};
use std::path::PathBuf;
use tokio::fs::{OpenOptions, create_dir_all, rename};
use tokio::io::AsyncWriteExt;
use uuid::Uuid;

pub fn profile_routes(app_state: AppState) -> Router {
    Router::new()
        .route("/", put(update_profile))
        .route("/password", post(change_password))
        .route("/upload-photo", post(upload_photo_chunked))
        .with_state(app_state)
}

async fn update_profile(
    State(app_state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ProfileUpdateRequest>,
) -> impl IntoResponse {
    let personnel_id = match claims.personnel_id {
        Some(id) => id,
        None => {
            return (
                axum::http::StatusCode::BAD_REQUEST,
                "Profile not fully bound to personnel".to_string(),
            )
                .into_response();
        }
    };

    match app_state
        .auth_service
        .update_user_profile(personnel_id, payload.phone_number, payload.email)
        .await
    {
        Ok(_) => (axum::http::StatusCode::OK, "Profile updated").into_response(),
        Err(e) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn change_password(
    State(app_state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ChangePasswordRequest>,
) -> impl IntoResponse {
    let user_id = match Uuid::parse_str(&claims.sub) {
        Ok(id) => id,
        Err(_) => {
            return (
                axum::http::StatusCode::BAD_REQUEST,
                "Invalid user ID".to_string(),
            )
                .into_response();
        }
    };

    match app_state
        .auth_service
        .change_password(user_id, &payload.current_password, &payload.new_password)
        .await
    {
        Ok(_) => (axum::http::StatusCode::OK, "Password changed").into_response(),
        Err(e) => (axum::http::StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn upload_photo_chunked(
    State(app_state): State<AppState>,
    Extension(claims): Extension<Claims>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let personnel_id = match claims.personnel_id {
        Some(id) => id,
        None => {
            return (
                axum::http::StatusCode::BAD_REQUEST,
                "Invalid personnel ID".to_string(),
            )
                .into_response();
        }
    };

    let mut chunk_index = 0;
    let mut total_chunks = 1;
    let mut file_name = String::new();
    let mut chunk_data = Vec::new();

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        if name == "chunkIndex" {
            let text = field.text().await.unwrap_or_default();
            chunk_index = text.parse().unwrap_or(0);
        } else if name == "totalChunks" {
            let text = field.text().await.unwrap_or_default();
            total_chunks = text.parse().unwrap_or(1);
        } else if name == "fileName" {
            file_name = field.text().await.unwrap_or_default();
        } else if name == "chunk" {
            chunk_data = field.bytes().await.unwrap_or_default().to_vec();
        }
    }

    if chunk_data.is_empty() || file_name.is_empty() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            "Missing chunk data or filename",
        )
            .into_response();
    }

    // Ensure directories exist
    let temp_dir = PathBuf::from("uploads/temp");
    let target_dir = PathBuf::from("uploads/profiles");
    let _ = create_dir_all(&temp_dir).await;
    let _ = create_dir_all(&target_dir).await;

    // Use personnel_id to prevent collision
    let temp_file_path = temp_dir.join(format!("{}_{}", personnel_id, file_name));

    // Append to temp file
    let mut file = match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&temp_file_path)
        .await
    {
        Ok(f) => f,
        Err(e) => {
            return (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to open temp file: {}", e),
            )
                .into_response();
        }
    };

    if let Err(e) = file.write_all(&chunk_data).await {
        return (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to write chunk: {}", e),
        )
            .into_response();
    }

    // Check if it's the last chunk
    if chunk_index == total_chunks - 1 {
        // Build final file path (webp, jpg, png etc) - Just keep the same extension.
        // Actually, let's prefix it with personnel_id and timestamp
        let ext = file_name.split('.').next_back().unwrap_or("png");
        let final_filename = format!("{}.{}", personnel_id, ext);
        let final_file_path = target_dir.join(&final_filename);

        // Move temp file to final location
        if let Err(e) = rename(&temp_file_path, &final_file_path).await {
            return (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed to move final file: {}", e),
            )
                .into_response();
        }

        // Update DB
        let url_path = format!("/uploads/profiles/{}", final_filename);
        if let Err(e) = app_state
            .auth_service
            .update_profile_picture(personnel_id, &url_path)
            .await
        {
            return (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                format!("Failed saving DB: {}", e),
            )
                .into_response();
        }

        return (axum::http::StatusCode::OK, url_path).into_response();
    }

    (
        axum::http::StatusCode::PARTIAL_CONTENT,
        "Chunk received".to_string(),
    )
        .into_response()
}
