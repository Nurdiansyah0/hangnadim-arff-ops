use crate::{domain::models::FlightRoute, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};
use serde::Deserialize;
use chrono::{DateTime, Utc};

#[derive(Deserialize)]
pub struct CreateFlightPayload {
    pub flight_number: String,
    pub origin: Option<String>,
    pub destination: Option<String>,
    pub runway: String,
    pub actual_time: DateTime<Utc>,
}

pub fn flight_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_flights).post(create_flight))
        .with_state(state)
}

async fn list_flights(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<Json<Vec<FlightRoute>>, (StatusCode, String)> {
    match state.flight_service.get_all_flights().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_flight(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Json(payload): Json<CreateFlightPayload>,
) -> Result<Json<FlightRoute>, (StatusCode, String)> {
    match state.flight_service.create_flight(
        &payload.flight_number, 
        payload.origin.as_deref(), 
        payload.destination.as_deref(), 
        &payload.runway, 
        payload.actual_time
    ).await {
        Ok(f) => Ok(Json(f)),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}
