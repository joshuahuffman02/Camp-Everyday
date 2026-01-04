//! Availability Calculator Rust Service
//!
//! Handles pricing evaluation, availability checking, deposit calculation,
//! and revenue forecasting for Campreserv.

use actix_web::{web, App, HttpResponse, HttpServer, middleware};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod availability;
mod config;
mod db;
mod deposits;
mod error;
mod forecasting;
mod pricing;

use config::Config;
use error::Result;

// ============================================================================
// Health Check
// ============================================================================

async fn health() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "availability-rs",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}

// ============================================================================
// Pricing Handlers
// ============================================================================

/// Evaluate pricing for a reservation.
async fn evaluate_pricing(
    body: web::Json<pricing::EvaluatePricingRequest>,
) -> Result<HttpResponse> {
    let result = pricing::evaluate_pricing(&body)?;
    Ok(HttpResponse::Ok().json(result))
}

// ============================================================================
// Availability Handlers
// ============================================================================

/// Check availability request with site data.
#[derive(Debug, serde::Deserialize)]
struct CheckAvailabilityPayload {
    #[serde(flatten)]
    request: availability::CheckAvailabilityRequest,
    /// Sites to check
    sites: Vec<SiteData>,
    /// Existing reservations
    reservations: Vec<ReservationData>,
    /// Maintenance blocks
    maintenance: Vec<MaintenanceData>,
}

#[derive(Debug, serde::Deserialize)]
struct SiteData {
    id: String,
    name: String,
    site_class_id: String,
    base_rate_cents: Option<u32>,
}

#[derive(Debug, serde::Deserialize)]
struct ReservationData {
    site_id: String,
    arrival_date: chrono::NaiveDate,
    departure_date: chrono::NaiveDate,
    status: String,
}

#[derive(Debug, serde::Deserialize)]
struct MaintenanceData {
    site_id: String,
    start_date: chrono::NaiveDate,
    end_date: chrono::NaiveDate,
    reason: String,
}

/// Check site availability.
async fn check_availability(
    body: web::Json<CheckAvailabilityPayload>,
) -> Result<HttpResponse> {
    let payload = body.into_inner();

    // Convert to internal types
    let sites: Vec<availability::SiteInfo> = payload
        .sites
        .iter()
        .map(|s| availability::SiteInfo {
            id: s.id.clone(),
            name: s.name.clone(),
            site_class_id: s.site_class_id.clone(),
            base_rate_cents: s.base_rate_cents,
        })
        .collect();

    let reservations: Vec<availability::ExistingReservation> = payload
        .reservations
        .iter()
        .map(|r| availability::ExistingReservation {
            site_id: r.site_id.clone(),
            arrival_date: r.arrival_date,
            departure_date: r.departure_date,
            status: r.status.clone(),
        })
        .collect();

    let maintenance: Vec<availability::MaintenanceBlock> = payload
        .maintenance
        .iter()
        .map(|m| availability::MaintenanceBlock {
            site_id: m.site_id.clone(),
            start_date: m.start_date,
            end_date: m.end_date,
            reason: m.reason.clone(),
        })
        .collect();

    let result = availability::filter_available_sites(
        &sites,
        payload.request.arrival_date,
        payload.request.departure_date,
        &reservations,
        &maintenance,
    );

    Ok(HttpResponse::Ok().json(result))
}

// ============================================================================
// Deposit Handlers
// ============================================================================

/// Calculate deposit amount.
async fn calculate_deposit(
    body: web::Json<deposits::CalculateDepositRequest>,
) -> Result<HttpResponse> {
    let result = deposits::calculate_deposit(&body)?;
    Ok(HttpResponse::Ok().json(result))
}

// ============================================================================
// Forecasting Handlers
// ============================================================================

/// Generate revenue forecast.
async fn generate_forecast(
    body: web::Json<forecasting::ForecastRequest>,
) -> Result<HttpResponse> {
    let result = forecasting::generate_forecast(&body);
    Ok(HttpResponse::Ok().json(result))
}

// ============================================================================
// Main Entry Point
// ============================================================================

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Load configuration
    let config = Config::from_env().expect("Failed to load configuration");

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(&config.rust_log))
        .with(tracing_subscriber::fmt::layer())
        .init();

    tracing::info!("Starting Availability Calculator service");

    let bind_addr = format!("{}:{}", config.host, config.port);
    tracing::info!("Listening on {}", bind_addr);

    // Start HTTP server
    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(middleware::Compress::default())
            // Health check
            .route("/health", web::get().to(health))
            // Pricing
            .route("/api/pricing/evaluate", web::post().to(evaluate_pricing))
            // Availability
            .route("/api/availability/check", web::post().to(check_availability))
            // Deposits
            .route("/api/deposits/calculate", web::post().to(calculate_deposit))
            // Forecasting
            .route("/api/forecasting/generate", web::post().to(generate_forecast))
    })
    .bind(&bind_addr)?
    .run()
    .await
}
