import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Loader from './components/Loader'
import HomeButtons, { type Tool } from './components/HomeButtons'
import Workspace from './components/Workspace'
import UpdateBanner from './components/UpdateBanner'

type View =
  | { screen: 'loading' }
  | { screen: 'home' }
  | { screen: 'tool'; tool: Tool }

export default function App() {
  const [view, setView] = useState<View>({ screen: 'loading' })

  return (
    <div style={{ height: '100%' }}>
      <UpdateBanner />
      <AnimatePresence mode="wait">
        <motion.div
          key={view.screen === 'tool' ? `tool-${view.tool}` : view.screen}
          style={{ height: '100%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {view.screen === 'loading' && <Loader onDone={() => setView({ screen: 'home' })} />}
          {view.screen === 'home' && <HomeButtons onPick={(tool) => setView({ screen: 'tool', tool })} />}
          {view.screen === 'tool' && <Workspace tool={view.tool} onBack={() => setView({ screen: 'home' })} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
