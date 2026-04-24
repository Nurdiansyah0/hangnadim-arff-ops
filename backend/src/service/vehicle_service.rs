use crate::domain::models::Vehicle;
use crate::repository::vehicle_repository::{
    CreateVehicleParams, UpdateVehicleParams, VehicleRepoTrait,
};
use bigdecimal::BigDecimal;
use std::sync::Arc;

#[derive(Clone)]
pub struct VehicleService {
    pub repo: Arc<dyn VehicleRepoTrait>,
}

impl VehicleService {
    pub fn new(repo: Arc<dyn VehicleRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, String> {
        self.repo
            .get_all_vehicles()
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn create_vehicle(&self, params: CreateVehicleParams<'_>) -> Result<Vehicle, String> {
        // Validation: Capacities must be non-negative
        if let Some(w) = params.water_capacity_l
            && w < &BigDecimal::from(0)
        {
            return Err("Water capacity cannot be negative".to_string());
        }
        if let Some(f) = params.foam_capacity_l
            && f < &BigDecimal::from(0)
        {
            return Err("Foam capacity cannot be negative".to_string());
        }
        if let Some(p) = params.powder_capacity_kg
            && p < &BigDecimal::from(0)
        {
            return Err("Powder capacity cannot be negative".to_string());
        }

        // Validation: Service dates
        if let (Some(last), Some(next)) = (params.last_service_date, params.next_service_due)
            && next < last
        {
            return Err("Next service due date cannot be before last service date".to_string());
        }

        self.repo
            .create_vehicle(params)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_vehicle(&self, params: UpdateVehicleParams<'_>) -> Result<Vehicle, String> {
        self.repo
            .update_vehicle(params)
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
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn create_vehicle(
            &self,
            params: CreateVehicleParams<'_>,
        ) -> Result<Vehicle, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(Vehicle {
                id: Uuid::new_v4(),
                code: params.code.to_string(),
                name: params.name.to_string(),
                vehicle_type: params.vehicle_type.map(|x| x.to_string()),
                status: params.status.to_string(),
                water_capacity_l: params.water_capacity_l.cloned(),
                foam_capacity_l: params.foam_capacity_l.cloned(),
                powder_capacity_kg: params.powder_capacity_kg.cloned(),
                last_service_date: params.last_service_date.cloned(),
                next_service_due: params.next_service_due.cloned(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }

        async fn update_vehicle(
            &self,
            params: UpdateVehicleParams<'_>,
        ) -> Result<Vehicle, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(Vehicle {
                id: params.id,
                code: params.code.unwrap_or("MOCK").to_string(),
                name: params.name.unwrap_or("Mock Vehicle").to_string(),
                vehicle_type: params.vehicle_type.map(|x| x.to_string()),
                status: params.status.unwrap_or("READY").to_string(),
                water_capacity_l: params.water_capacity_l.cloned(),
                foam_capacity_l: params.foam_capacity_l.cloned(),
                powder_capacity_kg: params.powder_capacity_kg.cloned(),
                last_service_date: params.last_service_date.cloned(),
                next_service_due: params.next_service_due.cloned(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_vehicle_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let water = BigDecimal::from(5000);

        let res = service
            .create_vehicle(CreateVehicleParams {
                code: "FOAM-01",
                name: "Foam Tender 1",
                vehicle_type: Some("Type 1"),
                status: "READY",
                water_capacity_l: Some(&water),
                foam_capacity_l: None,
                powder_capacity_kg: None,
                last_service_date: None,
                next_service_due: None,
            })
            .await;

        assert!(
            res.is_ok(),
            "Harus berhasil mendaftarkan vehicle baru dengan data kapasitas"
        );
        let v = res.unwrap();
        assert_eq!(v.code, "FOAM-01");
        assert_eq!(v.water_capacity_l, Some(water));
    }

    #[tokio::test]
    async fn test_create_vehicle_db_error() {
        let repo = Arc::new(MockVehicleRepo { should_fail: true });
        let service = VehicleService::new(repo);
        let res = service
            .create_vehicle(CreateVehicleParams {
                code: "FOAM-01",
                name: "Foam Tender 1",
                vehicle_type: Some("Type 1"),
                status: "READY",
                water_capacity_l: None,
                foam_capacity_l: None,
                powder_capacity_kg: None,
                last_service_date: None,
                next_service_due: None,
            })
            .await;
        assert!(res.is_err(), "Harus handle eror bila insert gagal");
    }

    #[tokio::test]
    async fn test_update_vehicle_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let id = Uuid::new_v4();
        let foam = BigDecimal::from(500);

        let res = service
            .update_vehicle(UpdateVehicleParams {
                id,
                code: None,
                name: Some("Updated Name"),
                vehicle_type: None,
                status: Some("MAINTENANCE"),
                water_capacity_l: None,
                foam_capacity_l: Some(&foam),
                powder_capacity_kg: None,
                last_service_date: None,
                next_service_due: None,
            })
            .await;

        assert!(res.is_ok());
        let v = res.unwrap();
        assert_eq!(v.name, "Updated Name");
        assert_eq!(v.status, "MAINTENANCE");
        assert_eq!(v.foam_capacity_l, Some(foam));
    }

    #[tokio::test]
    async fn test_create_vehicle_validation_negative_capacity() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let water = BigDecimal::from(-100);

        let res = service
            .create_vehicle(CreateVehicleParams {
                code: "FOAM-01",
                name: "Foam Tender 1",
                vehicle_type: None,
                status: "READY",
                water_capacity_l: Some(&water),
                foam_capacity_l: None,
                powder_capacity_kg: None,
                last_service_date: None,
                next_service_due: None,
            })
            .await;

        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Water capacity cannot be negative");
    }

    #[tokio::test]
    async fn test_create_vehicle_validation_invalid_dates() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let last = chrono::NaiveDate::from_ymd_opt(2026, 1, 1).unwrap();
        let next = chrono::NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();

        let res = service
            .create_vehicle(CreateVehicleParams {
                code: "FOAM-01",
                name: "Foam Tender 1",
                vehicle_type: None,
                status: "READY",
                water_capacity_l: None,
                foam_capacity_l: None,
                powder_capacity_kg: None,
                last_service_date: Some(&last),
                next_service_due: Some(&next),
            })
            .await;

        assert!(res.is_err());
        assert_eq!(
            res.unwrap_err(),
            "Next service due date cannot be before last service date"
        );
    }

    #[tokio::test]
    async fn test_get_all_vehicles_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let res = service.get_all_vehicles().await;
        assert!(res.is_ok());
    }
}
