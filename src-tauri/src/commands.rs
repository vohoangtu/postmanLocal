use serde::{Deserialize, Serialize};
use tauri::command;
use crate::storage;

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpRequest {
  pub method: String,
  pub url: String,
  pub headers: std::collections::HashMap<String, String>,
  pub body: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpResponse {
  pub status: u16,
  pub status_text: String,
  pub headers: std::collections::HashMap<String, String>,
  pub body: String,
}

#[command]
pub async fn execute_request(request: HttpRequest) -> Result<HttpResponse, String> {
  let client = reqwest::Client::new();
  
  let mut req_builder = match request.method.as_str() {
    "GET" => client.get(&request.url),
    "POST" => client.post(&request.url),
    "PUT" => client.put(&request.url),
    "PATCH" => client.patch(&request.url),
    "DELETE" => client.delete(&request.url),
    _ => return Err(format!("Unsupported method: {}", request.method)),
  };

  // Add headers
  for (key, value) in request.headers {
    req_builder = req_builder.header(&key, &value);
  }

  // Add body if present
  if let Some(body) = request.body {
    req_builder = req_builder.body(body);
  }

  let response = req_builder.send().await.map_err(|e| e.to_string())?;
  
  let status = response.status().as_u16();
  let status_text = response.status().canonical_reason().unwrap_or("Unknown").to_string();
  
  let mut headers = std::collections::HashMap::new();
  for (key, value) in response.headers() {
    headers.insert(
      key.to_string(),
      value.to_str().unwrap_or("").to_string(),
    );
  }

  let body = response.text().await.map_err(|e| e.to_string())?;

  Ok(HttpResponse {
    status,
    status_text,
    headers,
    body,
  })
}

#[command]
pub async fn save_request(
  name: String,
  method: String,
  url: String,
  headers: String,
  body: Option<String>,
) -> Result<(), String> {
  storage::save_request(name, method, url, headers, body).await
}

#[command]
pub async fn save_request_to_collection(
  name: String,
  method: String,
  url: String,
  headers: String,
  body: Option<String>,
  query_params: Option<String>,
  collection_id: Option<i64>,
  folder_id: Option<i64>,
) -> Result<i64, String> {
  storage::save_request_to_collection(
    name,
    method,
    url,
    headers,
    body,
    query_params,
    collection_id,
    folder_id,
  )
  .await
}

#[command]
pub async fn load_requests_from_collection(
  collection_id: i64,
) -> Result<Vec<serde_json::Value>, String> {
  storage::load_requests_from_collection(collection_id).await
}

#[command]
pub async fn load_collections() -> Result<Vec<serde_json::Value>, String> {
  // TODO: Implement loading from SQLite
  storage::load_collections().await
}

#[command]
pub async fn validate_schema(
  response: String,
  schema: String,
) -> Result<serde_json::Value, String> {
  // Basic schema validation
  let response_json: serde_json::Value = serde_json::from_str(&response)
    .map_err(|e| format!("Invalid JSON response: {}", e))?;
  
  let schema_json: serde_json::Value = serde_json::from_str(&schema)
    .map_err(|e| format!("Invalid JSON schema: {}", e))?;

  // Simple validation - check if required fields exist
  let mut errors = Vec::new();
  
  if let Some(required) = schema_json.get("required").and_then(|r| r.as_array()) {
    for field in required {
      if let Some(field_name) = field.as_str() {
        if !response_json.get(field_name).is_some() {
          errors.push(format!("Missing required field: {}", field_name));
        }
      }
    }
  }

  let result = serde_json::json!({
    "valid": errors.is_empty(),
    "errors": errors
  });

  Ok(result)
}

use crate::mock_server::MockServer;
use std::sync::Arc;
use tokio::sync::Mutex;

static MOCK_SERVER: Mutex<Option<Arc<MockServer>>> = Mutex::const_new(None);

#[command]
pub async fn start_mock_server(port: u16, routes: Vec<serde_json::Value>) -> Result<String, String> {
  let mut server_guard = MOCK_SERVER.lock().await;
  
  if server_guard.is_some() {
    return Err("Mock server is already running".to_string());
  }

  let server = Arc::new(MockServer::new(port));

  // Add routes
  for route in routes {
    if let (Some(path), Some(method), status, headers, body, delay_ms) = (
      route.get("path").and_then(|v| v.as_str()),
      route.get("method").and_then(|v| v.as_str()),
      route.get("status").and_then(|v| v.as_u64()).unwrap_or(200) as u16,
      route.get("headers").and_then(|v| v.as_object()).map(|o| {
        o.iter()
          .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
          .collect::<std::collections::HashMap<_, _>>()
      }).unwrap_or_default(),
      route.get("body").cloned().unwrap_or(serde_json::json!({})),
      route.get("delayMs").and_then(|v| v.as_u64()).unwrap_or(0) as u64,
    ) {
      server
        .add_route(path.to_string(), method.to_string(), status, headers, body, delay_ms)
        .await;
    }
  }

  server.start().await?;
  *server_guard = Some(server);

  Ok(format!("Mock server started on http://localhost:{}", port))
}

#[command]
pub async fn stop_mock_server() -> Result<(), String> {
  let mut server_guard = MOCK_SERVER.lock().await;
  if let Some(server) = server_guard.take() {
    server.stop().await;
    Ok(())
  } else {
    Err("Mock server is not running".to_string())
  }
}

#[command]
pub async fn get_mock_server_status() -> Result<serde_json::Value, String> {
  let server_guard = MOCK_SERVER.lock().await;
  if let Some(server) = server_guard.as_ref() {
    Ok(serde_json::json!({
      "running": true,
      "port": server.get_port()
    }))
  } else {
    Ok(serde_json::json!({
      "running": false
    }))
  }
}

#[command]
pub async fn sync_to_cloud(_data: String) -> Result<(), String> {
  // TODO: Implement cloud sync
  Ok(())
}


