use crate::domain::models::Incident;
use crate::repository::incident_repository::IncidentRepoTrait;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct IncidentService {
    pub repo: Arc<dyn IncidentRepoTrait>,
}

impl IncidentService {
    pub fn new(repo: Arc<dyn IncidentRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_incidents(&self) -> Result<Vec<Incident>, String> {
        self.repo.get_all_incidents().await.map_err(|e| e.to_string())
    }

        severity: Option<&str>,
        photo_url: Option<&str>,
    ) -> Result<Incident, String> {
        if description.trim().is_empty() {
            return Err("Deskripsi insiden wajib diisi".to_string());
        }
        self.repo.create_incident(None, description, location, severity, photo_url).await.map_err(|e| e.to_string())
    }

    pub async fn mark_arrived(&self, id: Uuid) -> Result<Incident, String> {
        self.repo.mark_arrived(id).await.map_err(|e| e.to_string())
    }

    pub async fn resolve_incident(&self, id: Uuid) -> Result<Incident, String> {
        self.repo.resolve_incident(id).await.map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::Utc;

    struct MockIncidentRepo;

    #[async_trait]
    impl IncidentRepoTrait for MockIncidentRepo {
        async fn get_all_incidents(&self) -> Result<Vec<Incident>, sqlx::Error> {
            Ok(vec![])
        }

        async fn create_incident(
            &self,
            c_id: Option<Uuid>,
            d: &str,
            l: Option<&str>,
            s: Option<&str>,
            p: Option<&str>,
        ) -> Result<Incident, sqlx::Error> {
            Ok(Incident {
                id: Uuid::new_v4(),
                commander_id: c_id,
                description: d.to_string(),
                location: l.map(|x| x.to_string()),
                dispatch_time: Utc::now(),
                arrival_time: None,
                resolved_at: None,
                severity: s.map(|x| x.to_string()),
                photo_url: p.map(|x| x.to_string()),
            })
        }
        
        async fn mark_arrived(&self, id: Uuid) -> Result<Incident, sqlx::Error> {
            Ok(Incident {
                id,
                commander_id: None,
                description: "Test".to_string(),
                location: None,
                dispatch_time: Utc::now(),
                arrival_time: Some(Utc::now()),
                resolved_at: None,
                severity: Some("LOW".to_string()),
                photo_url: None,
            })
        }

        async fn resolve_incident(&self, id: Uuid) -> Result<Incident, sqlx::Error> {
             Ok(Incident {
                id,
                commander_id: None,
                description: "Test".to_string(),
                location: None,
                dispatch_time: Utc::now(),
                arrival_time: Some(Utc::now()),
                resolved_at: Some(Utc::now()),
                severity: Some("LOW".to_string()),
                photo_url: None,
            })
        }
    }

    #[tokio::test]
    async fn test_create_incident_success() {
        let repo = Arc::new(MockIncidentRepo);
        let service = IncidentService::new(repo);
        let res = service.create_incident("Fire on RWY 04", Some("RWY 04"), Some("HIGH"), None).await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_create_incident_empty_desc() {
        let repo = Arc::new(MockIncidentRepo);
        let service = IncidentService::new(repo);
        let res = service.create_incident("   ", Some("RWY 04"), Some("HIGH"), None).await;
        assert!(res.is_err());
    }
}
