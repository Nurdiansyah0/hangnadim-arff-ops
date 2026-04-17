use crate::domain::models::{Personnel, Position};
use sqlx::{Pool, Postgres, Error};

#[derive(Clone)]
pub struct PersonnelRepository {
    db: Pool<Postgres>,
}

impl PersonnelRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn get_all_positions(&self) -> Result<Vec<Position>, Error> {
        sqlx::query_as::<_, Position>("SELECT id, name FROM positions")
            .fetch_all(&self.db)
            .await
    }

    pub async fn get_all_personnels(&self) -> Result<Vec<Personnel>, Error> {
        sqlx::query_as::<_, Personnel>(
            "SELECT id, nip_nik, full_name, position_id, shift::TEXT, status::TEXT, employment_status::TEXT, phone_number, profile_picture_url, corporate_level, annual_leave_quota, remaining_leave, created_at, updated_at FROM personnels"
        )
        .fetch_all(&self.db)
        .await
    }

    pub async fn get_by_id(&self, id: uuid::Uuid) -> Result<Personnel, Error> {
        sqlx::query_as::<_, Personnel>(
            "SELECT id, nip_nik, full_name, position_id, shift::TEXT, status::TEXT, employment_status::TEXT, phone_number, profile_picture_url, corporate_level, annual_leave_quota, remaining_leave, created_at, updated_at FROM personnels WHERE id = $1"
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    pub async fn create_personnel(
        &self,
        nip_nik: &str,
        full_name: &str,
        position_id: Option<i32>,
        status: &str,
        employment_status: Option<&str>,
        shift: Option<&str>,
    ) -> Result<Personnel, Error> {
        sqlx::query_as::<_, Personnel>(
            r#"
            INSERT INTO personnels (nip_nik, full_name, position_id, status, employment_status, shift) 
            VALUES ($1, $2, $3, $4::status_enum, $5::employment_status_enum, $6::shift_enum) 
            RETURNING id, nip_nik, full_name, position_id, shift::TEXT, status::TEXT, employment_status::TEXT, phone_number, profile_picture_url, corporate_level, annual_leave_quota, remaining_leave, created_at, updated_at
            "#
        )
        .bind(nip_nik)
        .bind(full_name)
        .bind(position_id)
        .bind(status)
        .bind(employment_status)
        .bind(shift)
        .fetch_one(&self.db)
        .await
    }

    pub async fn deduct_leave(&self, id: uuid::Uuid, days: i32) -> Result<(), Error> {
        sqlx::query("UPDATE personnels SET remaining_leave = remaining_leave - $1 WHERE id = $2")
            .bind(days)
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }
}
