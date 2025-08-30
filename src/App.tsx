import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Provider } from 'jotai'
import { AIExpandableSearch } from './components/AIExpandableSearch'
import { ErrorBoundary } from './components/ErrorBoundary'

function AppContent() {
    const [isInstallable, setIsInstallable] = useState(false)
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            setIsInstallable(false)
        }

        setDeferredPrompt(null)
    }

    return (
        <div className="w-full h-screen min-h-screen flex flex-col m-0 p-0">
            <main className="flex-1 flex flex-col w-full h-full m-0 p-4 box-border overflow-hidden md:p-2 sm:p-1">
                <Routes>
                    <Route path="/" element={<AIExpandableSearch />} />
                    <Route path="/q/:queryId" element={<AIExpandableSearch />} />
                </Routes>

                {/* Show install button if installable */}
                {isInstallable && (
                    <button
                        className="fixed bottom-5 right-5 bg-green-500 text-white border-none px-6 py-3 rounded-lg text-base cursor-pointer shadow-lg z-[1000] transition-all duration-200 hover:bg-green-600 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 md:bottom-4 md:right-4 md:px-5 md:py-2.5 md:text-sm sm:bottom-2.5 sm:right-2.5 sm:px-4 sm:py-2 sm:text-xs min-h-[44px] min-w-[44px]"
                        onClick={handleInstallClick}
                    >
                        Install App
                    </button>
                )}
            </main>
        </div>
    )
}

export default function App() {
    return (
        <Provider>
            <Router>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </Router>
        </Provider>
    )
}
