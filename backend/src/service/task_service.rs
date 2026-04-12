use uuid::Uuid;
use chrono::NaiveDate;
use crate::repository::task_repository::TaskRepository;
use crate::domain::models::{DailyTaskView, ShiftReport};

#[derive(Clone)]
pub struct TaskService {
    task_repo: TaskRepository,
}

impl TaskService {
    pub fn new(task_repo: TaskRepository) -> Self {
        Self { task_repo }
    }

    pub async fn generate_tasks_for_date(&self, date: NaiveDate) -> Result<(), String> {
        self.task_repo.generate_daily_tasks(date)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_my_tasks(&self, personnel_id: Uuid, date: NaiveDate) -> Result<Vec<DailyTaskView>, String> {
        self.task_repo.get_my_tasks(personnel_id, date)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn submit_task(&self, task_id: Uuid, notes: Option<String>) -> Result<(), String> {
        self.task_repo.submit_task(task_id, notes)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_shift_pending_approval(&self, shift_id: i32, date: NaiveDate) -> Result<Vec<DailyTaskView>, String> {
        self.task_repo.get_shift_tasks_for_approval(shift_id, date)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn approve_shift(&self, leader_id: Uuid, shift_id: i32, date: NaiveDate, notes: Option<String>) -> Result<ShiftReport, String> {
        self.task_repo.approve_shift_report(leader_id, shift_id, date, notes)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn get_squad_summary(&self, shift_id: i32, date: NaiveDate) -> Result<crate::domain::models::SquadSummaryResponse, String> {
        self.task_repo.get_squad_summary(shift_id, date)
            .await
            .map_err(|e| e.to_string())
    }
}
