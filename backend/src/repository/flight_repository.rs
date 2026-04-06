use crate::domain::models::FlightRoute;
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use chrono::{DateTime, Utc};

#[async_trait]
pub trait FlightRepoTrait: Send + Sync {
    async fn get_all_flights(&self) -> Result<Vec<FlightRoute>, Error>;
    async fn create_flight(
        &self,
        flight_number: &str,
        origin: Option<&str>,
        destination: Option<&str>,
        runway: &str,
        actual_time: DateTime<Utc>,
    ) -> Result<FlightRoute, Error>;
}

#[derive(Clone)]
pub struct FlightRepository {
    db: Pool<Postgres>,
}

impl FlightRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl FlightRepoTrait for FlightRepository {
    async fn get_all_flights(&self) -> Result<Vec<FlightRoute>, Error> {
        sqlx::query_as::<_, FlightRoute>(
            "SELECT id, flight_number, origin, destination, runway::TEXT, actual_time, created_at FROM flight_routes ORDER BY actual_time DESC"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_flight(
        &self,
        flight_number: &str,
        origin: Option<&str>,
        destination: Option<&str>,
        runway: &str,
        actual_time: DateTime<Utc>,
    ) -> Result<FlightRoute, Error> {
        sqlx::query_as::<_, FlightRoute>(
            r#"
            INSERT INTO flight_routes (flight_number, origin, destination, runway, actual_time) 
            VALUES ($1, $2, $3, $4::runway_enum, $5) 
            RETURNING id, flight_number, origin, destination, runway::TEXT, actual_time, created_at
            "#
        )
        .bind(flight_number)
        .bind(origin)
        .bind(destination)
        .bind(runway)
        .bind(actual_time)
        .fetch_one(&self.db)
        .await
    }
}
