use crate::domain::models::{Personnel, Position};
use crate::repository::personnel_repository::PersonnelRepository;
use std::sync::Arc;

#[derive(Clone)]
pub struct PersonnelService {
    pub repo: Arc<PersonnelRepository>,
}

impl PersonnelService {
    pub fn new(repo: Arc<PersonnelRepository>) -> Self {
        Self { repo }
    }

    pub async fn get_all_positions(&self) -> Result<Vec<Position>, String> {
        self.repo.get_all_positions().await.map_err(|e| e.to_string())
    }

    pub async fn get_all_personnels(&self) -> Result<Vec<Personnel>, String> {
        self.repo.get_all_personnels().await.map_err(|e| e.to_string())
    }

    pub async fn create_personnel(
        &self,
        nip_nik: &str,
        full_name: &str,
        position_id: Option<i32>,
        status: &str,
        employment_status: Option<&str>,
    ) -> Result<Personnel, String> {
        self.repo
            .create_personnel(nip_nik, full_name, position_id, status, employment_status)
            .await
            .map_err(|e| e.to_string())
    }
}
