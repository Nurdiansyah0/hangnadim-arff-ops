use crate::domain::models::PersonnelCertification;
use async_trait::async_trait;
use sqlx::{Error, Pool, Postgres};

#[async_trait]
pub trait CertificationRepoTrait: Send + Sync {
    async fn get_expiring_soon(&self, days: i32) -> Result<Vec<PersonnelCertification>, Error>;
}

#[derive(Clone)]
pub struct CertificationRepository {
    db: Pool<Postgres>,
}

impl CertificationRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl CertificationRepoTrait for CertificationRepository {
    async fn get_expiring_soon(&self, days: i32) -> Result<Vec<PersonnelCertification>, Error> {
        sqlx::query_as::<_, PersonnelCertification>(
            r#"
            SELECT id, personnel_id, training_id, cert_number, issue_date, expiry_date, status::TEXT, created_at, updated_at 
            FROM personnel_certifications 
            WHERE expiry_date <= CURRENT_DATE + ($1 || ' days')::INTERVAL
            AND status = 'ACTIVE'::cert_status_enum
            ORDER BY expiry_date ASC
            "#
        )
        .bind(days)
        .fetch_all(&self.db)
        .await
    }
}
