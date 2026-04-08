use crate::domain::models::FitnessTrendResponse;
use crate::repository::fitness_repository::FitnessRepository;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct FitnessService {
    repo: Arc<dyn FitnessRepository>,
}

impl FitnessService {
    pub fn new(repo: Arc<dyn FitnessRepository>) -> Self {
        Self { repo }
    }

    pub async fn get_my_fitness_trend(&self, personnel_id: Uuid) -> Result<Option<FitnessTrendResponse>, String> {
        let history = self.repo.get_history_by_personnel_id(personnel_id, 2).await.map_err(|e| e.to_string())?;
        
        if history.is_empty() {
            return Ok(None);
        }

        let current = history[0].clone();
        let previous = if history.len() > 1 {
            Some(history[1].clone())
        } else {
            None
        };

        Ok(Some(FitnessTrendResponse {
            current,
            previous
        }))
    }
}
