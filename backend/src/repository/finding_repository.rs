use crate::domain::models::Finding;
use async_trait::async_trait;
use sqlx::{Error, PgPool};
use uuid::Uuid;
use chrono::Utc;

#[async_trait]
pub trait FindingRepository: Send + Sync {
    async fn get_all_findings(&self, status: Option<&str>) -> Result<Vec<Finding>, Error>;
    async fn get_finding_by_id(&self, id: Uuid) -> Result<Finding, Error>;
    async fn update_finding(
        &self,
        id: Uuid,
        severity: Option<&str>,
        assigned_to: Option<Uuid>,
        status: Option<&str>,
        resolution_notes: Option<&str>,
    ) -> Result<Finding, Error>;
    async fn get_open_findings(&self) -> Result<Vec<Finding>, Error>;
}

pub struct PostgresFindingRepository {
    db: PgPool,
}

impl PostgresFindingRepository {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }
}

#[async_trait]
impl FindingRepository for PostgresFindingRepository {
    async fn get_all_findings(&self, status: Option<&str>) -> Result<Vec<Finding>, Error> {
        let query = r#"
            SELECT 
                f.id, f.inspection_result_id, f.severity::TEXT, f.description, 
                f.assigned_to, f.status::TEXT, f.resolved_at, f.resolution_notes, 
                f.created_at, f.updated_at,
                p.full_name as inspector_name,
                COALESCE(v.code, fe.serial_number) as asset_code
            FROM findings f
            JOIN inspection_results ir ON ir.id = f.inspection_result_id
            JOIN inspections i ON i.id = ir.inspection_id
            JOIN personnels p ON p.id = i.personnel_id
            LEFT JOIN vehicles v ON v.id = i.vehicle_id
            LEFT JOIN fire_extinguishers fe ON fe.id = i.fire_extinguisher_id
            WHERE ($1 IS NULL OR f.status = $1::finding_status_enum)
            ORDER BY f.created_at DESC
        "#;
        
        sqlx::query_as::<_, Finding>(query)
            .bind(status)
            .fetch_all(&self.db)
            .await
    }

    async fn get_finding_by_id(&self, id: Uuid) -> Result<Finding, Error> {
        sqlx::query_as::<_, Finding>(
            r#"
            SELECT 
                f.id, f.inspection_result_id, f.severity::TEXT, f.description, 
                f.assigned_to, f.status::TEXT, f.resolved_at, f.resolution_notes, 
                f.created_at, f.updated_at,
                p.full_name as inspector_name,
                COALESCE(v.code, fe.serial_number) as asset_code
            FROM findings f
            JOIN inspection_results ir ON ir.id = f.inspection_result_id
            JOIN inspections i ON i.id = ir.inspection_id
            JOIN personnels p ON p.id = i.personnel_id
            LEFT JOIN vehicles v ON v.id = i.vehicle_id
            LEFT JOIN fire_extinguishers fe ON fe.id = i.fire_extinguisher_id
            WHERE f.id = $1
            "#
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn update_finding(
        &self,
        id: Uuid,
        severity: Option<&str>,
        assigned_to: Option<Uuid>,
        status: Option<&str>,
        resolution_notes: Option<&str>,
    ) -> Result<Finding, Error> {
        let resolved_at = if status == Some("RESOLVED") || status == Some("CLOSED") {
            Some(Utc::now())
        } else {
            None
        };

        sqlx::query_as::<_, Finding>(
            r#"
            UPDATE findings SET
                severity = COALESCE($2::severity_enum, severity),
                assigned_to = COALESCE($3, assigned_to),
                status = COALESCE($4::finding_status_enum, status),
                resolution_notes = COALESCE($5, resolution_notes),
                resolved_at = CASE 
                    WHEN $4::finding_status_enum IN ('RESOLVED', 'CLOSED') THEN COALESCE($6, CURRENT_TIMESTAMP)
                    ELSE resolved_at
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING id, inspection_result_id, severity::TEXT, description, assigned_to, status::TEXT, resolved_at, resolution_notes, created_at, updated_at, NULL as inspector_name, NULL as asset_code
            "#
        )
        .bind(id)
        .bind(severity)
        .bind(assigned_to)
        .bind(status)
        .bind(resolution_notes)
        .bind(resolved_at)
        .fetch_one(&self.db)
        .await
    }

    async fn get_open_findings(&self) -> Result<Vec<Finding>, Error> {
        self.get_all_findings(Some("OPEN")).await
    }
}
