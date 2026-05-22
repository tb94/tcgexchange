import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { CardSizeProvider } from './cardSize.jsx'
import { GridColsProvider } from './gridCols.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CardSizeProvider>
      <GridColsProvider>
        <App />
      </GridColsProvider>
    </CardSizeProvider>
  </StrictMode>,
)
