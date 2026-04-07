use crate::repository::approval_repository::ApprovalRepoTrait;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct ApprovalService {
    pub repo: Arc<dyn ApprovalRepoTrait>,
}

impl ApprovalService {
    pub fn new(repo: Arc<dyn ApprovalRepoTrait>) -> Self {
        Self { repo }
    }

    /// Menangani transisi status untuk Inspeksi
    /// Aturan: 
    /// - Petugas (Role 4): DRAFT -> SUBMITTED
    /// - TL (Role 5): SUBMITTED -> REVIEWED
    /// - Admin (Role 1) / Kasubsie (Role 6): Any -> APPROVED / REJECTED
    pub async fn transition_inspection(
        &self,
        inspection_id: Uuid,
        current_status: &str,
        target_status: &str,
        role_id: i32,
        user_id: Option<Uuid>,
    ) -> Result<(), String> {
        match (current_status, target_status, role_id) {
            // Petugas menyerahkan laporan
            ("DRAFT", "SUBMITTED", 4) | ("DRAFT", "SUBMITTED", 1) => {
                self.repo.update_inspection_status(inspection_id, "SUBMITTED", user_id).await.map_err(|e| e.to_string())
            }
            // TL meriview laporan
            ("SUBMITTED", "REVIEWED", 5) | ("SUBMITTED", "REVIEWED", 1) => {
                self.repo.update_inspection_status(inspection_id, "REVIEWED", user_id).await.map_err(|e| e.to_string())
            }
            // Kasubsie / Admin menyetujui
            ("REVIEWED", "APPROVED", 6) | ("REVIEWED", "APPROVED", 1) | ("SUBMITTED", "APPROVED", 1) => {
                self.repo.update_inspection_status(inspection_id, "APPROVED", user_id).await.map_err(|e| e.to_string())
            }
            // Penolakan
            (_, "REJECTED", 1) | (_, "REJECTED", 6) | (_, "REJECTED", 5) => {
                self.repo.update_inspection_status(inspection_id, "REJECTED", user_id).await.map_err(|e| e.to_string())
            }
            _ => Err("Transisi status tidak diizinkan untuk Role Anda atau urutan salah".to_string())
        }
    }
}

// =========================================================
// UNIT TESTS
// =========================================================

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use sqlx::Error;

    struct MockApprovalRepo {
        should_fail: bool,
    }

    #[async_trait]
    impl ApprovalRepoTrait for MockApprovalRepo {
        async fn update_inspection_status(&self, _id: Uuid, _s: &str, _u: Option<Uuid>) -> Result<(), Error> {
            if self.should_fail { return Err(Error::PoolTimedOut); }
            Ok(())
        }
    }

    #[tokio::test]
    async fn test_petugas_submit_draft() {
        let repo = Arc::new(MockApprovalRepo { should_fail: false });
        let service = ApprovalService::new(repo);
        let res = service.transition_inspection(Uuid::new_v4(), "DRAFT", "SUBMITTED", 4, Some(Uuid::new_v4())).await;
        assert!(res.is_ok());
    }

    #[tokio::test]
    async fn test_petugas_cannot_approve() {
        let repo = Arc::new(MockApprovalRepo { should_fail: false });
        let service = ApprovalService::new(repo);
        let res = service.transition_inspection(Uuid::new_v4(), "REVIEWED", "APPROVED", 4, Some(Uuid::new_v4())).await;
        assert!(res.is_err(), "Petugas tidak boleh melakukan approval akhir");
    }

    #[tokio::test]
    async fn test_admin_bypass_all() {
        let repo = Arc::new(MockApprovalRepo { should_fail: false });
        let service = ApprovalService::new(repo);
        let res = service.transition_inspection(Uuid::new_v4(), "SUBMITTED", "APPROVED", 1, Some(Uuid::new_v4())).await;
        assert!(res.is_ok(), "Admin harus bisa bypass transisi");
    }
}
