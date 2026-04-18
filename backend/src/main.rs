// HAIS - Hang Nadim ARFF Integrated System
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
use handler::leave_handler::leave_routes;
use handler::media_handler::media_routes;
use handler::email_handler::email_routes;
use handler::maintenance_handler::maintenance_routes;
use handler::fitness_handler::fitness_routes;
use handler::roster_handler::roster_routes;
use handler::task_handler::task_routes;
use handler::performance_handler::performance_routes;
use handler::operation_handler::operation_routes;

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
use repository::leave_repository::LeaveRepository;
use repository::maintenance_repository::PostgresMaintenanceRepository;
use repository::fitness_repository::PostgresFitnessRepository;
use repository::audit_repository::AuditRepository;
use repository::roster_repository::RosterRepository;
use repository::task_repository::TaskRepository;
use repository::performance_repository::PerformanceRepository;

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
use service::leave_service::LeaveService;
use service::maintenance_service::MaintenanceService;
use service::fitness_service::FitnessService;
use service::roster_service::RosterService;
use service::task_service::TaskService;
use service::email_service::LettreEmailService;
use service::performance_service::PerformanceService;
use state::AppState;

pub async fn create_app_state(pool: sqlx::PgPool) -> AppState {
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
    let leave_repo = std::sync::Arc::new(LeaveRepository::new(pool.clone()));
    let fire_extinguisher_repo = std::sync::Arc::new(FireExtinguisherRepository::new(pool.clone()));
    let maintenance_repo = std::sync::Arc::new(PostgresMaintenanceRepository::new(pool.clone()));
    let fitness_repo = std::sync::Arc::new(PostgresFitnessRepository::new(pool.clone()));
    let audit_repo = std::sync::Arc::new(AuditRepository::new(pool.clone()));
    let roster_repo = std::sync::Arc::new(RosterRepository::new(pool.clone()));
    let task_repo = TaskRepository::new(pool.clone());
    let performance_repo = std::sync::Arc::new(PerformanceRepository::new(pool.clone()));

    AppState {
        auth_service: AuthService::new(user_repo_shared.clone()),
        user_service: UserService::new(user_repo_shared.clone()),
        personnel_service: PersonnelService::new(personnel_repo),
        shift_service: ShiftService::new(shift_repo.clone()),
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
        leave_service: LeaveService::new(leave_repo),
        email_service: std::sync::Arc::new(LettreEmailService),
        maintenance_service: MaintenanceService::new(maintenance_repo, vehicle_repo.clone()),
        fitness_service: FitnessService::new(fitness_repo),
        roster_service: RosterService::new(roster_repo, shift_repo.clone(), vehicle_repo.clone()),
        task_service: TaskService::new(task_repo),
        performance_service: PerformanceService::new(performance_repo),
        audit_repo: audit_repo.clone(),
    }
}

pub fn app_router(app_state: AppState) -> Router {
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
        .nest("/leaves", leave_routes(app_state.clone()))
        .nest("/media", media_routes(app_state.clone()))
        .nest("/email", email_routes(app_state.clone()))
        .nest("/maintenance", maintenance_routes(app_state.clone()))
        .nest("/fitness", fitness_routes(app_state.clone()))
        .nest("/roster", roster_routes(app_state.clone()))
        .nest("/tasks", task_routes(app_state.clone()))
        .nest("/performance", performance_routes(app_state.clone()))
        .nest("/squad", handler::squad_handler::squad_routes(app_state.clone()))
        .nest("/profile", handler::profile_handler::profile_routes(app_state.clone()))
        .nest("/operation", operation_routes(app_state.clone()))
        .nest("/admin/audit-logs", handler::audit_handler::audit_routes(app_state.clone()));

    Router::new()
        .nest("/api", api_routes)
        .nest_service("/uploads", ServeDir::new("uploads"))
        .route("/api/health", axum::routing::get(|| async { "OK" }))
        .layer(cors)
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    println!("Connecting to database...");
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    println!("Running SQL migrations...");

    let app_state = create_app_state(pool).await;
    
    // Start the Background Roster Scheduler
    let state_for_scheduler = app_state.clone();
    tokio::spawn(async move {
        spawn_roster_scheduler(state_for_scheduler).await;
    });

    let app = app_router(app_state);

    let addr = "0.0.0.0:8000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Backend Server running on {}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn spawn_roster_scheduler(state: AppState) {
    use chrono::{Datelike, Duration, Utc};
    println!("Roster Scheduler: Started background task.");

    loop {
        let now = Utc::now().date_naive();
        let tomorrow = now + Duration::days(1);
        let day_after_tomorrow = tomorrow + Duration::days(1);

        if tomorrow.month() == now.month() && day_after_tomorrow.month() != now.month() {
            let next_month_date = day_after_tomorrow;
            println!("Roster Scheduler: Triggering generation for next month: {:02}/{}", next_month_date.month(), next_month_date.year());
            
            match state.roster_service.generate_monthly_roster(next_month_date.month(), next_month_date.year()).await {
                Ok(_) => println!("Roster Scheduler: Successfully generated next month roster."),
                Err(e) => eprintln!("Roster Scheduler Error: {}", e),
            }
            
            tokio::time::sleep(tokio::time::Duration::from_secs(86400)).await;
        } else {
            tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
        }
    }
}
