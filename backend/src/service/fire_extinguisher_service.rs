use crate::domain::models::FireExtinguisher;
use crate::repository::fire_extinguisher_repository::{
    CreateExtinguisherParams, FireExtinguisherRepoTrait, UpdateExtinguisherParams,
};
use chrono::Utc;
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

    pub async fn get_extinguisher_by_id(
        &self,
        id: uuid::Uuid,
    ) -> Result<Option<FireExtinguisher>, String> {
        self.repo
            .get_extinguisher_by_id(id)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn create_extinguisher(
        &self,
        params: CreateExtinguisherParams<'_>,
    ) -> Result<FireExtinguisher, String> {
        if let Some(expiry) = params.expiry_date {
            let today = Utc::now().date_naive();
            if expiry < today {
                return Err("expiry_date cannot be in the past".to_string());
            }
        }

        self.repo
            .create_extinguisher(params)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn update_extinguisher(
        &self,
        params: UpdateExtinguisherParams<'_>,
    ) -> Result<Option<FireExtinguisher>, String> {
        if let Some(expiry) = params.expiry_date {
            let today = Utc::now().date_naive();
            if expiry < today {
                return Err("expiry_date cannot be in the past".to_string());
            }
        }

        self.repo
            .update_extinguisher(params)
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

    pub async fn get_nearby_extinguishers(
        &self,
        lat: f64,
        lng: f64,
        radius_m: f64,
    ) -> Result<Vec<FireExtinguisher>, String> {
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
    use crate::domain::models::FireExtinguisher;
    use async_trait::async_trait;
    use chrono::Utc;
    use rust_decimal::Decimal;
    use uuid::Uuid;

    struct MockRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl FireExtinguisherRepoTrait for MockRepo {
        async fn get_all_extinguishers(&self) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn get_extinguisher_by_id(
            &self,
            _id: Uuid,
        ) -> Result<Option<FireExtinguisher>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(None)
        }

        async fn create_extinguisher(
            &self,
            params: CreateExtinguisherParams<'_>,
        ) -> Result<FireExtinguisher, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(FireExtinguisher {
                id: Uuid::new_v4(),
                serial_number: params.serial_number.to_string(),
                agent_type: params.agent_type.map(|s| s.to_string()),
                capacity_kg: params.capacity_kg,
                location_description: params.location_description.map(|s| s.to_string()),
                latitude: params.latitude,
                longitude: params.longitude,
                floor: params.floor.map(|s| s.to_string()),
                building: params.building.map(|s| s.to_string()),
                expiry_date: params.expiry_date,
                last_inspection_date: params.last_inspection_date,
                status: params.status.to_string(),
                photo_url: params.photo_url.map(|s| s.to_string()),
                created_at: Utc::now(),
                updated_at: Utc::now(),
            })
        }

        async fn update_extinguisher(
            &self,
            params: UpdateExtinguisherParams<'_>,
        ) -> Result<Option<FireExtinguisher>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(Some(FireExtinguisher {
                id: params.id,
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
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(1)
        }

        async fn get_expiring_soon(
            &self,
            _days: i64,
        ) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn get_nearby_extinguishers(
            &self,
            _lat: f64,
            _lng: f64,
            _radius_m: f64,
        ) -> Result<Vec<FireExtinguisher>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn get_geojson_extinguishers(&self) -> Result<serde_json::Value, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(serde_json::json!({}))
        }
    }

    #[tokio::test]
    async fn test_create_extinguisher_success() {
        let repo = Arc::new(MockRepo { should_fail: false });
        let service = FireExtinguisherService::new(repo);

        let res = service
            .create_extinguisher(CreateExtinguisherParams {
                serial_number: "SERIAL-001",
                agent_type: Some("CO2"),
                capacity_kg: Some(Decimal::new(2, 0)),
                location_description: Some("Gate A"),
                latitude: Some(-6.2),
                longitude: Some(106.8),
                floor: Some("Ground"),
                building: Some("Hangar"),
                expiry_date: Some(Utc::now().date_naive() + chrono::Duration::days(30)),
                last_inspection_date: None,
                status: "ACTIVE",
                photo_url: None,
            })
            .await;

        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_create_extinguisher_expiry_past() {
        let repo = Arc::new(MockRepo { should_fail: false });
        let service = FireExtinguisherService::new(repo);

        let res = service
            .create_extinguisher(CreateExtinguisherParams {
                serial_number: "SERIAL-002",
                agent_type: Some("DCP"),
                capacity_kg: Some(Decimal::new(2, 0)),
                location_description: None,
                latitude: None,
                longitude: None,
                floor: None,
                building: None,
                expiry_date: Some(Utc::now().date_naive() - chrono::Duration::days(1)),
                last_inspection_date: None,
                status: "ACTIVE",
                photo_url: None,
            })
            .await;

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
