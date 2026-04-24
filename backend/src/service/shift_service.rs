use crate::domain::models::Shift;
use crate::repository::shift_repository::ShiftRepository;
use async_trait::async_trait;
use std::sync::Arc;

#[async_trait]
pub trait ShiftRepoTrait: Send + Sync {
    async fn get_all_shifts(&self) -> Result<Vec<Shift>, sqlx::Error>;
    async fn create_shift(
        &self,
        name: &str,
        start_time: chrono::NaiveTime,
        end_time: chrono::NaiveTime,
    ) -> Result<Shift, sqlx::Error>;
}

#[async_trait]
impl ShiftRepoTrait for ShiftRepository {
    async fn get_all_shifts(&self) -> Result<Vec<Shift>, sqlx::Error> {
        self.get_all_shifts().await
    }
    async fn create_shift(
        &self,
        name: &str,
        start_time: chrono::NaiveTime,
        end_time: chrono::NaiveTime,
    ) -> Result<Shift, sqlx::Error> {
        self.create_shift(name, start_time, end_time).await
    }
}

#[derive(Clone)]
pub struct ShiftService {
    pub repo: Arc<dyn ShiftRepoTrait>,
}

impl ShiftService {
    pub fn new(repo: Arc<dyn ShiftRepoTrait>) -> Self {
        Self { repo }
    }

    pub async fn get_all_shifts(&self) -> Result<Vec<Shift>, String> {
        self.repo.get_all_shifts().await.map_err(|e| e.to_string())
    }

    pub async fn create_shift(
        &self,
        name: &str,
        start_time: chrono::NaiveTime,
        end_time: chrono::NaiveTime,
    ) -> Result<Shift, String> {
        self.repo
            .create_shift(name, start_time, end_time)
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
    use chrono::NaiveTime;

    struct MockShiftRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl ShiftRepoTrait for MockShiftRepo {
        async fn get_all_shifts(&self) -> Result<Vec<Shift>, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(vec![])
        }

        async fn create_shift(
            &self,
            n: &str,
            s: NaiveTime,
            e: NaiveTime,
        ) -> Result<Shift, sqlx::Error> {
            if self.should_fail {
                return Err(sqlx::Error::PoolTimedOut);
            }
            Ok(Shift {
                id: 1,
                name: n.to_string(),
                start_time: s,
                end_time: e,
            })
        }
    }

    #[tokio::test]
    async fn test_create_shift_success() {
        let repo = Arc::new(MockShiftRepo { should_fail: false });
        let service = ShiftService::new(repo);

        let start = NaiveTime::from_hms_opt(7, 0, 0).unwrap();
        let end = NaiveTime::from_hms_opt(19, 0, 0).unwrap();

        let res = service.create_shift("Shift Pagi", start, end).await;
        assert!(res.is_ok(), "Harus berhasil membuat shift");
    }

    #[tokio::test]
    async fn test_create_shift_db_error() {
        let repo = Arc::new(MockShiftRepo { should_fail: true });
        let service = ShiftService::new(repo);

        let start = NaiveTime::from_hms_opt(7, 0, 0).unwrap();
        let end = NaiveTime::from_hms_opt(19, 0, 0).unwrap();

        let res = service.create_shift("Shift Pagi", start, end).await;
        assert!(res.is_err(), "Harus gagal jika database error");
    }

    #[tokio::test]
    async fn test_get_all_shifts_success() {
        let repo = Arc::new(MockShiftRepo { should_fail: false });
        let service = ShiftService::new(repo);

        let res = service.get_all_shifts().await;
        assert!(res.is_ok(), "Harus bisa menarik semua data shift");
    }
}
