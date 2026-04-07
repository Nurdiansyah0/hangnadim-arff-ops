use crate::domain::models::{Inspection, InspectionResult, InspectionTemplate, TemplateItem};
use async_trait::async_trait;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

pub struct InspectionResultCreate {
    pub template_item_id: i32,
    pub result: String,
    pub notes: Option<String>,
    pub photo_url: Option<String>,
}

#[async_trait]
pub trait InspectionRepoTrait: Send + Sync {
    async fn get_all_inspections(&self) -> Result<Vec<Inspection>, Error>;
    async fn get_inspection_by_id(&self, id: Uuid) -> Result<Inspection, Error>;
    async fn get_inspection_results(&self, inspection_id: Uuid) -> Result<Vec<InspectionResult>, Error>;
    async fn create_inspection_with_results(
        &self,
        vehicle_id: Uuid,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
        results: Vec<InspectionResultCreate>,
    ) -> Result<Inspection, Error>;
    async fn get_all_templates(&self) -> Result<Vec<InspectionTemplate>, Error>;
    async fn create_template(
        &self,
        name: &str,
        target_type: &str,
        frequency: &str,
    ) -> Result<InspectionTemplate, Error>;
    async fn get_template_items(&self, template_id: i32) -> Result<Vec<TemplateItem>, Error>;
    async fn create_template_item(
        &self,
        template_id: i32,
        category: &str,
        item_name: &str,
        item_order: i32,
    ) -> Result<TemplateItem, Error>;
}

#[derive(Clone)]
pub struct InspectionRepository {
    db: Pool<Postgres>,
}

impl InspectionRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl InspectionRepoTrait for InspectionRepository {
    async fn get_all_inspections(&self) -> Result<Vec<Inspection>, Error> {
        sqlx::query_as::<_, Inspection>(
            "SELECT id, vehicle_id, personnel_id, tanggal, status::TEXT, approved_by, approved_at, updated_at, created_at FROM inspections"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn get_inspection_by_id(&self, id: Uuid) -> Result<Inspection, Error> {
        sqlx::query_as::<_, Inspection>(
            "SELECT id, vehicle_id, personnel_id, tanggal, status::TEXT, approved_by, approved_at, updated_at, created_at FROM inspections WHERE id = $1"
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn get_inspection_results(&self, inspection_id: Uuid) -> Result<Vec<InspectionResult>, Error> {
        sqlx::query_as::<_, InspectionResult>(
            "SELECT id, inspection_id, inspection_date, template_item_id, result::TEXT, notes, photo_url, created_at FROM inspection_results WHERE inspection_id = $1 ORDER BY template_item_id"
        )
        .bind(inspection_id)
        .fetch_all(&self.db)
        .await
    }

    async fn create_inspection_with_results(
        &self,
        vehicle_id: Uuid,
        personnel_id: Option<Uuid>,
        tanggal: chrono::NaiveDate,
        status: &str,
        results: Vec<InspectionResultCreate>,
    ) -> Result<Inspection, Error> {
        // Insert inspection
        let inspection: Inspection = sqlx::query_as::<_, Inspection>(
            r#"
            INSERT INTO inspections (id, vehicle_id, personnel_id, tanggal, status)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4::approval_status_enum)
            RETURNING id, vehicle_id, personnel_id, tanggal, status::TEXT, approved_by, approved_at, updated_at, created_at
            "#
        )
        .bind(vehicle_id)
        .bind(personnel_id)
        .bind(tanggal)
        .bind(status)
        .fetch_one(&self.db)
        .await?;

        // Insert results
        for result in results {
            sqlx::query(
                "INSERT INTO inspection_results (inspection_id, inspection_date, template_item_id, result, notes, photo_url) VALUES ($1, $2, $3, $4::inspection_result_enum, $5, $6)"
            )
            .bind(inspection.id)
            .bind(tanggal)
            .bind(result.template_item_id)
            .bind(result.result)
            .bind(result.notes)
            .bind(result.photo_url)
            .execute(&self.db)
            .await?;
        }

        Ok(inspection)
    }

    async fn get_all_templates(&self) -> Result<Vec<InspectionTemplate>, Error> {
        sqlx::query_as::<_, InspectionTemplate>(
            "SELECT id, name, target_type, frequency FROM inspection_templates ORDER BY name"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn create_template(
        &self,
        name: &str,
        target_type: &str,
        frequency: &str,
    ) -> Result<InspectionTemplate, Error> {
        sqlx::query_as::<_, InspectionTemplate>(
            "INSERT INTO inspection_templates (name, target_type, frequency) VALUES ($1, $2, $3) RETURNING id, name, target_type, frequency"
        )
        .bind(name)
        .bind(target_type)
        .bind(frequency)
        .fetch_one(&self.db)
        .await
    }

    async fn get_template_items(&self, template_id: i32) -> Result<Vec<TemplateItem>, Error> {
        sqlx::query_as::<_, TemplateItem>(
            "SELECT id, template_id, category, item_name, item_order FROM template_items WHERE template_id = $1 ORDER BY item_order"
        )
        .bind(template_id)
        .fetch_all(&self.db)
        .await
    }

    async fn create_template_item(
        &self,
        template_id: i32,
        category: &str,
        item_name: &str,
        item_order: i32,
    ) -> Result<TemplateItem, Error> {
        sqlx::query_as::<_, TemplateItem>(
            "INSERT INTO template_items (template_id, category, item_name, item_order) VALUES ($1, $2, $3, $4) RETURNING id, template_id, category, item_name, item_order"
        )
        .bind(template_id)
        .bind(category)
        .bind(item_name)
        .bind(item_order)
        .fetch_one(&self.db)
        .await
    }
}
