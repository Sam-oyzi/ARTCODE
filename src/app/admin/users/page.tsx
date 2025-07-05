"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { getAllUsers, blockUser, unblockUser, migrateAllUsersToAddBlockedField, type UserProfile } from '@/lib/firebase';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Crown,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

const ADMIN_EMAILS = [
    'hou.issam.zi@gmail.com',
    'we.ardesign3d@gmail.com'
];

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await getAllUsers();
      // Handle existing users that don't have the blocked field
      const usersWithBlockedField = fetchedUsers.map(user => ({
        ...user,
        blocked: user.blocked ?? false // Default to false if blocked field doesn't exist
      }));
      setUsers(usersWithBlockedField);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'blocked') {
        filtered = filtered.filter(user => user.blocked);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(user => !user.blocked);
      } else if (statusFilter === 'admin') {
        filtered = filtered.filter(user => ADMIN_EMAILS.includes(user.email));
      }
    }

    setFilteredUsers(filtered);
  };

  const handleBlockUser = async (uid: string) => {
    setUpdatingUser(uid);
    try {
      await blockUser(uid);
      setUsers(prev => 
        prev.map(u => 
          u.uid === uid ? { ...u, blocked: true } : u
        )
      );
    } catch (error) {
      console.error('Error blocking user:', error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleUnblockUser = async (uid: string) => {
    setUpdatingUser(uid);
    try {
      await unblockUser(uid);
      setUsers(prev => 
        prev.map(u => 
          u.uid === uid ? { ...u, blocked: false } : u
        )
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleMigrateUsers = async () => {
    setMigrating(true);
    try {
      await migrateAllUsersToAddBlockedField();
      // Refresh the users list after migration
      await fetchUsers();
      alert('User migration completed successfully!');
    } catch (error) {
      console.error('Error migrating users:', error);
      alert('Error migrating users. Please try again.');
    } finally {
      setMigrating(false);
    }
  };

  if (loading || loadingUsers) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const activeUsers = users.filter(u => !u.blocked).length;
  const blockedUsers = users.filter(u => u.blocked).length;
  const adminUsers = users.filter(u => ADMIN_EMAILS.includes(u.email)).length;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-semibold text-lg md:text-2xl">User Management</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="px-3 py-1">
            {filteredUsers.length} users
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/requests">
              <FileText className="h-4 w-4 mr-1" />
              Manage Requests
            </Link>
          </Button>
          <Button
            onClick={handleMigrateUsers}
            disabled={migrating}
            variant="outline"
            size="sm"
          >
            {migrating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Migrating...
              </>
            ) : (
              'Migrate Users'
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked Users</p>
                <p className="text-2xl font-bold text-red-600">{blockedUsers}</p>
              </div>
              <ShieldX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-orange-600">{adminUsers}</p>
              </div>
              <Crown className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active Users</SelectItem>
                <SelectItem value="blocked">Blocked Users</SelectItem>
                <SelectItem value="admin">Admin Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Model Requests</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((userProfile) => {
                const isUpdating = updatingUser === userProfile.uid;
                const isCurrentAdmin = ADMIN_EMAILS.includes(userProfile.email);
                
                return (
                  <TableRow key={userProfile.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userProfile.photoURL || ''} alt={userProfile.displayName || "User"} />
                          <AvatarFallback>{(userProfile.displayName || userProfile.email).charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{userProfile.displayName || 'No Name'}</p>
                          <p className="text-sm text-muted-foreground">ID: {userProfile.uid.slice(0, 8)}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {userProfile.email}
                        {isCurrentAdmin && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {userProfile.blocked ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <ShieldX className="h-3 w-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1 w-fit">
                          <ShieldCheck className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={userProfile.subscription === 'premium' ? 'default' : 'secondary'}>
                        {userProfile.subscription}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {userProfile.modelRequests}/{userProfile.maxModelRequests}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {userProfile.lastLoginAt?.toLocaleDateString() || 'Never'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!isCurrentAdmin && (
                        <div className="flex gap-2">
                          {userProfile.blocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnblockUser(userProfile.uid)}
                              disabled={isUpdating}
                              className="text-green-600 hover:text-green-700"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4 mr-1" />
                                  Unblock
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBlockUser(userProfile.uid)}
                              disabled={isUpdating}
                              className="text-red-600 hover:text-red-700"
                            >
                              {isUpdating ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                              ) : (
                                <>
                                  <ShieldX className="h-4 w-4 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                      {isCurrentAdmin && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Protected
                        </Badge>
                      )}
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