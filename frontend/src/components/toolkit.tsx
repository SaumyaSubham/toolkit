'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlagiarismDetector from './plagiarism-detector'
import FileComparer from './filecomparer'
import SEOOptimizer from './seo_optimizer'

export default function Toolkit() {
  const [darkMode, setDarkMode] = useState(false)
  const [activeTab, setActiveTab] = useState('plagiarism')

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const toggleDarkMode = () => setDarkMode(!darkMode)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card shadow-md">
        <nav className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-semibold">Toolkit</div>
            <div className="flex items-center space-x-2">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
              <Moon className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="plagiarism" className="text-xs sm:text-sm">Plagiarism Detector</TabsTrigger>
            <TabsTrigger value="compare" className="text-xs sm:text-sm">Compare Files</TabsTrigger>
            <TabsTrigger value="seo" className="text-xs sm:text-sm">SEO Optimizer</TabsTrigger>
          </TabsList>
          <TabsContent value="plagiarism">
            <PlagiarismDetector />
          </TabsContent>
          <TabsContent value="compare">
            <FileComparer />
          </TabsContent>
          <TabsContent value="seo">
            <SEOOptimizer />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}