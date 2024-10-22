import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ComparisonResult {
  similarity: number
  file1_name: string
  file2_name: string
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function FileComparer() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select two files to compare')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    const formData = new FormData()
    formData.append('file1', file1)
    formData.append('file2', file2)

    try {
      const response = await axios.post<ComparisonResult>(
        `${BACKEND_URL}/compare_files`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setResult(response.data)
    } catch (err) {
      setError('An error occurred while comparing files.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Compare the Files</CardTitle>
        <CardDescription>Upload two files to compare</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5 mb-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => document.getElementById('file1-upload')?.click()}
              variant="outline"
              className="w-32 border-black dark:border-white"
            >
              Choose File 1
            </Button>
            <Input 
              id="file1-upload"
              type="file" 
              onChange={(e) => setFile1(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="text-sm text-muted-foreground">
              {file1 ? file1.name : 'No file chosen'}
            </span>
          </div>
        </div>
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => document.getElementById('file2-upload')?.click()}
              variant="outline"
              className="w-32 border-black dark:border-white"
            >
              Choose File 2
            </Button>
            <Input 
              id="file2-upload"
              type="file"
              onChange={(e) => setFile2(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="text-sm text-muted-foreground">
              {file2 ? file2.name : 'No file chosen'}
            </span>
          </div>
        </div>
        {error && <p className="text-destructive mt-4">{error}</p>}
        {result && (
          <div className="mt-4">
            <p className="font-semibold">Similarity: {(result.similarity * 100).toFixed(2)}%</p>
            <p>File 1: {result.file1_name}</p>
            <p>File 2: {result.file2_name}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleCompare} disabled={loading}>
          {loading ? 'Comparing...' : 'Compare Files'}
        </Button>
      </CardFooter>
    </Card>
  )
}