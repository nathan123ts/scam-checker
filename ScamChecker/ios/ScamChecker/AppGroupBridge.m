//
//  AppGroupBridge.m
//  ScamChecker
//
//  React Native bridge for AppGroupBridge Swift module
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppGroupBridge, NSObject)

// Get App Group directory path
RCT_EXTERN_METHOD(getAppGroupDirectory:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// List all files in App Group directory
RCT_EXTERN_METHOD(listAppGroupFiles:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Get the latest screenshot file
RCT_EXTERN_METHOD(getLatestScreenshot:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

// Delete a file by path
RCT_EXTERN_METHOD(deleteFile:(NSString *)filePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
