import * as FileSystem from 'expo-file-system/legacy'
import { NativeModules, Platform } from 'react-native'

// App Group configuration
const APP_GROUP_ID = 'group.com.yourapp.scamchecker'

// Native module for App Groups access
const { AppGroupBridge } = NativeModules

/**
 * App Group Service for reading shared screenshots from iOS Share Extension
 * 
 * This service handles reading files from the App Group container that is
 * shared between the main app and the Share Extension.
 */

export interface SharedScreenshot {
  uri: string
  filename: string
  size: number
  modificationTime: number
}

/**
 * Get the App Group container directory path
 * Try multiple locations where the Share Extension might have saved files
 */
const getAppGroupDirectory = async (): Promise<string> => {
  console.log(`📂 Looking for shared screenshots in system temp directory`)
  console.log(`📂 Target App Group ID: ${APP_GROUP_ID}`)
  console.log(`📂 Platform: ${FileSystem.platform}`)
  
  // Use the same shared temp directory that the Share Extension uses
  const sharedTempPath = '/tmp/ScamCheckerShared/'
  
  console.log(`📂 Checking shared temp path: ${sharedTempPath}`)
  
  // Check if the directory exists
  try {
    const dirInfo = await FileSystem.getInfoAsync(sharedTempPath)
    if (dirInfo.exists) {
      console.log(`✅ Shared temp directory exists`)
      return sharedTempPath
    } else {
      console.log(`❌ Shared temp directory does not exist`)
    }
  } catch (error) {
    console.log(`❌ Error checking shared temp directory: ${error}`)
  }
  
  // Fallback to Documents/AppGroup for backwards compatibility
  const fallbackPath = FileSystem.documentDirectory + 'AppGroup/'
  console.log(`📂 Using fallback path: ${fallbackPath}`)
  
  // Ensure the fallback directory exists
  const dirInfo = await FileSystem.getInfoAsync(fallbackPath)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(fallbackPath, { intermediates: true })
    console.log(`✅ Created fallback App Group directory: ${fallbackPath}`)
  } else {
    console.log(`✅ Fallback App Group directory exists`)
  }
  
  return fallbackPath
}

/**
 * Read all files from the App Group container
 * Returns list of files with metadata
 */
export const getSharedFiles = async (): Promise<SharedScreenshot[]> => {
  try {
    // Try native module first (iOS only)
    if (Platform.OS === 'ios' && AppGroupBridge) {
      console.log('📱 Using native App Group bridge to read files')
      
      try {
        const nativeFiles = await AppGroupBridge.listAppGroupFiles()
        console.log(`📁 Native bridge found ${nativeFiles.length} files`)
        
        const screenshots: SharedScreenshot[] = nativeFiles.map((file: any) => ({
          uri: file.path,
          filename: file.filename,
          size: file.size,
          modificationTime: file.modificationTime * 1000 // Convert to milliseconds
        }))
        
        return screenshots
        
      } catch (nativeError) {
        console.log('❌ Native bridge failed, falling back to file system:', nativeError)
      }
    }
    
    // Fallback to file system approach
    console.log('📁 Using file system fallback')
    const appGroupDir = await getAppGroupDirectory()
    console.log(`📁 Checking App Group directory: ${appGroupDir}`)
    
    const files = await FileSystem.readDirectoryAsync(appGroupDir)
    console.log(`Found ${files.length} files in App Group`)
    
    const screenshots: SharedScreenshot[] = []
    
    for (const filename of files) {
      // Only process image files
      if (filename.match(/\.(jpg|jpeg|png|heic)$/i)) {
        const filePath = appGroupDir + filename
        const fileInfo = await FileSystem.getInfoAsync(filePath)
        
        if (fileInfo.exists && !fileInfo.isDirectory) {
          screenshots.push({
            uri: filePath,
            filename,
            size: fileInfo.size || 0,
            modificationTime: fileInfo.modificationTime || 0
          })
        }
      }
    }
    
    // Sort by modification time (newest first)
    screenshots.sort((a, b) => b.modificationTime - a.modificationTime)
    
    return screenshots
    
  } catch (error) {
    console.error('Error reading App Group files:', error)
    return []
  }
}

/**
 * Get the most recent shared screenshot
 * This is the main function that will be called by AnalyzeScreen
 */
export const readSharedScreenshot = async (): Promise<SharedScreenshot | null> => {
  try {
    console.log('🔍 Looking for shared screenshot...')
    
    // Try native module first for better performance
    if (Platform.OS === 'ios' && AppGroupBridge) {
      try {
        console.log('📱 Using native bridge to get latest screenshot')
        const nativeFile = await AppGroupBridge.getLatestScreenshot()
        
        if (nativeFile) {
          console.log(`📱 Native bridge found latest screenshot: ${nativeFile.filename}`)
          return {
            uri: nativeFile.path,
            filename: nativeFile.filename,
            size: nativeFile.size,
            modificationTime: nativeFile.modificationTime * 1000 // Convert to milliseconds
          }
        } else {
          console.log('📱 Native bridge found no screenshots')
          return null
        }
        
      } catch (nativeError) {
        console.log('❌ Native bridge failed, falling back:', nativeError)
      }
    }
    
    // Fallback to file system approach
    const screenshots = await getSharedFiles()
    
    if (screenshots.length === 0) {
      console.log('No shared screenshots found')
      return null
    }
    
    const latestScreenshot = screenshots[0]
    console.log(`📱 Found latest screenshot: ${latestScreenshot.filename}`)
    
    return latestScreenshot
    
  } catch (error) {
    console.error('Error reading shared screenshot:', error)
    return null
  }
}

/**
 * Clean up old shared screenshots
 * Remove files older than the specified age (in hours)
 */
