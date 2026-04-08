pub mod domain;
pub mod handler;
pub mod repository;
pub mod service;
pub mod state;

use axum::Router;
use dotenvy::dotenv;
use sqlx::postgres::PgPoolOptions;
use std::env;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;

use handler::auth_handler::auth_routes;
use handler::user_handler::users_routes;
use handler::personel_handler::personnel_routes;
use handler::shift_handler::shift_routes;
use handler::vehicle_handler::vehicle_routes;
use handler::fire_extinguisher_handler::fire_extinguisher_routes;
use handler::inspection_handler::inspection_routes;
use handler::watchroom_handler::watchroom_routes;
use handler::approval_handler::approval_routes;
use handler::flight_handler::flight_routes;
use handler::analytics_handler::analytics_routes;
use handler::certification_handler::certification_routes;
use handler::compliance_handler::compliance_routes;
use handler::incident_handler::incident_routes;
use handler::superuser_handler::superuser_routes;
use handler::leave_handler::leave_routes;
use handler::media_handler::media_routes;
use handler::email_handler::email_routes;
use handler::inventory_handler::inventory_routes;
use handler::maintenance_handler::maintenance_routes;
use handler::finding_handler::finding_routes;
use handler::fitness_handler::fitness_routes;

use repository::user_repository::UserRepository;
use repository::personnel_repository::PersonnelRepository;
use repository::shift_repository::ShiftRepository;
use repository::vehicle_repository::VehicleRepository;
use repository::fire_extinguisher_repository::FireExtinguisherRepository;
use repository::inspection_repository::InspectionRepository;
use repository::watchroom_repository::WatchroomRepository;
use repository::approval_repository::ApprovalRepository;
use repository::flight_repository::FlightRepository;
use repository::analytics_repository::AnalyticsRepository;
use repository::certification_repository::CertificationRepository;
use repository::compliance_repository::ComplianceRepository;
use repository::incident_repository::IncidentRepository;
use repository::superuser_repository::SuperuserRepository;
use repository::leave_repository::LeaveRepository;
use repository::inventory_repository::InventoryRepository;
use repository::maintenance_repository::PostgresMaintenanceRepository;
use repository::finding_repository::PostgresFindingRepository;
use repository::fitness_repository::PostgresFitnessRepository;
use repository::audit_repository::AuditRepository;

