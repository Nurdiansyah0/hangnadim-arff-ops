use crate::domain::models::Inspection;
use crate::repository::inspection_repository::InspectionRepoTrait;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct InspectionService {
    pub repo: Arc<dyn InspectionRepoTrait>,
}

impl InspectionService {
    pub fn new(repo: Arc<dyn InspectionRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_inspections(&self) -> Result<Vec<Inspection>, String> {
        self.repo.get_all_inspections().await.map_err(|e| e.to_string())
    }

    pub async fn create_inspection(
        &self,
        vehicle_id: Uuid,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
    ) -> Result<Inspection, String> {
        self.repo
            .create_inspection(vehicle_id, personnel_id, tanggal, status)
            .await
            .map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::{Utc, NaiveDate};

    struct MockInspectionRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl InspectionRepoTrait for MockInspectionRepo {
        async fn get_all_inspections(&self) -> Result<Vec<Inspection>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_inspection(
            &self,
            v: Uuid,
            p: Option<Uuid>,
            t: NaiveDate,
            s: &str,
        ) -> Result<Inspection, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Inspection {
                id: Uuid::new_v4(),
                vehicle_id: v,
                personnel_id: p,
                tanggal: t,
                status: s.to_string(),
                created_at: Utc::now(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_inspection_success() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.create_inspection(Uuid::new_v4(), None, NaiveDate::from_ymd_opt(2026, 4, 6).unwrap(), "DRAFT").await;
        assert!(res.is_ok(), "Harus berhasil submit inspection form");
    }

    #[tokio::test]
    async fn test_create_inspection_error() {
        let repo = Arc::new(MockInspectionRepo { should_fail: true });
        let service = InspectionService::new(repo);
        let res = service.create_inspection(Uuid::new_v4(), None, NaiveDate::from_ymd_opt(2026, 4, 6).unwrap(), "DRAFT").await;
        assert!(res.is_err(), "Harus handle DB error atau validasi enum");
    }

    #[tokio::test]
    async fn test_get_all_inspections() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.get_all_inspections().await;
        assert!(res.is_ok());
    }
}
