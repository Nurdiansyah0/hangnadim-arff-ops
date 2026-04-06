use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_response_time_seconds: Option<f64>,
    pub readiness_percentage: f64,
    pub active_incidents: i64,
}

#[async_trait]
pub trait AnalyticsRepoTrait: Send + Sync {
    async fn get_performance_metrics(&self) -> Result<PerformanceMetrics, Error>;
}

#[derive(Clone)]
pub struct AnalyticsRepository {
    db: Pool<Postgres>,
}

impl AnalyticsRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl AnalyticsRepoTrait for AnalyticsRepository {
    async fn get_performance_metrics(&self) -> Result<PerformanceMetrics, Error> {
        // 1. Calculate Average Response Time (Dispatch to Arrival)
        let res_time: (Option<f64>,) = sqlx::query_as(
            "SELECT AVG(EXTRACT(EPOCH FROM (arrival_time - dispatch_time))) FROM incidents WHERE arrival_time IS NOT NULL"
        )
        .fetch_one(&self.db)
        .await?;

        // 2. Calculate Vehicle Readiness (%)
        let readiness: (i64, i64) = sqlx::query_as(
            "SELECT COUNT(*) FILTER (WHERE status = 'READY'), COUNT(*) FROM vehicles"
        )
        .fetch_one(&self.db)
        .await?;

        // 3. Count Active (Unresolved) Incidents
        let active: (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM incidents WHERE resolved_at IS NULL"
        )
        .fetch_one(&self.db)
        .await?;

        let readiness_percentage = if readiness.1 > 0 {
            (readiness.0 as f64 / readiness.1 as f64) * 100.0
        } else {
            0.0
        };

        Ok(PerformanceMetrics {
            avg_response_time_seconds: res_time.0,
            readiness_percentage,
            active_incidents: active.0,
        })
    }
}
