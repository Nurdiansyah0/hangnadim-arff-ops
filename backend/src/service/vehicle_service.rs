use crate::domain::models::Vehicle;
use crate::repository::vehicle_repository::VehicleRepoTrait;
use bigdecimal::BigDecimal;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct VehicleService {
    pub repo: Arc<dyn VehicleRepoTrait>,
}

impl VehicleService {
    pub fn new(repo: Arc<dyn VehicleRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, String> {
        self.repo.get_all_vehicles().await.map_err(|e| e.to_string())
    }

    pub async fn create_vehicle(
        &self,
        code: &str,
        name: &str,
        vehicle_type: Option<&str>,
        status: &str,
        water_capacity_liters: Option<&BigDecimal>,
        foam_capacity_liters: Option<&BigDecimal>,
        dcp_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
    ) -> Result<Vehicle, String> {
        self.repo
            .create_vehicle(
                code,
                name,
                vehicle_type,
                status,
                water_capacity_liters,
                foam_capacity_liters,
                dcp_capacity_kg,
                last_service_date,
                next_service_due,
            )
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_vehicle(
        &self,
        id: Uuid,
        code: Option<&str>,
        name: Option<&str>,
        vehicle_type: Option<&str>,
        status: Option<&str>,
        water_capacity_liters: Option<&BigDecimal>,
        foam_capacity_liters: Option<&BigDecimal>,
        dcp_capacity_kg: Option<&BigDecimal>,
        last_service_date: Option<&chrono::NaiveDate>,
        next_service_due: Option<&chrono::NaiveDate>,
    ) -> Result<Vehicle, String> {
        self.repo
            .update_vehicle(
                id,
                code,
                name,
                vehicle_type,
                status,
                water_capacity_liters,
                foam_capacity_liters,
                dcp_capacity_kg,
                last_service_date,
                next_service_due,
            )
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
    use chrono::Utc;
    use uuid::Uuid;

    struct MockVehicleRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl VehicleRepoTrait for MockVehicleRepo {
        async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn create_vehicle(
            &self,
            c: &str,
            n: &str,
            v: Option<&str>,
            s: &str,
        ) -> Result<Vehicle, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Vehicle {
                id: Uuid::new_v4(),
                code: c.to_string(),
                name: n.to_string(),
                vehicle_type: v.map(|x| x.to_string()),
                status: s.to_string(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_vehicle_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        
        let res = service.create_vehicle("FOAM-01", "Foam Tender 1", Some("Type 1"), "READY").await;
        assert!(res.is_ok(), "Harus berhasil mendaftarkan vehicle baru");
    }

    #[tokio::test]
    async fn test_create_vehicle_db_error() {
        let repo = Arc::new(MockVehicleRepo { should_fail: true });
        let service = VehicleService::new(repo);
        let res = service.create_vehicle("FOAM-01", "Foam Tender 1", Some("Type 1"), "READY").await;
        assert!(res.is_err(), "Harus handle eror bila insert gagal");
    }

    #[tokio::test]
    async fn test_get_all_vehicles_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let res = service.get_all_vehicles().await;
        assert!(res.is_ok());
    }
}
