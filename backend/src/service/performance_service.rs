use std::sync::Arc;
use uuid::Uuid;
use crate::repository::performance_repository::PerformanceRepoTrait;
use crate::domain::models::VehiclePerformanceTest;

#[derive(Clone)]
pub struct PerformanceService {
    pub repo: Arc<dyn PerformanceRepoTrait>,
}

impl PerformanceService {
    pub fn new(repo: Arc<dyn PerformanceRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_vehicle_tests(&self, vehicle_id: Option<Uuid>) -> Result<Vec<VehiclePerformanceTest>, String> {
        self.repo.get_vehicle_tests(vehicle_id).await.map_err(|e| e.to_string())
    }

    pub async fn create_vehicle_test(&self, test: VehiclePerformanceTest) -> Result<VehiclePerformanceTest, String> {
        self.repo.create_vehicle_test(test).await.map_err(|e| e.to_string())
    }
}
