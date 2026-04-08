use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use serde::{Deserialize, Serialize};

use crate::domain::models::{KpiDefinition, KpiReport};

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub avg_response_time_seconds: Option<f64>,
    pub readiness_percentage: f64,
    pub active_incidents: i64,
}

#[async_trait]
pub trait AnalyticsRepoTrait: Send + Sync {
    async fn get_performance_metrics(&self) -> Result<PerformanceMetrics, Error>;
    async fn get_kpi_report(&self) -> Result<Vec<KpiReport>, Error>;
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

    async fn get_kpi_report(&self) -> Result<Vec<KpiReport>, Error> {
        let defs: Vec<KpiDefinition> = sqlx::query_as::<_, KpiDefinition>("SELECT id, code, name, unit, threshold_green::FLOAT8, threshold_yellow::FLOAT8, threshold_red::FLOAT8, regulation_ref FROM kpi_definitions ORDER BY id")
            .fetch_all(&self.db)
            .await?;

        let mut reports = Vec::new();

        for def in defs {
            let mut trend = None;
            let value = match def.code.as_str() {
                "RESPONSE_TIME" => {
                    // Current (Last 30 days)
                    let curr: (Option<f64>,) = sqlx::query_as("SELECT AVG(EXTRACT(EPOCH FROM (arrival_time - dispatch_time))) FROM incidents WHERE arrival_time IS NOT NULL AND dispatch_time > NOW() - INTERVAL '30 days'")
                        .fetch_one(&self.db).await?;
                    let curr_val = curr.0.unwrap_or(0.0);
                    
                    // Previous (30-60 days ago)
                    let prev: (Option<f64>,) = sqlx::query_as("SELECT AVG(EXTRACT(EPOCH FROM (arrival_time - dispatch_time))) FROM incidents WHERE arrival_time IS NOT NULL AND dispatch_time BETWEEN (NOW() - INTERVAL '60 days') AND (NOW() - INTERVAL '30 days')")
                        .fetch_one(&self.db).await?;
                    
                    if let Some(p_val) = prev.0 {
                        if p_val > 0.0 {
                            trend = Some(((p_val - curr_val) / p_val) * 100.0); // Positive means improvement (faster)
                        }
                    }
                    curr_val
                },
                "VEHICLE_READINESS" => {
                    let res: (i64, i64) = sqlx::query_as("SELECT COUNT(*) FILTER (WHERE status = 'READY'), COUNT(*) FROM vehicles")
                        .fetch_one(&self.db).await?;
                    if res.1 > 0 { (res.0 as f64 / res.1 as f64) * 100.0 } else { 0.0 }
                },
                "FOAM_STOCK_RATIO" => {
                    let res: (Option<f64>, Option<f64>) = sqlx::query_as("SELECT SUM(inventory_level)::FLOAT8, SUM(min_requirement)::FLOAT8 FROM extinguishing_agents WHERE name ILIKE '%foam%'")
                        .fetch_one(&self.db).await?;
                    let inv = res.0.unwrap_or(0.0);
                    let req = res.1.unwrap_or(0.0); 
                    if req > 0.0 { (inv / req) * 100.0 } else { 100.0 } // 100% if no requirement set
                },
                "CERT_COMPLIANCE" => {
                    let res: (i64, i64) = sqlx::query_as("SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE'), COUNT(*) FROM personnel_certifications")
                        .fetch_one(&self.db).await?;
                    if res.1 > 0 { (res.0 as f64 / res.1 as f64) * 100.0 } else { 0.0 }
                },
                "INSPECTION_COMPLETION" => {
                    // Current (Last 24h as per spec, but for trend let's use 7 days)
                    let res: (i64, i64) = sqlx::query_as(r#"
                        SELECT 
                            (SELECT COUNT(DISTINCT COALESCE(vehicle_id::text, fire_extinguisher_id::text)) FROM inspections WHERE created_at > NOW() - INTERVAL '24 hours'),
                            ((SELECT COUNT(*) FROM vehicles) + (SELECT COUNT(*) FROM fire_extinguishers))
                    "#).fetch_one(&self.db).await?;
                    
                    // Simple trend based on inspections last 7 days vs previous 7 days
                    let weekly_curr: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM inspections WHERE created_at > NOW() - INTERVAL '7 days'").fetch_one(&self.db).await?;
                    let weekly_prev: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM inspections WHERE created_at BETWEEN (NOW() - INTERVAL '14 days') AND (NOW() - INTERVAL '7 days')").fetch_one(&self.db).await?;
                    
                    if weekly_prev.0 > 0 {
                        trend = Some(((weekly_curr.0 as f64 - weekly_prev.0 as f64) / weekly_prev.0 as f64) * 100.0);
                    }
                    
                    if res.1 > 0 { (res.0 as f64 / res.1 as f64) * 100.0 } else { 0.0 }
                },
                "APAR_EXPIRY_COMPLIANCE" => {
                    let res: (i64, i64) = sqlx::query_as("SELECT COUNT(*) FILTER (WHERE expiry_date >= CURRENT_DATE), COUNT(*) FROM fire_extinguishers")
                        .fetch_one(&self.db).await?;
                    if res.1 > 0 { (res.0 as f64 / res.1 as f64) * 100.0 } else { 0.0 }
                },
                _ => 0.0
            };

            let status = if def.code == "RESPONSE_TIME" {
                if value <= def.threshold_green { "GREEN" }
                else if value <= def.threshold_yellow { "YELLOW" }
                else { "RED" }
            } else {
                if value >= def.threshold_green { "GREEN" }
                else if value >= def.threshold_yellow { "YELLOW" }
                else { "RED" }
            }.to_string();

            reports.push(KpiReport {
                code: def.code,
                name: def.name,
                value,
                unit: def.unit,
                status,
                trend,
                threshold_green: def.threshold_green,
                threshold_yellow: def.threshold_yellow,
                threshold_red: def.threshold_red,
                regulation_ref: def.regulation_ref,
            });
        }

        Ok(reports)
    }
}
