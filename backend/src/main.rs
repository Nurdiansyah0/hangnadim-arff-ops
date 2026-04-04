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

use handler::asset_handler::asset_routes;
use handler::auth_handler::auth_routes;
use handler::shift_handler::shift_routes;
use handler::user_handler::users_routes;
use repository::asset_repository::{AssetRepositoryImpl};
use repository::shift_repository::{ShiftRepositoryImpl};
use repository::user_repository::UserRepository;
use service::asset_service::AssetService;
use service::auth_service::AuthService;
use service::shift_service::ShiftService;
use service::user_service::UserService;
use state::AppState;
use std::sync::Arc;

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
    let asset_repo = Arc::new(AssetRepositoryImpl::new(pool.clone()));
    let shift_repo = Arc::new(ShiftRepositoryImpl::new(pool.clone()));

    let app_state = AppState {
        auth_service: AuthService::new(user_repo.clone()),
        user_service: UserService::new(user_repo.clone()),
        asset_service: AssetService::new(asset_repo),
        shift_service: ShiftService::new(shift_repo, user_repo),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .nest("/auth", auth_routes(app_state.clone()))
        .nest("/users", users_routes(app_state.clone()))
        .nest("/assets", asset_routes(app_state.clone()))
        .nest("/shifts", shift_routes(app_state.clone()));

    let app = Router::new()
        .nest("/api/v1", api_routes)
        .route("/api/health", axum::routing::get(|| async { "OK" }))
        .layer(cors);

    let addr = "0.0.0.0:8000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Backend Server running on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
