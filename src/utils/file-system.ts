export async function readFile(
  rootHandle: FileSystemDirectoryHandle,
  path: string,
  options?: { create: boolean },
): Promise<File> {
  // '/uploads/123.jpg' -> ['uploads', '123.jpg']
  const pathArray = path.split("/").filter(Boolean)

  const fileHandle = await getFileHandle(rootHandle, pathArray, options)

  return await fileHandle.getFile()
}

export async function writeFile(
  rootHandle: FileSystemDirectoryHandle,
  path: string,
  data: FileSystemWriteChunkType,
  options?: { create: boolean },
) {
  // '/uploads/123.jpg' -> ['uploads', '123.jpg']
  const pathArray = path.split("/").filter(Boolean)

  const fileHandle = await getFileHandle(rootHandle, pathArray, options)

  // Create a stream to write to
  const writeableStream = await fileHandle.createWritable()

  // Write the contents of the file
  await writeableStream.write(data)

  // Close the stream
  await writeableStream.close()
}

async function getFileHandle(
  rootHandle: FileSystemDirectoryHandle,
  path: string[],
  options?: { create: boolean },
): Promise<FileSystemFileHandle> {
  if (path.length === 1) {
    return await rootHandle.getFileHandle(path[0], options)
  }

  const directoryHandle = await rootHandle.getDirectoryHandle(path[0], options)
  return await getFileHandle(directoryHandle, path.slice(1), options)
}
