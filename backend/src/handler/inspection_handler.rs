use crate::{domain::models::{Inspection, InspectionResult, InspectionTemplate, TemplateItem}, handler::middleware::RequireAuth, state::AppState};
use axum::{extract::{Path, State}, http::StatusCode, routing::get, Json, Router};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Deserialize)]
pub struct CreateInspectionResultPayload {
    pub template_item_id: i32,
    pub result: String,
    pub notes: Option<String>,
    pub photo_url: Option<String>,
}

#[derive(Deserialize)]
pub struct CreateInspectionPayload {
    pub vehicle_id: Uuid,
    pub tanggal: chrono::NaiveDate,
    pub status: String,
    pub template_id: Option<i32>,
    pub results: Vec<CreateInspectionResultPayload>,
}

#[derive(Deserialize)]
pub struct CreateInspectionTemplatePayload {
    pub name: String,
    pub target_type: String,
    pub frequency: String,
}

#[derive(Deserialize)]
pub struct CreateTemplateItemPayload {
    pub category: String,
    pub item_name: String,
    pub item_order: i32,
}

#[derive(Serialize)]
pub struct InspectionDetail {
    pub inspection: Inspection,
    pub results: Vec<InspectionResult>,
}

pub fn inspection_routes(state: AppState) -> Router {
    Router::new()
        .route("/", get(list_inspections).post(create_inspection))
        .route("/templates", get(list_inspection_templates).post(create_inspection_template))
        .route("/templates/{template_id}/items", get(list_template_items).post(create_template_item))
        .route("/{id}", get(get_inspection_by_id))
        .with_state(state)
}

async fn list_inspections(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Inspection>>, (StatusCode, String)> {
    if claims.role_id.is_none() {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.get_all_inspections().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn get_inspection_by_id(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(id): Path<Uuid>,
) -> Result<Json<InspectionDetail>, (StatusCode, String)> {
    if claims.role_id.is_none() {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.get_inspection_by_id(id).await {
        Ok(inspection) => match state.inspection_service.get_inspection_results(id).await {
            Ok(results) => Ok(Json(InspectionDetail { inspection, results })),
            Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
        },
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn list_inspection_templates(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<InspectionTemplate>>, (StatusCode, String)> {
    if claims.role_id.is_none() {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.get_all_templates().await {
        Ok(data) => Ok(Json(data)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn list_template_items(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(template_id): Path<i32>,
) -> Result<Json<Vec<TemplateItem>>, (StatusCode, String)> {
    if claims.role_id.is_none() {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.get_template_items(template_id).await {
        Ok(items) => Ok(Json(items)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_inspection_template(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateInspectionTemplatePayload>,
) -> Result<Json<InspectionTemplate>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 5 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.create_template(
        &payload.name,
        &payload.target_type,
        &payload.frequency,
    ).await {
        Ok(template) => Ok(Json(template)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_template_item(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Path(template_id): Path<i32>,
    Json(payload): Json<CreateTemplateItemPayload>,
) -> Result<Json<TemplateItem>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 5 {
        return Err((StatusCode::FORBIDDEN, "Forbidden".to_string()));
    }

    match state.inspection_service.create_template_item(
        template_id,
        &payload.category,
        &payload.item_name,
        payload.item_order,
    ).await {
        Ok(item) => Ok(Json(item)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}

async fn create_inspection(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<CreateInspectionPayload>,
) -> Result<Json<Inspection>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);
    if rid != 1 && rid != 5 && rid != 4 {
        return Err((StatusCode::FORBIDDEN, "Role tidak memiliki izin melakukan inspeksi".to_string()));
    }

    let results = payload
        .results
        .into_iter()
        .map(|item| crate::repository::inspection_repository::InspectionResultCreate {
            template_item_id: item.template_item_id,
            result: item.result,
            notes: item.notes,
            photo_url: item.photo_url,
        })
        .collect();

    match state
        .inspection_service
        .create_inspection_with_results(
            payload.vehicle_id,
            claims.personnel_id,
            payload.tanggal,
            &payload.status,
            results,
        )
        .await
    {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
