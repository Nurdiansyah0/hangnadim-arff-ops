use crate::{
    domain::models::{Inspection, InspectionResult, InspectionTemplate, TemplateItem},
    handler::middleware::RequireAuth,
    repository::inspection_repository::CreateInspectionParams,
    state::AppState,
};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    routing::get,
};
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
    pub vehicle_id: Option<Uuid>,
    pub fire_extinguisher_id: Option<Uuid>,
    pub tanggal: chrono::NaiveDate,
    pub status: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
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
        .route(
            "/templates",
            get(list_inspection_templates).post(create_inspection_template),
        )
        .route(
            "/templates/{template_id}/items",
            get(list_template_items).post(create_template_item),
        )
        .route("/{id}", get(get_inspection_by_id))
        .with_state(state)
}

async fn list_inspections(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
) -> Result<Json<Vec<Inspection>>, (StatusCode, String)> {
    let rid = claims.role_id.unwrap_or(0);

    // Admin (1), Manager (3), VP (2) see everything.
    // Others (Staff, squad leaders) see only their own.
    let filter_id = if rid == 1 || rid == 2 || rid == 3 {
        None
    } else {
        claims.personnel_id
    };

    match state
        .inspection_service
        .get_all_inspections(filter_id)
        .await
    {
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
            Ok(results) => Ok(Json(InspectionDetail {
                inspection,
                results,
            })),
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

    match state
        .inspection_service
        .get_template_items(template_id)
        .await
    {
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

    match state
        .inspection_service
        .create_template(&payload.name, &payload.target_type, &payload.frequency)
        .await
    {
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

    match state
        .inspection_service
        .create_template_item(
            template_id,
            &payload.category,
            &payload.item_name,
            payload.item_order,
        )
        .await
    {
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
    if rid != 1 && rid != 5 && rid != 4 && rid != 8 && rid != 9 {
        return Err((
            StatusCode::FORBIDDEN,
            "Role tidak memiliki izin melakukan inspeksi".to_string(),
        ));
    }

    let results = payload
        .results
        .into_iter()
        .map(
            |item| crate::repository::inspection_repository::InspectionResultCreate {
                template_item_id: item.template_item_id,
                result: item.result,
                notes: item.notes,
                photo_url: item.photo_url,
            },
        )
        .collect();

    // Backend Deep Sync: If user has an active assignment, enforce that vehicle
    let mut final_vehicle_id = payload.vehicle_id;
    let user_id = Uuid::parse_str(&claims.sub).unwrap_or_default();

    if let Ok(context) = state.auth_service.get_operational_context(user_id).await
        && let Some(assigned_id) = context.assigned_vehicle_id
    {
        // Force the vehicle_id to match the assignment for non-admins
        if rid != 1 && rid != 2 && rid != 3 {
            final_vehicle_id = Some(assigned_id);
        }
    }

    match state
        .inspection_service
        .create_inspection_with_results(CreateInspectionParams {
            vehicle_id: final_vehicle_id,
            fire_extinguisher_id: payload.fire_extinguisher_id,
            personnel_id: claims.personnel_id,
            tanggal: payload.tanggal,
            status: &payload.status,
            latitude: payload.latitude,
            longitude: payload.longitude,
            results,
        })
        .await
    {
        Ok(v) => Ok(Json(v)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e)),
    }
}
