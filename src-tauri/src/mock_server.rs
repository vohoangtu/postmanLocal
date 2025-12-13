use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use serde_json::Value;
use axum::{
    extract::{Path, State},
    http::{Method, StatusCode},
    response::Response,
    routing::{get, post, put, delete, patch},
    Router,
};
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_response_structure() {
        let response = MockResponse {
            status: 200,
            headers: HashMap::new(),
            body: json!({"message": "success"}),
            delay_ms: 0,
        };

        assert_eq!(response.status, 200);
        assert_eq!(response.delay_ms, 0);
    }

    #[tokio::test]
    async fn test_mock_server_creation() {
        let server = MockServer::new(3000);
        assert_eq!(server.get_port(), 3000);
    }
}

pub struct MockServer {
    port: u16,
    routes: Arc<Mutex<HashMap<String, MockResponse>>>,
    server_handle: Arc<Mutex<Option<tokio::task::JoinHandle<()>>>>,
}

#[derive(Clone)]
struct MockResponse {
    status: u16,
    headers: HashMap<String, String>,
    body: Value,
    delay_ms: u64,
}

impl MockServer {
    pub fn new(port: u16) -> Self {
        Self {
            port,
            routes: Arc::new(Mutex::new(HashMap::new())),
            server_handle: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn add_route(
        &self,
        path: String,
        method: String,
        status: u16,
        headers: HashMap<String, String>,
        body: Value,
        delay_ms: u64,
    ) {
        let key = format!("{}:{}", method.to_uppercase(), path);
        let mut routes = self.routes.lock().await;
        routes.insert(
            key,
            MockResponse {
                status,
                headers,
                body,
                delay_ms,
            },
        );
    }

    pub async fn get_response(&self, path: &str, method: &str) -> Option<MockResponse> {
        let key = format!("{}:{}", method.to_uppercase(), path);
        let routes = self.routes.lock().await;
        routes.get(&key).cloned()
    }

    pub fn get_port(&self) -> u16 {
        self.port
    }

    pub async fn start(&self) -> Result<(), String> {
        let routes = Arc::clone(&self.routes);
        let port = self.port;

        let app = Router::new()
            .route("/*path", get(handle_request_get))
            .route("/*path", post(handle_request_post))
            .route("/*path", put(handle_request_put))
            .route("/*path", delete(handle_request_delete))
            .route("/*path", patch(handle_request_patch))
            .layer(ServiceBuilder::new().layer(CorsLayer::permissive()))
            .with_state(routes);

        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

        let handle = tokio::spawn(async move {
            axum::serve(listener, app)
                .await
                .unwrap_or_else(|e| eprintln!("Server error: {}", e));
        });

        let mut server_handle = self.server_handle.lock().await;
        *server_handle = Some(handle);

        Ok(())
    }

    pub async fn stop(&self) {
        let mut server_handle = self.server_handle.lock().await;
        if let Some(handle) = server_handle.take() {
            handle.abort();
        }
    }
}

async fn handle_request_common(
    method: Method,
    path: String,
    routes: Arc<Mutex<HashMap<String, MockResponse>>>,
) -> Response {
    let method_str = method.as_str();
    let mock_response = {
        let routes = routes.lock().await;
        routes.get(&format!("{}:{}", method_str, path)).cloned()
    };

    if let Some(mock_response) = mock_response {
        // Apply delay if configured
        if mock_response.delay_ms > 0 {
            tokio::time::sleep(tokio::time::Duration::from_millis(mock_response.delay_ms)).await;
        }

        let mut response = Response::builder()
            .status(StatusCode::from_u16(mock_response.status).unwrap_or(StatusCode::OK));

        // Add headers
        for (key, value) in mock_response.headers {
            response = response.header(key, value);
        }

        // Set body
        let body_json = serde_json::to_string(&mock_response.body).unwrap_or_else(|_| "{}".to_string());
        response
            .header("content-type", "application/json")
            .body(body_json.into())
            .unwrap_or_else(|_| {
                Response::builder()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body("Internal server error".into())
                    .unwrap()
            })
    } else {
        Response::builder()
            .status(StatusCode::NOT_FOUND)
            .body(
                serde_json::json!({
                    "error": "Route not found",
                    "path": path,
                    "method": method_str
                })
                .to_string()
                .into(),
            )
            .unwrap()
    }
}

async fn handle_request_get(
    Path(path): Path<String>,
    State(routes): State<Arc<Mutex<HashMap<String, MockResponse>>>>,
) -> Response {
    handle_request_common(Method::GET, path, routes).await
}

async fn handle_request_post(
    Path(path): Path<String>,
    State(routes): State<Arc<Mutex<HashMap<String, MockResponse>>>>,
) -> Response {
    handle_request_common(Method::POST, path, routes).await
}

async fn handle_request_put(
    Path(path): Path<String>,
    State(routes): State<Arc<Mutex<HashMap<String, MockResponse>>>>,
) -> Response {
    handle_request_common(Method::PUT, path, routes).await
}

async fn handle_request_delete(
    Path(path): Path<String>,
    State(routes): State<Arc<Mutex<HashMap<String, MockResponse>>>>,
) -> Response {
    handle_request_common(Method::DELETE, path, routes).await
}

async fn handle_request_patch(
    Path(path): Path<String>,
    State(routes): State<Arc<Mutex<HashMap<String, MockResponse>>>>,
) -> Response {
    handle_request_common(Method::PATCH, path, routes).await
}
