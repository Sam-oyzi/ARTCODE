"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { GoogleDriveService } from '@/lib/googleDriveService';
import dynamic from 'next/dynamic';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MoreHorizontal, 
  Search,
  Filter,
  Users,
  Eye,
  Ban,
  CheckCircle,
  RefreshCw,
  Shield,
  ShieldOff,
  Grid3X3,
  List
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ModelViewer = dynamic(() => import('@/components/model-viewer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full aspect-square bg-muted/50" />
});

const ADMIN_EMAILS = [
    'hou.issam.zi@gmail.com',
    'we.ardesign3d@gmail.com'
];

interface UserModel {
  id: string;
  name: string;
  originalName: string;
  userEmail: string;
  userName: string;
  description: string;
  imageUrl: string;
  modelUrl: string;
  createdAt: string;
  blocked: boolean;
  googleDriveId: string;
}

export default function AdminModelsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [models, setModels] = useState<UserModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<UserModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingModels, setLoadingModels] = useState(true);
  const [updatingModel, setUpdatingModel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<UserModel | null>(null);
  const [viewerModel, setViewerModel] = useState<UserModel | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { toast } = useToast();

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchAllUserModels();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterModels();
  }, [models, searchTerm, userFilter, statusFilter]);

  const fetchAllUserModels = async () => {
    try {
      setLoadingModels(true);
      console.log('🔍 Fetching all user models from Google Drive...');
      
      // Load all files from Google Drive USER_3DOBJECT folder (no individual user filtering)
      const { objects } = await GoogleDriveService.scanRealGoogleDriveFolder('all-users', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY!, 'USER_3DOBJECT');
      
      // Convert Google Drive objects to UserModel format
      const allModels: UserModel[] = objects.map(obj => {
        // Extract username from filename (same logic as regular models page)
        const fileName = obj.name;
        const fileNameWithoutExt = fileName.replace(/\.[^.]+$/, ''); // Remove only the final extension
        
        let userEmail = 'unknown@example.com';
        let userName = 'Unknown User';
        
        // Try different combinations starting from the end
        const parts = fileNameWithoutExt.split('_');
        if (parts.length >= 2) {
          for (let i = 1; i < parts.length; i++) {
            const potentialUserIdentifier = parts.slice(i).join('_');
            
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
                userName = emailUser;
                userEmail = `${emailUser}@gmail.com`;
                break;
              }
            }
          }
        }
        
        return {
          id: `${userEmail}_${obj.id}`,
          name: obj.name,
          originalName: obj.originalName || obj.name,
          userEmail,
          userName,
          description: `3D Model: ${obj.originalName || obj.name}`,
          imageUrl: obj.imageUrl || 'https://placehold.co/300x200.png',
          modelUrl: obj.downloadUrl,
          createdAt: new Date(obj.createdTime).toLocaleDateString(),
          blocked: false, // Default to not blocked
          googleDriveId: obj.id,
        };
      });
      
      setModels(allModels);
      console.log(`✅ Total models found: ${allModels.length}`);
    } catch (error) {
      console.error('Error fetching user models:', error);
      toast({
        title: "Error",
        description: "Failed to load user models.",
        variant: "destructive",
      });
    } finally {
      setLoadingModels(false);
    }
  };

  const filterModels = () => {
    let filtered = models;

    if (searchTerm) {
      filtered = filtered.filter(model =>
        model.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(model => model.userName === userFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'blocked') {
        filtered = filtered.filter(model => model.blocked);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(model => !model.blocked);
      }
    }

    setFilteredModels(filtered);
  };

  const toggleModelBlock = async (modelId: string, currentBlocked: boolean) => {
    setUpdatingModel(modelId);
    try {
      // Update local state
      setModels(prev => 
        prev.map(model => 
          model.id === modelId 
            ? { ...model, blocked: !currentBlocked }
            : model
        )
      );

      toast({
        title: currentBlocked ? "Model Unblocked" : "Model Blocked",
        description: `Model has been ${currentBlocked ? 'unblocked' : 'blocked'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating model status:', error);
      toast({
        title: "Error",
        description: "Failed to update model status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingModel(null);
    }
  };

  const uniqueUsernames = [...new Set(models.map(model => model.userName).filter(Boolean))].sort();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="flex justify-center items-center h-64">Access denied</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">3D Models Management</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {models.length} models
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllUserModels}
            disabled={loadingModels}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loadingModels ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by username, model name, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsernames.map((username) => (
                    <SelectItem key={username} value={username}>
                      {username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center border rounded-md p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="px-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingModels ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Loading user models...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredModels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No models found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredModels.map((model) => {
                  const isUpdating = updatingModel === model.id;
                  
                  return (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-medium">{model.userName}</span>
                          <span className="text-sm text-muted-foreground">{model.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold">{model.originalName}</span>
                          <span className="text-sm text-muted-foreground">{model.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                                              <img 
                        src={model.imageUrl}
                        alt={model.originalName}
                        className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setViewerModel(model)}
                      />
                      </TableCell>
                      <TableCell>
                        {model.createdAt}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={model.blocked ? "destructive" : "default"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {model.blocked ? (
                            <>
                              <Ban className="h-3 w-3" />
                              Blocked
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Active
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              aria-haspopup="true" 
                              size="icon" 
                              variant="ghost"
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedModel(model)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setViewerModel(model)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View in 3D
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleModelBlock(model.id, model.blocked)}
                            >
                              {model.blocked ? (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Unblock Model
                                </>
                              ) : (
                                <>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Block Model
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => window.open(model.modelUrl, '_blank')}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View in Google Drive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="space-y-4">
          {loadingModels ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading user models...</span>
                </div>
              </CardContent>
            </Card>
          ) : filteredModels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No models found matching your criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredModels.map((model) => {
                const isUpdating = updatingModel === model.id;
                
                return (
                  <Card key={model.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="relative mb-3">
                        <img 
                          src={model.imageUrl}
                          alt={model.originalName}
                          className="w-full h-32 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setViewerModel(model)}
                        />
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant={model.blocked ? "destructive" : "default"}
                            className="flex items-center gap-1 text-xs"
                          >
                            {model.blocked ? (
                              <>
                                <Ban className="h-2 w-2" />
                                Blocked
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-2 w-2" />
                                Active
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold text-sm truncate">{model.originalName}</h3>
                          <p className="text-xs text-muted-foreground">{model.description}</p>
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{model.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{model.userEmail}</p>
                            </div>
                            <div className="ml-2 flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    aria-haspopup="true" 
                                    size="sm" 
                                    variant="ghost"
                                    disabled={isUpdating}
                                    className="h-8 w-8 p-0"
                                  >
                                    {isUpdating ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                    ) : (
                                      <MoreHorizontal className="h-3 w-3" />
                                    )}
                                    <span className="sr-only">Toggle menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedModel(model)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setViewerModel(model)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View in 3D
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => toggleModelBlock(model.id, model.blocked)}
                                  >
                                    {model.blocked ? (
                                      <>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Unblock Model
                                      </>
                                    ) : (
                                      <>
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        Block Model
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => window.open(model.modelUrl, '_blank')}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View in Google Drive
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Created: {model.createdAt}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Model Details Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Model Details</DialogTitle>
          </DialogHeader>
          {selectedModel && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <img 
                    src={selectedModel.imageUrl}
                    alt={selectedModel.originalName}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Model Name</h4>
                    <p className="font-medium">{selectedModel.originalName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Owner</h4>
                    <p className="font-medium">{selectedModel.userName}</p>
                    <p className="text-sm text-muted-foreground">{selectedModel.userEmail}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Created</h4>
                    <p>{selectedModel.createdAt}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground">Status</h4>
                    <Badge variant={selectedModel.blocked ? "destructive" : "default"}>
                      {selectedModel.blocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewerModel(selectedModel)}
                >
                  View in 3D
                </Button>
                <Button
                  variant={selectedModel.blocked ? "default" : "destructive"}
                  onClick={() => toggleModelBlock(selectedModel.id, selectedModel.blocked)}
                  disabled={updatingModel === selectedModel.id}
                >
                  {selectedModel.blocked ? 'Unblock Model' : 'Block Model'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedModel.modelUrl, '_blank')}
                >
                  View in Google Drive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 3D Viewer Dialog */}
      <Dialog open={!!viewerModel} onOpenChange={() => setViewerModel(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{viewerModel?.originalName}</DialogTitle>
            <DialogDescription>
              An interactive preview of the 3D model. Use your mouse to rotate and zoom.
              Created by: {viewerModel?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 w-full h-full min-h-0">
            {viewerModel && (
              <ModelViewer
                src={viewerModel.modelUrl}
                alt={viewerModel.description}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 