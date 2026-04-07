use crate::repository::compliance_repository::{ComplianceRepoTrait, AuditLog, DocumentSOP, InventoryAlert};
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

    pub async fn get_inventory_alerts(&self) -> Result<Vec<InventoryAlert>, String> {
        self.repo.get_inventory_alerts().await.map_err(|e| e.to_string())
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
        async fn get_inventory_alerts(&self) -> Result<Vec<InventoryAlert>, sqlx::Error> {
             Ok(vec![
                InventoryAlert {
                    id: Uuid::new_v4(),
                    name: "Water".to_string(),
                    inventory_level: rust_decimal::Decimal::from(5000),
                    min_requirement: rust_decimal::Decimal::from(90000),
                    deficit: rust_decimal::Decimal::from(85000),
                    percentage: 5.5,
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

    #[tokio::test]
    async fn test_get_inventory_alerts() {
        let repo = Arc::new(MockComplianceRepo);
        let service = ComplianceService::new(repo);
        let res = service.get_inventory_alerts().await;
        assert!(res.is_ok());
        let alerts = res.unwrap();
        assert_eq!(alerts.len(), 1);
        assert_eq!(alerts[0].name, "Water");
        assert!(alerts[0].percentage < 10.0);
    }
}
