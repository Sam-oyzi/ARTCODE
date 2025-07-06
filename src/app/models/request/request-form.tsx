"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { refineModelRequest } from "@/ai/flows/refine-model-request";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ImageUploadService } from '@/lib/imageUploadService';
import { buildApiUrl } from '@/lib/utils';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, FileUp, Sparkles, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const requestSchema = z.object({
  title: z.string().min(3, "Please provide a title for your 3D model."),
  description: z.string().optional(),
  photo: z.any().optional(),
  pinterestLink: z.string().url().optional().or(z.literal("")),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function RequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [refinedDescription, setRefinedDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      title: "",
      description: "",
      pinterestLink: "",
    },
  });

  // Handle file selection (store file for later upload)
  const handleFileSelection = (files: FileList | null) => {
    if (!files || files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadedImageId(null); // Clear any previous upload
  };

  // Upload the selected file to Google Drive
  const uploadSelectedFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    setIsUploadingImage(true);
    try {
      // Try Service Account upload first (no user authentication needed)
      try {
        console.log('🔄 Attempting Service Account upload...');
        
        const timestamp = Date.now();
        const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
        const userIdentifier = user.email!.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_');
        const formTitle = form.getValues().title || 'untitled';
        const sanitizedTitle = formTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = `${sanitizedTitle}_${userIdentifier}.${fileExtension}`;
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('fileName', fileName);
        uploadFormData.append('folderId', '1IgZTNiLsDSQL5wEUNbGim1Rcc6Y33kzL'); // USER_REQUESTS folder
        
        const response = await fetch(buildApiUrl('/api/upload-to-drive'), {
          method: 'POST',
          body: uploadFormData
        });
        
        const result = await response.json();
        
        if (result.success && result.fileId) {
          // Service Account upload successful - no authentication needed!
          console.log('✅ Service Account upload successful');
          return result.fileId;
        } else {
          throw new Error(result.error || 'Service Account upload failed');
        }
        
      } catch (serviceAccountError) {
        console.warn('🚨 Service Account upload failed, trying OAuth fallback:', serviceAccountError);
        
        // Fallback to OAuth upload (requires user authentication)
        const isOAuthConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        
        if (!isOAuthConfigured) {
          throw new Error('Both Service Account and OAuth are not configured');
        }

        // Generate temporary request ID for image upload using title
        const formTitle = form.getValues().title || 'untitled';
        const sanitizedTitle = formTitle.replace(/[^a-zA-Z0-9]/g, '_');
        const tempRequestId = `${sanitizedTitle}_oauth_${Date.now()}`;
        
        const uploadSummary = await ImageUploadService.uploadImages([selectedFile], {
          userEmail: user.email!,
          projectName: tempRequestId,
          maxFileSize: 10 * 1024 * 1024, // 10MB for request images
          allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        });

        if (uploadSummary.successful > 0) {
          return uploadSummary.fileIds[0];
        } else {
          const error = uploadSummary.results[0]?.error || "OAuth upload failed";
          throw new Error(error);
        }
      }
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: (error as Error).message || "Could not upload image. Image stored locally instead.",
        variant: "destructive",
      });
      
      // Final fallback to local storage
      return `local_${Date.now()}`;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFormSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    // If no description provided, submit directly
    if (!data.description?.trim()) {
      await submitDirectRequest();
      return;
    }

    setIsLoading(true);
    setRefinedDescription("");

    let photoDataUri: string | undefined;
    if (data.photo && data.photo[0]) {
      try {
        photoDataUri = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(data.photo[0]);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
        });
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          title: "Error",
          description: "Could not process the uploaded image.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await refineModelRequest({
        description: data.description || "",
        photoDataUri: photoDataUri,
        pinterestLink: data.pinterestLink,
      });
      setRefinedDescription(result.refinedDescription);
      toast({
        title: "Description Refined!",
        description: "The AI has enhanced your request description.",
      });
    } catch (error) {
      console.error("Error refining request:", error);
      toast({
        title: "Refinement Failed",
        description: "The AI could not refine the description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitRequest = async (withAI = false) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a request.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get form data
      const formData = form.getValues();
      
      // Generate unique request ID
      const requestId = `req_${Date.now()}`;
      
      // Upload image if selected
      let googleDriveFileId = uploadedImageId;
      if (selectedFile && !uploadedImageId) {
        googleDriveFileId = await uploadSelectedFile();
        if (googleDriveFileId) {
          setUploadedImageId(googleDriveFileId);
        }
      }
      
      // Save request to Firestore
      const requestData = {
        requestId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName || user.email?.split('@')[0],
        title: formData.title,
        originalDescription: formData.description || "",
        refinedDescription: withAI ? refinedDescription : (formData.description || ""),
        pinterestLink: formData.pinterestLink || null,
        googleDriveFileId: googleDriveFileId || null,
        imageUrl: googleDriveFileId ? `https://drive.google.com/uc?export=download&id=${googleDriveFileId}` : null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'modelRequests'), requestData);
      
    toast({
      title: "Request Submitted!",
      description: "Your 3D model request has been sent to our creators.",
    });
      
      // Reset form
    form.reset();
    setRefinedDescription("");
      setUploadedImageId(null);
      setSelectedFile(null);
      
    } catch (error) {
      console.error("Error submitting request:", error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Direct submit without AI refinement
  const submitDirectRequest = async () => {
    // Validate form first
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    await submitRequest(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>3D Model Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 'My Hero', 'Pokémon', 'Dragon', 'Superhero', 'Car Model'..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will be the name of your 3D model
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 'a sleek, futuristic armchair with glowing blue accents'"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="mt-3">
                    <Button type="submit" disabled={isLoading} size="sm">
                      {isLoading ? <Cpu className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Refine with AI
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Photo</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={isUploadingImage}
                            className="flex items-center gap-2"
                          >
                            <FileUp className="h-4 w-4" />
                            Choose Photo
                          </Button>
                          {selectedFile && (
                            <span className="text-sm text-muted-foreground">
                              {selectedFile.name}
                            </span>
                          )}
                        </div>
                        <Input 
                          id="photo-upload"
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => {
                            handleFileSelection(e.target.files);
                            field.onChange(e.target.files);
                          }}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {isUploadingImage ? (
                        <span className="flex items-center gap-2 text-primary">
                          <Cpu className="h-4 w-4 animate-spin" />
                          Uploading image...
                        </span>
                      ) : uploadedImageId ? (
                        <span className="flex items-center gap-2 text-green-600">
                          <Sparkles className="h-4 w-4" />
                          Image uploaded successfully!
                        </span>
                      ) : selectedFile ? (
                        <span className="flex items-center gap-2 text-blue-600">
                          <FileUp className="h-4 w-4" />
                          {selectedFile.name} selected - will upload when you submit.
                        </span>
                      ) : (
                        "Upload a photo for reference (optional)."
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pinterestLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pinterest Link</FormLabel>
                    <FormControl>
                      <Input placeholder="https://pinterest.com/..." {...field} />
                    </FormControl>
                    <FormDescription>Link to a board or pin.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-center">
              <Button 
                type="button" 
                onClick={submitDirectRequest} 
                disabled={isSubmitting || isLoading}
                className="w-full"
              >
                {isSubmitting ? <Cpu className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Submit Request
              </Button>
            </div>
          </form>
        </Form>

        {(isLoading || refinedDescription) && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold flex items-center mb-4">
              <Wand2 className="mr-2 h-5 w-5 text-primary" />
              AI-Refined Description
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-sm">
                  <p>{refinedDescription}</p>
                </CardContent>
              </Card>
            )}
            {refinedDescription && !isLoading && (
                 <Button onClick={() => submitRequest(true)} disabled={isSubmitting} className="w-full mt-4">
                    {isSubmitting ? <Cpu className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    Submit Final Request
                </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
