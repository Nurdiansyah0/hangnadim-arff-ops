use axum::{
    extract::State as AxumState,
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use crate::state::AppState;
use crate::handler::middleware::RequireAuth;

pub fn fitness_routes(state: AppState) -> Router {
    Router::new()
        .route("/me/trend", get(get_my_trend))
        .with_state(state)
}

pub async fn get_my_trend(
    AxumState(state): AxumState<AppState>,
    RequireAuth(claims): RequireAuth,
) -> impl IntoResponse {
    let personnel_id = match claims.personnel_id {
        Some(id) => id,
        None => return (StatusCode::FORBIDDEN, Json("Only tied personnel can view fitness trends.".to_string())).into_response()
    };

    match state.fitness_service.get_my_fitness_trend(personnel_id).await {
        Ok(Some(trend)) => (StatusCode::OK, Json(trend)).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json("No historical fitness data found.".to_string())).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(e)).into_response(),
    }
}
