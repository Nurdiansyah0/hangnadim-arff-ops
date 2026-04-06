use std::sync::Arc;
use uuid::Uuid;
use crate::repository::leave_repository::LeaveRepository;

#[derive(Clone)]
pub struct LeaveService {
    repo: Arc<LeaveRepository>,
}

impl LeaveService {
    pub fn new(repo: Arc<LeaveRepository>) -> Self {
        Self { repo }
    }

    pub async fn submit_request(&self, personnel_id: Uuid, start_date: chrono::NaiveDate, end_date: chrono::NaiveDate, reason: &str) -> Result<Uuid, String> {
        if start_date > end_date {
            return Err("Tanggal mulai tidak boleh lebih besar dari tanggal selesai".to_string());
        }
        self.repo.create_leave_request(personnel_id, start_date, end_date, reason).await
    }

    pub async fn list_requests(&self) -> Result<Vec<serde_json::Value>, String> {
        self.repo.get_all_requests().await
    }

    pub async fn process_request(&self, id: Uuid, status: &str) -> Result<(), String> {
        self.repo.update_status(id, status).await
    }
}
