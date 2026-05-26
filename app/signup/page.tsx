import { redirect } from 'next/navigation';

// /signup is an alias for /login. The actual signup form lives inside
// LoginClient as a tab. Sitemap and external links point here for memorability.
export default function SignupPage(): never {
  redirect('/login');
}
