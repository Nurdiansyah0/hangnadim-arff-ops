use axum::{extract::{State, Path, Query}, http::StatusCode, routing::{get, put, post}, Json, Router};
use serde::Deserialize;
use uuid::Uuid;
use chrono::NaiveDate;
use crate::{state::AppState, handler::middleware::RequireAuth};

#[derive(Deserialize)]
pub struct DateQuery {
    pub date: NaiveDate,
}

#[derive(Deserialize)]
pub struct PendingApprovalQuery {
    pub shift_id: i32,
    pub date: NaiveDate,
}

#[derive(Deserialize)]
pub struct SubmitTaskPayload {
    pub completed_notes: Option<String>,
}

#[derive(Deserialize)]
pub struct ApproveShiftPayload {
    pub shift_id: i32,
    pub date: NaiveDate,
    pub notes: Option<String>,
}

pub fn task_routes(state: AppState) -> Router {
    Router::new()
        .route("/my-tasks", get(get_my_tasks))
        .route("/{id}/submit", put(submit_task))
        .route("/pending-approval", get(get_shift_pending_approval))
        .route("/approve-shift", post(approve_shift))
        .route("/generate-today", post(generate_today_tasks))
        .with_state(state)
}

// 1. Staff sees their own tasks for a given date
async fn get_my_tasks(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Query(params): Query<DateQuery>,
) -> Result<Json<Vec<crate::domain::models::DailyTaskView>>, (StatusCode, String)> {
    let personnel_id = claims.personnel_id.ok_or((StatusCode::UNAUTHORIZED, "Missing personnel profile".to_string()))?;
    let tasks = state.task_service.get_my_tasks(personnel_id, params.date)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(tasks))
}

// 2. Staff submits a specific task
async fn submit_task(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
    Path(id): Path<Uuid>,
    Json(payload): Json<SubmitTaskPayload>,
) -> Result<StatusCode, (StatusCode, String)> {
    state.task_service.submit_task(id, payload.completed_notes)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(StatusCode::OK)
}

// 3. Team Leader views all tasks belonging to their shift
async fn get_shift_pending_approval(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth, // In reality, we might assert Role === TL here
    Query(params): Query<PendingApprovalQuery>,
) -> Result<Json<Vec<crate::domain::models::DailyTaskView>>, (StatusCode, String)> {
    let tasks = state.task_service.get_shift_pending_approval(params.shift_id, params.date)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(Json(tasks))
}

// 4. Team Leader approves the shift -> becomes Shift Report
async fn approve_shift(
    State(state): State<AppState>,
    RequireAuth(claims): RequireAuth,
    Json(payload): Json<ApproveShiftPayload>,
) -> Result<Json<crate::domain::models::ShiftReport>, (StatusCode, String)> {
    let leader_id = claims.personnel_id.ok_or((StatusCode::UNAUTHORIZED, "Missing personnel profile".to_string()))?;
    let report = state.task_service.approve_shift(
        leader_id,
        payload.shift_id,
        payload.date,
        payload.notes,
    )
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;

    Ok(Json(report))
}

// 5. Test endpoint to generate today's tasks
async fn generate_today_tasks(
    State(state): State<AppState>,
    RequireAuth(_): RequireAuth,
) -> Result<StatusCode, (StatusCode, String)> {
    let today = chrono::Local::now().naive_local().date();
    state.task_service.generate_tasks_for_date(today)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e))?;
    Ok(StatusCode::OK)
}
