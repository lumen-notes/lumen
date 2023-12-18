import { REPO_DIR } from "../global-state"
import LightningFS from "@isomorphic-git/lightning-fs"

export async function logFileSystemState(fs: LightningFS, dir = REPO_DIR) {
  try {
    // List files and directories at the specified path
    const files = await fs.promises.readdir(dir)

    console.log(`Contents of ${dir}:`, files)

    // Iterate over each file/directory
    for (const file of files) {
      // Ensure there is a slash between the directory and file names
      const filePath = `${dir}/${file}`

      const stats = await fs.promises.stat(filePath)
      if (stats.isDirectory()) {
        // If directory, recursively log its contents
        await logFileSystemState(fs, `${filePath}/`)
      } else {
        // If file, read and log its contents
        const content = await fs.promises.readFile(filePath, "utf8")
        console.log(`Contents of ${filePath}:`, content)
      }
    }
  } catch (error) {
    console.error("Error logging file system state:", error)
  }
}
