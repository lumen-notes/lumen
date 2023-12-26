# Contributing

## Local development

1.  Clone the repository using your preferred method:

    ```shell
    # HTTPS
    git clone https://github.com/lumen-notes/lumen.git

    # SSH
    git clone git@github.com:lumen-notes/lumen.git

    # GitHub CLI
    gh repo clone lumen-notes/lumen
    ```

1.  Generate a GitHub [personal access token (classic)](https://github.com/settings/tokens/new) with `repo`, `gist`, and `user:email` scopes, then add it to a `.env.local` file in the root directory:

    ```shell
    VITE_GITHUB_PAT=<your token here>
    ```

1.  Install the dependencies:

    ```shell
    npm install
    ```

1.  Start the development server:

    ```shell
    npm run dev:netlify
    ```

1.  Open the app at http://localhost:8888


## Architecture

### GitHub sync

```mermaid
graph
    subgraph local[Local machine]
      subgraph app.uselumen.com
        state-machine([state machine])
        isomorphic-git([isomorphic-git])
        lightning-fs([lightning-fs])
      end

      indexeddb[(IndexedDB)]
    end

    subgraph edge[Netlify Edge Functions]
      /cors-proxy
    end

    github.com

    state-machine <--> isomorphic-git
    state-machine <--> lightning-fs
    isomorphic-git <--> lightning-fs
    isomorphic-git <--> /cors-proxy
    /cors-proxy <--> github.com
    lightning-fs <--> indexeddb
```
