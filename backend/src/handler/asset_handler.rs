use crate::{
    domain::{
        dtos::{
            CreateVehicleDto, UpdateVehicleDto, CreateFireEquipmentDto, UpdateFireEquipmentDto,
            CreateHydrantDto, UpdateHydrantDto, CreateFoamSystemDto, UpdateFoamSystemDto,
            UpdateAssetStatusDto
        }
    },
    handler::middleware::RequireAuth,
    state::AppState
};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};
use uuid::Uuid;
use validator::Validate;

pub fn asset_routes(state: AppState) -> Router {
    Router::new()
        // Vehicles
        .route("/vehicles", get(list_vehicles).post(create_vehicle))
        .route("/vehicles/{id}", get(get_vehicle).put(update_vehicle).delete(delete_vehicle))
        .route("/vehicles/{id}/status", patch(update_vehicle_status))
        // Fire Equipment
        .route("/equipments", get(list_equipments).post(create_equipment))
        .route("/equipments/{id}", get(get_equipment).put(update_equipment).delete(delete_equipment))
        .route("/equipments/{id}/status", patch(update_equipment_status))
        // Hydrants
        .route("/hydrants", get(list_hydrants).post(create_hydrant))
        .route("/hydrants/{id}", get(get_hydrant).put(update_hydrant).delete(delete_hydrant))
        .route("/hydrants/{id}/status", patch(update_hydrant_status))
        // Foam Systems
        .route("/foam-systems", get(list_foam_systems).post(create_foam_system))
        .route("/foam-systems/{id}", get(get_foam_system).put(update_foam_system).delete(delete_foam_system))
        .route("/foam-systems/{id}/status", patch(update_foam_system_status))
        .with_state(state)
}

// Vehicles Handlers
async fn list_vehicles(State(state): State<AppState>, _auth: RequireAuth) -> impl IntoResponse {
    match state.asset_service.get_all_vehicles().await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn create_vehicle(State(state): State<AppState>, _auth: RequireAuth, Json(payload): Json<CreateVehicleDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.create_vehicle(payload).await {
        Ok(v) => (StatusCode::CREATED, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_vehicle(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.get_vehicle_by_id(id).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn update_vehicle(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateVehicleDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.update_vehicle(id, payload).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn update_vehicle_status(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateAssetStatusDto>) -> impl IntoResponse {
    match state.asset_service.update_vehicle_status(id, payload.status).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn delete_vehicle(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.delete_vehicle(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

// Fire Equipment Handlers
async fn list_equipments(State(state): State<AppState>, _auth: RequireAuth) -> impl IntoResponse {
    match state.asset_service.get_all_equipments().await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn create_equipment(State(state): State<AppState>, _auth: RequireAuth, Json(payload): Json<CreateFireEquipmentDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.create_equipment(payload).await {
        Ok(v) => (StatusCode::CREATED, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_equipment(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.get_equipment_by_id(id).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn update_equipment(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateFireEquipmentDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.update_equipment(id, payload).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn update_equipment_status(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateAssetStatusDto>) -> impl IntoResponse {
    match state.asset_service.update_equipment_status(id, payload.status).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn delete_equipment(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.delete_equipment(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

// Hydrant Handlers
async fn list_hydrants(State(state): State<AppState>, _auth: RequireAuth) -> impl IntoResponse {
    match state.asset_service.get_all_hydrants().await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn create_hydrant(State(state): State<AppState>, _auth: RequireAuth, Json(payload): Json<CreateHydrantDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.create_hydrant(payload).await {
        Ok(v) => (StatusCode::CREATED, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_hydrant(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.get_hydrant_by_id(id).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn update_hydrant(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateHydrantDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.update_hydrant(id, payload).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn update_hydrant_status(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateAssetStatusDto>) -> impl IntoResponse {
    match state.asset_service.update_hydrant_status(id, payload.status).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn delete_hydrant(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.delete_hydrant(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

// Foam System Handlers
async fn list_foam_systems(State(state): State<AppState>, _auth: RequireAuth) -> impl IntoResponse {
    match state.asset_service.get_all_foam_systems().await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn create_foam_system(State(state): State<AppState>, _auth: RequireAuth, Json(payload): Json<CreateFoamSystemDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.create_foam_system(payload).await {
        Ok(v) => (StatusCode::CREATED, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn get_foam_system(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.get_foam_system_by_id(id).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn update_foam_system(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateFoamSystemDto>) -> impl IntoResponse {
    if let Err(e) = payload.validate() {
        return (StatusCode::BAD_REQUEST, e.to_string()).into_response();
    }
    match state.asset_service.update_foam_system(id, payload).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn update_foam_system_status(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>, Json(payload): Json<UpdateAssetStatusDto>) -> impl IntoResponse {
    match state.asset_service.update_foam_system_status(id, payload.status).await {
        Ok(v) => (StatusCode::OK, Json(v)).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn delete_foam_system(State(state): State<AppState>, _auth: RequireAuth, Path(id): Path<Uuid>) -> impl IntoResponse {
    match state.asset_service.delete_foam_system(id).await {
        Ok(_) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}
