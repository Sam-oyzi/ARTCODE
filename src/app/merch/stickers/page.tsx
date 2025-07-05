"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sticker, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StickersPage() {
    return (
        <div className="flex flex-1 items-center justify-center p-4">
             <Button asChild variant="ghost" className="absolute top-6 left-6">
                <Link href="/merch">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Merch
                </Link>
            </Button>
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit">
                        <Sticker className="h-12 w-12 text-accent" />
                    </div>
                </CardHeader>
                <CardContent>
                    <CardTitle className="text-2xl mb-2">Sticker Customization</CardTitle>
                    <CardDescription>
                       This feature is coming soon! Soon you'll be able to create and order custom stickers.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}
