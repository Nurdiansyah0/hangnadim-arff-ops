use serde::{Deserialize, Serialize};
use sqlx::Type;

#[derive(Debug, Serialize, Deserialize, Type, PartialEq, Clone, Copy)]
#[sqlx(type_name = "asset_status")]
pub enum AssetStatus {
    Available,
    UnderMaintenance,
    Broken,
}
