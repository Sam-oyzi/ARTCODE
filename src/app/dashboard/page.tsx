'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { GoogleDriveService } from '@/lib/googleDriveService';
import Model3DViewer from '@/components/model-viewer-3d';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, PlusCircle, MessageSquare, Upload } from 'lucide-react';
import Link from 'next/link';
// Removed Dialog imports as they're no longer needed

interface User3DModel {
  id: string;
  name: string;
  originalName: string;
  downloadUrl: string;
  viewUrl: string;
  createdTime: string;
  size: number;
  mimeType: string;
  imageUrl?: string; // Optional image URL for model thumbnails
}

// Removed User3DImage interface - images are now part of 3D models

// Removed ConnectionStatus interface

const ADMIN_EMAILS = [
  'hou.issam.zi@gmail.com',
  'we.ardesign3d@gmail.com'
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [models, setModels] = useState<User3DModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  // Removed debug and connection testing functionality

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (user?.email && !isAdmin) {
      loadUserModels();
    } else if (isAdmin) {
      // Admin users don't load their own models in dashboard
      setLoading(false);
      setModels([]);
    }
  }, [user, isAdmin]);

  const loadUserModels = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Loading user 3D models from Google Drive for:', user.email);
      
      // Load all models from Google Drive
      const { objects } = await GoogleDriveService.scanRealGoogleDriveFolder('all-users', process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY!, 'USER_3DOBJECT');
      
      // Filter models to only include those belonging to the current user
      const userModels = objects.filter(obj => {
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
      
      setModels(userModels);
      console.log(`✅ Loaded ${userModels.length} user models for ${user.email}`);
      
      if (userModels.length === 0) {
        setError('No 3D models found. Use "Request New Model" to create your first 3D model.');
      }
    } catch (error) {
      console.error('❌ Error loading user models:', error);
      setError(`Failed to load models: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Removed debug and connection testing functions

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h2>
          <p className="text-gray-600">You need to be signed in to access your 3D models.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">My 3D Models</h1>
            <p className="text-gray-600">Welcome back, {user.displayName || user.email}</p>
          </div>
      </div>

        {/* Quick Actions Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 max-w-2xl">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/models/request">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <PlusCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Request New Model</h3>
                      <p className="text-xs text-gray-600">Submit a new 3D model request</p>
                </div>
                </div>
                </CardContent>
              </Link>
        </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/models">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <MessageSquare className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">View All Models</h3>
                      <p className="text-xs text-gray-600">Browse all available 3D models</p>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>
        </div>

        {/* Removed Quick Stats section */}

        {/* Error Display */}
        {error && (
          <Alert className="mb-4 border-red-500">
            <AlertDescription>
              <strong>Notice:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Models Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading your 3D models...</span>
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-12">
          {isAdmin ? (
            <>
              <h3 className="text-xl font-semibold mb-2">Admin Dashboard</h3>
              <p className="text-gray-600 mb-4">
                As an admin, your personal models are not displayed here.
              </p>
              <p className="text-gray-600">
                Use the quick actions above to manage requests and view all models.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-2">No 3D Models Found</h3>
              <p className="text-gray-600 mb-4">
                You don't have any custom 3D models yet.
              </p>
              <p className="text-gray-600">
                Use the "Request New Model" button above to submit a request for your first custom 3D model.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model) => (
            <Card key={model.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{model.originalName}</CardTitle>
                  </div>
                  <Badge variant="secondary">{formatDate(model.createdTime)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-4 h-96">
                  <Model3DViewer
                    modelUrl={model.downloadUrl}
                    alt={model.originalName}
                    className="w-full h-full border rounded-lg"
                    style={{ height: '100%' }}
                  />
                </div>
                {/* Removed View Original link */}
          </CardContent>
        </Card>
          ))}
      </div>
      )}

      {/* Removed images section - images are now used as 3D model thumbnails */}
    </div>
  );
}
