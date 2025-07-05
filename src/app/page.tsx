import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, QrCode, Shirt, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const features = [
  {
    icon: Cpu,
    title: 'AI-Powered Creation',
    description: 'Describe your vision, and our AI will refine it into a detailed 3D model request for our artists.',
  },
  {
    icon: QrCode,
    title: 'Instant AR Experience',
    description: 'Link your models to unique QR codes and view them instantly in your space, right from your phone.',
  },
  {
    icon: Shirt,
    title: 'Custom Merchandise',
    description: 'Order high-quality t-shirts and other apparel featuring your personal AR code.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Bring Your Ideas to Life with Augmented Reality
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  <span className="text-primary font-semibold">ART CODE</span> turns your descriptions into stunning 3D models and connects them to the real world through custom QR codes.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/login">Get Started for Free</Link>
                </Button>
              </div>
            </div>
            <Image
              src="https://placehold.co/600x600.png"
              width="600"
              height="600"
              alt="Hero"
              className="mx-auto aspect-square overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              data-ai-hint="augmented reality abstract"
            />
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                From a simple idea to a physical product with an AR experience. Our platform makes it easy.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader className="items-center">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                </CardHeader>
                <CardContent className="text-center">
                    <CardTitle className="mb-2 text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Ready to Create Your Own Reality?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Sign up today and get three free 3D models to start your collection.
            </p>
          </div>
          <div className="mx-auto w-full max-w-sm space-y-2">
             <Button asChild size="lg" className="w-full">
                <Link href="/login">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start Creating
                </Link>
             </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
