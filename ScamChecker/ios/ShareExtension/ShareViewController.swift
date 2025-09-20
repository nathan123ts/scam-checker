//
//  ShareViewController.swift
//  ShareExtension
//
//  ScamChecker Share Extension - Receives screenshots and opens main app
//

import UIKit
import Social
import UniformTypeIdentifiers
import os.log

class ShareViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Super distinctive logging
        print("🚨🚨🚨 SHAREEXTENSION_VIEWDIDLOAD_CALLED 🚨🚨🚨")
        print("🚨🚨🚨 SHAREEXTENSION_PROCESS_STARTED 🚨🚨🚨")
        NSLog("🚨🚨🚨 SHAREEXTENSION_NSLOG_VIEWDIDLOAD 🚨🚨🚨")
        
        // Also log to system log
        os_log("🚨 ShareExtension viewDidLoad called", log: OSLog.default, type: .info)
        
        // Immediately process the shared item
        processSharedItem()
    }
    
    
    private func processSharedItem() {
        print("🚨🚨🚨 SHAREEXTENSION_PROCESSSHAREDITEM_CALLED 🚨🚨🚨")
        NSLog("🚨🚨🚨 SHAREEXTENSION_PROCESSSHAREDITEM_NSLOG 🚨🚨🚨")
        
        guard let extensionContext = extensionContext else {
            print("❌ No extension context")
            completeRequest()
            return
        }
        
        guard let inputItems = extensionContext.inputItems as? [NSExtensionItem] else {
            print("❌ No input items found")
            completeRequest()
            return
        }
        
        print("📱 ScamChecker Share Extension activated")
        print("📄 Processing \(inputItems.count) input items...")
        print("🔥 Extension context exists: \(extensionContext)")
        print("🔥 Input items: \(inputItems)")
        
        // Process the first input item
        for inputItem in inputItems {
            guard let attachments = inputItem.attachments else { continue }
            
            for attachment in attachments {
                // Check if it's an image
                if attachment.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                    print("🖼️ Found image attachment")
                    processImageAttachment(attachment)
                    return
                }
            }
        }
        
        print("❌ No image attachments found")
        completeRequest()
    }
    
    private func processImageAttachment(_ attachment: NSItemProvider) {
        attachment.loadItem(forTypeIdentifier: UTType.image.identifier, options: nil) { [weak self] (item, error) in
            
            if let error = error {
                print("❌ Error loading image: \(error)")
                self?.completeRequest()
                return
            }
            
            var imageData: Data?
            
            // Handle different types of image items
            if let url = item as? URL {
                print("📁 Loading image from URL: \(url)")
                imageData = try? Data(contentsOf: url)
            } else if let image = item as? UIImage {
                print("🖼️ Converting UIImage to data")
                imageData = image.jpegData(compressionQuality: 0.8)
            } else if let data = item as? Data {
                print("📄 Using direct data")
                imageData = data
            }
            
            guard let data = imageData else {
                print("❌ Failed to get image data")
                self?.completeRequest()
                return
            }
            
            print("✅ Image data loaded: \(data.count) bytes")
            self?.saveImageToAppGroup(data)
        }
    }
    
    private func saveImageToAppGroup(_ imageData: Data) {
        // PROPER APPROACH: Save to App Groups container
        let appGroupIdentifier = "group.com.yourapp.scamchecker"
        
        print("🚨🚨🚨 ATTEMPTING_TO_GET_APP_GROUP_CONTAINER 🚨🚨🚨")
        NSLog("🚨🚨🚨 ATTEMPTING_TO_GET_APP_GROUP_CONTAINER 🚨🚨🚨")
        
        guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupIdentifier) else {
            print("❌ Failed to get App Group container")
            NSLog("❌ Failed to get App Group container")
            completeRequest()
            return
        }
        
        print("✅ Got App Group container: \(appGroupURL.path)")
        NSLog("✅ Got App Group container: \(appGroupURL.path)")
        
        // Save the image to App Groups (main app will read via native module)
        saveToDirectory(appGroupURL, imageData: imageData)
    }
    
    
    private func saveToDirectory(_ directoryURL: URL, imageData: Data) {
        print("🚨🚨🚨 SAVETODIRECTORY_CALLED 🚨🚨🚨")
        NSLog("🚨🚨🚨 SAVETODIRECTORY_CALLED 🚨🚨🚨")
        
        // Create directory if it doesn't exist
        do {
            try FileManager.default.createDirectory(at: directoryURL, withIntermediateDirectories: true, attributes: nil)
            print("📁 Directory created/verified: \(directoryURL.path)")
            NSLog("📁 Directory created/verified: \(directoryURL.path)")
        } catch {
            print("❌ Failed to create directory: \(error)")
            NSLog("❌ Failed to create directory: \(error)")
            completeRequest()
            return
        }
        
        let timestamp = Int(Date().timeIntervalSince1970)
        let filename = "screenshot_\(timestamp).jpg"
        let fileURL = directoryURL.appendingPathComponent(filename)
        
        do {
            try imageData.write(to: fileURL)
            print("✅ Screenshot saved: \(filename)")
            print("📁 Full path: \(fileURL.path)")
            print("📁 File size: \((imageData.count / 1024)) KB")
            
            // Open main app
            openMainApp()
            
        } catch {
            print("❌ Failed to save screenshot: \(error)")
            completeRequest()
        }
    }
    
    private func openMainApp() {
        print("🚀 Opening ScamChecker main app...")
        
        guard let url = URL(string: "scamchecker://analyze") else {
            print("❌ Invalid URL scheme")
            completeRequest()
            return
        }
        
        // Open main app via URL scheme
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                application.open(url, options: [:]) { success in
                    print(success ? "✅ Main app opened successfully" : "❌ Failed to open main app")
                }
                break
            }
            responder = responder?.next
        }
        
        // If we can't find UIApplication, try the extension context
        if responder == nil {
            extensionContext?.open(url) { success in
                print(success ? "✅ Main app opened via extension context" : "❌ Failed to open main app via extension context")
            }
        }
        
        // Complete the extension
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.completeRequest()
        }
    }
    
    private func completeRequest() {
        print("🏁 Share Extension completing...")
        
        DispatchQueue.main.async {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: { _ in
                print("✅ Share Extension completed")
            })
        }
    }
}
