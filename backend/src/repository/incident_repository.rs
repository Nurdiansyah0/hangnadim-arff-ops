use crate::domain::models::Incident;
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[async_trait]
pub trait IncidentRepoTrait: Send + Sync {
    async fn get_all_incidents(&self) -> Result<Vec<Incident>, Error>;
    async fn create_incident(
        &self,
        commander_id: Option<Uuid>,
        description: &str,
        location: Option<&str>,
        severity: Option<&str>,
    ) -> Result<Incident, Error>;
    async fn mark_arrived(&self, id: Uuid) -> Result<Incident, Error>;
    async fn resolve_incident(&self, id: Uuid) -> Result<Incident, Error>;
}

#[derive(Clone)]
pub struct IncidentRepository {
    db: Pool<Postgres>,
}

impl IncidentRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl IncidentRepoTrait for IncidentRepository {
    async fn get_all_incidents(&self) -> Result<Vec<Incident>, Error> {
        sqlx::query_as::<_, Incident>(
            "SELECT id, commander_id, description, location, dispatch_time, arrival_time, resolved_at, severity::TEXT FROM incidents ORDER BY dispatch_time DESC"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_incident(
        &self,
        commander_id: Option<Uuid>,
        description: &str,
        location: Option<&str>,
        severity: Option<&str>,
    ) -> Result<Incident, Error> {
        // Jika severity diberikan, kita cast ke severity_enum, kalau tidak dibiarkan Null agar PostgreSQL pakai DEFAULT 'LOW' (jika di schema di-set gitu)
        // Di query ini kita berasumsi input `severity` adalah text valid (LOW, MEDIUM, HIGH, CRITICAL)
        let query = r#"
            INSERT INTO incidents (commander_id, description, location, dispatch_time, severity)
            VALUES ($1, $2, $3, NOW(), COALESCE($4, 'LOW')::severity_enum)
            RETURNING id, commander_id, description, location, dispatch_time, arrival_time, resolved_at, severity::TEXT
        "#;
        
        sqlx::query_as::<_, Incident>(query)
            .bind(commander_id)
            .bind(description)
            .bind(location)
            .bind(severity)
            .fetch_one(&self.db)
            .await
    }

    async fn mark_arrived(&self, id: Uuid) -> Result<Incident, Error> {
        sqlx::query_as::<_, Incident>(
            r#"
            UPDATE incidents SET arrival_time = NOW() 
            WHERE id = $1 AND arrival_time IS NULL
            RETURNING id, commander_id, description, location, dispatch_time, arrival_time, resolved_at, severity::TEXT
            "#
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn resolve_incident(&self, id: Uuid) -> Result<Incident, Error> {
        sqlx::query_as::<_, Incident>(
            r#"
            UPDATE incidents SET resolved_at = NOW() 
            WHERE id = $1 AND resolved_at IS NULL
            RETURNING id, commander_id, description, location, dispatch_time, arrival_time, resolved_at, severity::TEXT
            "#
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }
}
