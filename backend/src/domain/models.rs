use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub name: String,
    pub nik: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role_id: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role_id: i32,
    pub exp: usize,
}
use crate::domain::status::AssetStatus;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Vehicle {
    pub id: Uuid,
    pub name: String,
    pub status: AssetStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FireEquipment {
    pub id: Uuid,
    pub name: String,
    pub r#type: String,
    pub status: AssetStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Hydrant {
    pub id: Uuid,
    pub location: String,
    pub status: AssetStatus,
    pub pressure: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct FoamSystem {
    pub id: Uuid,
    pub name: String,
    pub status: AssetStatus,
    pub capacity: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Shift {
    pub id: i32,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct ShiftPersonnel {
    pub shift_id: i32,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}
