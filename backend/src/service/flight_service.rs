use crate::domain::models::FlightRoute;
use crate::repository::flight_repository::FlightRepoTrait;
use chrono::{DateTime, Utc};
use std::sync::Arc;

#[derive(Clone)]
pub struct FlightService {
    pub repo: Arc<dyn FlightRepoTrait>,
}

impl FlightService {
    pub fn new(repo: Arc<dyn FlightRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_flights(&self) -> Result<Vec<FlightRoute>, String> {
        self.repo.get_all_flights().await.map_err(|e| e.to_string())
    }

    pub async fn create_flight(
        &self,
        flight_number: &str,
        origin: Option<&str>,
        destination: Option<&str>,
        runway: &str,
        actual_time: DateTime<Utc>,
    ) -> Result<FlightRoute, String> {
        // Validasi Runway 04/22
        if runway != "04" && runway != "22" {
            return Err("Hanya runway 04 atau 22 yang diizinkan".to_string());
        }

        self.repo
            .create_flight(flight_number, origin, destination, runway, actual_time)
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
    use uuid::Uuid;

    struct MockFlightRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl FlightRepoTrait for MockFlightRepo {
        async fn get_all_flights(&self) -> Result<Vec<FlightRoute>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn create_flight(
            &self,
            f: &str,
            o: Option<&str>,
            d: Option<&str>,
            r: &str,
            t: DateTime<Utc>,
        ) -> Result<FlightRoute, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(FlightRoute {
                id: Uuid::new_v4(),
                flight_number: f.to_string(),
                origin: o.map(|x| x.to_string()),
                destination: d.map(|x| x.to_string()),
                runway: r.to_string(),
                actual_time: t,
                created_at: Utc::now(),
            })
        }
    }

    #[tokio::test]
    async fn test_create_flight_success() {
        let repo = Arc::new(MockFlightRepo { should_fail: false });
        let service = FlightService::new(repo);
        let res = service
            .create_flight("GA-123", Some("CGK"), Some("BTH"), "04", Utc::now())
            .await;
        assert!(res.is_ok(), "Harus berhasil mendaftarkan rute penerbangan");
    }

    #[tokio::test]
    async fn test_create_flight_invalid_runway() {
        let repo = Arc::new(MockFlightRepo { should_fail: false });
        let service = FlightService::new(repo);
        let res = service
            .create_flight("GA-123", Some("CGK"), Some("BTH"), "99", Utc::now())
            .await;
        assert!(res.is_err(), "Harus menolak runway selain 04/22");
    }

    #[tokio::test]
    async fn test_get_all_flights() {
        let repo = Arc::new(MockFlightRepo { should_fail: false });
        let service = FlightService::new(repo);
        let res = service.get_all_flights().await;
        assert!(res.is_ok());
    }
}
