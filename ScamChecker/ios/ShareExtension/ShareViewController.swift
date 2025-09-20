//
//  ShareViewController.swift
//  ShareExtension
//
//  ScamChecker Share Extension - Receives screenshots and opens main app
//

import UIKit
import UniformTypeIdentifiers

class ShareViewController: UIViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Immediately process the shared item
        processSharedItem()
    }
    
    private func processSharedItem() {
        guard let extensionContext = extensionContext,
              let inputItems = extensionContext.inputItems as? [NSExtensionItem] else {
            print("❌ No input items found")
            completeRequest()
            return
        }
        
        print("📱 ScamChecker Share Extension activated")
        print("📄 Processing \(inputItems.count) input items...")
        
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
        guard let appGroupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.yourapp.scamchecker") else {
            print("❌ Failed to access App Group container")
            completeRequest()
            return
        }
        
        let timestamp = Int(Date().timeIntervalSince1970)
        let filename = "screenshot_\(timestamp).jpg"
        let fileURL = appGroupURL.appendingPathComponent(filename)
        
        do {
            try imageData.write(to: fileURL)
            print("✅ Screenshot saved to App Group: \(filename)")
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
