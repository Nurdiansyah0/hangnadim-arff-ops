use crate::{domain::models::FireExtinguisher, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::{Path, Query, State}, http::StatusCode, routing::get, Json, Router};
use rust_decimal::Decimal;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct CreateFireExtinguisherPayload {
    pub serial_number: String,
    pub agent_type: String,
    pub capacity_kg: Decimal,
    pub location_description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub floor: Option<String>,
    pub building: Option<String>,
    pub expiry_date: chrono::NaiveDate,
    pub last_inspection_date: Option<chrono::NaiveDate>,
    pub status: String,
    pub photo_url: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateFireExtinguisherPayload {
    pub serial_number: Option<String>,
    pub agent_type: Option<String>,
    pub capacity_kg: Option<Decimal>,
    pub location_description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub floor: Option<String>,
    pub building: Option<String>,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub last_inspection_date: Option<chrono::NaiveDate>,
    pub status: Option<String>,
    pub photo_url: Option<String>,
}

#[derive(Deserialize)]
pub struct ExpiringQuery {
    pub days: Option<i64>,
}

#[derive(Deserialize)]
pub struct NearbyQuery {
    pub lat: f64,
    pub lng: f64,
    pub radius: Option<f64>,
}

pub fn fire_extinguisher_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_extinguishers).post(create_extinguisher))
        .route("/nearby", get(nearby_extinguishers))
        .route("/geojson", get(geojson_extinguishers))
        .route("/expiring", get(list_expiring_soon))
        .route("/{id}", get(get_extinguisher).put(update_extinguisher).delete(delete_extinguisher))
        .with_state(state)
}

async fn list_extinguishers(
    State(state): State<AppState>,
    _claims: RequireAuth,
) -> Result<Json<Vec<FireExtinguisher>>, (StatusCode, String)> {
    state
        .fire_extinguisher_service
        .get_all_extinguishers()
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

async fn list_expiring_soon(
    State(state): State<AppState>,
    _claims: RequireAuth,
    Query(query): Query<ExpiringQuery>,
) -> Result<Json<Vec<FireExtinguisher>>, (StatusCode, String)> {
    let days = query.days.unwrap_or(30);
    state
        .fire_extinguisher_service
        .get_expiring_soon(days)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

async fn get_extinguisher(
    State(state): State<AppState>,
    _claims: RequireAuth,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<FireExtinguisher>, (StatusCode, String)> {
    match state.fire_extinguisher_service.get_extinguisher_by_id(id).await {
        Ok(Some(record)) => Ok(Json(record)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "Fire extinguisher not found".to_string())),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_extinguisher(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateFireExtinguisherPayload>,
) -> Result<Json<FireExtinguisher>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    // Allow: Superuser (1), Manager (3), Ops TL (5), Maint TL (6), General TL (7), Squad Leader (8), Officer (9)
    if rid != 1 && rid != 3 && rid != 5 && rid != 6 && rid != 7 && rid != 8 && rid != 9 {
        return Err((StatusCode::FORBIDDEN, "Forbidden: Missing asset management permission".to_string()));
    }

    match state.fire_extinguisher_service.create_extinguisher(
        &payload.serial_number,
        &payload.agent_type,
        payload.capacity_kg,
        payload.location_description.as_deref(),
        payload.latitude,
        payload.longitude,
        payload.floor.as_deref(),
        payload.building.as_deref(),
        payload.expiry_date,
        payload.last_inspection_date,
        &payload.status,
        payload.photo_url.as_deref(),
    ).await {
        Ok(item) => Ok(Json(item)),
        Err(e) => {
            if e.contains("duplicate key value violates unique constraint") {
                Err((StatusCode::CONFLICT, "Serial number already exists".to_string()))
            } else if e.contains("invalid_status") {
                Err((StatusCode::BAD_REQUEST, "Invalid status. Allowed: READY, MAINTENANCE, EXPIRED, OUT_OF_SERVICE".to_string()))
            } else if e.contains("expiry_date") {
                Err((StatusCode::BAD_REQUEST, e))
            } else {
                Err((StatusCode::INTERNAL_SERVER_ERROR, e))
            }
        }
    }
}

async fn update_extinguisher(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdateFireExtinguisherPayload>,
) -> Result<Json<FireExtinguisher>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 3 && rid != 5 && rid != 6 && rid != 7 && rid != 8 && rid != 9 {
        return Err((StatusCode::FORBIDDEN, "Forbidden: Missing asset management permission".to_string()));
    }

    match state.fire_extinguisher_service.update_extinguisher(
        id,
        payload.serial_number.as_deref(),
        payload.agent_type.as_deref(),
        payload.capacity_kg,
        payload.location_description.as_deref(),
        payload.latitude,
        payload.longitude,
        payload.floor.as_deref(),
        payload.building.as_deref(),
        payload.expiry_date,
        payload.last_inspection_date,
        payload.status.as_deref(),
        payload.photo_url.as_deref(),
    ).await {
        Ok(Some(item)) => Ok(Json(item)),
        Ok(None) => Err((StatusCode::NOT_FOUND, "Fire extinguisher not found".to_string())),
        Err(e) => Err((StatusCode::BAD_REQUEST, e)),
    }
}

async fn delete_extinguisher(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<uuid::Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 3 && rid != 5 && rid != 6 && rid != 7 && rid != 8 && rid != 9 {
        return Err((StatusCode::FORBIDDEN, "Forbidden: Missing asset management permission".to_string()));
    }

    match state.fire_extinguisher_service.delete_extinguisher(id).await {
        Ok(1) => Ok(StatusCode::NO_CONTENT),
        Ok(0) => Err((StatusCode::NOT_FOUND, "Fire extinguisher not found".to_string())),
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn nearby_extinguishers(
    State(state): State<AppState>,
    _claims: RequireAuth,
    Query(query): Query<NearbyQuery>,
) -> Result<Json<Vec<FireExtinguisher>>, (StatusCode, String)> {
    let radius = query.radius.unwrap_or(500.0); // Default 500m
    state
        .fire_extinguisher_service
        .get_nearby_extinguishers(query.lat, query.lng, radius)
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}

async fn geojson_extinguishers(
    State(state): State<AppState>,
    _claims: RequireAuth,
) -> Result<Json<serde_json::Value>, (StatusCode, String)> {
    state
        .fire_extinguisher_service
        .get_geojson_extinguishers()
        .await
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))
}
