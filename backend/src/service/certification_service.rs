use crate::domain::models::PersonnelCertification;
use crate::repository::certification_repository::CertificationRepoTrait;
use std::sync::Arc;

#[derive(Clone)]
pub struct CertificationService {
    pub repo: Arc<dyn CertificationRepoTrait>,
}

impl CertificationService {
    pub fn new(repo: Arc<dyn CertificationRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_expiring_soon(
        &self,
        days: i32,
    ) -> Result<Vec<PersonnelCertification>, String> {
        self.repo
            .get_expiring_soon(days)
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
    use chrono::{NaiveDate, Utc};
    use uuid::Uuid;

    struct MockCertRepo;

    #[async_trait]
    impl CertificationRepoTrait for MockCertRepo {
        async fn get_expiring_soon(
            &self,
            _days: i32,
        ) -> Result<Vec<PersonnelCertification>, sqlx::Error> {
            Ok(vec![PersonnelCertification {
                id: Uuid::new_v4(),
                personnel_id: Some(Uuid::new_v4()),
                training_id: Some(1),
                cert_number: "CERT-001".to_string(),
                issue_date: NaiveDate::from_ymd_opt(2023, 1, 1).unwrap(),
                expiry_date: NaiveDate::from_ymd_opt(2026, 5, 1).unwrap(),
                status: "ACTIVE".to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            }])
        }
    }

    #[tokio::test]
    async fn test_get_expiring_soon() {
        let repo = Arc::new(MockCertRepo);
        let service = CertificationService::new(repo);
        let res = service.get_expiring_soon(30).await;
        assert!(res.is_ok());
        assert_eq!(res.unwrap().len(), 1);
    }
}
