import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Only the admin area needs a server-side session check. Running it on every
  // storefront request called Supabase Auth on each page view and hit its rate
  // limit (429). Storefront admin edits verify the session inside the server action.
  matcher: ['/admin/:path*'],
}
