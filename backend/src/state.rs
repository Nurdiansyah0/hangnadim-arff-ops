use crate::service::auth_service::AuthService;
use crate::service::user_service::UserService;

#[derive(Clone)]
pub struct AppState {
    pub auth_service: AuthService,
    pub user_service: UserService,
}
