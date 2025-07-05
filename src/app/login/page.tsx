'use client';

import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ArtCodeLogo from '@/assets/artcode_logo.png';

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  
  // SVG for Google icon
  const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.05 1.05-2.36 1.95-4.25 1.95-3.37 0-6.13-2.7-6.13-6.1s2.76-6.1 6.13-6.1c1.65 0 3.18.62 4.34 1.73l2.5-2.5C18.43 1.9 15.79 1 12.48 1 7.23 1 3.06 4.9 3.06 10.12s4.17 9.12 9.42 9.12c2.82 0 4.9-1.02 6.5-2.52 1.6-1.5 2.22-3.72 2.22-5.77 0-.57-.05-1.12-.14-1.62H12.48z"
      />
    </svg>
  );

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);


  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Image src={ArtCodeLogo} alt="ART CODE Logo" className="h-12 w-12 object-contain" priority />
          </div>
          <CardTitle className="text-3xl text-primary">Welcome to ART CODE</CardTitle>
          <CardDescription>Sign in to begin creating your AR experiences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={signInWithGoogle} disabled={loading}>
            {loading ? (
              'Signing in...'
            ) : (
              <>
                <GoogleIcon className="mr-2 h-5 w-5" />
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
