import type {
  WorkerRequest,
  WorkerResponse,
  GitCloneRequest,
  GitPullRequest,
  GitPushRequest,
  GitCommitRequest,
  GitAddRequest,
  GitRemoveRequest,
  GitStatusRequest
} from './git-worker-types'

class WorkerClient {
  private worker: Worker | null = null
  private requestId = 0
  private pendingRequests = new Map<string, {
    resolve: (value: unknown) => void
    reject: (error: Error) => void
  }>()

  constructor() {
    this.initWorker()
  }

  private initWorker() {
    try {
      this.worker = new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
      )

      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { data } = event
        const pending = this.pendingRequests.get(data.id)
        
        if (!pending) {
          console.warn('Received response for unknown request ID:', data.id)
          return
        }

        this.pendingRequests.delete(data.id)

        if (data.type === 'error') {
          const errorPayload = data.payload as { error?: string }
          const errorMessage = errorPayload?.error || 'Unknown error'
          pending.reject(new Error(errorMessage))
        } else if (data.type === 'success') {
          pending.resolve(data.payload)
        }
      }

      this.worker.onerror = (error) => {
        console.error('Worker error:', error)
        for (const [id, pending] of this.pendingRequests) {
          pending.reject(new Error('Worker error'))
          this.pendingRequests.delete(id)
        }
      }
    } catch (error) {
      console.error('Failed to initialize worker:', error)
    }
  }

  private sendRequest<T>(category: 'git', type: string, payload: WorkerRequest['payload']): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'))
        return
      }

      const id = (++this.requestId).toString()
      const request: WorkerRequest = { id, category, type, payload }

      this.pendingRequests.set(id, { 
        resolve: resolve as (value: unknown) => void, 
        reject 
      })
      this.worker.postMessage(request)

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 30000)
    })
  }

  // Git operations
  git = {
    clone: (options: GitCloneRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'clone', options)
    },

    pull: (options: GitPullRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'pull', options)
    },

    push: (options: GitPushRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'push', options)
    },

    commit: (options: GitCommitRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'commit', options)
    },

    add: (options: GitAddRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'add', options)
    },

    remove: (options: GitRemoveRequest): Promise<void> => {
      return this.sendRequest<void>('git', 'remove', options)
    },

    status: (options: GitStatusRequest = {}): Promise<{ isSynced: boolean }> => {
      return this.sendRequest<{ isSynced: boolean }>('git', 'status', options)
    }
  }

  dispose() {
    if (this.worker) {
      for (const [id, pending] of this.pendingRequests) {
        pending.reject(new Error('Worker disposed'))
        this.pendingRequests.delete(id)
      }
      
      this.worker.terminate()
      this.worker = null
    }
  }
}

// Singleton 
export const worker = new WorkerClient()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    worker.dispose()
  })
}
