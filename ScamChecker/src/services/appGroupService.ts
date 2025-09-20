import * as FileSystem from 'expo-file-system'

// App Group configuration
const APP_GROUP_ID = 'group.com.yourapp.scamchecker'

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
 * Note: In a real iOS app with Share Extension, this would be the actual App Group path
 * For now, we'll use the document directory for testing
 */
const getAppGroupDirectory = async (): Promise<string> => {
  // In a real iOS implementation, this would be:
  // return FileSystem.documentDirectory + '../../../Shared/AppGroup/' + APP_GROUP_ID + '/'
  
  // For testing purposes, use a subdirectory in documents
  const appGroupPath = FileSystem.documentDirectory + 'AppGroup/'
  
  // Ensure the directory exists
  const dirInfo = await FileSystem.getInfoAsync(appGroupPath)
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(appGroupPath, { intermediates: true })
  }
  
  return appGroupPath
}

/**
 * Read all files from the App Group container
 * Returns list of files with metadata
 */
export const getSharedFiles = async (): Promise<SharedScreenshot[]> => {
  try {
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
 * Delete a specific shared screenshot after processing
 */
export const deleteSharedScreenshot = async (screenshot: SharedScreenshot): Promise<boolean> => {
  try {
    await FileSystem.deleteAsync(screenshot.uri)
    console.log(`🗑️ Deleted processed screenshot: ${screenshot.filename}`)
    return true
    
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
