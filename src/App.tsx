import './App.css'
import { ModeToggle } from 'valkoma-package/design-system'
import { ThemeProvider } from 'valkoma-package/hooks'
import ValkomaMarkdown from './components/valkoma-markdown'

function App() {

  return (
    <ThemeProvider showLoader={true}>
      <ValkomaMarkdown />
      <div className="fixed bottom-4 right-4 z-50">
        <ModeToggle />
      </div>
    </ThemeProvider>
  )
}

export default App
