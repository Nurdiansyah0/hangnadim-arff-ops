use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

// =========================================================
// 1. IDENTITY & ACCESS (RBAC)
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Role {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Permission {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Personnel {
    pub id: Uuid,
    pub nip_nik: String,
    pub full_name: String,
    pub position_id: Option<i32>,
    pub employment_status: Option<String>,
    pub shift: Option<String>,
    pub status: Option<String>,
    pub phone_number: Option<String>,
    pub profile_picture_url: Option<String>,
    pub corporate_level: Option<String>,
    pub annual_leave_quota: Option<i32>,
    pub remaining_leave: Option<i32>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct User {
    pub id: Uuid,
    pub personnel_id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub status: Option<String>,
    pub last_login_at: Option<DateTime<Utc>>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,

    #[sqlx(default)]
    pub role_id: Option<i32>,

    // Optional joined fields for convenience in some queries
    pub full_name: Option<String>,
    pub nip_nik: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct UserProfile {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub position_name: Option<String>,
    pub role_name: Option<String>,
    pub role_id: Option<i32>,
    pub phone_number: Option<String>,
    pub profile_picture_url: Option<String>,
    pub remaining_leave: Option<i32>,
    pub annual_leave_quota: Option<i32>,
    pub shift_team: Option<String>,
    pub personnel_id: Option<Uuid>,
    pub created_at: Option<DateTime<Utc>>, // Made optional for safety
}

// --- Specialized Responses ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthContextResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub full_name: Option<String>,
    pub role: String,
    pub position: Option<String>,
    pub phone_number: Option<String>,
    pub profile_picture_url: Option<String>,
    pub permissions: Vec<String>,
    pub remaining_leave: Option<i32>,
    pub annual_leave_quota: Option<i32>,
    pub shift_team: Option<String>,
    pub personnel_id: Option<Uuid>,
    pub role_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SquadSummaryResponse {
    pub active_personnel: i64,
    pub pending_tasks: i64,
    pub completed_tasks: i64,
    pub readiness_percentage: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FullProfileResponse {
    pub personal: User,
    pub position: Option<String>,
    pub role: Option<String>,
    pub certifications: Vec<CertificationDetail>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct CertificationDetail {
    pub title: String,
    pub category: Option<String>,
    pub cert_number: Option<String>,
    pub issue_date: Option<chrono::NaiveDate>,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OperationalContextResponse {
    pub shift_id: Option<i32>,
    pub shift_name: Option<String>,
    pub shift_start: Option<chrono::NaiveTime>,
    pub shift_end: Option<chrono::NaiveTime>,
    pub duty_position: Option<String>,
    pub assigned_vehicle: Option<String>,
    pub assigned_vehicle_id: Option<Uuid>,
    pub duty_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FlightFilter {
    pub date: Option<chrono::NaiveDate>,
    pub route_id: Option<i32>,
    pub status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileUpdateRequest {
    pub phone_number: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub role_id: Option<i32>,
    pub personnel_id: Option<Uuid>,
    pub exp: usize,
}

// =========================================================
// 2. ORGANIZATION (HR)
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Position {
    pub id: i32,
    pub name: String,
}

// Personnel struct is now defined above for better modularity

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PersonnelCertification {
    pub id: Uuid,
    pub personnel_id: Option<Uuid>,
    pub training_id: Option<i32>,
    pub cert_number: String,
    pub issue_date: chrono::NaiveDate,
    pub expiry_date: chrono::NaiveDate,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// =========================================================
// 3. MASTER DATA (ARMADA & OPS)
// ===================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Shift {
    pub id: i32,
    pub name: String,
    pub start_time: chrono::NaiveTime,
    pub end_time: chrono::NaiveTime,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Vehicle {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub vehicle_type: Option<String>,
    pub status: String, // Maps to vehicle_status_enum (READY, etc)
    pub water_capacity_l: Option<BigDecimal>,
    pub foam_capacity_l: Option<BigDecimal>,
    pub powder_capacity_kg: Option<BigDecimal>,
    pub last_service_date: Option<chrono::NaiveDate>,
    pub next_service_due: Option<chrono::NaiveDate>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct VehiclePerformanceTest {
    pub id: Uuid,
    pub vehicle_id: Uuid,
    pub inspector_id: Option<Uuid>,
    pub test_date: DateTime<Utc>,
    pub top_speed_kmh: f64,
    pub discharge_range_m: f64,
    pub discharge_rate_lpm: f64,
    pub stopping_distance_m: f64,
    pub remarks: Option<String>,
    pub status: String, // PASS, FAIL
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Optional joined fields
    #[sqlx(default)]
    pub vehicle_code: Option<String>,
    #[sqlx(default)]
    pub inspector_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct ExtinguishingAgent {
    pub id: Uuid,
    pub name: String,
    pub brand: Option<String>,
    pub min_requirement: BigDecimal,
    pub unit: String,
    pub inventory_level: BigDecimal,
    pub last_procurement_year: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct FireExtinguisher {
    pub id: Uuid,
    pub serial_number: String,
    pub agent_type: Option<String>,
    pub capacity_kg: Option<rust_decimal::Decimal>,
    pub location_description: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub floor: Option<String>,
    pub building: Option<String>,
    pub expiry_date: Option<chrono::NaiveDate>,
    pub last_inspection_date: Option<chrono::NaiveDate>,
    pub status: String,
    pub photo_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct InspectionTemplate {
    pub id: i32,
    pub name: String,
    pub target_type: String,
    pub frequency: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct TemplateItem {
    pub id: i32,
    pub template_id: i32,
    pub category: String,
    pub item_name: String,
    pub item_order: i32,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct InspectionResult {
    pub id: uuid::Uuid,
    pub inspection_id: uuid::Uuid,
    pub inspection_date: chrono::NaiveDate,
    pub template_item_id: i32,
    pub result: String,
    pub notes: Option<String>,
    pub photo_url: Option<String>,
    pub created_at: DateTime<Utc>,

    // Joined fields for metadata sync
    #[sqlx(default)]
    pub item_name: Option<String>,
    #[sqlx(default)]
    pub category: Option<String>,
}

// =========================================================
// 4. TRANSACTIONS (INSPECTIONS & WATCHROOM)
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Inspection {
    pub id: Uuid,
    pub vehicle_id: Option<Uuid>,
    pub fire_extinguisher_id: Option<Uuid>,
    pub personnel_id: Option<Uuid>,
    pub tanggal: chrono::NaiveDate,
    pub status: String,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub approved_by: Option<Uuid>,
    pub approved_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,

    // Joined metadata for total sync
    #[sqlx(default)]
    pub inspector_name: Option<String>,
    #[sqlx(default)]
    pub vehicle_code: Option<String>,
    #[sqlx(default)]
    pub fire_extinguisher_serial: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct MaintenanceRecord {
    pub id: Uuid,
    pub vehicle_id: Uuid,
    pub maintenance_type: Option<String>, // SCHEDULED, UNSCHEDULED, REPAIR
    pub description: String,
    pub performed_by: Uuid,
    pub performed_at: Option<chrono::NaiveDate>,
    pub cost: Option<BigDecimal>,
    pub next_due: Option<chrono::NaiveDate>,
    pub status: String, // REQUESTED, IN_PROGRESS, COMPLETED, REJECTED
    pub photo_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Optional joined fields
    #[sqlx(default)]
    pub vehicle_code: Option<String>,
    #[sqlx(default)]
    pub personnel_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Finding {
    pub id: Uuid,
    pub inspection_result_id: Uuid,
    pub severity: String, // LOW, MEDIUM, HIGH, CRITICAL
    pub description: Option<String>,
    pub assigned_to: Option<Uuid>,
    pub status: String, // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    pub resolved_at: Option<DateTime<Utc>>,
    pub resolution_notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,

    // Optional joined fields
    #[sqlx(default)]
    pub inspector_name: Option<String>,
    #[sqlx(default)]
    pub asset_code: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct KpiDefinition {
    pub id: i32,
    pub code: String,
    pub name: String,
    pub unit: String,
    pub threshold_green: f64,
    pub threshold_yellow: f64,
    pub threshold_red: f64,
    pub regulation_ref: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct KpiReport {
    pub code: String,
    pub name: String,
    pub value: f64,
    pub unit: String,
    pub status: String,     // GREEN, YELLOW, RED
    pub trend: Option<f64>, // Percentage change vs prev period
    pub threshold_green: f64,
    pub threshold_yellow: f64,
    pub threshold_red: f64,
    pub regulation_ref: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FleetReadinessItem {
    pub label: String,
    pub rate: f64,
    pub color: String, // emerald, amber, rose, blue, purple, etc
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AlertItem {
    pub alert_type: String, // Critical Supply Low, Inspection Overdue
    pub description: String,
    pub color: String, // rose, amber, etc.
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct WatchroomLog {
    pub id: Uuid,
    pub personnel_id: Option<Uuid>,
    pub entry_type: Option<String>,
    pub description: String,
    pub payload: Option<serde_json::Value>,
    pub photo_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct DutyAssignment {
    pub id: Uuid,
    pub personnel_id: Uuid,
    pub shift_id: Option<i32>,
    pub vehicle_id: Option<Uuid>,
    pub position: String, // Maps to duty_position_enum
    pub status: Option<String>,
    pub assignment_date: chrono::NaiveDate,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct RosterView {
    pub id: Uuid,
    pub assignment_date: chrono::NaiveDate,
    pub personnel_id: Uuid, // Added for linking
    pub personnel_name: String,
    pub team_name: String,
    pub shift_name: String,
    pub vehicle_id: Option<Uuid>, // Added for linking
    pub vehicle_code: Option<String>,
    pub position: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Incident {
    pub id: Uuid,
    pub commander_id: Option<Uuid>,
    pub description: String,
    pub location: Option<String>,
    pub dispatch_time: DateTime<Utc>,
    pub arrival_time: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub severity: Option<String>, // Maps to severity_enum (LOW, HIGH, etc)
    pub photo_url: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct FlightRoute {
    pub id: Uuid,
    pub flight_number: String,
    pub origin: Option<String>,
    pub destination: Option<String>,
    pub runway: String, // Maps to runway_enum (04, 22)
    pub actual_time: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

// =========================================================
// 5. AUDIT & LOGS
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct AuditLog {
    pub id: Uuid,
    pub actor_id: Option<Uuid>,
    pub table_name: String,
    pub action: String,
    pub original_data: Option<serde_json::Value>,
    pub new_data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,

    // Joined field
    #[sqlx(default)]
    pub actor_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditLogResponse {
    pub logs: Vec<AuditLog>,
    pub total: i64,
}

// =========================================================
// 6. HEALTH & FITNESS (Readiness)
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PhysicalFitnessTest {
    pub id: Uuid,
    pub personnel_id: Uuid,
    pub test_date: chrono::NaiveDate,
    pub run_12min_meters: i32,
    pub shuttle_run_seconds: bigdecimal::BigDecimal,
    pub pull_ups: i32,
    pub sit_ups: i32,
    pub push_ups: i32,
    pub score: Option<bigdecimal::BigDecimal>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FitnessTrendResponse {
    pub current: PhysicalFitnessTest,
    pub previous: Option<PhysicalFitnessTest>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct TaskTemplate {
    pub id: Uuid,
    pub position: String,
    pub task_name: String,
    pub description: Option<String>,
    pub is_mandatory: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct DailyTask {
    pub id: Uuid,
    pub assignment_id: Uuid,
    pub task_name: String,
    pub description: Option<String>,
    pub status: Option<String>,
    pub completed_at: Option<DateTime<Utc>>,
    pub completed_notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct ShiftReport {
    pub id: Uuid,
    pub report_date: chrono::NaiveDate,
    pub shift_id: i32,
    pub team_leader_id: Uuid,
    pub status: Option<String>,
    pub approval_notes: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct DailyTaskView {
    pub task_id: Uuid,
    pub task_name: String,
    pub task_description: Option<String>,
    pub status: Option<String>,
    pub completed_at: Option<DateTime<Utc>>,
    pub completed_notes: Option<String>,
    pub assignment_id: Uuid,
    pub assignment_date: chrono::NaiveDate,
    pub personnel_id: Uuid,
    pub personnel_name: String,
    pub team_name: String,
    pub shift_name: String,
    pub vehicle_code: Option<String>,
    pub position: String,
}
