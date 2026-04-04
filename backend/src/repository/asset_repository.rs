use crate::domain::models::{Vehicle, FireEquipment, Hydrant, FoamSystem};
use crate::domain::status::AssetStatus;
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;
use async_trait::async_trait;

#[async_trait]
pub trait AssetRepository: Send + Sync {
    // Vehicles
    async fn create_vehicle(&self, name: &str, status: AssetStatus) -> Result<Vehicle, Error>;
    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error>;
    async fn get_vehicle_by_id(&self, id: Uuid) -> Result<Option<Vehicle>, Error>;
    async fn update_vehicle(&self, id: Uuid, name: Option<&str>, status: Option<AssetStatus>) -> Result<Vehicle, Error>;
    async fn update_vehicle_status(&self, id: Uuid, status: AssetStatus) -> Result<Vehicle, Error>;
    async fn delete_vehicle(&self, id: Uuid) -> Result<(), Error>;

    // Fire Equipment
    async fn create_equipment(&self, name: &str, r#type: &str, status: AssetStatus) -> Result<FireEquipment, Error>;
    async fn get_all_equipments(&self) -> Result<Vec<FireEquipment>, Error>;
    async fn get_equipment_by_id(&self, id: Uuid) -> Result<Option<FireEquipment>, Error>;
    async fn update_equipment(&self, id: Uuid, name: Option<&str>, r#type: Option<&str>, status: Option<AssetStatus>) -> Result<FireEquipment, Error>;
    async fn update_equipment_status(&self, id: Uuid, status: AssetStatus) -> Result<FireEquipment, Error>;
    async fn delete_equipment(&self, id: Uuid) -> Result<(), Error>;

    // Hydrants
    async fn create_hydrant(&self, location: &str, pressure: f64, status: AssetStatus) -> Result<Hydrant, Error>;
    async fn get_all_hydrants(&self) -> Result<Vec<Hydrant>, Error>;
    async fn get_hydrant_by_id(&self, id: Uuid) -> Result<Option<Hydrant>, Error>;
    async fn update_hydrant(&self, id: Uuid, location: Option<&str>, pressure: Option<f64>, status: Option<AssetStatus>) -> Result<Hydrant, Error>;
    async fn update_hydrant_status(&self, id: Uuid, status: AssetStatus) -> Result<Hydrant, Error>;
    async fn delete_hydrant(&self, id: Uuid) -> Result<(), Error>;

    // Foam Systems
    async fn create_foam_system(&self, name: &str, capacity: f64, status: AssetStatus) -> Result<FoamSystem, Error>;
    async fn get_all_foam_systems(&self) -> Result<Vec<FoamSystem>, Error>;
    async fn get_foam_system_by_id(&self, id: Uuid) -> Result<Option<FoamSystem>, Error>;
    async fn update_foam_system(&self, id: Uuid, name: Option<&str>, capacity: Option<f64>, status: Option<AssetStatus>) -> Result<FoamSystem, Error>;
    async fn update_foam_system_status(&self, id: Uuid, status: AssetStatus) -> Result<FoamSystem, Error>;
    async fn delete_foam_system(&self, id: Uuid) -> Result<(), Error>;
}

#[derive(Clone)]
pub struct AssetRepositoryImpl {
    db: Pool<Postgres>,
}

impl AssetRepositoryImpl {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }
}

#[async_trait]
impl AssetRepository for AssetRepositoryImpl {
    // Vehicles Implementation
    async fn create_vehicle(&self, name: &str, status: AssetStatus) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            "INSERT INTO vehicles (name, status) VALUES ($1, $2) RETURNING id, name, status, created_at, updated_at"
        )
        .bind(name)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }

    async fn get_all_vehicles(&self) -> Result<Vec<Vehicle>, Error> {
        sqlx::query_as::<_, Vehicle>("SELECT id, name, status, created_at, updated_at FROM vehicles ORDER BY created_at DESC")
            .fetch_all(&self.db)
            .await
    }

    async fn get_vehicle_by_id(&self, id: Uuid) -> Result<Option<Vehicle>, Error> {
        sqlx::query_as::<_, Vehicle>("SELECT id, name, status, created_at, updated_at FROM vehicles WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    async fn update_vehicle(&self, id: Uuid, name: Option<&str>, status: Option<AssetStatus>) -> Result<Vehicle, Error> {
        let current = self.get_vehicle_by_id(id).await?.ok_or(Error::RowNotFound)?;
        sqlx::query_as::<_, Vehicle>(
            "UPDATE vehicles SET name = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, status, created_at, updated_at"
        )
        .bind(name.unwrap_or(&current.name))
        .bind(status.unwrap_or(current.status))
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn update_vehicle_status(&self, id: Uuid, status: AssetStatus) -> Result<Vehicle, Error> {
        sqlx::query_as::<_, Vehicle>(
            "UPDATE vehicles SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status, created_at, updated_at"
        )
        .bind(status)
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn delete_vehicle(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM vehicles WHERE id = $1").bind(id).execute(&self.db).await.map(|_| ())
    }

    // Fire Equipment Implementation
    async fn create_equipment(&self, name: &str, r#type: &str, status: AssetStatus) -> Result<FireEquipment, Error> {
        sqlx::query_as::<_, FireEquipment>(
            "INSERT INTO fire_equipments (name, type, status) VALUES ($1, $2, $3) RETURNING id, name, type, status, created_at, updated_at"
        )
        .bind(name)
        .bind(r#type)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }

    async fn get_all_equipments(&self) -> Result<Vec<FireEquipment>, Error> {
        sqlx::query_as::<_, FireEquipment>("SELECT id, name, type, status, created_at, updated_at FROM fire_equipments ORDER BY created_at DESC")
            .fetch_all(&self.db)
            .await
    }

    async fn get_equipment_by_id(&self, id: Uuid) -> Result<Option<FireEquipment>, Error> {
        sqlx::query_as::<_, FireEquipment>("SELECT id, name, type, status, created_at, updated_at FROM fire_equipments WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    async fn update_equipment(&self, id: Uuid, name: Option<&str>, r#type: Option<&str>, status: Option<AssetStatus>) -> Result<FireEquipment, Error> {
        let current = self.get_equipment_by_id(id).await?.ok_or(Error::RowNotFound)?;
        sqlx::query_as::<_, FireEquipment>(
            "UPDATE fire_equipments SET name = $1, type = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, type, status, created_at, updated_at"
        )
        .bind(name.unwrap_or(&current.name))
        .bind(r#type.unwrap_or(&current.r#type))
        .bind(status.unwrap_or(current.status))
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn update_equipment_status(&self, id: Uuid, status: AssetStatus) -> Result<FireEquipment, Error> {
        sqlx::query_as::<_, FireEquipment>(
            "UPDATE fire_equipments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, type, status, created_at, updated_at"
        )
        .bind(status)
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn delete_equipment(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM fire_equipments WHERE id = $1").bind(id).execute(&self.db).await.map(|_| ())
    }

    // Hydrants Implementation
    async fn create_hydrant(&self, location: &str, pressure: f64, status: AssetStatus) -> Result<Hydrant, Error> {
        sqlx::query_as::<_, Hydrant>(
            "INSERT INTO hydrants (location, pressure, status) VALUES ($1, $2, $3) RETURNING id, location, status, pressure, created_at, updated_at"
        )
        .bind(location)
        .bind(pressure)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }

    async fn get_all_hydrants(&self) -> Result<Vec<Hydrant>, Error> {
        sqlx::query_as::<_, Hydrant>("SELECT id, location, status, pressure, created_at, updated_at FROM hydrants ORDER BY created_at DESC")
            .fetch_all(&self.db)
            .await
    }

    async fn get_hydrant_by_id(&self, id: Uuid) -> Result<Option<Hydrant>, Error> {
        sqlx::query_as::<_, Hydrant>("SELECT id, location, status, pressure, created_at, updated_at FROM hydrants WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    async fn update_hydrant(&self, id: Uuid, location: Option<&str>, pressure: Option<f64>, status: Option<AssetStatus>) -> Result<Hydrant, Error> {
        let current = self.get_hydrant_by_id(id).await?.ok_or(Error::RowNotFound)?;
        sqlx::query_as::<_, Hydrant>(
            "UPDATE hydrants SET location = $1, pressure = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING id, location, status, pressure, created_at, updated_at"
        )
        .bind(location.unwrap_or(&current.location))
        .bind(pressure.unwrap_or(current.pressure))
        .bind(status.unwrap_or(current.status))
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn update_hydrant_status(&self, id: Uuid, status: AssetStatus) -> Result<Hydrant, Error> {
        sqlx::query_as::<_, Hydrant>(
            "UPDATE hydrants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, location, status, pressure, created_at, updated_at"
        )
        .bind(status)
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn delete_hydrant(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM hydrants WHERE id = $1").bind(id).execute(&self.db).await.map(|_| ())
    }

    // Foam Systems Implementation
    async fn create_foam_system(&self, name: &str, capacity: f64, status: AssetStatus) -> Result<FoamSystem, Error> {
        sqlx::query_as::<_, FoamSystem>(
            "INSERT INTO foam_systems (name, capacity, status) VALUES ($1, $2, $3) RETURNING id, name, status, capacity, created_at, updated_at"
        )
        .bind(name)
        .bind(capacity)
        .bind(status)
        .fetch_one(&self.db)
        .await
    }

    async fn get_all_foam_systems(&self) -> Result<Vec<FoamSystem>, Error> {
        sqlx::query_as::<_, FoamSystem>("SELECT id, name, status, capacity, created_at, updated_at FROM foam_systems ORDER BY created_at DESC")
            .fetch_all(&self.db)
            .await
    }

    async fn get_foam_system_by_id(&self, id: Uuid) -> Result<Option<FoamSystem>, Error> {
        sqlx::query_as::<_, FoamSystem>("SELECT id, name, status, capacity, created_at, updated_at FROM foam_systems WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.db)
            .await
    }

    async fn update_foam_system(&self, id: Uuid, name: Option<&str>, capacity: Option<f64>, status: Option<AssetStatus>) -> Result<FoamSystem, Error> {
        let current = self.get_foam_system_by_id(id).await?.ok_or(Error::RowNotFound)?;
        sqlx::query_as::<_, FoamSystem>(
            "UPDATE foam_systems SET name = $1, capacity = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING id, name, status, capacity, created_at, updated_at"
        )
        .bind(name.unwrap_or(&current.name))
        .bind(capacity.unwrap_or(current.capacity))
        .bind(status.unwrap_or(current.status))
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn update_foam_system_status(&self, id: Uuid, status: AssetStatus) -> Result<FoamSystem, Error> {
        sqlx::query_as::<_, FoamSystem>(
            "UPDATE foam_systems SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, status, capacity, created_at, updated_at"
        )
        .bind(status)
        .bind(id)
        .fetch_one(&self.db)
        .await
    }

    async fn delete_foam_system(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM foam_systems WHERE id = $1").bind(id).execute(&self.db).await.map(|_| ())
    }
}
