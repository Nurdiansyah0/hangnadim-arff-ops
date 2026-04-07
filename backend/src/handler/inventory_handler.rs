use crate::{domain::models::ExtinguishingAgent, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::{Path, State}, http::StatusCode, routing::{get, put}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;
use bigdecimal::BigDecimal;

#[derive(Deserialize)]
pub struct UpdateInventoryPayload {
    pub inventory_level: BigDecimal,
}

#[derive(Deserialize)]
pub struct CreateAgentPayload {
    pub name: String,
    pub brand: Option<String>,
    pub min_requirement: BigDecimal,
    pub unit: String,
    pub inventory_level: BigDecimal,
    pub last_procurement_year: Option<String>,
}

pub fn inventory_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_agents).post(create_agent))
        .route("/{id}/level", put(update_level))
        .with_state(state)
}

async fn list_agents(
    State(state): State<AppState>,
    RequireAuth(_claims): RequireAuth,
) -> Result<Json<Vec<ExtinguishingAgent>>, (StatusCode, String)> {
    // Semua role (1, 2, 3) bisa melihat
    match state.inventory_service.get_all_agents().await {
        Ok(agents) => Ok(Json(agents)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn update_level(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateInventoryPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    // Hanya Admin (1) atau Manager (2) yang bisa update stok
    if rid != 1 && rid != 2 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inventory_service.update_inventory_level(id, payload.inventory_level).await {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_agent(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateAgentPayload>,
) -> Result<Json<ExtinguishingAgent>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    // Hanya Admin (1) yang bisa buat agen baru
    if rid != 1 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inventory_service.create_agent(
        &payload.name, 
        payload.brand.as_deref(), 
        payload.min_requirement, 
        &payload.unit, 
        payload.inventory_level, 
        payload.last_procurement_year.as_deref()
    ).await {
        Ok(agent) => Ok(Json(agent)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
