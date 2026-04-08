use crate::service::auth_service::AuthService;
use crate::service::user_service::UserService;
use crate::service::personnel_service::PersonnelService;
use crate::service::shift_service::ShiftService;
use crate::service::vehicle_service::VehicleService;
use crate::service::fire_extinguisher_service::FireExtinguisherService;
use crate::service::inspection_service::InspectionService;
use crate::service::watchroom_service::WatchroomService;
use crate::service::approval_service::ApprovalService;
use crate::service::flight_service::FlightService;
use crate::service::analytics_service::AnalyticsService;
use crate::service::certification_service::CertificationService;
use crate::service::compliance_service::ComplianceService;
use crate::service::incident_service::IncidentService;
use crate::service::superuser_service::SuperuserService;
use crate::service::leave_service::LeaveService;
use crate::service::inventory_service::InventoryService;
use crate::service::email_service::EmailService;
use crate::service::maintenance_service::MaintenanceService;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub auth_service: AuthService,
    pub user_service: UserService,
    pub personnel_service: PersonnelService,
    pub shift_service: ShiftService,
    pub vehicle_service: VehicleService,
    pub fire_extinguisher_service: FireExtinguisherService,
    pub inspection_service: InspectionService,
    pub watchroom_service: WatchroomService,
    pub approval_service: ApprovalService,
    pub flight_service: FlightService,
    pub analytics_service: AnalyticsService,
    pub certification_service: CertificationService,
    pub compliance_service: ComplianceService,
    pub incident_service: IncidentService,
    pub superuser_service: SuperuserService,
    pub leave_service: LeaveService,
    pub inventory_service: InventoryService,
    pub email_service: Arc<dyn EmailService>,
    pub maintenance_service: MaintenanceService,
}
