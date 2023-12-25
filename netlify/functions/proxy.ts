import corsProxy from "@isomorphic-git/cors-proxy"
import express from "express"
import serverless from "serverless-http"

const app = express()

app.use(corsProxy)

export const handler = serverless(app)
