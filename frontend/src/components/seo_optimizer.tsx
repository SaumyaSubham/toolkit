import { useState } from 'react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

export default function SEOOptimizer() {
  const [sourceText, setSourceText] = useState('')
  const [seoKeywords, setSEOKeywords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExtractKeywords = async () => {
    if (!sourceText) {
      setError('Please enter text to analyze.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post(`${BACKEND_URL}/extract_seo_keywords`, {
        text: sourceText,
      })

      setSEOKeywords(response.data.seo_keywords)
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(`Error: ${err.response.data.error}. ${err.response.data.details || ''}`)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">SEO Keyword Optimizer</CardTitle>
        <CardDescription>Extract SEO keywords from your text</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Enter your text here" 
          className="min-h-[200px] mb-4"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
        />
        {error && <p className="text-destructive mb-4">{error}</p>}
        {seoKeywords.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">SEO Keywords:</h3>
            <div className="flex flex-wrap gap-2">
              {seoKeywords.map((keyword, index) => (
                <Badge key={index} variant="secondary">{keyword}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleExtractKeywords} disabled={loading}>
          {loading ? 'Extracting...' : 'Extract SEO Keywords'}
        </Button>
      </CardFooter>
    </Card>
  )
}