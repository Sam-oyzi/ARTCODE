"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, FileText, BarChart3, Cloud, TestTube, CheckCircle, XCircle, AlertCircle, Sparkles, Settings, Upload } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


import { GoogleDriveConfig } from "@/lib/googleDriveConfig";
import { buildApiUrl } from '@/lib/utils';


const ADMIN_EMAILS = [
    'hou.issam.zi@gmail.com',
    'we.ardesign3d@gmail.com'
];

export default function AdminPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [testResults, setTestResults] = useState<{
        connection: any;
        serviceAccountUpload: any;
        connectionLoading: boolean;
        serviceAccountUploadLoading: boolean;
    }>({
        connection: null,
        serviceAccountUpload: null,
        connectionLoading: false,
        serviceAccountUploadLoading: false
    });

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

    useEffect(() => {
        if (!loading && (!user || !isAdmin)) {
            router.push('/dashboard');
        }
    }, [user, loading, isAdmin, router]);

    const testApiConnection = async () => {
        setTestResults(prev => ({ ...prev, connectionLoading: true, connection: null }));
        
        try {
            console.log('🔍 Testing Google Drive API connection...');
            
            // Test API key by fetching files from the 3D objects folder
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY;
            const folderId = '1LWDis8Yy3LpLwfJZ5dm7y8buPoTQXzKx'; // USER_3DOBJECT folder
            
            if (!apiKey) {
                setTestResults(prev => ({ 
                    ...prev, 
                    connectionLoading: false, 
                    connection: {
                        success: false,
                        message: 'Google Drive API key not configured',
                        error: 'NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY not found in environment variables'
                    }
                }));
                return;
            }
            
            const response = await fetch(
                `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&fields=files(id,name,mimeType)&pageSize=5`,
                { method: 'GET' }
            );
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API connection successful:', data);
                
                setTestResults(prev => ({ 
                    ...prev, 
                    connectionLoading: false, 
                    connection: {
                        success: true,
                        message: `API connection successful! Found ${data.files?.length || 0} files in 3D objects folder`,
                        fileCount: data.files?.length || 0,
                        files: data.files?.slice(0, 3) || []
                    }
                }));
            } else {
                const errorText = await response.text();
                console.error('❌ API connection failed:', errorText);
                
                setTestResults(prev => ({ 
                    ...prev, 
                    connectionLoading: false, 
                    connection: {
                        success: false,
                        message: `API connection failed: ${response.status} ${response.statusText}`,
                        error: errorText
                    }
                }));
            }
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            setTestResults(prev => ({ 
                ...prev, 
                connectionLoading: false, 
                connection: {
                    success: false,
                    message: 'API connection test failed',
                    error: (error as Error).message
                }
            }));
        }
    };









    const testServiceAccountUpload = async () => {
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = false;

        fileInput.onchange = async (event) => {
            const target = event.target as HTMLInputElement;
            const file = target.files?.[0];
            
            if (!file) return;

            setTestResults(prev => ({ ...prev, serviceAccountUploadLoading: true, serviceAccountUpload: null }));
            
            try {
                console.log('🔄 Testing Service Account upload...');
                
                // Generate unique filename
                const timestamp = Date.now();
                const fileExtension = file.name.split('.').pop() || 'jpg';
                const fileName = `service_account_test_${timestamp}.${fileExtension}`;
                
                // Create form data
                const formData = new FormData();
                formData.append('file', file);
                formData.append('fileName', fileName);
                formData.append('folderId', GoogleDriveConfig.FOLDERS.USER_REQUESTS);
                
                // Call server-side API
                const response = await fetch(buildApiUrl('/api/upload-to-drive'), {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                setTestResults(prev => ({ 
                    ...prev, 
                    serviceAccountUploadLoading: false, 
                    serviceAccountUpload: {
                        success: result.success,
                        message: result.success 
                            ? `Service Account upload successful! No user authentication required.`
                            : 'Service Account upload failed',
                        fileName: result.fileName || fileName,
                        fileId: result.fileId,
                        downloadUrl: result.downloadUrl,
                        viewUrl: result.viewUrl,
                        error: result.error,
                        method: result.method || 'Service Account (Server-side)',
                        fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                        fallback: result.fallback
                    }
                }));

            } catch (error) {
                console.error('🚨 Service Account Upload Error:', error);
                setTestResults(prev => ({ 
                    ...prev, 
                    serviceAccountUploadLoading: false, 
                    serviceAccountUpload: {
                        success: false,
                        message: 'Service Account upload failed',
                        error: (error as Error).message,
                        fileName: file.name
                    }
                }));
            }
        };

        // Trigger file selection
        fileInput.click();
    };

    const renderTestResult = (result: any) => {
        if (!result) return null;
        
        return (
            <div className={`p-3 rounded-lg border ${
                result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
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
                            {result.message}
                        </p>
                        {result.error && (
                            <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                        
                        {/* API Connection Results */}
                        {result.success && result.fileCount !== undefined && (
                            <div className="mt-2 space-y-1">
                                <p className="text-sm text-green-700">Found {result.fileCount} files</p>
                                {result.files && result.files.length > 0 && (
                                    <div className="text-xs text-green-600">
                                        Recent files: {result.files.map((f: any) => f.name).join(', ')}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* OAuth Upload Results */}
                        {result.fileId && (
                            <div className="mt-2 space-y-1">
                                <p className="text-sm text-green-700">File ID: {result.fileId}</p>
                                <div className="flex gap-2">
                                    <a 
                                        href={result.viewUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                    >
                                        View Image
                                    </a>
                                    <a 
                                        href={result.driveUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                                    >
                                        Google Drive
                                    </a>
                                </div>
                            </div>
                        )}
                        
                        {/* User Info for OAuth */}
                        {result.userInfo && (
                            <div className="mt-2 space-y-1">
                                <p className="text-sm text-green-700">
                                    User: {result.userInfo.name} ({result.userInfo.email})
                                </p>
                                {result.method && (
                                    <p className="text-xs text-green-600">Method: {result.method}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="font-semibold text-lg md:text-2xl">Admin Dashboard</h1>
                </div>
                <div className="text-sm text-muted-foreground">
                    {user?.email} {isAdmin ? '✅' : '❌'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Request Management Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <FileText className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Request Management</CardTitle>
                                <CardDescription>
                                    Manage user model requests and track their status
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            • View all user model requests
                        </div>
                        <div className="text-sm text-muted-foreground">
                            • Update request status (pending, in progress, completed, rejected)
                        </div>
                        <div className="text-sm text-muted-foreground">
                            • Filter by user email or model name
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/admin/requests">
                                <FileText className="mr-2 h-4 w-4" />
                                Manage Requests
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* User Management Card */}
                <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Users className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">User Management</CardTitle>
                                <CardDescription>
                                    Manage user accounts and access control
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            • View all registered users
                        </div>
                        <div className="text-sm text-muted-foreground">
                            • Block/unblock user access
                        </div>
                        <div className="text-sm text-muted-foreground">
                            • Monitor user activity and statistics
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/admin/users">
                                <Users className="mr-2 h-4 w-4" />
                                Manage Users
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                {/* Google Drive Test Card - Browser Only */}
                <Card className="hover:shadow-lg transition-shadow md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Cloud className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Google Drive Test (Browser Only)</CardTitle>
                                <CardDescription>
                                    Test Google Drive connection and upload functionality directly in the browser - no Python required!
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                            ✅ <strong>No Python Required:</strong> These tests work directly in your browser using OAuth authentication.
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <TestTube className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium">API Key Test</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Test Google Drive API connection (reads 3D models)
                                </p>
                                <Button 
                                    onClick={testApiConnection}
                                    disabled={testResults.connectionLoading}
                                    className="w-full"
                                    variant="outline"
                                >
                                    {testResults.connectionLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                                            Testing...
                                        </>
                                    ) : (
                                        <>
                                            <TestTube className="mr-2 h-4 w-4" />
                                            Test API Connection
                                        </>
                                    )}
                                </Button>
                                {renderTestResult(testResults.connection)}
                            </div>

                            
                        </div>
                    </CardContent>
                </Card>





                {/* Service Account Upload Test Card */}
                <Card className="hover:shadow-lg transition-shadow md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Cloud className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Service Account Upload Test</CardTitle>
                                <CardDescription>
                                    Server-side upload without user authentication (Best UX)
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <CheckCircle className="h-4 w-4" />
                            <span>No Google login required - uploads directly to Drive using service account</span>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-4">
                            <Button 
                                onClick={testServiceAccountUpload}
                                disabled={testResults.serviceAccountUploadLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                                size="lg"
                            >
                                {testResults.serviceAccountUploadLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Cloud className="mr-2 h-5 w-5" />
                                        Test Service Account Upload
                                    </>
                                )}
                            </Button>
                            
                            {testResults.serviceAccountUpload && (
                                <div className="w-full max-w-md">
                                    {renderTestResult(testResults.serviceAccountUpload)}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>


            </div>

            {/* Welcome Message */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-primary">Welcome, Admin!</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                You have full access to manage users, requests, and system settings.
                            </p>
                        </div>
                        <div className="bg-primary/20 p-3 rounded-full">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
