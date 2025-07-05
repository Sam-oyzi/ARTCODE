
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useModelContext } from "@/context/model-context";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
// Removed FormDescription import - not needed for simple text display

// Import background image
import Background from "@/assets/background.png";

const TSHIRT_COLORS: { [key: string]: string } = {
  black: "bg-gray-900",
  white: "bg-gray-100",
  navy: "bg-blue-900",
  gray: "bg-gray-400",
  teal: "bg-teal-500",
};

const FONT_COLORS: { [key: string]: string } = {
  black: "text-white",
  white: "text-black",
  navy: "text-white",
  gray: "text-black",
  teal: "text-white",
};

export function TshirtCustomizer() {
  const { qrCodes, qrCodeAssignments } = useModelContext();
  const { toast } = useToast();
  
  const userQrCode = qrCodes.length > 0 ? qrCodes[0] : null;
  const qrCodeId = userQrCode?.id;
  const assignedModel = qrCodeId ? qrCodeAssignments[qrCodeId] : "No model assigned";

  const [color, setColor] = useState("black");
  const [size, setSize] = useState("L");
  const [quote, setQuote] = useState("Your Quote Here");

  const handleAddToCart = () => {
    if (!qrCodeId) {
        toast({
            title: "QR Code Required",
            description: "No QR code found for your account.",
            variant: "destructive",
        });
        return;
    }

    toast({
        title: "Added to Cart!",
        description: `A ${size}, ${color} T-shirt linked to ${qrCodeId} has been added.`,
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Design Preview</CardTitle>
          </CardHeader>
          <CardContent className="aspect-square flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
            {/* Background */}
            <Image
              src={Background}
              alt="Background"
              fill
              className="object-cover opacity-10"
            />
            
            {/* T-shirt mockup */}
            <div
              className={cn(
                "w-full max-w-md aspect-[4/5] rounded-lg transition-colors duration-300 flex flex-col items-center justify-center relative shadow-lg z-10",
                TSHIRT_COLORS[color]
              )}
            >
              <div
                className={cn(
                  "absolute text-center transition-colors duration-300",
                  FONT_COLORS[color]
                )}
                style={{ top: "20%" }}
              >
                <p
                  className="font-semibold text-2xl break-words px-8"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {quote}
                </p>
              </div>

              <div className="absolute" style={{ top: "45%" }}>
                <div className="w-32 h-32 bg-white rounded-md p-2 border-2 border-gray-200">
                  <div className="w-full h-full bg-gray-900 rounded flex items-center justify-center">
                    <div className="text-white text-xs font-mono">QR CODE</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Customize Your T-Shirt</CardTitle>
            <CardDescription>
              Changes will be reflected in the preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select onValueChange={setColor} defaultValue={color}>
                <SelectTrigger id="color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(TSHIRT_COLORS).map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Select onValueChange={setSize} defaultValue={size}>
                <SelectTrigger id="size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quote">Custom Quote</Label>
              <Input
                id="quote"
                placeholder="Your custom quote"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label>Your Unique QR Code</Label>
                <Card className="bg-muted/50 p-3">
                  <p className="font-mono text-sm font-semibold">{userQrCode?.id || "N/A"}</p>
                  <p className="text-xs text-muted-foreground">Linked to: {assignedModel}</p>
                </Card>
              <p className="text-sm text-muted-foreground">Your T-shirt will be permanently linked to this unique QR code.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleAddToCart} disabled={!userQrCode}>
                <ShoppingCart className="mr-2" />
                Add to Cart - $29.99
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
