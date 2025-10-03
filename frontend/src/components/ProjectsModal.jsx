import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const ProjectsModal = ({ isOpen, onClose, timeframe, onProjectUpdated }) => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingProjects, setUpdatingProjects] = useState(new Set()); // Track which projects are being updated

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, timeframe]);

  const loadProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the dedicated projects endpoint
      const response = await apiService.get('/api/projects');
      
      if (response.success) {
        setProjects(response.data || []);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error('Projects loading error:', err);
      setError('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (projectId, newStatus) => {
    // Add project to updating set for loading state
    setUpdatingProjects(prev => new Set(prev).add(projectId));
    
    try {
      // Update project status via API
      const response = await apiService.put(`/api/projects/${projectId}/status`, {
        status: newStatus
      });
      
      if (response.success) {
        // Update local state with the response data
        setProjects(projects.map(p => 
          p.id === projectId ? response.data : p
        ));
        
        // Notify parent component to refresh dashboard
        if (onProjectUpdated) {
          onProjectUpdated();
        }
      } else {
        throw new Error(response.error || 'Failed to update project status');
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
      setError('Failed to update project status: ' + err.message);
    } finally {
      // Remove project from updating set
      setUpdatingProjects(prev => {
        const next = new Set(prev);
        next.delete(projectId);
        return next;
      });
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setNewProjectName(project.name);
  };

  const handleSaveEdit = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      // Update project name via API
      const response = await apiService.put(`/api/projects/${editingProject.id}/name`, {
        name: newProjectName.trim()
      });
      
      if (response.success) {
        // Update local state with the response data
        setProjects(projects.map(p => 
          p.id === editingProject.id ? response.data : p
        ));
        
        setEditingProject(null);
        setNewProjectName('');
        
        // Notify parent component to refresh dashboard
        if (onProjectUpdated) {
          onProjectUpdated();
        }
      } else {
        throw new Error(response.error || 'Failed to update project name');
      }
    } catch (err) {
      console.error('Failed to update project name:', err);
      setError('Failed to update project name: ' + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setNewProjectName('');
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '⚪';
      case 'archived': return '🔴';
      default: return '⚫';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'completed': return 'text-gray-600 bg-gray-50';
      case 'archived': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">📁 Manage Projects</h2>
            <p className="text-sm text-gray-600 mt-1">
              View and manage your projects ({timeframe === 'all' ? 'All Time' : timeframe})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-96 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <div className="text-4xl mb-2">⚠️</div>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
              >
                Dismiss
              </button>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No projects found{searchTerm ? ` for "${searchTerm}"` : ''}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProjects.map((project) => (
                <div key={project.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg">{getStatusIcon(project.status)}</span>
                      
                      {editingProject?.id === project.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600">
                            {project.entryCount} entries
                            {project.updatedAt && (
                              <span className="ml-2">
                                • Last updated {new Date(project.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {editingProject?.id !== project.id && (
                        <>
                          {/* Status Selector */}
                          <div className="relative">
                            <select
                              value={project.status}
                              onChange={(e) => handleStatusChange(project.id, e.target.value)}
                              disabled={updatingProjects.has(project.id)}
                              className={`px-3 py-1 rounded text-sm border ${getStatusColor(project.status)} ${
                                updatingProjects.has(project.id) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="completed">Completed</option>
                              <option value="archived">Archived</option>
                            </select>
                            {updatingProjects.has(project.id) && (
                              <div className="absolute right-2 top-2">
                                <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></div>
                              </div>
                            )}
                          </div>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(project)}
                            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectsModal;