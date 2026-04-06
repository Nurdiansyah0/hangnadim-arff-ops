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
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub personnel_id: Option<Uuid>, 
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    #[sqlx(default)]
    pub role_id: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,         
    pub personnel_id: Option<Uuid>,
    pub role_id: Option<i32>, // Ditambahkan untuk autorisasi di handler
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

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Personnel {
    pub id: Uuid,
    pub nip_nik: String,
    pub full_name: String,
    pub position_id: Option<i32>,
    pub status: String, // Maps to status_enum (ACTIVE, etc)
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct PersonnelCertification {
    pub id: Uuid,
    pub personnel_id: Option<Uuid>,
    pub training_id: Option<i32>,
    pub cert_number: String,
    pub issue_date: chrono::NaiveDate,
    pub expiry_date: chrono::NaiveDate,
    pub status: String, // ACTIVE, EXPIRED, etc
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
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// =========================================================
// 4. TRANSACTIONS (INSPECTIONS & WATCHROOM)
// =========================================================

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct Inspection {
    pub id: Uuid,
    pub vehicle_id: Uuid,
    pub personnel_id: Option<Uuid>,
    pub tanggal: chrono::NaiveDate,
    pub status: String, // Maps to approval_status_enum (DRAFT, etc)
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct WatchroomLog {
    pub id: Uuid,
    pub actor_id: Option<Uuid>,
    pub entry_type: Option<String>,
    pub description: String,
    pub payload: Option<serde_json::Value>, 
    pub created_at: DateTime<Utc>,
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
    pub user_id: Option<Uuid>,
    pub table_name: String,
    pub action: String,
    pub original_data: Option<serde_json::Value>,
    pub new_data: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}
