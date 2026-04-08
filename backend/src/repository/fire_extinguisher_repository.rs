use async_trait::async_trait;
use crate::domain::models::FireExtinguisher;
use sqlx::{Error, Pool, Postgres};
use uuid::Uuid;
use rust_decimal::Decimal;

#[async_trait]
pub trait FireExtinguisherRepoTrait: Send + Sync {
    async fn get_all_extinguishers(&self) -> Result<Vec<FireExtinguisher>, Error>;
    async fn get_extinguisher_by_id(&self, id: Uuid) -> Result<Option<FireExtinguisher>, Error>;
    async fn create_extinguisher(
        &self,
        serial_number: &str,
        agent_type: &str,
        capacity_kg: Decimal,
        location_description: Option<&str>,
        latitude: Option<f64>,
        longitude: Option<f64>,
        floor: Option<&str>,
        building: Option<&str>,
        expiry_date: chrono::NaiveDate,
        last_inspection_date: Option<chrono::NaiveDate>,
        status: &str,
        photo_url: Option<&str>,
    ) -> Result<FireExtinguisher, Error>;
    async fn update_extinguisher(
        &self,
        id: Uuid,
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
    ) -> Result<Option<FireExtinguisher>, Error>;
    async fn delete_extinguisher(&self, id: Uuid) -> Result<u64, Error>;
    async fn get_expiring_soon(&self, days: i64) -> Result<Vec<FireExtinguisher>, Error>;
    async fn get_nearby_extinguishers(&self, lat: f64, lng: f64, radius_m: f64) -> Result<Vec<FireExtinguisher>, Error>;
    async fn get_geojson_extinguishers(&self) -> Result<serde_json::Value, Error>;
}

#[derive(Clone)]
pub struct FireExtinguisherRepository {
    db: Pool<Postgres>,
}

impl FireExtinguisherRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl FireExtinguisherRepoTrait for FireExtinguisherRepository {
    async fn get_all_extinguishers(&self) -> Result<Vec<FireExtinguisher>, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            "SELECT id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at FROM fire_extinguishers"
        )
        .fetch_all(&self.db)
        .await
    }

    async fn get_extinguisher_by_id(&self, id: Uuid) -> Result<Option<FireExtinguisher>, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            "SELECT id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at FROM fire_extinguishers WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.db)
        .await
    }

    async fn create_extinguisher(
        &self,
        serial_number: &str,
        agent_type: &str,
        capacity_kg: Decimal,
        location_description: Option<&str>,
        latitude: Option<f64>,
        longitude: Option<f64>,
        floor: Option<&str>,
        building: Option<&str>,
        expiry_date: chrono::NaiveDate,
        last_inspection_date: Option<chrono::NaiveDate>,
        status: &str,
        photo_url: Option<&str>,
    ) -> Result<FireExtinguisher, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            r#"
            INSERT INTO fire_extinguishers (
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
                photo_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::fire_extinguisher_status_enum, $12)
            RETURNING id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at
            "#
        )
        .bind(serial_number)
        .bind(agent_type)
        .bind(capacity_kg)
        .bind(location_description)
        .bind(latitude)
        .bind(longitude)
        .bind(floor)
        .bind(building)
        .bind(expiry_date)
        .bind(last_inspection_date)
        .bind(status)
        .bind(photo_url)
        .fetch_one(&self.db)
        .await
    }

    async fn update_extinguisher(
        &self,
        id: Uuid,
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
    ) -> Result<Option<FireExtinguisher>, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            r#"
            UPDATE fire_extinguishers
            SET serial_number = COALESCE($2, serial_number),
                agent_type = COALESCE($3, agent_type),
                capacity_kg = COALESCE($4, capacity_kg),
                location_description = COALESCE($5, location_description),
                latitude = COALESCE($6, latitude),
                longitude = COALESCE($7, longitude),
                floor = COALESCE($8, floor),
                building = COALESCE($9, building),
                expiry_date = COALESCE($10, expiry_date),
                last_inspection_date = COALESCE($11, last_inspection_date),
                status = COALESCE($12::fire_extinguisher_status_enum, status),
                photo_url = COALESCE($13, photo_url)
            WHERE id = $1
            RETURNING id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(serial_number)
        .bind(agent_type)
        .bind(capacity_kg)
        .bind(location_description)
        .bind(latitude)
        .bind(longitude)
        .bind(floor)
        .bind(building)
        .bind(expiry_date)
        .bind(last_inspection_date)
        .bind(status)
        .bind(photo_url)
        .fetch_optional(&self.db)
        .await
    }

    async fn delete_extinguisher(&self, id: Uuid) -> Result<u64, Error> {
        let result = sqlx::query("DELETE FROM fire_extinguishers WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await?;
        Ok(result.rows_affected())
    }

    async fn get_expiring_soon(&self, days: i64) -> Result<Vec<FireExtinguisher>, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            "SELECT id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at FROM fire_extinguishers WHERE expiry_date <= CURRENT_DATE + $1 * INTERVAL '1 day' ORDER BY expiry_date ASC"
        )
        .bind(days)
        .fetch_all(&self.db)
        .await
    }

    async fn get_nearby_extinguishers(&self, lat: f64, lng: f64, radius_m: f64) -> Result<Vec<FireExtinguisher>, Error> {
        sqlx::query_as::<_, FireExtinguisher>(
            r#"
            SELECT id, serial_number, agent_type, capacity_kg, location_description, latitude, longitude, floor, building, expiry_date, last_inspection_date, status::TEXT, photo_url, created_at, updated_at 
            FROM fire_extinguishers 
            WHERE ST_DWithin(
                geom, 
                ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 
                $3
            )
            ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) ASC
            "#
        )
        .bind(lat)
        .bind(lng)
        .bind(radius_m)
        .fetch_all(&self.db)
        .await
    }

    async fn get_geojson_extinguishers(&self) -> Result<serde_json::Value, Error> {
        sqlx::query_scalar(
            r#"
            SELECT jsonb_build_object(
                'type',     'FeatureCollection',
                'features', COALESCE(jsonb_agg(feature), '[]'::jsonb)
            )
            FROM (
              SELECT jsonb_build_object(
                'type',       'Feature',
                'id',         id,
                'geometry',   ST_AsGeoJSON(geom)::jsonb,
                'properties', jsonb_build_object(
                    'serial_number', serial_number,
                    'agent_type', agent_type,
                    'capacity_kg', capacity_kg,
                    'status', status,
                    'building', building,
                    'floor', floor,
                    'location_description', location_description
                )
              ) AS feature
              FROM fire_extinguishers
            ) features
            "#
        )
        .fetch_one(&self.db)
        .await
    }
}
