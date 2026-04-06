use crate::repository::compliance_repository::{ComplianceRepoTrait, AuditLog, DocumentSOP};
use std::sync::Arc;

#[derive(Clone)]
pub struct ComplianceService {
    pub repo: Arc<dyn ComplianceRepoTrait>,
}

impl ComplianceService {
    pub fn new(repo: Arc<dyn ComplianceRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_audit_logs(&self, limit: i64) -> Result<Vec<AuditLog>, String> {
        self.repo.get_audit_logs(limit).await.map_err(|e| e.to_string())
    }

    pub async fn get_sops(&self) -> Result<Vec<DocumentSOP>, String> {
        self.repo.get_sop_documents().await.map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use uuid::Uuid;
    use chrono::Utc;

    struct MockComplianceRepo;

    #[async_trait]
    impl ComplianceRepoTrait for MockComplianceRepo {
        async fn get_audit_logs(&self, _l: i64) -> Result<Vec<AuditLog>, sqlx::Error> {
            Ok(vec![])
        }
        async fn get_sop_documents(&self) -> Result<Vec<DocumentSOP>, sqlx::Error> {
            Ok(vec![
                DocumentSOP {
                    id: Uuid::new_v4(),
                    title: "SOP-01 Rescue".to_string(),
                    version: "1.0".to_string(),
                    file_path: None,
                    category: "RESCUE".to_string(),
                    created_at: Utc::now(),
                }
            ])
        }
    }

    #[tokio::test]
    async fn test_get_sops() {
        let repo = Arc::new(MockComplianceRepo);
        let service = ComplianceService::new(repo);
        let res = service.get_sops().await;
        assert!(res.is_ok());
        assert_eq!(res.unwrap().len(), 1);
    }
}
