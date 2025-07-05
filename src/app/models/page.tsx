
"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, PlusCircle, CheckCircle, Clock, Eye, Check, RefreshCw, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useModelContext, type Model } from '@/context/model-context';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { GoogleDriveService } from '@/lib/googleDriveService';
import { useAuth } from '@/context/auth-context';


const ModelViewer = dynamic(() => import('@/components/model-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full aspect-square bg-muted/50" />
});

interface ExtendedModel extends Model {
  username?: string;
  userEmail?: string;
}

export default function ModelsPage() {
  const { qrCodes, qrCodeAssignments, assignModelToQr } = useModelContext();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState<ExtendedModel | null>(null);
  const [detailsModel, setDetailsModel] = useState<ExtendedModel | null>(null);
  const [allModels, setAllModels] = useState<ExtendedModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<ExtendedModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingGoogleDriveModels, setLoadingGoogleDriveModels] = useState(false);
  const { toast } = useToast();

  // Default free models available to all users
  const defaultModels: ExtendedModel[] = [
    {
      id: 'model-astronaut',
      name: 'Oscar the Astronaut',
      description: 'A detailed model of an astronaut in a spacesuit.',
      status: 'Active',
      imageUrl: 'https://placehold.co/300x200.png',
      modelSrc: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      createdAt: '2024-01-15',
      aiHint: 'astronaut space',
      isFree: true,
      username: 'System',
      userEmail: 'system@artcode.com',
    },
    {
      id: 'model-knight',
      name: 'Valiant Knight',
      description: 'A model of a knight in armor riding a horse. This is a slightly longer description to test the alignment of the card footer buttons.',
      status: 'Active',
      imageUrl: 'https://placehold.co/300x200.png',
      modelSrc: 'https://modelviewer.dev/shared-assets/models/Horse.glb',
      createdAt: '2024-01-14',
      aiHint: 'knight horse',
      isFree: true,
      username: 'System',
      userEmail: 'system@artcode.com',
    },
    {
      id: 'model-drone',
      name: 'Sci-Fi Drone',
      description: 'A high-poly drone with intricate details.',
      status: 'Active',
      imageUrl: 'https://placehold.co/300x200.png',
      modelSrc: 'https://modelviewer.dev/shared-assets/models/shishkebab.glb',
      createdAt: '2024-01-12',
      aiHint: 'drone sci-fi',
      isFree: true,
      username: 'System',
      userEmail: 'system@artcode.com',
    },
  ];

  const handleAssign = async (modelName: string, qrId: string) => {
    try {
      await assignModelToQr(qrId, modelName);
      toast({
        title: "Success!",
        description: `Model "${modelName}" assigned to QR code "${qrId}".`,
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

  const loadUserGoogleDriveModels = async () => {
    if (!user?.email) {
      console.log('🔍 No user logged in, showing only default models');
      setAllModels(defaultModels);
      return;
    }

    setLoadingGoogleDriveModels(true);
    try {
      console.log('🔍 Loading user 3D models from Google Drive for:', user.email);
      
      // Load all files from Google Drive USER_3DOBJECT folder
      const { objects } = await GoogleDriveService.scanRealGoogleDriveFolder('all-users', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY!, 'USER_3DOBJECT');
      
      // Get current user's email username part (before @)
      const currentUserEmailPart = user.email.split('@')[0];
      
      // Convert Google Drive models to Extended Model interface and filter by current user
      const convertedModels: ExtendedModel[] = objects
        .map((obj, index) => {
          // Extract username from filename (e.g., "Hero_catenary_bim_designer.glb")
          const fileName = obj.name;
          
          // Try to extract user identifier from filename
          let username = 'Unknown User';
          let userEmail = 'unknown@example.com';
          
          // Extract user identifier from filename pattern: title_useridentifier.extension
          // Example: My_Hero_catenary_bim_designer.glb -> extract catenary_bim_designer
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
                
                // Basic validation: should look like an email username (contain dots or be reasonable length)
                if ((emailUser.includes('.') && emailUser.length > 5) || emailUser.length > 3) {
                  username = emailUser;
                  userEmail = `${emailUser}@gmail.com`;
                  break;
                }
              }
            }
          }

          return {
            id: `google-drive-${obj.id}`,
            name: obj.originalName || obj.name,
            description: `Custom 3D model: ${obj.originalName || obj.name}`,
            status: 'Active' as const,
            imageUrl: obj.imageUrl || 'https://placehold.co/300x200.png',
            modelSrc: obj.downloadUrl,
            createdAt: new Date(obj.createdTime).toLocaleDateString(),
            aiHint: obj.originalName?.toLowerCase() || obj.name.toLowerCase(),
            isFree: false,
            username,
            userEmail,
          };
        })
        .filter(model => {
          // Only include models that belong to the current user
          return model.userEmail === user.email;
        });

      // Combine default models with user's Google Drive models
      const combinedModels = [...defaultModels, ...convertedModels];
      setAllModels(combinedModels);
      console.log(`✅ Loaded ${convertedModels.length} user models for ${user.email}`);
      
    } catch (error) {
      console.error('❌ Error loading user models:', error);
      setAllModels(defaultModels);
    } finally {
      setLoadingGoogleDriveModels(false);
    }
  };

  // Filter models based on search
  useEffect(() => {
    let filtered = allModels;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredModels(filtered);
  }, [allModels, searchTerm]);

  // Load models on component mount and when user changes
  useEffect(() => {
    loadUserGoogleDriveModels();
  }, [user]);

  const assignedModelNames = Object.values(qrCodeAssignments);

  return (
    <>
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedModel(null)}>
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
          <div className="flex items-center justify-between">
            <h1 className="font-semibold text-lg md:text-2xl">My 3D Models</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadUserGoogleDriveModels}
                disabled={loadingGoogleDriveModels}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingGoogleDriveModels ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Models</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button asChild size="sm">
                <Link href="/models/request">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Request New Model</span>
                  <span className="sm:hidden">Request</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by model name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loadingGoogleDriveModels && (
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading all models...</span>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredModels.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No models found matching your criteria.
              </div>
            ) : (
              filteredModels.map((model) => {
                const isAssigned = assignedModelNames.includes(model.name);
                const status = isAssigned ? 'Active' : 'Pending';
                
                return (
                  <Card key={model.id} className="flex flex-col">
                    <CardHeader className="p-0 relative">
                      {model.isFree && (
                        <Badge variant="default" className="absolute top-3 right-3 z-10">Free</Badge>
                      )}
                      {!model.isFree && (
                        <Badge variant="secondary" className="absolute top-3 right-3 z-10">Custom</Badge>
                      )}
                      {model.username && (
                        <Badge variant="outline" className="absolute top-3 left-3 z-10">
                          {model.username}
                        </Badge>
                      )}
                      {model.isFree ? (
                        <Image
                          src={model.imageUrl}
                          alt={model.name}
                          width={300}
                          height={200}
                          className="rounded-t-lg aspect-video object-cover w-full"
                          data-ai-hint={model.aiHint}
                        />
                      ) : (
                        <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                          <img
                            src={model.imageUrl}
                            alt={model.name}
                            className="max-w-full max-h-full object-contain rounded-t-lg"
                            data-ai-hint={model.aiHint}
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 flex-grow">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{model.name}</CardTitle>
                        <Badge
                          variant={status === 'Active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {status === 'Active' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <Clock className="mr-1 h-3 w-3" />
                          )}
                          {status}
                        </Badge>
                      </div>
                      <CardDescription>{model.description}</CardDescription>
                      {model.username && (
                        <p className="text-xs text-muted-foreground">
                          By: {model.username}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="p-4 flex justify-between items-center mt-auto">
                      <p className="text-xs text-muted-foreground">
                        Created: {model.createdAt}
                      </p>
                      <div className="flex items-center gap-2">
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedModel(model)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                <span>Assign to QR</span>
                              </DropdownMenuSubTrigger>
                              <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                  {qrCodes.map(qr => (
                                    <DropdownMenuItem key={qr.id} onClick={() => handleAssign(model.name, qr.id)}>
                                      <span className="flex-1">{qr.id}</span>
                                      {qrCodeAssignments[qr.id] === model.name && <Check className="ml-2 h-4 w-4" />}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={() => setDetailsModel(model)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        {selectedModel && (
          <DialogContent className="max-w-3xl h-3/4 flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedModel.name}</DialogTitle>
              <DialogDescription>
                An interactive preview of the 3D model. Use your mouse to rotate and zoom.
                {selectedModel.username && ` Created by: ${selectedModel.username}`}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-0">
              <ModelViewer
                src={selectedModel.modelSrc}
                alt={selectedModel.description}
              />
            </div>
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={!!detailsModel} onOpenChange={(isOpen) => !isOpen && setDetailsModel(null)}>
        {detailsModel && (() => {
          const isAssigned = assignedModelNames.includes(detailsModel.name);
          const status = isAssigned ? 'Active' : 'Pending';
          return (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{detailsModel.name}</DialogTitle>
                <DialogDescription>
                  A summary of the model&apos;s properties.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{detailsModel.description}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Status</h4>
                    <Badge
                      variant={status === 'Active' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {status === 'Active' ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {status}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-1">Created</h4>
                    <p className="text-sm">{detailsModel.createdAt}</p>
                  </div>
                </div>
                {detailsModel.username && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Creator</h4>
                      <p className="text-sm">{detailsModel.username}</p>
                    </div>
                  </>
                )}
                {detailsModel.isFree && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground mb-1">Tier</h4>
                      <Badge variant="outline">Free</Badge>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          )
        })()}
      </Dialog>
    </>
  );
}
