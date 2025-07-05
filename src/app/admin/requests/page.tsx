"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  CheckCircle, 
  Clock, 
  XCircle, 
  Search,
  Filter,
  Users,
  Cloud,
  Trash2
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

const ADMIN_EMAILS = [
    'hou.issam.zi@gmail.com',
    'we.ardesign3d@gmail.com'
];

interface ModelRequest {
  id: string;
  requestId: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  originalDescription: string;
  refinedDescription: string;
  pinterestLink: string | null;
  googleDriveFileId: string | null;
  imageUrl: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

const statusConfig = {
    'pending': {
        icon: Clock,
        color: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/20',
        label: 'Pending'
    },
    'in_progress': {
        icon: Clock,
        color: 'bg-blue-400/20 text-blue-400 border-blue-400/20',
        label: 'In Progress'
    },
    'completed': {
        icon: CheckCircle,
        color: 'bg-green-400/20 text-green-400 border-green-400/20',
        label: 'Completed'
    },
    'rejected': {
        icon: XCircle,
        color: 'bg-red-400/20 text-red-400 border-red-400/20',
        label: 'Rejected'
    },
}

export default function AdminRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<ModelRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ModelRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<string | null>(null);


  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchRequests();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter, userFilter]);

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'modelRequests');
      const q = query(requestsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedRequests: ModelRequest[] = [];
      querySnapshot.forEach((doc) => {
        fetchedRequests.push({
          id: doc.id,
          ...doc.data()
        } as ModelRequest);
      });
      
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.refinedDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    if (userFilter !== 'all') {
      filtered = filtered.filter(request => request.userName === userFilter);
    }

    setFilteredRequests(filtered);
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    setUpdatingRequest(requestId);
    try {
      const requestRef = doc(db, 'modelRequests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      // Update local state
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: newStatus as any, updatedAt: new Date() }
            : req
        )
      );
    } catch (error) {
      console.error('Error updating request status:', error);
    } finally {
      setUpdatingRequest(null);
    }
  };

  const deleteRequest = async (requestId: string) => {
    setDeletingRequest(requestId);
    try {
      const requestRef = doc(db, 'modelRequests', requestId);
      await deleteDoc(requestRef);
      
      // Update local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error deleting request:', error);
    } finally {
      setDeletingRequest(null);
    }
  };

  // Get unique user names for the filter dropdown
  const uniqueUserNames = Array.from(new Set(requests.map(request => request.userName))).sort();



  if (loading || loadingRequests) {
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
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg md:text-2xl">User Model Requests</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredRequests.length} requests
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">
              <Users className="h-4 w-4 mr-1" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <Cloud className="h-4 w-4 mr-1" />
              Google Drive Tests
            </Link>
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user email, name, title, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUserNames.map((userName) => (
                      <SelectItem key={userName} value={userName}>
                        {userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Pinterest</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No requests found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests.map((request) => {
                const config = statusConfig[request.status];
                const Icon = config.icon;
                const isUpdating = updatingRequest === request.id;
                
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-medium">{request.userName}</span>
                        <span className="text-sm text-muted-foreground">{request.userEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <span className="text-sm font-semibold text-primary">{request.title || 'Untitled'}</span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Original:</p>
                        <p className="text-sm text-muted-foreground truncate">{request.originalDescription}</p>
                        {request.refinedDescription !== request.originalDescription && (
                          <>
                            <p className="text-sm font-medium">AI Refined:</p>
                            <p className="text-sm truncate">{request.refinedDescription}</p>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.googleDriveFileId ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={`/api/images/${request.googleDriveFileId}`}
                            alt="Reference" 
                            className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(`https://drive.google.com/file/d/${request.googleDriveFileId}/view`, '_blank')}
                            onError={(e) => {
                              // Fallback to original imageUrl if API fails
                              const target = e.target as HTMLImageElement;
                              if (request.imageUrl && target.src !== request.imageUrl) {
                                target.src = request.imageUrl;
                              }
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(`https://drive.google.com/file/d/${request.googleDriveFileId}/view`, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ) : request.imageUrl ? (
                        <div className="flex items-center gap-2">
                          <img 
                            src={request.imageUrl} 
                            alt="Reference" 
                            className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(request.imageUrl!, '_blank')}
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(request.imageUrl!, '_blank')}
                          >
                            View
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">No image</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.pinterestLink ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(request.pinterestLink!, '_blank')}
                        >
                          View Pinterest
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">No link</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={config.color}>
                        <Icon className="mr-1 h-3 w-3"/>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
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
                          <DropdownMenuItem 
                            onClick={() => updateRequestStatus(request.id, 'pending')}
                            disabled={request.status === 'pending'}
                          >
                            Mark as Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateRequestStatus(request.id, 'in_progress')}
                            disabled={request.status === 'in_progress'}
                          >
                            Mark as In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateRequestStatus(request.id, 'completed')}
                            disabled={request.status === 'completed'}
                          >
                            Mark as Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => updateRequestStatus(request.id, 'rejected')}
                            disabled={request.status === 'rejected'}
                          >
                            Mark as Rejected
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Request
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Request</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this request from "{request.userName}"? 
                                  This action cannot be undone and will permanently remove the request 
                                  and any associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRequest(request.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={deletingRequest === request.id}
                                >
                                  {deletingRequest === request.id ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </>
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
    </div>
  );
}