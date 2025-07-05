"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, PlusCircle, ScanLine, Box } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { useModelContext } from '@/context/model-context';

const qrCodeScans: Record<string, number> = {
  'QR-A4B1C2': 250,
  'QR-D3E4F5': 120,
  'QR-G6H7I8': 58,
};

export default function QRCodesPage() {
  const { qrCodes, qrCodeAssignments } = useModelContext();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-lg md:text-2xl">QR Codes</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Generate New QR Code
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map((qr) => (
          <Card key={qr.id}>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle>{qr.id}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Box className="h-4 w-4" />
                  {qrCodeAssignments[qr.id]}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Download</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex justify-center items-center p-6">
              <Image
                src="https://placehold.co/150x150.png"
                alt={`QR Code for ${qrCodeAssignments[qr.id]}`}
                width={150}
                height={150}
                className="rounded-lg"
                data-ai-hint="qr code"
              />
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground flex items-center gap-2">
              <ScanLine className="h-4 w-4" />
              <span>{qrCodeScans[qr.id] ?? 0} scans</span>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
