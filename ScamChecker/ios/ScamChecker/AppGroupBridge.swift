//
//  AppGroupBridge.swift
//  ScamChecker
//
//  Native iOS module to access App Groups from React Native
//

import Foundation
import React

@objc(AppGroupBridge)
class AppGroupBridge: NSObject {
  
  private let appGroupIdentifier = "group.com.yourapp.scamchecker"
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  // MARK: - App Groups Directory Access
  
  @objc
  func getAppGroupDirectory(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Could not access App Group container", nil)
      return
    }
    
    resolve(appGroupURL.path)
  }
  
  // MARK: - List Files in App Groups
  
  @objc
  func listAppGroupFiles(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Could not access App Group container", nil)
      return
    }
    
    do {
      let fileURLs = try FileManager.default.contentsOfDirectory(at: appGroupURL, includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey], options: [])
      
      var files: [[String: Any]] = []
      
      for fileURL in fileURLs {
        // Only include image files
        let filename = fileURL.lastPathComponent
        if filename.hasSuffix(".jpg") || filename.hasSuffix(".jpeg") || filename.hasSuffix(".png") || filename.hasSuffix(".heic") {
          
          let resourceValues = try fileURL.resourceValues(forKeys: [.contentModificationDateKey, .fileSizeKey])
          
          let fileInfo: [String: Any] = [
            "filename": filename,
            "path": fileURL.path,
            "size": resourceValues.fileSize ?? 0,
            "modificationTime": resourceValues.contentModificationDate?.timeIntervalSince1970 ?? 0
          ]
          
          files.append(fileInfo)
        }
      }
      
      // Sort by modification time (newest first)
      files.sort { (file1, file2) in
        let time1 = file1["modificationTime"] as? Double ?? 0
        let time2 = file2["modificationTime"] as? Double ?? 0
        return time1 > time2
      }
      
      resolve(files)
      
    } catch {
      reject("FILE_READ_ERROR", "Could not read App Group directory: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - Get Latest Screenshot
  
  @objc
  func getLatestScreenshot(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Could not access App Group container", nil)
      return
    }
    
    do {
      let fileURLs = try FileManager.default.contentsOfDirectory(at: appGroupURL, includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey], options: [])
      
      var latestFile: (url: URL, date: Date)?
      
      for fileURL in fileURLs {
        let filename = fileURL.lastPathComponent
        if filename.hasSuffix(".jpg") || filename.hasSuffix(".jpeg") || filename.hasSuffix(".png") || filename.hasSuffix(".heic") {
          
          let resourceValues = try fileURL.resourceValues(forKeys: [.contentModificationDateKey])
          if let modificationDate = resourceValues.contentModificationDate {
            
            if latestFile == nil || modificationDate > latestFile!.date {
              latestFile = (fileURL, modificationDate)
            }
          }
        }
      }
      
      guard let latest = latestFile else {
        resolve(nil) // No files found
        return
      }
      
      let resourceValues = try latest.url.resourceValues(forKeys: [.fileSizeKey])
      
      let fileInfo: [String: Any] = [
        "filename": latest.url.lastPathComponent,
        "path": latest.url.path,
        "size": resourceValues.fileSize ?? 0,
        "modificationTime": latest.date.timeIntervalSince1970
      ]
      
      resolve(fileInfo)
      
    } catch {
      reject("FILE_READ_ERROR", "Could not read App Group directory: \(error.localizedDescription)", error)
    }
  }
  
  // MARK: - Delete File
  
  @objc
  func deleteFile(_ filePath: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    
    let fileURL = URL(fileURLWithPath: filePath)
    
    do {
      try FileManager.default.removeItem(at: fileURL)
      resolve(true)
    } catch {
      reject("DELETE_ERROR", "Could not delete file: \(error.localizedDescription)", error)
    }
  }
}
