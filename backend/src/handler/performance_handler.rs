use crate::domain::models::VehiclePerformanceTest;
use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::get,
};
use serde::Deserialize;
use uuid::Uuid;

pub fn performance_routes(state: AppState) -> Router {
    Router::new()
        .route("/vehicle", get(get_vehicle_tests).post(create_vehicle_test))
        .with_state(state)
}

#[derive(Deserialize)]
pub struct FilterQuery {
    pub vehicle_id: Option<Uuid>,
}

async fn get_vehicle_tests(
    State(state): State<AppState>,
    Query(filter): Query<FilterQuery>,
) -> Result<Json<Vec<VehiclePerformanceTest>>, (StatusCode, String)> {
    match state
        .performance_service
        .get_vehicle_tests(filter.vehicle_id)
        .await
    {
        Ok(tests) => Ok(Json(tests)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_vehicle_test(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(mut payload): Json<VehiclePerformanceTest>,
) -> Result<(StatusCode, Json<VehiclePerformanceTest>), (StatusCode, String)> {
    // Set inspector from current user
    payload.inspector_id = claims.personnel_id;

    match state.performance_service.create_vehicle_test(payload).await {
        Ok(test) => Ok((StatusCode::CREATED, Json(test))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
