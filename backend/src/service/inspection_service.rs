use crate::domain::models::{Inspection, InspectionResult, InspectionTemplate, TemplateItem};
use crate::repository::inspection_repository::{InspectionRepoTrait, InspectionResultCreate};
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

    pub async fn get_all_inspections(&self, personnel_id: Option<Uuid>) -> Result<Vec<Inspection>, String> {
        self.repo.get_all_inspections(personnel_id).await.map_err(|e| e.to_string())
    }

    pub async fn get_inspection_by_id(&self, id: Uuid) -> Result<Inspection, String> {
        self.repo.get_inspection_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn get_inspection_results(&self, inspection_id: Uuid) -> Result<Vec<InspectionResult>, String> {
        self.repo.get_inspection_results(inspection_id).await.map_err(|e| e.to_string())
    }

    pub async fn create_inspection_with_results(
        &self,
        vehicle_id: Option<Uuid>,
        fire_extinguisher_id: Option<Uuid>,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
        latitude: Option<f64>,
        longitude: Option<f64>,
        results: Vec<InspectionResultCreate>,
    ) -> Result<Inspection, String> {
        // Validation: Results cannot be empty
        if results.is_empty() {
            return Err("At least one inspection result must be provided".to_string());
        }

        // Validation: Date cannot be in the future
        let today = chrono::Local::now().date_naive();
        if tanggal > today {
            return Err("Inspection date cannot be in the future".to_string());
        }

        self.repo
            .create_inspection_with_results(vehicle_id, fire_extinguisher_id, personnel_id, tanggal, status, latitude, longitude, results)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_all_templates(&self) -> Result<Vec<InspectionTemplate>, String> {
        self.repo.get_all_templates().await.map_err(|e| e.to_string())
    }

    pub async fn create_template(
        &self,
        name: &str,
        target_type: &str,
        frequency: &str,
    ) -> Result<InspectionTemplate, String> {
        self.repo
            .create_template(name, target_type, frequency)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_template_items(&self, template_id: i32) -> Result<Vec<TemplateItem>, String> {
        self.repo.get_template_items(template_id).await.map_err(|e| e.to_string())
    }

    pub async fn create_template_item(
        &self,
        template_id: i32,
        category: &str,
        item_name: &str,
        item_order: i32,
    ) -> Result<TemplateItem, String> {
        self.repo
            .create_template_item(template_id, category, item_name, item_order)
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
        async fn get_all_inspections(&self, _personnel_id: Option<Uuid>) -> Result<Vec<Inspection>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn get_inspection_by_id(&self, _id: Uuid) -> Result<Inspection, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Inspection {
                id: Uuid::new_v4(),
                vehicle_id: Some(Uuid::new_v4()),
                fire_extinguisher_id: None,
                personnel_id: None,
                tanggal: NaiveDate::from_ymd_opt(2026, 4, 6).unwrap(),
                status: "DRAFT".to_string(),
                latitude: None,
                longitude: None,
                approved_by: None,
                approved_at: None,
                updated_at: Some(Utc::now()),
                created_at: Utc::now(),
                inspector_name: None,
                vehicle_code: None,
                fire_extinguisher_serial: None,
            })
        }

        async fn get_inspection_results(&self, _inspection_id: Uuid) -> Result<Vec<InspectionResult>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_inspection_with_results(
            &self,
            v: Option<Uuid>,
            f: Option<Uuid>,
            pid: Option<Uuid>,
            t: NaiveDate,
            s: &str,
            lat: Option<f64>,
            lng: Option<f64>,
            _results: Vec<InspectionResultCreate>,
        ) -> Result<Inspection, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Inspection {
                id: Uuid::new_v4(),
                vehicle_id: v,
                fire_extinguisher_id: f,
                personnel_id: pid,
                tanggal: t,
                status: s.to_string(),
                latitude: lat,
                longitude: lng,
                approved_by: None,
                approved_at: None,
                updated_at: Some(Utc::now()),
                created_at: Utc::now(),
                inspector_name: None,
                vehicle_code: None,
                fire_extinguisher_serial: None,
            })
        }

        async fn get_all_templates(&self) -> Result<Vec<InspectionTemplate>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_template(&self, name: &str, target_type: &str, frequency: &str) -> Result<InspectionTemplate, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(InspectionTemplate { id: 1, name: name.to_string(), target_type: target_type.to_string(), frequency: frequency.to_string() })
        }

        async fn get_template_items(&self, _template_id: i32) -> Result<Vec<TemplateItem>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_template_item(&self, template_id: i32, category: &str, item_name: &str, item_order: i32) -> Result<TemplateItem, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(TemplateItem { id: 1, template_id, category: category.to_string(), item_name: item_name.to_string(), item_order })
        }
    }

    #[tokio::test]
    async fn test_create_inspection_with_results_success() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.create_inspection_with_results(
            Some(Uuid::new_v4()),
            None,
            None,
            NaiveDate::from_ymd_opt(2026, 4, 6).unwrap(),
            "DRAFT",
            Some(-6.2),
            Some(106.8),
            vec![InspectionResultCreate { template_item_id: 1, result: "PASS".to_string(), notes: None, photo_url: None }],
        ).await;
        assert!(res.is_ok(), "Harus berhasil submit inspection dengan hasil checklist");
    }

    #[tokio::test]
    async fn test_create_inspection_validation_empty_results() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.create_inspection_with_results(
            Some(Uuid::new_v4()),
            None,
            None,
            NaiveDate::from_ymd_opt(2026, 4, 6).unwrap(),
            "DRAFT",
            None,
            None,
            vec![],
        ).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "At least one inspection result must be provided");
    }

    #[tokio::test]
    async fn test_create_inspection_validation_future_date() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let future_date = NaiveDate::from_ymd_opt(2099, 1, 1).unwrap();
        let res = service.create_inspection_with_results(
            Some(Uuid::new_v4()),
            None,
            None,
            future_date,
            "DRAFT",
            None,
            None,
            vec![InspectionResultCreate { template_item_id: 1, result: "PASS".to_string(), notes: None, photo_url: None }],
        ).await;
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Inspection date cannot be in the future");
    }

    #[tokio::test]
    async fn test_get_all_templates_success() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.get_all_templates().await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_get_all_inspections_success() {
        let repo = Arc::new(MockInspectionRepo { should_fail: false });
        let service = InspectionService::new(repo);
        let res = service.get_all_inspections(None).await;
        assert!(res.is_ok());
    }
}
