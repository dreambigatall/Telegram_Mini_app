import { useEffect, useState } from 'react';
import { Users, RefreshCw, Edit, Trash2, Search, Filter } from 'lucide-react';
import api from '../utils/api';
import {type  User, type UpdateUserPayload, type UserListResponse } from '../types';
import { UpdateUserModal } from '../components/UpdateUserModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { showToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const UserManagementPage = () => {
  const { isSuperAdmin } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(45);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    role: '' as User['role'] | '',
    isBanned: undefined as boolean | undefined,
    search: '',
  });
  
  // Modal states
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (filters.role) {
        params.append('role', filters.role);
      }
      
      if (filters.isBanned !== undefined) {
        params.append('isBanned', filters.isBanned.toString());
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      const response = await api.get<UserListResponse>(`/admin/users?${params}`);
      
      // Check if response is successful
      if (response.data && response.data.success) {
        // Set users data (handle both array and undefined)
        const usersData = Array.isArray(response.data.data) ? response.data.data : [];
        setUsers(usersData);
        
        // Backend returns total at root level (from successWithPagination)
        const totalCount = response.data.total || response.data.pagination?.total || usersData.length;
        setTotal(totalCount);
      } else {
        // Only show error if success is explicitly false
        if (response.data && response.data.success === false) {
          const message = response.data.message || 'Failed to load users';
          showToast(message, 'error');
        }
        setUsers([]);
        setTotal(0);
      }
    } catch (err: unknown) {
      // Only show error toast for actual errors (network errors, 4xx, 5xx)
      // Don't show error if it's just a response structure issue
      const errorObj = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
      if (errorObj.response && errorObj.response.status && errorObj.response.status >= 400) {
        const message = errorObj.response?.data?.error || errorObj.response?.data?.message || 'Failed to load users';
        showToast(message, 'error');
      } else if (!errorObj.response) {
        // Network error
        showToast('Network error. Please check your connection.', 'error');
      }
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.role, filters.isBanned, filters.search, isSuperAdmin]);

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="p-4 pb-24">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-center">
          <p className="font-bold">Access Denied</p>
          <p className="text-sm mt-1">Only Super Admins can access this page.</p>
        </div>
      </div>
    );
  }

  // Handle Update
  const handleUpdateClick = (user: User) => {
    setSelectedUser(user);
    setUpdateModalOpen(true);
  };

  const handleUpdate = async (id: string, data: UpdateUserPayload) => {
    try {
      await api.patch(`/admin/users/${id}`, data);
      showToast('✅ User updated successfully!', 'success');
      fetchUsers(); // Refresh list
      setUpdateModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string; message?: string } } };
      const message = errorObj.response?.data?.error || errorObj.response?.data?.message || 'Failed to update user';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  // Handle Delete
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      showToast('✅ User deleted successfully!', 'success');
      fetchUsers(); // Refresh list
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string; message?: string } } };
      const message = errorObj.response?.data?.error || errorObj.response?.data?.message || 'Failed to delete user';
      showToast(message, 'error');
      throw err; // Re-throw so modal can handle it
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof typeof filters, value: User['role'] | boolean | undefined | string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">User Management</h1>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 mb-6 space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <h2 className="font-bold text-gray-700">Filters</h2>
        </div>

        {/* Search */}
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by username or name..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Role and Ban Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Role</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value || '')}
            >
              <option value="">All Roles</option>
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-sm"
              value={filters.isBanned === undefined ? '' : filters.isBanned.toString()}
              onChange={(e) => handleFilterChange('isBanned', e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">All Users</option>
              <option value="false">Active</option>
              <option value="true">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-bold text-gray-700">
            Users ({total})
          </h2>
          <button onClick={fetchUsers} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <p>Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-white p-6 rounded-xl">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p>No users found.</p>
            {filters.search || filters.role || filters.isBanned !== undefined ? (
              <p className="text-sm mt-2">Try adjusting your filters.</p>
            ) : null}
          </div>
        ) : (
          <>
            {users.map(user => (
              <div key={user._id} className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">
                      {user.username || user.firstName || `User ${user._id.slice(-6)}`}
                    </h3>
                    <p className="text-xs text-gray-400">
                      @{user.username || 'no-username'} • {user.telegramId}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'ADMIN' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                    {user.isBanned && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        BANNED
                      </span>
                    )}
                  </div>
                </div>
                
                {user.firstName && (
                  <p className="text-sm text-gray-600 mb-2">{user.firstName}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleUpdateClick(user)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 text-sm"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg flex justify-center items-center gap-2 hover:bg-red-700 text-sm"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedUser && (
        <>
          <UpdateUserModal
            isOpen={updateModalOpen}
            onClose={() => {
              setUpdateModalOpen(false);
              setSelectedUser(null);
            }}
            user={selectedUser}
            onSubmit={handleUpdate}
          />
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            title={selectedUser.username || selectedUser.firstName || `User ${selectedUser._id.slice(-6)}`}
            itemType="User"
            onSubmit={handleDelete}
          />
        </>
      )}
    </div>
  );
};

export default UserManagementPage;

