use crate::domain::models::Finding;
use crate::repository::finding_repository::FindingRepository;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct FindingService {
    repo: Arc<dyn FindingRepository>,
}

impl FindingService {
    pub fn new(repo: Arc<dyn FindingRepository>) -> Self {
        Self { repo }
    }

    pub async fn get_all_findings(&self, status: Option<String>) -> Result<Vec<Finding>, String> {
        self.repo.get_all_findings(status.as_deref()).await.map_err(|e| e.to_string())
    }

    pub async fn get_finding_by_id(&self, id: Uuid) -> Result<Finding, String> {
        self.repo.get_finding_by_id(id).await.map_err(|e| e.to_string())
    }

    pub async fn update_finding(
        &self,
        id: Uuid,
        severity: Option<String>,
        assigned_to: Option<Uuid>,
        status: Option<String>,
        resolution_notes: Option<String>,
    ) -> Result<Finding, String> {
        self.repo
            .update_finding(id, severity.as_deref(), assigned_to, status.as_deref(), resolution_notes.as_deref())
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_open_findings(&self) -> Result<Vec<Finding>, String> {
        self.repo.get_open_findings().await.map_err(|e| e.to_string())
    }
}
