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

use handler::auth_handler::auth_routes;
use handler::user_handler::users_routes;
use repository::user_repository::UserRepository;
use service::auth_service::AuthService;
use service::user_service::UserService;
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

    let user_repo = UserRepository::new(pool);
    let user_repo_shared = std::sync::Arc::new(user_repo); // Bungkus dengan Arc
    let app_state = AppState {
        auth_service: AuthService::new(user_repo_shared.clone()),
        user_service: UserService::new(user_repo_shared.clone()),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .nest("/auth", auth_routes(app_state.clone()))
        .nest("/users", users_routes(app_state.clone()));

    let app = Router::new()
        .nest("/api", api_routes)
        .route("/api/health", axum::routing::get(|| async { "OK" }))
        .layer(cors);

    let addr = "0.0.0.0:8000";
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Backend Server running on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
