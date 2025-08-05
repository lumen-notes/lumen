// Worker - Runs all heavy operations in a separate thread
// This prevents blocking the main UI thread

import {
  gitClone,
  gitPull,
  gitPush,
  gitCommit,
  gitAdd,
  gitRemove,
  isRepoSynced,
} from "../utils/git"
import type {
  WorkerRequest,
  WorkerResponse,
  GitCloneRequest,
  GitPullRequest,
  GitPushRequest,
  GitCommitRequest,
  GitAddRequest,
  GitRemoveRequest
} from "./worker-types"

// Helper function to send success response
function sendSuccess(id: string, result?: unknown) {
  const response: WorkerResponse = {
    id,
    type: 'success',
    payload: result || {}
  }
  
  self.postMessage(response)
}

// Helper function to send error response
function sendError(id: string, error: Error | string) {
  const response: WorkerResponse = {
    id,
    type: 'error',
    payload: { error: error instanceof Error ? error.message : error }
  }
  
  self.postMessage(response)
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data

  try {
    if (request.category === 'git') {
      switch (request.type) {
        case 'clone': {
          const payload = request.payload as GitCloneRequest
          await gitClone(payload.repo, payload.user)
          sendSuccess(request.id)
          break
        }
        
        case 'pull': {
          const payload = request.payload as GitPullRequest
          await gitPull(payload.user)
          sendSuccess(request.id)
          break
        }
        
        case 'push': {
          const payload = request.payload as GitPushRequest
          await gitPush(payload.user)
          sendSuccess(request.id)
          break
        }
        
        case 'commit': {
          const payload = request.payload as GitCommitRequest
          await gitCommit(payload.message)
          sendSuccess(request.id)
          break
        }
        
        case 'add': {
          const payload = request.payload as GitAddRequest
          await gitAdd(payload.filePaths)
          sendSuccess(request.id)
          break
        }
        
        case 'remove': {
          const payload = request.payload as GitRemoveRequest
          await gitRemove(payload.filePath)
          sendSuccess(request.id)
          break
        }
        
        case 'status': {
          const isSynced = await isRepoSynced()
          sendSuccess(request.id, { isSynced })
          break
        }
        
        default:
          sendError(request.id, `Unknown git operation: ${request.type}`)
      }
    } else {
      sendError(request.id, `Unknown category: ${request.category}`)
    }
  } catch (error) {
    console.error('Worker error:', error)
    sendError(request.id, error instanceof Error ? error : String(error))
  }
}
