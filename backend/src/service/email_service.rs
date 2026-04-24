use async_trait::async_trait;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use std::env;

#[async_trait]
pub trait EmailService: Send + Sync {
    async fn send_report(&self, to: &str, subject: &str, body: &str) -> Result<(), String>;
}

pub struct LettreEmailService;

#[async_trait]
impl EmailService for LettreEmailService {
    async fn send_report(&self, to: &str, subject: &str, body: &str) -> Result<(), String> {
        let smtp_server = env::var("SMTP_SERVER").unwrap_or_else(|_| "smtp.gmail.com".to_string());
        let smtp_username =
            env::var("SMTP_USERNAME").map_err(|_| "SMTP_USERNAME not set".to_string())?;
        let smtp_password =
            env::var("SMTP_PASSWORD").map_err(|_| "SMTP_PASSWORD not set".to_string())?;

        let email = Message::builder()
            .from("HAIS ARFF <system@hais.id>".parse().unwrap())
            .to(to
                .parse()
                .map_err(|_| "Invalid recipient email".to_string())?)
            .subject(subject)
            .body(body.to_string())
            .map_err(|e| e.to_string())?;

        let creds = Credentials::new(smtp_username, smtp_password);

        let mailer = SmtpTransport::relay(&smtp_server)
            .unwrap()
            .credentials(creds)
            .build();

        // In development/test, we might want to just log it if not configured
        if env::var("SMTP_ENABLE").unwrap_or_else(|_| "false".to_string()) == "true" {
            mailer.send(&email).map_err(|e| e.to_string())?;
        } else {
            println!("EMAIL MOCK DISPATCH [TO: {}]: {}", to, subject);
        }

        Ok(())
    }
}
