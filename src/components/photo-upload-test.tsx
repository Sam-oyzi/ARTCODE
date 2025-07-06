"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ImageUploadService } from "@/lib/imageUploadService";
import { GoogleDriveOAuthAlternative } from "@/lib/googleDriveOAuthAlternative";
import { GoogleDriveConfig } from "@/lib/googleDriveConfig";
import { Upload, Image as ImageIcon, CheckCircle, XCircle, Loader2, Settings } from "lucide-react";

interface UploadResult {
  success: boolean;
  fileName: string;
  fileId?: string;
  downloadUrl?: string;
  viewUrl?: string;
  error?: string;
}

export function PhotoUploadTest() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [useAlternativeOAuth, setUseAlternativeOAuth] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setUploadResults([]);
  };

  const uploadPhotos = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select some photos to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      const testEmail = "admin@test.com";
      const authMethod = useAlternativeOAuth ? "Alternative OAuth" : "Standard OAuth";
      
      toast({
        title: "Starting Upload",
        description: `Uploading ${selectedFiles.length} photos using ${authMethod}...`,
      });

      if (useAlternativeOAuth) {
        // Use alternative OAuth method
        console.log('🔄 Using Alternative OAuth method');
        const results: UploadResult[] = [];
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileName = `test_${Date.now()}_${i + 1}_${file.name}`;
          
          const uploadResult = await GoogleDriveOAuthAlternative.uploadFile(
            file,
            fileName,
            GoogleDriveConfig.FOLDERS.USER_REQUESTS
          );
          
          results.push(uploadResult);
        }
        
        setUploadResults(results);
        const successful = results.filter(r => r.success).length;
        
        if (successful > 0) {
          toast({
            title: "Upload Complete!",
            description: `Successfully uploaded ${successful}/${results.length} photos using Alternative OAuth.`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: `Failed to upload photos. Check the results below.`,
            variant: "destructive",
          });
        }

      } else {
        // Use standard OAuth method
        console.log('🔄 Using Standard OAuth method');
        const uploadSummary = await ImageUploadService.uploadImages(selectedFiles, {
          userEmail: testEmail,
          projectName: "photo_upload_test",
          maxFileSize: 10 * 1024 * 1024, // 10MB
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        });

        setUploadResults(uploadSummary.results);

        if (uploadSummary.successful > 0) {
          toast({
            title: "Upload Complete!",
            description: `Successfully uploaded ${uploadSummary.successful}/${uploadSummary.total} photos using Standard OAuth.`,
          });
        } else {
          toast({
            title: "Upload Failed",
            description: `Failed to upload photos. Check the results below.`,
            variant: "destructive",
          });
        }
      }

    } catch (error) {
      console.error("Upload test failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not test upload functionality.";
      toast({
        title: "Upload Test Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearTest = () => {
    setSelectedFiles([]);
    setUploadResults([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-blue-600" />
          Photo Upload Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* OAuth Method Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            OAuth Method
          </label>
          <div className="flex gap-2">
            <Button
              variant={useAlternativeOAuth ? "outline" : "default"}
              size="sm"
              onClick={() => setUseAlternativeOAuth(false)}
              disabled={uploading}
            >
              Standard OAuth
            </Button>
            <Button
              variant={useAlternativeOAuth ? "default" : "outline"}
              size="sm"
              onClick={() => setUseAlternativeOAuth(true)}
              disabled={uploading}
            >
              Alternative OAuth
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            {useAlternativeOAuth ? (
              <>Alternative OAuth uses the older gapi.auth2 library to avoid redirect_uri_mismatch errors.</>
            ) : (
              <>Standard OAuth uses the newer Google Identity Services library.</>
            )}
          </div>
        </div>

        {/* File Selection */}
        <div className="space-y-3">
          <label htmlFor="photo-upload" className="text-sm font-medium">
            Select Photos to Upload
          </label>
          <Input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {selectedFiles.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFiles.length} photos
              <ul className="mt-2 space-y-1">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex gap-3">
          <Button 
            onClick={uploadPhotos} 
            disabled={uploading || selectedFiles.length === 0}
            className="flex-1"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Google Drive
              </>
            )}
          </Button>
          
          <Button 
            onClick={clearTest} 
            variant="outline"
            disabled={uploading}
          >
            Clear
          </Button>
        </div>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium">Upload Results:</h3>
            <div className="space-y-2">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${
                        result.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.fileName}
                      </p>
                      {result.success && result.fileId && (
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-green-700">
                            File ID: {result.fileId}
                          </p>
                          <div className="flex gap-2">
                            {result.downloadUrl && (
                              <a 
                                href={result.downloadUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              >
                                Download
                              </a>
                            )}
                            {result.viewUrl && (
                              <a 
                                href={result.viewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                              >
                                View in Drive
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Error: {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
          <p className="font-medium mb-1">Test Instructions:</p>
          <ul className="space-y-1">
            <li>1. Select one or more photos from your computer</li>
            <li>2. Click "Upload to Google Drive" to test the upload</li>
            <li>3. If OAuth is configured, it will upload to Google Drive</li>
            <li>4. If OAuth is not configured, it will show a helpful error message</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 