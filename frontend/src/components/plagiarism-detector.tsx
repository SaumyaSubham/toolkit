import { useState, useEffect } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface PlagiarismResult {
  sentence: string
  url: string
  similarity: number
}

interface PlagiarismResponse {
  results: PlagiarismResult[]
  overall_similarity: number
  total_sentences: number
  matched_sentences: number
  message?: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function PlagiarismDetector() {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<PlagiarismResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)

  useEffect(() => {
    setCharCount(text.length)
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length)
  }, [text])

  const handleCheck = async () => {
    setLoading(true)
    setError('')
    setResults(null)

    const formData = new FormData()
    if (text) formData.append('text', text)
    if (file) formData.append('file', file)

    try {
      const response = await axios.post<PlagiarismResponse>(
        `${BACKEND_URL}/check_plagiarism`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setResults(response.data)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(`Error: ${err.response.data.error || 'An unknown error occurred'}`)
      } else {
        setError('An error occurred while checking for plagiarism.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card text-card-foreground">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Plagiarism Detector</CardTitle>
        <CardDescription>Check your text or file for plagiarism</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Enter your text here" 
          className="min-h-[200px] mb-2 bg-background text-foreground"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="text-sm text-muted-foreground mb-4">
          Words: {wordCount} | Characters: {charCount}
        </div>
        <div className="mb-4">
          <p className="mb-2">Or upload a file:</p>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              variant="outline"
              className="w-32 border-black dark:border-white"
            >
              Choose File
            </Button>
            <Input 
              id="file-upload"
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".txt,.pdf,.docx"
              className="hidden"
            />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : 'No file chosen'}
            </span>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {results && (
          <div className="mt-4">
            {results.message ? (
              <Alert>
                <AlertTitle>Result</AlertTitle>
                <AlertDescription>{results.message}</AlertDescription>
              </Alert>
            ) : (
              <>
                <p className="font-semibold">Overall Similarity: {(results.overall_similarity * 100).toFixed(2)}%</p>
                <p>Matched Sentences: {results.matched_sentences} / {results.total_sentences}</p>
                {results.results && results.results.length > 0 ? (
                  results.results.map((result, index) => (
                    <div key={index} className="mt-2 p-2 bg-muted rounded">
                      <p>Sentence: {result.sentence}</p>
                      <p>Similarity: {(result.similarity * 100).toFixed(2)}%</p>
                      <p>Source: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{result.url}</a></p>
                    </div>
                  ))
                ) : (
                  <p>No matching results found.</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleCheck} disabled={loading} className="w-full">
          {loading ? 'Checking...' : 'Check for Plagiarism'}
        </Button>
      </CardFooter>
    </Card>
  )
}