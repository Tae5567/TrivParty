import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/create" className="block">
            <Button variant="outline" className="w-full">
              Create Quiz
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}