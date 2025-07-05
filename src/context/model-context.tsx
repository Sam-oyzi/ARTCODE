
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { getUserModelRequests, type ModelRequest, saveQRModelAssignment, getUserQRAssignments } from '@/lib/firebase';
import { GoogleDriveService } from '@/lib/googleDriveService';

// Define the shape of the context data
export interface Model {
    id: string;
    name: string;
    description: string;
    status: 'Active' | 'Pending' | 'Processing';
    imageUrl: string;
    modelSrc: string;
    createdAt: string;
    aiHint: string;
    isFree?: boolean;
}

// The QrCode is now just an ID. It's a unique token.
export interface QrCode {
    id: string;
}

interface ModelContextType {
  qrCodeAssignments: Record<string, string>; 
  assignModelToQr: (qrId: string, modelName: string) => Promise<void>;
  models: Model[];
  qrCodes: QrCode[];
  userModelRequests: ModelRequest[];
  refreshModelRequests: () => Promise<void>;
  loadingGoogleDriveModels: boolean;
  refreshGoogleDriveModels: () => Promise<void>;
}

// Default free models available to all users
const defaultModels: Model[] = [
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
    },
];


// Create the context
const ModelContext = createContext<ModelContextType | undefined>(undefined);

// Create the provider component
export function ModelProvider({ children }: { children: ReactNode }) {
    const { user, userProfile } = useAuth();
    const [qrCodeAssignments, setQrCodeAssignments] = useState<Record<string, string>>({});
    const [userModelRequests, setUserModelRequests] = useState<ModelRequest[]>([]);
    const [googleDriveModels, setGoogleDriveModels] = useState<Model[]>([]);
    const [loadingGoogleDriveModels, setLoadingGoogleDriveModels] = useState(false);

    // Get user's QR codes from their profile
    const qrCodes: QrCode[] = userProfile ? [{ id: userProfile.qrCodeId }] : [];

    const refreshModelRequests = async () => {
        if (user) {
            try {
                const requests = await getUserModelRequests(user.uid);
                setUserModelRequests(requests);
            } catch (error) {
                console.error('Error fetching model requests:', error);
            }
        }
    };

    const loadQRAssignments = async () => {
        if (user) {
            try {
                const assignments = await getUserQRAssignments(user.uid);
                setQrCodeAssignments(assignments);
            } catch (error) {
                console.error('Error fetching QR assignments:', error);
            }
        }
    };

    const refreshGoogleDriveModels = async () => {
        if (!user?.email) return;

        try {
            setLoadingGoogleDriveModels(true);
            console.log('🔍 Loading custom models for user:', user.email);
            
            const { objects } = await GoogleDriveService.scanUserAssetsInDrive(user.email);
            
            // Convert Google Drive models to Model interface
            const convertedModels: Model[] = objects.map((obj, index) => ({
                id: `google-drive-${obj.id}`,
                name: obj.originalName || obj.name,
                description: `Your custom 3D model: ${obj.originalName || obj.name}`,
                status: 'Active' as const,
                imageUrl: obj.imageUrl || 'https://placehold.co/300x200.png', // Use matched image or default placeholder
                modelSrc: obj.downloadUrl,
                createdAt: new Date(obj.createdTime).toLocaleDateString(),
                aiHint: obj.originalName?.toLowerCase() || obj.name.toLowerCase(),
                isFree: false, // User's custom models are not free models
            }));

            setGoogleDriveModels(convertedModels);
            console.log('✅ Loaded custom models:', convertedModels);
            
        } catch (error) {
            console.error('❌ Error loading custom models:', error);
            setGoogleDriveModels([]);
        } finally {
            setLoadingGoogleDriveModels(false);
        }
    };

    const assignModelToQr = async (qrId: string, modelName: string) => {
        if (!user) return;
        
        try {
            // Save to Firebase
            await saveQRModelAssignment(qrId, user.uid, modelName);
            
            // Update local state
            setQrCodeAssignments(prev => ({
                ...prev,
                [qrId]: modelName,
            }));
        } catch (error) {
            console.error('Error saving QR model assignment:', error);
        }
    };

    // Load user's model requests and Google Drive models when user changes
    useEffect(() => {
        if (user) {
            refreshModelRequests();
            refreshGoogleDriveModels();
            loadQRAssignments();
        } else {
            setUserModelRequests([]);
            setGoogleDriveModels([]);
            setQrCodeAssignments({});
        }
    }, [user]);

    // Set default assignment for user's QR code if no assignment exists
    useEffect(() => {
        const setDefaultAssignment = async () => {
            if (userProfile && qrCodes.length > 0 && user) {
                // Only set default if no assignment exists for this QR code
                if (!qrCodeAssignments[userProfile.qrCodeId]) {
                    await assignModelToQr(userProfile.qrCodeId, 'Oscar the Astronaut');
                }
            }
        };
        
        setDefaultAssignment();
    }, [userProfile, qrCodeAssignments, user]);
    
    // Combine default models with Google Drive models
    const allModels = [...defaultModels, ...googleDriveModels];

    const value = {
        qrCodeAssignments,
        assignModelToQr,
        models: allModels,
        qrCodes,
        userModelRequests,
        refreshModelRequests,
        loadingGoogleDriveModels,
        refreshGoogleDriveModels,
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
}

// Create a custom hook for easy access to the context
export function useModelContext() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('useModelContext must be used within a ModelProvider');
    }
    return context;
}
