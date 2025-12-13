use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

static DB_URL: &str = "sqlite:postmanlocal.db";

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
  let pool = SqlitePoolOptions::new()
    .max_connections(5)
    .connect(DB_URL)
    .await?;

  // Create tables
  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT,
      body TEXT,
      query_params TEXT,
      collection_id INTEGER,
      folder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
    "#,
  )
  .execute(&pool)
  .await?;
  
  // Create folders table
  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      collection_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
    )
    "#,
  )
  .execute(&pool)
  .await?;

  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#,
  )
  .execute(&pool)
  .await?;

  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      variables TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#,
  )
  .execute(&pool)
  .await?;

  sqlx::query(
    r#"
    CREATE TABLE IF NOT EXISTS schemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      schema_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    "#,
  )
  .execute(&pool)
  .await?;

  Ok(pool)
}

pub async fn save_request(
  name: String,
  method: String,
  url: String,
  headers: String,
  body: Option<String>,
) -> Result<(), String> {
  let pool = init_db().await.map_err(|e| e.to_string())?;

  sqlx::query(
    "INSERT INTO requests (name, method, url, headers, body) VALUES (?, ?, ?, ?, ?)",
  )
  .bind(name)
  .bind(method)
  .bind(url)
  .bind(headers)
  .bind(body)
  .execute(&pool)
  .await
  .map_err(|e| e.to_string())?;

  Ok(())
}

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
  let pool = init_db().await.map_err(|e| e.to_string())?;

  let result = sqlx::query(
    "INSERT INTO requests (name, method, url, headers, body, query_params, collection_id, folder_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
  .bind(name)
  .bind(method)
  .bind(url)
  .bind(headers)
  .bind(body)
  .bind(query_params)
  .bind(collection_id)
  .bind(folder_id)
  .execute(&pool)
  .await
  .map_err(|e| e.to_string())?;

  Ok(result.last_insert_rowid())
}

pub async fn load_requests_from_collection(
  collection_id: i64,
) -> Result<Vec<serde_json::Value>, String> {
  let pool = init_db().await.map_err(|e| e.to_string())?;

  let requests = sqlx::query_as::<_, (i64, String, String, String, Option<String>, Option<String>, Option<String>, Option<i64>, Option<i64>)>(
    "SELECT id, name, method, url, headers, body, query_params, collection_id, folder_id FROM requests WHERE collection_id = ? ORDER BY created_at DESC",
  )
  .bind(collection_id)
  .fetch_all(&pool)
  .await
  .map_err(|e| e.to_string())?;

  let result: Vec<serde_json::Value> = requests
    .into_iter()
    .map(|(id, name, method, url, headers, body, query_params, collection_id, folder_id)| {
      serde_json::json!({
        "id": id,
        "name": name,
        "method": method,
        "url": url,
        "headers": headers,
        "body": body,
        "query_params": query_params,
        "collection_id": collection_id,
        "folder_id": folder_id
      })
    })
    .collect();

  Ok(result)
}

pub async fn load_collections() -> Result<Vec<serde_json::Value>, String> {
  let pool = init_db().await.map_err(|e| e.to_string())?;

  let collections = sqlx::query_as::<_, (i64, String, Option<String>)>(
    "SELECT id, name, description FROM collections",
  )
  .fetch_all(&pool)
  .await
  .map_err(|e| e.to_string())?;

  let result: Vec<serde_json::Value> = collections
    .into_iter()
    .map(|(id, name, description)| {
      serde_json::json!({
        "id": id,
        "name": name,
        "description": description
      })
    })
    .collect();

  Ok(result)
}


