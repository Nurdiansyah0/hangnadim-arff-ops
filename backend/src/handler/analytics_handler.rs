use crate::{handler::middleware::RequireAuth, state::AppState};
use axum::{extract::State, http::StatusCode, routing::get, Json, Router};

pub fn analytics_routes(state: AppState) -> Router {
    Router::new()
        .route("/performance", get(get_performance))
        .route("/kpis", get(get_kpi_report))
        .route("/fleet-readiness", get(get_fleet_readiness))
        .route("/alerts", get(get_alerts))
        .with_state(state)
}

async fn get_performance(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    // Analytics biasanya untuk Admin (1) atau Kasubsie (6)
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 6 {
        return Err((StatusCode::FORBIDDEN, "Hanya Administrator atau Kasubsie yang bisa melihat performa".to_string()));
    }

    match state.analytics_service.get_performance().await {
        Ok(metrics) => Ok(Json(serde_json::json!(metrics))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn get_kpi_report(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<crate::domain::models::KpiReport>>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 6 {
        return Err((StatusCode::FORBIDDEN, "Hanya Administrator atau Kasubsie yang bisa melihat KPI".to_string()));
    }

    match state.analytics_service.get_kpi_report().await {
        Ok(report) => Ok(Json(report)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn get_fleet_readiness(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<crate::domain::models::FleetReadinessItem>>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 6 {
        return Err((StatusCode::FORBIDDEN, "Hanya Administrator atau Kasubsie yang bisa melihat readiness".to_string()));
    }

    match state.analytics_service.get_fleet_readiness().await {
        Ok(fleet) => Ok(Json(fleet)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn get_alerts(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<crate::domain::models::AlertItem>>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 6 {
        return Err((StatusCode::FORBIDDEN, "Hanya Administrator atau Kasubsie yang bisa melihat alerts".to_string()));
    }

    match state.analytics_service.get_alerts().await {
        Ok(alerts) => Ok(Json(alerts)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
