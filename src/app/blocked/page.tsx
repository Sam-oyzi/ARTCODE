"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldX, 
  Phone, 
  Mail, 
  MessageCircle, 
  AlertTriangle,
  Home
} from "lucide-react";
import Link from "next/link";

export default function BlockedPage() {
  const handleWhatsApp = () => {
    window.open(`https://wa.me/0708061209?text=Hello, my account has been blocked. Please assist me.`, '_blank');
  };

  const handleEmail = () => {
    window.open(`mailto:we.ardesign3d@gmail.com?subject=Account Blocked - Support Request&body=Hello,%0D%0A%0D%0AMy account has been blocked. Please assist me with this issue.%0D%0A%0D%0AThank you.`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-red-200">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-red-100 p-4 rounded-full w-fit">
            <ShieldX className="h-12 w-12 text-red-600" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-red-800">Account Blocked</CardTitle>
            <Badge variant="destructive" className="flex items-center gap-1 w-fit mx-auto">
              <AlertTriangle className="h-3 w-3" />
              Access Denied
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              Your account has been temporarily blocked by an administrator.
            </p>
            <p className="text-sm text-gray-600">
              If you believe this is an error, please contact our support team for assistance.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-3">Contact Support</h3>
            </div>
            
            {/* WhatsApp Contact */}
            <Button
              onClick={handleWhatsApp}
              className="w-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp: 0708061209
            </Button>

            {/* Email Contact */}
            <Button
              onClick={handleEmail}
              variant="outline"
              className="w-full border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email: we.ardesign3d@gmail.com
            </Button>

            {/* Phone Contact */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <Phone className="h-4 w-4" />
              <span>Phone: 0708061209</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Return to Homepage
              </Link>
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 space-y-1">
            <p>Support Hours: Monday - Friday, 9AM - 6PM</p>
            <p>We typically respond within 24 hours</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 