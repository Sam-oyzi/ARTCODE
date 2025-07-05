
"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from 'next/dynamic';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { Plus, View, Check, ArrowLeft, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useModelContext } from "@/context/model-context";
import { GoogleDriveService } from "@/lib/googleDriveService";
import { useAuth } from "@/context/auth-context";

const ModelViewer = dynamic(() => import('@/components/model-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full aspect-square" />
});

interface ProfileModel {
  id: string;
  name: string;
  originalName: string;
  modelSrc: string;
  description: string;
  imageUrl?: string;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { qrCodes, qrCodeAssignments, assignModelToQr } = useModelContext();
  const userQrCode = qrCodes.length > 0 ? qrCodes[0] : null;

  const [models, setModels] = useState<ProfileModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const modelViewerRefs = useRef<any[]>([]);

  // Load models from Google Drive when component mounts or user changes
  useEffect(() => {
    loadModels();
  }, [user]);

  const loadModels = async () => {
    try {
      setLoading(true);
      
      // Default free models (always available)
      const defaultModels: ProfileModel[] = [
        {
          id: 'model-astronaut',
          name: 'Oscar the Astronaut',
          originalName: 'Oscar the Astronaut',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
          description: 'A detailed model of an astronaut in a spacesuit.',
          imageUrl: 'https://placehold.co/300x200.png'
        },
        {
          id: 'model-knight',
          name: 'Valiant Knight',
          originalName: 'Valiant Knight',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
          description: 'A model of a knight in armor riding a horse.',
          imageUrl: 'https://placehold.co/300x200.png'
        },
        {
          id: 'model-drone',
          name: 'Sci-Fi Drone',
          originalName: 'Sci-Fi Drone',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
          description: 'A high-poly drone with intricate details.',
          imageUrl: 'https://placehold.co/300x200.png'
        }
      ];
      
      // Only load Google Drive models if user is logged in
      let googleDriveModels: ProfileModel[] = [];
      
      if (user?.email) {
        console.log('🔍 Loading user 3D models for profile page:', user.email);
        
        // Load Google Drive models
        const { objects } = await GoogleDriveService.scanRealGoogleDriveFolder('all-users', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY!, 'USER_3DOBJECT');
        
        // Filter models to only include those belonging to the current user
        const userObjects = objects.filter(obj => {
          // Extract username from filename (e.g., "Hero_catenary_bim_designer.glb")
          const fileName = obj.name;
          const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, ''); // Remove only the final extension
          
          // Try to find the user identifier by looking for common email username patterns
          const parts = fileNameWithoutExt.split('_');
          
          if (parts.length >= 2) {
            // Try different combinations starting from the end
            for (let i = 1; i < parts.length; i++) {
              const potentialUserIdentifier = parts.slice(i).join('_');
              
              // Check if it looks like a user identifier (reasonable length)
              if (potentialUserIdentifier.length > 5) {
                let emailUser;
                
                // Case 1: Already has dots (e.g., "catenary.bim.designer")
                if (potentialUserIdentifier.includes('.')) {
                  emailUser = potentialUserIdentifier;
                }
                // Case 2: Has underscores to convert (e.g., "catenary_bim_designer")
                else if (potentialUserIdentifier.includes('_')) {
                  emailUser = potentialUserIdentifier.replace(/_/g, '.');
                }
                // Case 3: Simple username without dots or underscores
                else {
                  emailUser = potentialUserIdentifier;
                }
                
                // Basic validation: should look like an email username
                if ((emailUser.includes('.') && emailUser.length > 5) || emailUser.length > 3) {
                  const userEmail = `${emailUser}@gmail.com`;
                  // Check if this model belongs to the current user
                  return userEmail === user.email;
                }
              }
            }
          }
          
          return false; // Model doesn't belong to current user
        });
        
        // Convert filtered Google Drive models to ProfileModel format
        googleDriveModels = userObjects.map(obj => ({
          id: obj.id,
          name: obj.originalName || obj.name,
          originalName: obj.originalName || obj.name,
          modelSrc: obj.downloadUrl,
          description: `Custom 3D Model: ${obj.originalName || obj.name}`,
          imageUrl: obj.imageUrl
        }));
        
        console.log(`✅ Loaded ${googleDriveModels.length} user models for profile page`);
      }

      // Combine default models with user's Google Drive models
      const allModels = [...defaultModels, ...googleDriveModels];
      setModels(allModels);
      
    } catch (error) {
      console.error('❌ Error loading models for profile:', error);
      // Fallback to just default models on error
      const defaultModels: ProfileModel[] = [
        {
          id: 'model-astronaut',
          name: 'Oscar the Astronaut',
          originalName: 'Oscar the Astronaut',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
          description: 'A detailed model of an astronaut in a spacesuit.',
          imageUrl: 'https://placehold.co/300x200.png'
        },
        {
          id: 'model-knight',
          name: 'Valiant Knight',
          originalName: 'Valiant Knight',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
          description: 'A model of a knight in armor riding a horse.',
          imageUrl: 'https://placehold.co/300x200.png'
        },
        {
          id: 'model-drone',
          name: 'Sci-Fi Drone',
          originalName: 'Sci-Fi Drone',
          modelSrc: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
          description: 'A high-poly drone with intricate details.',
          imageUrl: 'https://placehold.co/300x200.png'
        }
      ];
      setModels(defaultModels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrentModelIndex(api.selectedScrollSnap());
    };
    api.on("select", onSelect);
    onSelect();
    return () => api.off("select", onSelect);
  }, [api]);

  const handleApply = async () => {
    if (!userQrCode) {
      toast({
        title: "Error",
        description: "No QR code found for this user.",
        variant: "destructive",
      });
      return;
    }
    const modelToAssign = models[currentModelIndex];
    
    try {
      await assignModelToQr(userQrCode.id, modelToAssign.name);
      toast({
        title: "Success!",
        description: `Model "${modelToAssign.name}" assigned to your QR code.`,
      });
    } catch (error) {
      console.error('Error assigning model:', error);
      toast({
        title: "Error",
        description: "Failed to assign model. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleArClick = () => {
    const modelViewer = modelViewerRefs.current[currentModelIndex];
    if (modelViewer) {
      modelViewer.activateAR();
    }
  };

  const isCurrentlyApplied = userQrCode ? qrCodeAssignments[userQrCode.id] === models[currentModelIndex]?.name : false;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading your 3D models...</span>
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">No Models Found</h3>
          <p className="text-gray-600 mb-4">
            You have access to default models, but no custom models yet.
          </p>
          <Button onClick={loadModels}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="profile-theme w-full max-w-sm">
        <Card className="rounded-3xl border-none shadow-2xl text-foreground bg-background overflow-hidden relative">
          <Button asChild variant="ghost" size="icon" className="absolute top-4 left-4 md:hidden z-10 bg-foreground/10 hover:bg-foreground/20 backdrop-blur-sm">
            <Link href={user ? "/dashboard" : "/"}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{user ? "Back to Dashboard" : "Back to Home"}</span>
            </Link>
          </Button>
          <CardContent className="p-4 flex flex-col items-center">
            
            <div className="text-center my-4">
                <h2 className="text-xl font-bold tracking-wider">{models[currentModelIndex]?.name || 'Loading...'}</h2>
                <p className="text-sm opacity-75">My 3D Models</p>
            </div>
            
            <Carousel setApi={setApi} className="w-full" opts={{ watchDrag: false }}>
              <CarouselContent>
                {models.map((model, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square w-full h-full">
                      <ModelViewer
                        ref={(el) => (modelViewerRefs.current[index] = el)}
                        src={model.modelSrc}
                        alt={model.description}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-foreground/20 hover:bg-foreground/30 border-none text-background" />
              <CarouselNext className="right-2 bg-foreground/20 hover:bg-foreground/30 border-none text-background" />
            </Carousel>

            <footer className="flex flex-col items-center gap-4 mt-4 w-full">
              <Button onClick={handleArClick} className="rounded-full px-6 bg-foreground/20 hover:bg-foreground/30 border-none text-foreground">
                  <View className="mr-2 h-4 w-4" />
                  View in AR
              </Button>

              {userQrCode && (
                <div className="w-full max-w-xs text-center py-2 border-b border-foreground/50">
                   <p className="text-sm text-foreground/80">Your QR Code:</p>
                   <p className="font-semibold">{userQrCode.id}</p>
                </div>
              )}

              <Button
                onClick={handleApply}
                disabled={!userQrCode}
                className={cn(
                  "rounded-full w-16 h-16 mt-4 transition-colors",
                  isCurrentlyApplied && "bg-green-500 hover:bg-green-600 text-white"
                )}
              >
                {isCurrentlyApplied ? <Check size={32} /> : <Plus size={32} />}
              </Button>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
