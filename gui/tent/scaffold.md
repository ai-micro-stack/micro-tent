1. Create "micro-tent" backend scaffold

```
# Pick Option: React, TypeScript
yarn create vite micro-tent
```

2. Setup alias (Option 1)

Manual config solution. Use option 2 in case of not working.

```sh
yarn add path
```

vite.config.js

```
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
      alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

tsconfig.app.json

```
{
  "compilerOptions": {
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  }
}
```

3. Setup alias (Option 2)

Auto config package. The alternative of option 1.

```sh
yarn add -D vite-tsconfig-paths
```

vite.config.js

```
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
});
```

tsconfig.app.json

```
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

4. React Router

```sh
yarn add react-router
yarn add react-router-dom
```

main.tsx

```
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router";
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

5. Bootstrap UI library

```
yarn add bootstrap
yarn add react-bootstrap
```

6. Other dependencies

```sh
yarn add ts-md5 axios
yarn add @xterm/xterm @xterm/addon-fit @xterm/addon-serialize
yarn add socket.io-client
yarn add @tanstack/react-table
yarn add styled-components
```
