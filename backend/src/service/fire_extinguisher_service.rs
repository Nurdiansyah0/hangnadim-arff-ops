use crate::domain::models::FireExtinguisher;
use crate::repository::fire_extinguisher_repository::FireExtinguisherRepoTrait;
use chrono::Utc;
use rust_decimal::Decimal;
use std::sync::Arc;

#[derive(Clone)]
pub struct FireExtinguisherService {
    pub repo: Arc<dyn FireExtinguisherRepoTrait>,
}

impl FireExtinguisherService {
    pub fn new(repo: Arc<dyn FireExtinguisherRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_extinguishers(&self) -> Result<Vec<FireExtinguisher>, String> {
        self.repo
            .get_all_extinguishers()
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_extinguisher_by_id(&self, id: uuid::Uuid) -> Result<Option<FireExtinguisher>, String> {
        self.repo
            .get_extinguisher_by_id(id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn create_extinguisher(
        &self,
        serial_number: &str,
        agent_type: Option<&str>,
        capacity_kg: Option<Decimal>,
        location_description: Option<&str>,
        latitude: Option<f64>,
        longitude: Option<f64>,
        floor: Option<&str>,
        building: Option<&str>,
        expiry_date: Option<chrono::NaiveDate>,
        last_inspection_date: Option<chrono::NaiveDate>,
        status: &str,
        photo_url: Option<&str>,
    ) -> Result<FireExtinguisher, String> {
        if let Some(expiry) = expiry_date {
            let today = Utc::now().date_naive();
            if expiry < today {
                return Err("expiry_date cannot be in the past".to_string());
            }
        }

        self.repo
            .create_extinguisher(
                serial_number,
                agent_type,
                capacity_kg,
                location_description,
                latitude,
                longitude,
                floor,
                building,
                expiry_date,
                last_inspection_date,
                status,
                photo_url,
            )
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_extinguisher(
        &self,
        id: uuid::Uuid,
        serial_number: Option<&str>,
        agent_type: Option<&str>,
        capacity_kg: Option<Decimal>,
        location_description: Option<&str>,
        latitude: Option<f64>,
        longitude: Option<f64>,
        floor: Option<&str>,
        building: Option<&str>,
        expiry_date: Option<chrono::NaiveDate>,
        last_inspection_date: Option<chrono::NaiveDate>,
        status: Option<&str>,
        photo_url: Option<&str>,
    ) -> Result<Option<FireExtinguisher>, String> {
        if let Some(expiry) = expiry_date {
            let today = Utc::now().date_naive();
            if expiry < today {
                return Err("expiry_date cannot be in the past".to_string());
            }
        }

        self.repo
            .update_extinguisher(
                id,
                serial_number,
                agent_type,
                capacity_kg,
                location_description,
                latitude,
                longitude,
                floor,
                building,
                expiry_date,
                last_inspection_date,
                status,
                photo_url,
            )
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn delete_extinguisher(&self, id: uuid::Uuid) -> Result<u64, String> {
        self.repo
            .delete_extinguisher(id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_expiring_soon(&self, days: i64) -> Result<Vec<FireExtinguisher>, String> {
        self.repo
            .get_expiring_soon(days)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_nearby_extinguishers(&self, lat: f64, lng: f64, radius_m: f64) -> Result<Vec<FireExtinguisher>, String> {
        self.repo
            .get_nearby_extinguishers(lat, lng, radius_m)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_geojson_extinguishers(&self) -> Result<serde_json::Value, String> {
        self.repo
            .get_geojson_extinguishers()
            .await
            .map_err(|e| e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use chrono::Utc;
    use rust_decimal::Decimal;
    use uuid::Uuid;
    use crate::domain::models::FireExtinguisher;

    struct MockRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl FireExtinguisherRepoTrait for MockRepo {
        async fn get_all_extinguishers(&self) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn get_extinguisher_by_id(&self, _id: Uuid) -> Result<Option<FireExtinguisher>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(None)
        }

        async fn create_extinguisher(
            &self,
            serial_number: &str,
            agent_type: Option<&str>,
            capacity_kg: Option<Decimal>,
            location_description: Option<&str>,
            latitude: Option<f64>,
            longitude: Option<f64>,
            floor: Option<&str>,
            building: Option<&str>,
            expiry_date: Option<chrono::NaiveDate>,
            last_inspection_date: Option<chrono::NaiveDate>,
            status: &str,
            photo_url: Option<&str>,
        ) -> Result<FireExtinguisher, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(FireExtinguisher {
                id: Uuid::new_v4(),
                serial_number: serial_number.to_string(),
                agent_type: agent_type.map(|s| s.to_string()),
                capacity_kg,
                location_description: location_description.map(|s| s.to_string()),
                latitude,
                longitude,
                floor: floor.map(|s| s.to_string()),
                building: building.map(|s| s.to_string()),
                expiry_date,
                last_inspection_date,
                status: status.to_string(),
                photo_url: photo_url.map(|s| s.to_string()),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }

        async fn update_extinguisher(
            &self,
            id: Uuid,
            _serial_number: Option<&str>,
            _agent_type: Option<&str>,
            _capacity_kg: Option<Decimal>,
            _location_description: Option<&str>,
            _latitude: Option<f64>,
            _longitude: Option<f64>,
            _floor: Option<&str>,
            _building: Option<&str>,
            _expiry_date: Option<chrono::NaiveDate>,
            _last_inspection_date: Option<chrono::NaiveDate>,
            _status: Option<&str>,
            _photo_url: Option<&str>,
        ) -> Result<Option<FireExtinguisher>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(Some(FireExtinguisher {
                id,
                serial_number: "SN-TEST".to_string(),
                agent_type: Some("DCP".to_string()),
                capacity_kg: Some(Decimal::new(10, 0)),
                location_description: Some("Hangar".to_string()),
                latitude: Some(-6.2),
                longitude: Some(106.8),
                floor: Some("Ground".to_string()),
                building: Some("Tower".to_string()),
                expiry_date: Some(Utc::now().date_naive()),
                last_inspection_date: None,
                status: "ACTIVE".to_string(),
                photo_url: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            }))
        }

        async fn delete_extinguisher(&self, _id: Uuid) -> Result<u64, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(1)
        }

        async fn get_expiring_soon(&self, _days: i64) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn get_nearby_extinguishers(&self, _lat: f64, _lng: f64, _radius_m: f64) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(vec![])
        }

        async fn get_geojson_extinguishers(&self) -> Result<serde_json::Value, sqlx::Error> {
            if self.should_fail { return Err(sqlx::Error::PoolTimedOut); }
            Ok(serde_json::json!({}))
        }
    }

    #[tokio::test]
    async fn test_create_extinguisher_success() {
        let repo = Arc::new(MockRepo { should_fail: false });
        let service = FireExtinguisherService::new(repo);

        let res = service.create_extinguisher(
            "SERIAL-001",
            "CO2",
            Decimal::new(2, 0),
            Some("Gate A"),
            Some(-6.2),
            Some(106.8),
            Some("Ground"),
            Some("Hangar"),
            Utc::now().date_naive() + chrono::Duration::days(30),
            None,
            "ACTIVE",
            None,
        ).await;

        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_create_extinguisher_expiry_past() {
        let repo = Arc::new(MockRepo { should_fail: false });
        let service = FireExtinguisherService::new(repo);

        let res = service.create_extinguisher(
            "SERIAL-002",
            "DCP",
            Decimal::new(2, 0),
            None,
            None,
            None,
            None,
            None,
            Utc::now().date_naive() - chrono::Duration::days(1),
            None,
            "ACTIVE",
            None,
        ).await;

        assert!(res.is_err());
    }

    #[tokio::test]
    async fn test_get_expiring_soon_success() {
        let repo = Arc::new(MockRepo { should_fail: false });
        let service = FireExtinguisherService::new(repo);
        let res = service.get_expiring_soon(30).await;
        assert!(res.is_ok());
    }
}
