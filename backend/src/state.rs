use crate::service::auth_service::AuthService;
use crate::service::user_service::UserService;
use crate::service::asset_service::AssetService;
use crate::service::shift_service::ShiftService;

#[derive(Clone)]
pub struct AppState {
    pub auth_service: AuthService,
    pub user_service: UserService,
    pub asset_service: AssetService,
    pub shift_service: ShiftService,
}
