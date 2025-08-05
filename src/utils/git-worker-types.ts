// Types for communication between main thread and worker

export interface WorkerRequest {
  id: string
  category: 'git'
  type: string
  payload: GitCloneRequest | GitPullRequest | GitPushRequest | GitCommitRequest | GitAddRequest | GitRemoveRequest | GitStatusRequest
}

export interface WorkerResponse {
  id: string
  type: 'success' | 'error'
  payload: unknown
}

export interface GitCloneRequest {
  repo: {
    owner: string
    name: string
  }
  user: {
    login: string
    name: string
    email: string
    token: string
  }
}

export interface GitPullRequest {
  user: {
    login: string
    name: string
    email: string
    token: string
  }
}

export interface GitPushRequest {
  user: {
    login: string
    name: string
    email: string
    token: string
  }
}

export interface GitCommitRequest {
  message: string
}

export interface GitAddRequest {
  filePaths: string[]
}

export interface GitRemoveRequest {
  filePath: string
}

export interface GitStatusRequest {
}
