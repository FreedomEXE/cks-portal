/*───────────────────────────────────────────────
  Property of CKS  © 2025
  Manifested by Freedom
───────────────────────────────────────────────*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import TestHubRoles from './test-hub-roles'
import { CatalogProvider } from './shared/catalog/CatalogContext'
import CatalogViewer from './shared/catalog/CatalogViewer'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CatalogProvider>
      <TestHubRoles />
      <CatalogViewer />
    </CatalogProvider>
  </React.StrictMode>,
)
