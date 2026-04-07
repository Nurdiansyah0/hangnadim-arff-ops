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
        // Validation: Capacities must be non-negative
        if let Some(w) = water_capacity_liters {
            if w < &BigDecimal::from(0) { return Err("Water capacity cannot be negative".to_string()); }
        }
        if let Some(f) = foam_capacity_liters {
            if f < &BigDecimal::from(0) { return Err("Foam capacity cannot be negative".to_string()); }
        }
        if let Some(d) = dcp_capacity_kg {
            if d < &BigDecimal::from(0) { return Err("DCP capacity cannot be negative".to_string()); }
        }

        // Validation: Service dates
        if let (Some(last), Some(next)) = (last_service_date, next_service_due) {
            if next < last {
                return Err("Next service due date cannot be before last service date".to_string());
            }
        }

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
            w: Option<&BigDecimal>,
            f: Option<&BigDecimal>,
            d: Option<&BigDecimal>,
            ls: Option<&chrono::NaiveDate>,
            ns: Option<&chrono::NaiveDate>,
        ) -> Result<Vehicle, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Vehicle {
                id: Uuid::new_v4(),
                code: c.to_string(),
                name: n.to_string(),
                vehicle_type: v.map(|x| x.to_string()),
                status: s.to_string(),
                water_capacity_liters: w.cloned(),
                foam_capacity_liters: f.cloned(),
                dcp_capacity_kg: d.cloned(),
                last_service_date: ls.cloned(),
                next_service_due: ns.cloned(),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }

        async fn update_vehicle(
            &self,
            id: Uuid,
            code: Option<&str>,
            name: Option<&str>,
            vehicle_type: Option<&str>,
            status: Option<&str>,
            w: Option<&BigDecimal>,
            f: Option<&BigDecimal>,
            d: Option<&BigDecimal>,
            ls: Option<&chrono::NaiveDate>,
            ns: Option<&chrono::NaiveDate>,
        ) -> Result<Vehicle, sqlx::Error> {
             if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
             Ok(Vehicle {
                id,
                code: code.unwrap_or("MOCK").to_string(),
                name: name.unwrap_or("Mock Vehicle").to_string(),
                vehicle_type: vehicle_type.map(|x| x.to_string()),
                status: status.unwrap_or("READY").to_string(),
                water_capacity_liters: w.cloned(),
                foam_capacity_liters: f.cloned(),
                dcp_capacity_kg: d.cloned(),
                last_service_date: ls.cloned(),
                next_service_due: ns.cloned(),
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
        
        let res = service.create_vehicle(
            "FOAM-01", "Foam Tender 1", Some("Type 1"), "READY",
            Some(&water), None, None, None, None
        ).await;
        
        assert!(res.is_ok(), "Harus berhasil mendaftarkan vehicle baru dengan data kapasitas");
        let v = res.unwrap();
        assert_eq!(v.code, "FOAM-01");
        assert_eq!(v.water_capacity_liters, Some(water));
    }

    #[tokio::test]
    async fn test_create_vehicle_db_error() {
        let repo = Arc::new(MockVehicleRepo { should_fail: true });
        let service = VehicleService::new(repo);
        let res = service.create_vehicle(
            "FOAM-01", "Foam Tender 1", Some("Type 1"), "READY",
            None, None, None, None, None
        ).await;
        assert!(res.is_err(), "Harus handle eror bila insert gagal");
    }

    #[tokio::test]
    async fn test_update_vehicle_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let id = Uuid::new_v4();
        let foam = BigDecimal::from(500);

        let res = service.update_vehicle(
            id, None, Some("Updated Name"), None, Some("MAINTENANCE"),
            None, Some(&foam), None, None, None
        ).await;

        assert!(res.is_ok());
        let v = res.unwrap();
        assert_eq!(v.name, "Updated Name");
        assert_eq!(v.status, "MAINTENANCE");
        assert_eq!(v.foam_capacity_liters, Some(foam));
    }

    #[tokio::test]
    async fn test_create_vehicle_validation_negative_capacity() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let water = BigDecimal::from(-100);
        
        let res = service.create_vehicle(
            "FOAM-01", "Foam Tender 1", None, "READY",
            Some(&water), None, None, None, None
        ).await;
        
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Water capacity cannot be negative");
    }

    #[tokio::test]
    async fn test_create_vehicle_validation_invalid_dates() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let last = chrono::NaiveDate::from_ymd_opt(2026, 1, 1).unwrap();
        let next = chrono::NaiveDate::from_ymd_opt(2025, 1, 1).unwrap();
        
        let res = service.create_vehicle(
            "FOAM-01", "Foam Tender 1", None, "READY",
            None, None, None, Some(&last), Some(&next)
        ).await;
        
        assert!(res.is_err());
        assert_eq!(res.unwrap_err(), "Next service due date cannot be before last service date");
    }

    #[tokio::test]
    async fn test_get_all_vehicles_success() {
        let repo = Arc::new(MockVehicleRepo { should_fail: false });
        let service = VehicleService::new(repo);
        let res = service.get_all_vehicles().await;
        assert!(res.is_ok());
    }
}
