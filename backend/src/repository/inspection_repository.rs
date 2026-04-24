use crate::domain::models::{Inspection, InspectionResult, InspectionTemplate, TemplateItem};
use async_trait::async_trait;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;

pub struct InspectionResultCreate {
    pub template_item_id: i32,
    pub result: String,
    pub notes: Option<String>,
    pub photo_url: Option<String>,
}

pub struct CreateInspectionParams<'a> {
    pub vehicle_id: Option<Uuid>,
    pub fire_extinguisher_id: Option<Uuid>,
    pub personnel_id: Option<Uuid>,
    pub tanggal: chrono::NaiveDate,
    pub status: &'a str,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub results: Vec<InspectionResultCreate>,
}

#[async_trait]
pub trait InspectionRepoTrait: Send + Sync {
    async fn get_all_inspections(
        &self,
        personnel_id: Option<Uuid>,
    ) -> Result<Vec<Inspection>, Error>;
    async fn get_inspection_by_id(&self, id: Uuid) -> Result<Inspection, Error>;
    async fn get_inspection_results(
        &self,
        inspection_id: Uuid,
    ) -> Result<Vec<InspectionResult>, Error>;
    async fn create_inspection_with_results(
        &self,
        params: CreateInspectionParams<'_>,
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
    async fn get_all_inspections(
        &self,
        personnel_id: Option<Uuid>,
    ) -> Result<Vec<Inspection>, Error> {
        let mut query = String::from(
            r#"
            SELECT 
                i.*, 
                i.status::TEXT as status,
                p.full_name as inspector_name,
                v.code as vehicle_code,
                fe.serial_number as fire_extinguisher_serial
            FROM inspections i
            LEFT JOIN personnels p ON p.id = i.personnel_id
            LEFT JOIN vehicles v ON v.id = i.vehicle_id
            LEFT JOIN fire_extinguishers fe ON fe.id = i.fire_extinguisher_id
        "#,
        );

        if personnel_id.is_some() {
            query.push_str(" WHERE i.personnel_id = $1 ");
        }

        query.push_str(" ORDER BY i.tanggal DESC, i.created_at DESC");

        let mut q = sqlx::query_as::<_, Inspection>(&query);
        if let Some(pid) = personnel_id {
            q = q.bind(pid);
        }

        q.fetch_all(&self.db).await
    }

    async fn get_inspection_by_id(&self, id: Uuid) -> Result<Inspection, Error> {
        sqlx::query_as::<_, Inspection>(
            r#"
            SELECT 
                i.*, 
                i.status::TEXT as status,
                p.full_name as inspector_name,
                v.code as vehicle_code,
                fe.serial_number as fire_extinguisher_serial
            FROM inspections i
            LEFT JOIN personnels p ON p.id = i.personnel_id
            LEFT JOIN vehicles v ON v.id = i.vehicle_id
            LEFT JOIN fire_extinguishers fe ON fe.id = i.fire_extinguisher_id
            WHERE i.id = $1
            "#,
        )
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn get_inspection_results(
        &self,
        inspection_id: Uuid,
    ) -> Result<Vec<InspectionResult>, Error> {
        sqlx::query_as::<_, InspectionResult>(
            r#"
            SELECT 
                ir.*, 
                ir.result::TEXT as result,
                ti.item_name, 
                ti.category 
            FROM inspection_results ir
            LEFT JOIN template_items ti ON ti.id = ir.template_item_id
            WHERE ir.inspection_id = $1 
            ORDER BY ti.item_order, ir.template_item_id
            "#,
        )
        .bind(inspection_id)
        .fetch_all(&self.db)
        .await
    }

    async fn create_inspection_with_results(
        &self,
        params: CreateInspectionParams<'_>,
    ) -> Result<Inspection, Error> {
        let mut tx = self.db.begin().await?;

        // Insert inspection
        let inspection: Inspection = sqlx::query_as::<_, Inspection>(
            r#"
            INSERT INTO inspections (id, vehicle_id, fire_extinguisher_id, personnel_id, tanggal, status, latitude, longitude)
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5::approval_status_enum, $6, $7)
            RETURNING id, vehicle_id, fire_extinguisher_id, personnel_id, tanggal, status::TEXT, latitude, longitude, approved_by, approved_at, updated_at, created_at
            "#
        )
        .bind(params.vehicle_id)
        .bind(params.fire_extinguisher_id)
        .bind(params.personnel_id)
        .bind(params.tanggal)
        .bind(params.status)
        .bind(params.latitude)
        .bind(params.longitude)
        .fetch_one(&mut *tx)
        .await?;

        // Insert results
        for result in params.results {
            sqlx::query(
                "INSERT INTO inspection_results (inspection_id, inspection_date, template_item_id, result, notes, photo_url) VALUES ($1, $2, $3, $4::inspection_result_enum, $5, $6)"
            )
            .bind(inspection.id)
            .bind(params.tanggal)
            .bind(result.template_item_id)
            .bind(result.result)
            .bind(result.notes)
            .bind(result.photo_url)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;

        Ok(inspection)
    }

    async fn get_all_templates(&self) -> Result<Vec<InspectionTemplate>, Error> {
        sqlx::query_as::<_, InspectionTemplate>(
            "SELECT id, name, target_type, frequency FROM inspection_templates ORDER BY name",
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