use service::auth_service::AuthService;
use service::user_service::UserService;
use service::personnel_service::PersonnelService;
use service::shift_service::ShiftService;
use service::vehicle_service::VehicleService;
use service::fire_extinguisher_service::FireExtinguisherService;
use service::inspection_service::InspectionService;
use service::watchroom_service::WatchroomService;
use service::approval_service::ApprovalService;
use service::flight_service::FlightService;
use service::analytics_service::AnalyticsService;
use service::certification_service::CertificationService;
use service::compliance_service::ComplianceService;
use service::incident_service::IncidentService;
use service::superuser_service::SuperuserService;
use service::leave_service::LeaveService;
use service::inventory_service::InventoryService;
use service::maintenance_service::MaintenanceService;
use service::finding_service::FindingService;
use service::fitness_service::FitnessService;
use service::email_service::LettreEmailService;
use state::AppState;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    println!("Connecting to database...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    println!("Running SQL migrations...");

    let user_repo = UserRepository::new(pool.clone());
    let user_repo_shared = std::sync::Arc::new(user_repo);

    let personnel_repo = std::sync::Arc::new(PersonnelRepository::new(pool.clone()));
    let shift_repo = std::sync::Arc::new(ShiftRepository::new(pool.clone()));
    let vehicle_repo = std::sync::Arc::new(VehicleRepository::new(pool.clone()));
    let inspection_repo = std::sync::Arc::new(InspectionRepository::new(pool.clone()));
    let watchroom_repo = std::sync::Arc::new(WatchroomRepository::new(pool.clone()));
    let approval_repo = std::sync::Arc::new(ApprovalRepository::new(pool.clone()));
    let flight_repo = std::sync::Arc::new(FlightRepository::new(pool.clone()));
    let analytics_repo = std::sync::Arc::new(AnalyticsRepository::new(pool.clone()));
    let certification_repo = std::sync::Arc::new(CertificationRepository::new(pool.clone()));
    let compliance_repo = std::sync::Arc::new(ComplianceRepository::new(pool.clone()));
    let incident_repo = std::sync::Arc::new(IncidentRepository::new(pool.clone()));
    let superuser_repo = std::sync::Arc::new(SuperuserRepository::new(pool.clone()));
    let leave_repo = std::sync::Arc::new(LeaveRepository::new(pool.clone()));
    let inventory_repo = std::sync::Arc::new(InventoryRepository::new(pool.clone()));
    let fire_extinguisher_repo = std::sync::Arc::new(FireExtinguisherRepository::new(pool.clone()));
    let maintenance_repo = std::sync::Arc::new(PostgresMaintenanceRepository::new(pool.clone()));
    let finding_repo = std::sync::Arc::new(PostgresFindingRepository::new(pool.clone()));
    let fitness_repo = std::sync::Arc::new(PostgresFitnessRepository::new(pool.clone()));
    let audit_repo = std::sync::Arc::new(AuditRepository::new(pool.clone()));

    let app_state = AppState {
        auth_service: AuthService::new(user_repo_shared.clone()),
        user_service: UserService::new(user_repo_shared.clone()),
        personnel_service: PersonnelService::new(personnel_repo),
        shift_service: ShiftService::new(shift_repo),
        vehicle_service: VehicleService::new(vehicle_repo.clone()),
        fire_extinguisher_service: FireExtinguisherService::new(fire_extinguisher_repo),
        inspection_service: InspectionService::new(inspection_repo),
        watchroom_service: WatchroomService::new(watchroom_repo),
        approval_service: ApprovalService::new(approval_repo),
        flight_service: FlightService::new(flight_repo),
        analytics_service: AnalyticsService::new(analytics_repo),
        certification_service: CertificationService::new(certification_repo),
        compliance_service: ComplianceService::new(compliance_repo),
        incident_service: IncidentService::new(incident_repo),
        superuser_service: SuperuserService::new(superuser_repo),
        leave_service: LeaveService::new(leave_repo),
        inventory_service: InventoryService::new(inventory_repo),
        email_service: std::sync::Arc::new(LettreEmailService),
        maintenance_service: MaintenanceService::new(maintenance_repo, vehicle_repo.clone()),
        finding_service: FindingService::new(finding_repo),
        fitness_service: FitnessService::new(fitness_repo),
        audit_repo: audit_repo.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .nest("/auth", auth_routes(app_state.clone()))
        .nest("/users", users_routes(app_state.clone()))
        .nest("/personnel", personnel_routes(app_state.clone()))
        .nest("/shifts", shift_routes(app_state.clone()))
        .nest("/vehicles", vehicle_routes(app_state.clone()))
        .nest("/fire-extinguishers", fire_extinguisher_routes(app_state.clone()))
        .nest("/inspections", inspection_routes(app_state.clone()))
        .nest("/watchroom", watchroom_routes(app_state.clone()))
        .nest("/approvals", approval_routes(app_state.clone()))
        .nest("/flights", flight_routes(app_state.clone()))
        .nest("/analytics", analytics_routes(app_state.clone()))
        .nest("/certifications", certification_routes(app_state.clone()))
        .nest("/compliance", compliance_routes(app_state.clone()))
        .nest("/incidents", incident_routes(app_state.clone()))
        .nest("/superuser", superuser_routes(app_state.clone()))
        .nest("/leaves", leave_routes(app_state.clone()))
        .nest("/media", media_routes(app_state.clone()))
        .nest("/email", email_routes(app_state.clone()))
        .nest("/inventory", inventory_routes(app_state.clone()))
        .nest("/maintenance", maintenance_routes(app_state.clone()))
        .nest("/findings", finding_routes(app_state.clone()))
        .nest("/fitness", fitness_routes(app_state.clone()))
        .nest("/admin/audit-logs", handler::audit_handler::audit_routes(app_state.clone()));

    let app = Router::new()
        .nest("/api", api_routes)
        .nest_service("/uploads", ServeDir::new("uploads"))
        .route("/api/health", axum::routing::get(|| async { "OK" }))
        .layer(cors);

    let addr = "0.0.0.0:8000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Backend Server running on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
