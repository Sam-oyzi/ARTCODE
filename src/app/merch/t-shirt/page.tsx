"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingCart, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useModelContext } from "@/context/model-context";

// Import T-shirt mockup images
import TShirt1 from '@/assets/TShirt_Mockups_ID1.png';
import TShirt2 from '@/assets/TShirt_Mockups_ID2.png';
import TShirt3 from '@/assets/TShirt_Mockups_ID3.png';
import TShirt4 from '@/assets/TShirt_Mockups_ID4.png';
import TShirt5 from '@/assets/TShirt_Mockups_ID5.png';
import TShirt6 from '@/assets/TShirt_Mockups_ID6.png';
import Background from '@/assets/background.png';

const tshirtImages = [
  { id: 1, image: TShirt1, name: "Classic AR Tee", color: "Carbon Black" },
  { id: 2, image: TShirt2, name: "QR Code Longsleeve", color: "Navy Blue" },
  { id: 3, image: TShirt3, name: "V-Neck AR", color: "Charcoal Gray" },
  { id: 4, image: TShirt4, name: "Minimalist QR", color: "Pure White" },
  { id: 5, image: TShirt5, name: "Retro AR Style", color: "Vintage Black" },
  { id: 6, image: TShirt6, name: "Premium QR Tee", color: "Deep Black" },
];

export default function TshirtProductPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();
  const { qrCodes } = useModelContext();
  
  const currentProduct = tshirtImages[currentIndex];
  const userQrCode = qrCodes.length > 0 ? qrCodes[0] : null;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % tshirtImages.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + tshirtImages.length) % tshirtImages.length);
  };

  const handleAddToCart = () => {
    if (!userQrCode) {
      toast({
        title: "QR Code Required",
        description: "No QR code found for your account.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Added to Cart!",
      description: `${currentProduct.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={Background}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 md:p-6">
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10">
            <Link href="/merch">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Merch
            </Link>
          </Button>
          <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
            NEW PRODUCT
          </Badge>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-center p-4 md:p-6 gap-8">
          {/* Product Image Section */}
          <div className="relative w-full max-w-2xl">
            {/* Main Product Image */}
            <div className="relative aspect-square mb-6">
              <Image
                src={currentProduct.image}
                alt={currentProduct.name}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
              
              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors backdrop-blur-sm"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors backdrop-blur-sm"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            <div className="flex justify-center gap-2 mb-6">
              {tshirtImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Product Info Section */}
          <div className="w-full max-w-md text-white">
            <div className="space-y-6">
              {/* Product Title */}
              <div>
                <h1 className="text-4xl md:text-6xl font-bold tracking-wider mb-2">
                  T-SHIRT
                </h1>
                <p className="text-xl md:text-2xl font-light tracking-wide opacity-90">
                  {currentProduct.color}
                </p>
              </div>

              {/* QR Code Info */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Your QR Code</h3>
                    <p className="text-sm opacity-90 font-mono">
                      {userQrCode?.id || "No QR code assigned"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded border-2 border-gray-200 flex items-center justify-center">
                    <div className="text-xs font-mono text-black">QR</div>
                  </div>
                </div>
              </div>

              {/* Product Description */}
              <div className="space-y-3">
                <p className="text-sm opacity-90 leading-relaxed">
                  Available in a timeless {currentProduct.color.toLowerCase()}, this
                  shirt is made from a high-quality cotton blend
                  to keep you comfortable.
                </p>
                
                {/* Barcode */}
                <div className="flex items-center gap-2 opacity-70">
                  <div className="flex gap-px">
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="w-0.5 h-6 bg-white" />
                    ))}
                  </div>
                                     <span className="text-xs font-mono text-primary">ART CODE™</span>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm opacity-90">4.9 (127 reviews)</span>
              </div>

              {/* Price and Add to Cart */}
              <div className="space-y-4">
                <div className="text-2xl font-bold">$29.99</div>
                <Button 
                  onClick={handleAddToCart}
                  className="w-full bg-white text-black hover:bg-gray-200 font-semibold py-6"
                  disabled={!userQrCode}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Product Counter */}
        <div className="text-center py-4 text-white/70">
          <p className="text-sm">
            {currentIndex + 1} of {tshirtImages.length} designs
          </p>
        </div>
      </div>
    </div>
  );
}
