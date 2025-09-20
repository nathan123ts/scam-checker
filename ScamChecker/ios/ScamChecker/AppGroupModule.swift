import Foundation
import React

@objc(AppGroupModule)
class AppGroupModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func getAppGroupDirectory(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupIdentifier = "group.com.yourapp.scamchecker"
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Failed to get App Group container URL", nil)
      return
    }
    
    resolve(appGroupURL.path)
  }
  
  @objc
  func readMetadataFile(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupIdentifier = "group.com.yourapp.scamchecker"
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Failed to get App Group container URL", nil)
      return
    }
    
    let metadataFile = appGroupURL.appendingPathComponent("latest_screenshot.json")
    
    do {
      let data = try Data(contentsOf: metadataFile)
      if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
        resolve(json)
      } else {
        reject("JSON_ERROR", "Failed to parse metadata JSON", nil)
      }
    } catch {
      reject("READ_ERROR", "Failed to read metadata file: \(error.localizedDescription)", error)
    }
  }
  
  @objc
  func listAppGroupFiles(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let appGroupIdentifier = "group.com.yourapp.scamchecker"
    
    guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
      reject("APP_GROUP_ERROR", "Failed to get App Group container URL", nil)
      return
    }
    
    do {
      let fileManager = FileManager.default
      let files = try fileManager.contentsOfDirectory(at: appGroupURL, includingPropertiesForKeys: [.contentModificationDateKey, .fileSizeKey], options: [])
      
      var fileList: [[String: Any]] = []
      
      for fileURL in files {
        let fileName = fileURL.lastPathComponent
        
        // Only include image files
        if fileName.hasSuffix(".jpg") || fileName.hasSuffix(".jpeg") || fileName.hasSuffix(".png") || fileName.hasSuffix(".heic") {
          do {
            let attributes = try fileManager.attributesOfItem(atPath: fileURL.path)
            let modificationDate = attributes[.modificationDate] as? Date ?? Date()
            let fileSize = attributes[.size] as? Int64 ?? 0
            
            fileList.append([
              "uri": fileURL.path,
              "filename": fileName,
              "size": fileSize,
              "modificationTime": modificationDate.timeIntervalSince1970 * 1000 // Convert to milliseconds
            ])
          } catch {
            print("Error getting file attributes for \(fileName): \(error)")
          }
        }
      }
      
      // Sort by modification time (newest first)
      fileList.sort { (file1, file2) in
        let time1 = file1["modificationTime"] as? Double ?? 0
        let time2 = file2["modificationTime"] as? Double ?? 0
        return time1 > time2
      }
      
      resolve(fileList)
      
    } catch {
      reject("FILE_LIST_ERROR", "Failed to list App Group files: \(error.localizedDescription)", error)
    }
  }
}
