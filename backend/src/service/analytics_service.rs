use crate::domain::models::{AlertItem, FleetReadinessItem, KpiReport};
use crate::repository::analytics_repository::{AnalyticsRepoTrait, PerformanceMetrics};
use std::sync::Arc;

#[derive(Clone)]
pub struct AnalyticsService {
    pub repo: Arc<dyn AnalyticsRepoTrait>,
}

impl AnalyticsService {
    pub fn new(repo: Arc<dyn AnalyticsRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_performance(&self) -> Result<PerformanceMetrics, String> {
        self.repo
            .get_performance_metrics()
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_kpi_report(&self) -> Result<Vec<KpiReport>, String> {
        self.repo.get_kpi_report().await.map_err(|e| e.to_string())
    }

    pub async fn get_fleet_readiness(&self) -> Result<Vec<FleetReadinessItem>, String> {
        self.repo
            .get_fleet_readiness()
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_alerts(&self) -> Result<Vec<AlertItem>, String> {
        self.repo.get_alerts().await.map_err(|e| e.to_string())
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;

    struct MockAnalyticsRepo;

    #[async_trait]
    impl AnalyticsRepoTrait for MockAnalyticsRepo {
        async fn get_performance_metrics(&self) -> Result<PerformanceMetrics, sqlx::Error> {
            Ok(PerformanceMetrics {
                avg_response_time_seconds: Some(180.0), // 3 minutes standard
                readiness_percentage: 95.0,
                active_incidents: 2,
            })
        }

        async fn get_kpi_report(&self) -> Result<Vec<KpiReport>, sqlx::Error> {
            Ok(vec![])
        }

        async fn get_fleet_readiness(&self) -> Result<Vec<FleetReadinessItem>, sqlx::Error> {
            Ok(vec![])
        }

        async fn get_alerts(&self) -> Result<Vec<AlertItem>, sqlx::Error> {
            Ok(vec![])
        }
    }

    #[tokio::test]
    async fn test_get_performance_metrics() {
        let repo = Arc::new(MockAnalyticsRepo);
        let service = AnalyticsService::new(repo);
        let res = service.get_performance().await;

        assert!(res.is_ok());
        let metrics = res.unwrap();
        assert_eq!(metrics.avg_response_time_seconds, Some(180.0));
        assert!(metrics.readiness_percentage > 90.0);
    }
}
