use crate::domain::models::{User, UserProfile, FullProfileResponse, OperationalContextResponse, CertificationDetail};
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
        let user = sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.personnel_id, u.username, u.email, u.password_hash, 
                p.full_name, p.nip_nik,
                u.status::text as status,
                u.last_login_at,
                u.created_at, u.updated_at,
                ur.role_id as role_id
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN personnel_roles ur ON p.id = ur.personnel_id
            WHERE u.username = $1 OR u.email = $1
            LIMIT 1
            "#
        )
        .bind(ident)
        .fetch_optional(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn create_user(&self, personnel_id: Uuid, username: &str, email: &str, password_hash: &str) -> Result<User, Error> {
        let user = sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (personnel_id, username, email, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING 
                id, personnel_id, username, email, password_hash,
                status::text as status, last_login_at, created_at, updated_at, 
                NULL::int as role_id, NULL::text as full_name, NULL::text as nip_nik
            "#
        )
        .bind(personnel_id)
        .bind(username)
        .bind(email)
        .bind(password_hash)
        .fetch_one(&self.db)
        .await?;

        Ok(user)
    }

    pub async fn delete_user(&self, id: Uuid) -> Result<(), Error> {
        sqlx::query("DELETE FROM users WHERE id = $1")
            .bind(id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn update_user_profile(
        &self, 
        personnel_id: Uuid, 
        phone_number: Option<String>, 
        email: Option<String>
    ) -> Result<(), Error> {
        let mut tx = self.db.begin().await?;

        if let Some(ref e) = email {
            sqlx::query("UPDATE users SET email = $1 WHERE personnel_id = $2")
                .bind(e)
                .bind(personnel_id)
                .execute(&mut *tx)
                .await?;
        }

        if phone_number.is_some() {
            sqlx::query("UPDATE personnels SET phone_number = $1 WHERE id = $2")
                .bind(phone_number)
                .bind(personnel_id)
                .execute(&mut *tx)
                .await?;
        }

        tx.commit().await?;
        Ok(())
    }

    pub async fn update_password(&self, user_id: Uuid, new_password_hash: &str) -> Result<(), Error> {
        sqlx::query("UPDATE users SET password_hash = $1 WHERE id = $2")
            .bind(new_password_hash)
            .bind(user_id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn update_profile_picture(&self, personnel_id: Uuid, url: &str) -> Result<(), Error> {
        sqlx::query("UPDATE personnels SET profile_picture_url = $1 WHERE id = $2")
            .bind(url)
            .bind(personnel_id)
            .execute(&self.db)
            .await
            .map(|_| ())
    }

    pub async fn get_user_profile(&self, id: Uuid) -> Result<Option<UserProfile>, Error> {
        let profile = sqlx::query_as::<_, UserProfile>(
            r#"
            SELECT 
                u.id, u.username, u.email,
                p.full_name, pos.name as position_name, 
                r.name as role_name, ur.role_id as role_id,
                p.phone_number, p.profile_picture_url,
                p.remaining_leave, p.annual_leave_quota,
                p.shift::TEXT as shift_team,
                p.id as personnel_id,
                u.created_at
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN positions pos ON p.position_id = pos.id
            LEFT JOIN personnel_roles ur ON p.id = ur.personnel_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.db)
        .await?;

        Ok(profile)
    }

    pub async fn get_user_permissions(&self, user_id: Uuid) -> Result<Vec<String>, Error> {
        let records = sqlx::query(
            r#"
            SELECT DISTINCT perm.name
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            JOIN personnel_roles ur ON p.id = ur.personnel_id
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions perm ON rp.permission_id = perm.id
            WHERE u.id = $1
            "#,
        )
        .bind(user_id)
        .fetch_all(&self.db)
        .await?;

        Ok(records.into_iter().map(|row: sqlx::postgres::PgRow| {
            use sqlx::Row;
            row.get::<String, _>("name")
        }).collect())
    }

    pub async fn get_full_profile(&self, user_id: Uuid) -> Result<Option<FullProfileResponse>, Error> {
        let personal = sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.personnel_id, u.username, u.email, u.password_hash, 
                p.full_name, p.nip_nik,
                u.status::text as status, 
                u.last_login_at, u.created_at, u.updated_at,
                ur.role_id as role_id
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN personnel_roles ur ON p.id = ur.personnel_id
            WHERE u.id = $1
            "#
        )
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        if let Some(u) = personal {
            let position: Option<String> = sqlx::query_scalar(
                "SELECT pos.name FROM positions pos JOIN personnels p ON pos.id = p.position_id WHERE p.id = $1"
            )
            .bind(u.personnel_id)
            .fetch_optional(&self.db)
            .await?;

            let role: Option<String> = sqlx::query_scalar(
                "SELECT r.name FROM roles r JOIN personnel_roles ur ON r.id = ur.role_id WHERE ur.personnel_id = $1 LIMIT 1"
            )
            .bind(u.personnel_id)
            .fetch_optional(&self.db)
            .await?;

            let certifications = sqlx::query_as::<_, CertificationDetail>(
                r#"
                SELECT 
                    t.title, t.category, uc.cert_number,
                    uc.issue_date, uc.expiry_date,
                    uc.status::text as status
                FROM personnel_certifications uc
                JOIN trainings t ON uc.training_id = t.id
                WHERE uc.personnel_id = $1
                "#,
            )
            .bind(u.personnel_id)
            .fetch_all(&self.db)
            .await?;

            Ok(Some(FullProfileResponse {
                personal: u,
                position, 
                role,
                certifications,
            }))
        } else {
            Ok(None)
        }
    }

    pub async fn get_operational_context(&self, user_id: Uuid) -> Result<OperationalContextResponse, Error> {
        let shift_info = sqlx::query(
            r#"
            SELECT s.id, s.name, s.start_time, s.end_time
            FROM users u
            JOIN shift_assignments sa ON u.personnel_id = sa.personnel_id
            JOIN shifts s ON sa.shift_id = s.id
            WHERE u.id = $1 AND sa.assignment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE
            LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        let duty_info = sqlx::query(
            r#"
            SELECT 
                da.position::text as position, 
                da.status as status, 
                v.code as vehicle_code,
                v.id as vehicle_id
            FROM users u
            JOIN duty_assignments da ON u.personnel_id = da.personnel_id
            LEFT JOIN vehicles v ON da.vehicle_id = v.id
            WHERE u.id = $1 AND da.assignment_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')::DATE
            ORDER BY da.created_at DESC LIMIT 1
            "#,
        )
        .bind(user_id)
        .fetch_optional(&self.db)
        .await?;

        use sqlx::Row;
        Ok(OperationalContextResponse {
            shift_id: shift_info.as_ref().map(|s| s.get("id")),
            shift_name: shift_info.as_ref().map(|s| s.get("name")),
            shift_start: shift_info.as_ref().map(|s| s.get("start_time")),
            shift_end: shift_info.as_ref().map(|s| s.get("end_time")),
            duty_position: duty_info.as_ref().map(|d| d.get("position")),
            assigned_vehicle: duty_info.as_ref().map(|d| d.get("vehicle_code")),
            assigned_vehicle_id: duty_info.as_ref().and_then(|d| d.get("vehicle_id")),
            duty_status: duty_info.as_ref().and_then(|d| d.get::<Option<String>, _>("status")).unwrap_or_else(|| "OFF_DUTY".to_string()),
        })
    }

    pub async fn get_all_users(&self) -> Result<Vec<User>, Error> {
        let users = sqlx::query_as::<_, User>(
            r#"
            SELECT 
                u.id, u.personnel_id, u.username, u.email, u.password_hash, 
                p.full_name, p.nip_nik,
                u.status::text as status,
                u.last_login_at,
                u.created_at, u.updated_at,
                ur.role_id as role_id
            FROM users u
            JOIN personnels p ON u.personnel_id = p.id
            LEFT JOIN personnel_roles ur ON p.id = ur.personnel_id
            ORDER BY u.created_at DESC
            "#
        )
        .fetch_all(&self.db)
        .await?;

        Ok(users)
    }
}
