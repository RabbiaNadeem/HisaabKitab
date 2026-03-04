import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAiParse, useAiParseTest } from '@/hooks/useAiParse'
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react'

export function ApiTestPanel() {
  const [testInput, setTestInput] = useState('Spent $25 on groceries yesterday')
  
  const testConnection = useAiParseTest()
  const parseTransaction = useAiParse()

  const handleTestConnection = () => {
    testConnection.mutate()
  }

  const handleParseTest = () => {
    if (testInput.trim()) {
      parseTransaction.mutate(testInput)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Parse API Test
          </CardTitle>
          <CardDescription>
            Test the connection to OpenRouter API and verify transaction parsing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connection Test */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-2">1. Test API Connection</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Verify that the OPENROUTER_API_KEY is configured correctly in Supabase secrets
              </p>
            </div>
            
            <Button 
              onClick={handleTestConnection}
              disabled={testConnection.isPending}
              className="w-full"
            >
              {testConnection.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>

            {testConnection.data && (
              <Alert className={testConnection.data.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-start gap-2">
                  {testConnection.data.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      <p className="font-medium">{testConnection.data.message}</p>
                      {testConnection.data.model && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          Model: {testConnection.data.model}
                        </p>
                      )}
                      {testConnection.data.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          Tested at: {new Date(testConnection.data.timestamp).toLocaleString()}
                        </p>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {testConnection.error && (
              <Alert className="border-red-500">
                <XCircle className="h-5 w-5 text-red-500" />
                <AlertDescription>
                  Connection failed: {testConnection.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="border-t pt-6" />

          {/* Parse Test */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-2">2. Test Transaction Parsing</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Enter a natural language transaction to test the AI parsing
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-input">Transaction Text</Label>
              <Input
                id="test-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="e.g., Paid 50 dollars for groceries"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !parseTransaction.isPending) {
                    handleParseTest()
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleParseTest}
              disabled={parseTransaction.isPending || !testInput.trim()}
              className="w-full"
              variant="secondary"
            >
              {parseTransaction.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Parse Transaction
                </>
              )}
            </Button>

            {parseTransaction.data && (
              <Alert className="border-green-500">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <AlertDescription>
                  <p className="font-medium mb-2">Parsed Successfully:</p>
                  <div className="text-sm space-y-1 font-mono bg-muted p-3 rounded">
                    <div><span className="text-muted-foreground">Amount:</span> {parseTransaction.data.amount}</div>
                    <div><span className="text-muted-foreground">Type:</span> {parseTransaction.data.type}</div>
                    <div><span className="text-muted-foreground">Category:</span> {parseTransaction.data.category}</div>
                    <div><span className="text-muted-foreground">Date:</span> {parseTransaction.data.date}</div>
                    <div><span className="text-muted-foreground">Description:</span> {parseTransaction.data.description}</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {parseTransaction.error && (
              <Alert className="border-red-500">
                <XCircle className="h-5 w-5 text-red-500" />
                <AlertDescription>
                  Parse failed: {parseTransaction.error.message}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Quick Test Examples */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Spent $45 on dinner last night',
                'Got $2000 salary today',
                'Paid 150 for electricity bill',
                'Coffee 5 dollars this morning'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setTestInput(example)}
                  className="text-xs bg-background border rounded px-2 py-1 hover:bg-accent transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
