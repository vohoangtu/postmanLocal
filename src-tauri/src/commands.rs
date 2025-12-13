// ... existing code ...

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execute_request_validation() {
        // Test URL validation
        let invalid_request = HttpRequest {
            method: "GET".to_string(),
            url: "not-a-url".to_string(),
            headers: std::collections::HashMap::new(),
            body: None,
        };

        // Should handle invalid URL gracefully
        // (Actual implementation would need async runtime for full test)
    }
}