export const cleanupOldScreenshots = async (maxAgeHours: number = 24): Promise<number> => {
  try {
    const screenshots = await getSharedFiles()
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000)
    
    let deletedCount = 0
    
    for (const screenshot of screenshots) {
      if (screenshot.modificationTime < cutoffTime) {
        await FileSystem.deleteAsync(screenshot.uri)
        console.log(`🗑️ Deleted old screenshot: ${screenshot.filename}`)
        deletedCount++
      }
    }
    
    console.log(`Cleaned up ${deletedCount} old screenshots`)
    return deletedCount
    
  } catch (error) {
    console.error('Error cleaning up screenshots:', error)
    return 0
  }
}

/**
 * Clear old screenshots but keep the newest one (the one just shared)
 */
export const clearOldScreenshots = async (): Promise<void> => {
  try {
    console.log('🧹 Clearing old screenshots, keeping newest...')
    
    if (Platform.OS === 'ios' && AppGroupBridge) {
      try {
        const files = await AppGroupBridge.listAppGroupFiles()
        console.log(`🧹 Found ${files.length} total files`)
        
        if (files.length <= 1) {
          console.log('✅ Only one or no files found, no cleanup needed')
          return
        }
        
        // Sort by creation time (newest first)
        const sortedFiles = files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        const newestFile = sortedFiles[0]
        const oldFiles = sortedFiles.slice(1) // All except the newest
        
        console.log(`📱 Keeping newest: ${newestFile.filename}`)
        console.log(`🗑️ Deleting ${oldFiles.length} old files`)
        
        for (const file of oldFiles) {
          try {
            await AppGroupBridge.deleteFile(file.uri)
            console.log(`🗑️ Deleted old screenshot: ${file.filename}`)
          } catch (error) {
            // Skip permission errors silently - they're usually system files we can't delete
            if (error.message?.includes('permission') || error.message?.includes('System')) {
              console.log(`⚠️ Skipping system file: ${file.filename}`)
            } else {
              console.log(`⚠️ Failed to delete ${file.filename}:`, error.message)
            }
          }
        }
        
        console.log('✅ Old screenshots cleanup completed')
        return
      } catch (error) {
        console.log('❌ Native cleanup failed, using fallback:', error)
      }
    }
    
    // Fallback: use file system
    const screenshots = await getSharedFiles()
    if (screenshots.length <= 1) {
      console.log('✅ Only one or no files found, no cleanup needed')
      return
    }
    
    // Sort by creation time and keep newest
    const sortedScreenshots = screenshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const oldScreenshots = sortedScreenshots.slice(1)
    
    for (const screenshot of oldScreenshots) {
      try {
        await FileSystem.deleteAsync(screenshot.uri)
        console.log(`🗑️ Deleted old screenshot (fallback): ${screenshot.filename}`)
      } catch (error) {
        console.log(`⚠️ Failed to delete ${screenshot.filename}:`, error)
      }
    }
    
  } catch (error) {
    console.error('Error clearing old screenshots:', error)
  }
}

/**
 * Delete a specific shared screenshot after processing
 */
export const deleteSharedScreenshot = async (screenshot: SharedScreenshot): Promise<boolean> => {
  try {
    // Try native module first
    if (Platform.OS === 'ios' && AppGroupBridge) {
      try {
        await AppGroupBridge.deleteFile(screenshot.uri)
        console.log(`🗑️ Deleted processed screenshot via native bridge: ${screenshot.filename}`)
        return true
      } catch (nativeError) {
        console.log('❌ Native delete failed, falling back to file system:', nativeError.message)
        // Continue to fallback only if native delete failed
      }
    }
    
    // Fallback to file system (only if native delete failed or not available)
    try {
      await FileSystem.deleteAsync(screenshot.uri)
      console.log(`🗑️ Deleted processed screenshot via fallback: ${screenshot.filename}`)
      return true
    } catch (fallbackError) {
      // Check if file doesn't exist (which is actually success)
      if (fallbackError.message?.includes('does not exist')) {
        console.log(`✅ Screenshot already deleted: ${screenshot.filename}`)
        return true
      }
      throw fallbackError
    }
    
  } catch (error) {
    console.error('Error deleting screenshot:', error)
    return false
  }
}

/**
 * Create a test screenshot file for development/testing
 * This simulates what the Share Extension would do
 */
export const createTestScreenshot = async (): Promise<SharedScreenshot | null> => {
  try {
    const appGroupDir = await getAppGroupDirectory()
    const timestamp = Date.now()
    const filename = `screenshot_${timestamp}.txt` // Using .txt for testing
    const filePath = appGroupDir + filename
    
    // Create a test file with some content
    const testContent = `Test screenshot created at ${new Date().toISOString()}`
    await FileSystem.writeAsStringAsync(filePath, testContent)
    
    console.log(`📝 Created test screenshot: ${filename}`)
    
    return {
      uri: filePath,
      filename,
      size: testContent.length,
      modificationTime: timestamp
    }
    
  } catch (error) {
    console.error('Error creating test screenshot:', error)
    return null
  }
}

/**
 * Get App Group container info for debugging
 */
export const getAppGroupInfo = async () => {
  try {
    const appGroupDir = await getAppGroupDirectory()
    const dirInfo = await FileSystem.getInfoAsync(appGroupDir)
    const files = await getSharedFiles()
    
    return {
      path: appGroupDir,
      exists: dirInfo.exists,
      isDirectory: dirInfo.isDirectory,
      fileCount: files.length,
      files: files.map(f => ({
        name: f.filename,
        size: f.size,
        modified: new Date(f.modificationTime).toISOString()
      }))
    }
    
  } catch (error) {
    console.error('Error getting App Group info:', error)
    return null
  }
}
