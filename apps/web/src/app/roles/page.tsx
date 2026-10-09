'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Plus,
  Lock,
  CheckCircle2,
  AlertCircle,
  Users,
  Key,
  Edit2,
  Trash2,
  Sparkles,
  Info,
  Check,
  ChevronRight,
  Search,
} from 'lucide-react';
import { RoleType, PermissionCode } from '@washora/shared';

interface PermissionCatalogCategory {
  category: string;
  description: string;
  permissions: {
    code: string;
    name: string;
    description: string;
  }[];
}

interface RoleItem {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isSystem: boolean;
  permissions: string[];
  userCount?: number;
}

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogCategory[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    permissions: [] as string[],
  });

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('accessToken') || '';
    }
    return '';
  };

  const fetchRolesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();

      const [rolesRes, catalogRes] = await Promise.all([
        fetch('/api/roles', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/roles/permissions/catalog', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const rolesData = await rolesRes.json();
      const catalogData = await catalogRes.json();

      if (rolesData.success) {
        setRoles(rolesData.data || []);
        if (rolesData.data?.length > 0 && !selectedRole) {
          setSelectedRole(rolesData.data[0]);
        }
      }

      if (catalogData.success) {
        setCatalog(catalogData.data || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      name: '',
      description: '',
      permissions: [PermissionCode.ORDER_VIEW, PermissionCode.CUSTOMER_VIEW],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    if (role.isSystem) return;
    setIsEditing(true);
    setFormData({
      id: role.id,
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
    });
    setError(null);
    setIsModalOpen(true);
  };

  const togglePermission = (code: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(code);
      if (exists) {
        return { ...prev, permissions: prev.permissions.filter((p) => p !== code) };
      } else {
        return { ...prev, permissions: [...prev.permissions, code] };
      }
    });
  };

  const toggleCategory = (categoryPermissions: { code: string }[]) => {
    const codes = categoryPermissions.map((p) => p.code);
    const allSelected = codes.every((c) => formData.permissions.includes(c));

    setFormData((prev) => {
      if (allSelected) {
        return { ...prev, permissions: prev.permissions.filter((p) => !codes.includes(p)) };
      } else {
        const set = new Set([...prev.permissions, ...codes]);
        return { ...prev, permissions: Array.from(set) };
      }
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = getAuthToken();
      const url = isEditing ? `/api/roles/${formData.id}` : '/api/roles';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setIsModalOpen(false);
        setSuccessMsg(isEditing ? 'Role updated successfully' : 'Custom role created successfully');
        await fetchRolesData();
      } else {
        setError(resData.message || 'Failed to save role');
      }
    } catch (err: any) {
      setError(err.message || 'Network error saving role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this custom role?')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Role deleted');
        fetchRolesData();
      }
    } catch (err) {
      console.error('Failed to delete role', err);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Roles & Permissions (RBAC)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Level 4 SaaS Security
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure granular access controls, cash limits, and role templates for cashiers, delivery drivers, and staff.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          Create Custom Role
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Main Grid: Roles List (Left) & Selected Role Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              {filteredRoles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          role.isSystem
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}
                      >
                        {role.isSystem ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{role.name}</span>
                          {role.isSystem ? (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              System
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                          {role.description || `${role.permissions?.length || 0} permissions assigned`}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Role Permissions Breakdown */}
        <div className="lg:col-span-7">
          {selectedRole ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedRole.name}</h2>
                    {selectedRole.isSystem ? (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Default System Template
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                        Custom RBAC Role
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {selectedRole.description || 'Pre-configured permission matrix for shop operations.'}
                  </p>
                </div>

                {!selectedRole.isSystem && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(selectedRole)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit Role
                    </button>
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 flex items-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Permission Matrix for Selected Role */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Granted Permissions ({selectedRole.permissions?.length || 0})
                  </span>
                </div>

                <div className="space-y-4">
                  {catalog.map((cat) => {
                    const grantedInCat = cat.permissions.filter((p) =>
                      selectedRole.permissions.includes(p.code)
                    );
                    if (grantedInCat.length === 0) return null;

                    return (
                      <div
                        key={cat.category}
                        className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50"
                      >
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {cat.category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {grantedInCat.map((perm) => (
                            <div
                              key={perm.code}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{perm.name}</p>
                                <p className="text-[10px] text-slate-400">{perm.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-semibold">Select a role to inspect its permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Create / Edit Modal with Permission Category Toggles */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Custom Role' : 'Create Custom RBAC Role'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select specific operational permissions granted to staff members assigned to this role.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveRole} className="mt-4 flex flex-col flex-1 overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Intake Specialist, Head Ironer, Driver"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief summary of duties and access level"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Configurable Permissions ({formData.permissions.length} selected)
                  </label>

                  <div className="space-y-4">
                    {catalog.map((cat) => {
                      const allSelected = cat.permissions.every((p) =>
                        formData.permissions.includes(p.code)
                      );
                      const someSelected = cat.permissions.some((p) =>
                        formData.permissions.includes(p.code)
                      );

                      return (
                        <div
                          key={cat.category}
                          className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60"
                        >
                          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{cat.category}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{cat.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleCategory(cat.permissions)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/40"
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {cat.permissions.map((p) => {
                              const checked = formData.permissions.includes(p.code);
                              return (
                                <label
                                  key={p.code}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                                    checked
                                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
                                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100/50'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePermission(p.code)}
                                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                      {p.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {p.description}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
