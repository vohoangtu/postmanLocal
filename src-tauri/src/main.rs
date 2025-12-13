// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod storage;
mod api_client;
mod mock_server;

use commands::*;
use log::{error, info, LevelFilter};
use simplelog::{Config, WriteLogger};
use std::fs::OpenOptions;
use std::path::PathBuf;

fn setup_logging() {
    // Tạo thư mục logs nếu chưa có
    let log_dir = get_log_directory();
    std::fs::create_dir_all(&log_dir).ok();
    
    // Đường dẫn file log
    let log_file = log_dir.join("postmanlocal.log");
    
    // Mở file log với append mode
    let file = match OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)
    {
        Ok(f) => f,
        Err(e) => {
            eprintln!("Không thể mở file log: {}", e);
            return;
        }
    };
    
    // Setup logger: ghi vào file
    let config = Config::default();
    
    // Ghi vào file
    if let Err(e) = WriteLogger::init(
        LevelFilter::Debug,
        config,
        file,
    ) {
        eprintln!("Không thể khởi tạo file logger: {}", e);
    }
    
    info!("=== PostmanLocal khởi động ===");
    info!("Log file: {:?}", log_file);
}

fn get_log_directory() -> PathBuf {
    // Thử dùng thư mục AppData\Local\PostmanLocal\logs
    if let Some(app_data) = std::env::var_os("LOCALAPPDATA") {
        let mut path = PathBuf::from(app_data);
        path.push("PostmanLocal");
        path.push("logs");
        return path;
    }
    
    // Fallback: dùng thư mục hiện tại
    std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join("logs")
}

fn main() {
    // Setup logging trước khi chạy app
    setup_logging();
    
    info!("Đang khởi tạo Tauri application...");
    
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      execute_request,
      save_request,
      save_request_to_collection,
      load_collections,
      load_requests_from_collection,
      validate_schema,
      start_mock_server,
      stop_mock_server,
      get_mock_server_status,
      sync_to_cloud
    ])
        .run(tauri::generate_context!());
    
    match result {
        Ok(_) => {
            info!("Tauri application đã thoát bình thường");
        }
        Err(e) => {
            error!("Lỗi khi chạy Tauri application: {:?}", e);
            error!("Chi tiết lỗi: {}", e);
            
            // Ghi stack trace nếu có
            #[cfg(debug_assertions)]
            {
                error!("Backtrace:\n{:?}", std::backtrace::Backtrace::capture());
            }
            
            std::process::exit(1);
        }
    }
}
