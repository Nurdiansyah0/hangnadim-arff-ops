use crate::state::AppState;
use axum::{
    Router,
    extract::{Json, State},
    routing::post,
};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct SendReportRequest {
    pub to: String,
    pub subject: String,
    pub body: String,
}

pub fn email_routes(state: AppState) -> Router {
    Router::new()
        .route("/send-report", post(send_email_report))
        .with_state(state)
}

async fn send_email_report(
    State(state): State<AppState>,
    Json(payload): Json<SendReportRequest>,
) -> Result<String, String> {
    state
        .email_service
        .send_report(&payload.to, &payload.subject, &payload.body)
        .await?;

    Ok("Report sent successfully".to_string())
}
