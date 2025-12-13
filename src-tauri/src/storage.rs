#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[tokio::test]
    async fn test_init_db() {
        // Test database initialization
        let result = init_db().await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_save_and_load_request() {
        // Test save request
        let result = save_request(
            "Test Request".to_string(),
            "GET".to_string(),
            "https://api.example.com/test".to_string(),
            json!({"Content-Type": "application/json"}).to_string(),
            None,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_load_collections() {
        let result = load_collections().await;
        assert!(result.is_ok());
    }

    #[test]
    fn test_collection_serialization() {
        let collection = json!({
            "id": "col-1",
            "name": "Test Collection",
            "requests": []
        });

        assert_eq!(collection["name"], "Test Collection");
    }
}
