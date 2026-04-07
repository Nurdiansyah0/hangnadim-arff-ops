use crate::domain::models::{User, UserProfile, FullProfileResponse, OperationalContextResponse, Personnel, CertificationDetail};
use sqlx::{Pool, Postgres, Error};
use uuid::Uuid;

#[derive(Clone)]
pub struct UserRepository {
    pub db: Pool<Postgres>,
}

impl UserRepository {
    pub fn new(db: Pool<Postgres>) -> Self {
        Self { db }
    }

    pub async fn find_by_username_or_email(&self, ident: &str) -> Result<Option<User>, Error> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT 
                u.id, u.username, u.email, u.password_hash, 
                u.personnel_id, u.created_at as "created_at!", u.updated_at as "updated_at!",
                pr.role_id as "role_id?"
            FROM users u
            LEFT JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN personnel_roles pr ON p.id = pr.personnel_id
            WHERE u.username = $1 OR u.email = $1
            LIMIT 1
            "#,
            ident
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn create_user(&self, username: &str, email: &str, password_hash: &str, personnel_id: Option<Uuid>) -> Result<User, Error> {
        let user = sqlx::query_as!(
            User,
            r#"
            INSERT INTO users (username, email, password_hash, personnel_id)
            VALUES ($1, $2, $3, $4)
            RETURNING id, username, email, password_hash, personnel_id, created_at as "created_at!", updated_at as "updated_at!", NULL::int as "role_id?"
            "#,
            username, email, password_hash, personnel_id
        )
        .fetch_one(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn delete_user(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query!("DELETE FROM users WHERE id = $1", id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn get_user_profile(&self, id: Uuid) -> Result<Option<UserProfile>, Error> {
        let profile = sqlx::query_as!(
            UserProfile,
            r#"
            SELECT 
                u.id, u.username, u.email,
                p.full_name, pos.name as position_name, 
                r.name as role_name, pr.role_id as "role_id?",
                u.created_at as "created_at!"
            FROM users u
            LEFT JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN positions pos ON p.position_id = pos.id
            LEFT JOIN personnel_roles pr ON p.id = pr.personnel_id
            LEFT JOIN roles r ON pr.role_id = r.id
            WHERE u.id = $1
            "#,
            id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(profile)
    }

    pub async fn get_user_permissions(&self, user_id: Uuid) -> Result<Vec<String>, Error> {
        let records = sqlx::query!(
            r#"
            SELECT DISTINCT perm.name as "name!"
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            JOIN personnel_roles pr ON p.id = pr.personnel_id
            JOIN role_permissions rp ON pr.role_id = rp.role_id
            JOIN permissions perm ON rp.permission_id = perm.id
            WHERE u.id = $1
            "#,
            user_id
        )
        .fetch_all(&self.db)
        .await?;

        Ok(records.into_iter().map(|rec| rec.name).collect())
    }

    pub async fn get_full_profile(&self, personnel_id: Uuid) -> Result<Option<FullProfileResponse>, Error> {
        let personal = sqlx::query_as!(
            Personnel,
            r#"SELECT id, nip_nik as "nip_nik!", full_name as "full_name!", position_id, status::text as "status!", created_at as "created_at!", updated_at as "updated_at!" FROM personnels WHERE id = $1"#,
            personnel_id
        )
        .fetch_optional(&self.db)
        .await?;

        if let Some(p) = personal {
            let position = sqlx::query_scalar!("SELECT name FROM positions WHERE id = $1", p.position_id)
                .fetch_optional(&self.db)
                .await?;

            let role = sqlx::query_scalar!(
                "SELECT r.name FROM roles r JOIN personnel_roles pr ON r.id = pr.role_id WHERE pr.personnel_id = $1 LIMIT 1",
                p.id
            )
            .fetch_optional(&self.db)
            .await?;

            let certifications = sqlx::query_as!(
                CertificationDetail,
                r#"
                SELECT 
                    t.title as "title!", t.category as "category!", pc.cert_number as "cert_number!",
                    pc.issue_date as "issue_date!", pc.expiry_date as "expiry_date!",
                    pc.status::text as "status!"
                FROM personnel_certifications pc
                JOIN trainings t ON pc.training_id = t.id
                WHERE pc.personnel_id = $1
                "#,
                p.id
            )
            .fetch_all(&self.db)
            .await?;

            Ok(Some(FullProfileResponse {
                personal: p,
                position,
                role,
                certifications,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn get_operational_context(&self, personnel_id: Uuid) -> Result<OperationalContextResponse, Error> {
        let shift_info = sqlx::query!(
            r#"
            SELECT s.name as "name!", s.start_time as "start_time!", s.end_time as "end_time!"
            FROM shift_assignments sa
            JOIN shifts s ON sa.shift_id = s.id
            WHERE sa.personnel_id = $1 AND sa.assignment_date = CURRENT_DATE
            LIMIT 1
            "#,
            personnel_id
        )
        .fetch_optional(&self.db)
        .await?;

        let duty_info = sqlx::query!(
            r#"
            SELECT 
                da.position::text as "position!", 
                da.status as "status?", 
                v.code as "vehicle_code?"
            FROM duty_assignments da
            LEFT JOIN vehicles v ON da.vehicle_id = v.id
            WHERE da.personnel_id = $1 AND da.assignment_date = CURRENT_DATE
            ORDER BY da.created_at DESC LIMIT 1
            "#,
            personnel_id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(OperationalContextResponse {
            shift_name: shift_info.as_ref().map(|s| s.name.clone()),
            shift_start: shift_info.as_ref().map(|s| s.start_time),
            shift_end: shift_info.as_ref().map(|s| s.end_time),
            duty_position: duty_info.as_ref().map(|d| d.position.clone()),
            assigned_vehicle: duty_info.as_ref().and_then(|d| d.vehicle_code.clone()),
            duty_status: duty_info.as_ref().and_then(|d| d.status.clone()).unwrap_or_else(|| "OFF_DUTY".to_string()),
        })
    }
}
