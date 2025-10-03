const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dbService = require('../services/database');
const cache = require('../services/cache');

const router = express.Router();

// GET /api/projects - Get all projects for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search;
    const status = req.query.status;

    console.log(`📁 Loading projects for user ${userId}`);

    const projects = await dbService.executeOperation(async (prismaClient) => {
      const whereClause = { userId };
      
      // Add search filter
      if (search) {
        whereClause.name = {
          contains: search,
          mode: 'insensitive'
        };
      }
      
      // Add status filter
      if (status && status !== 'all') {
        whereClause.status = status;
      }

      return await prismaClient.project.findMany({
        where: whereClause,
        orderBy: [
          { status: 'asc' }, // Active first
          { updatedAt: 'desc' }
        ]
      });
    });

    // Transform data to include entry count
    const transformedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      status: project.status,
      entryCount: project.entryCount, // Using the denormalized field from schema
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    res.json({
      success: true,
      data: transformedProjects
    });

  } catch (error) {
    console.error('❌ Projects loading failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to load projects',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/projects/:id/status - Update project status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { status } = req.body;

    console.log(`📁 Updating project ${projectId} status to ${status} for user ${userId}`);

    // Validate status
    const validStatuses = ['active', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: active, completed, archived'
      });
    }

    const updatedProject = await dbService.executeOperation(async (prismaClient) => {
      // First verify the project belongs to the user
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Update the project status
      return await prismaClient.project.update({
        where: { id: projectId },
        data: { 
          status,
          updatedAt: new Date()
        }
      });
    });

    // Transform response
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      status: updatedProject.status,
      entryCount: updatedProject.entryCount,
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt
    };

    // Invalidate dashboard cache to ensure changes are reflected
    try {
      await cache.invalidateUserCache(userId, ['projects', 'entries']); // Also clear dashboard cache
      console.log(`✅ Cache invalidated for user ${userId} after project status update`);
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed:', cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    res.json({
      success: true,
      data: transformedProject
    });

  } catch (error) {
    console.error('❌ Project status update failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      projectId: req.params.id
    });
    
    res.status(400).json({
      success: false,
      error: error.message === 'Project not found or access denied' ? error.message : 'Failed to update project status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// PUT /api/projects/:id/name - Update project name
router.put('/:id/name', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { name } = req.body;

    console.log(`📁 Updating project ${projectId} name to "${name}" for user ${userId}`);

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Project name must be 100 characters or less'
      });
    }

    const updatedProject = await dbService.executeOperation(async (prismaClient) => {
      // First verify the project belongs to the user
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Check if name already exists for this user
      const existingProject = await prismaClient.project.findFirst({
        where: { 
          userId, 
          name: trimmedName,
          id: { not: projectId } // Exclude current project
        }
      });

      if (existingProject) {
        throw new Error('A project with this name already exists');
      }

      // Update the project name
      return await prismaClient.project.update({
        where: { id: projectId },
        data: { 
          name: trimmedName,
          updatedAt: new Date()
        }
      });
    });

    // Transform response
    const transformedProject = {
      id: updatedProject.id,
      name: updatedProject.name,
      status: updatedProject.status,
      entryCount: updatedProject.entryCount,
      createdAt: updatedProject.createdAt,
      updatedAt: updatedProject.updatedAt
    };

    // Invalidate dashboard cache to ensure changes are reflected
    try {
      await cache.invalidateUserCache(userId, ['projects', 'entries']); // Also clear dashboard cache
      console.log(`✅ Cache invalidated for user ${userId} after project name update`);
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed:', cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    res.json({
      success: true,
      data: transformedProject
    });

  } catch (error) {
    console.error('❌ Project name update failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      projectId: req.params.id
    });
    
    res.status(400).json({
      success: false,
      error: error.message.includes('not found') || error.message.includes('already exists') ? error.message : 'Failed to update project name',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/projects - Create new project
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, status = 'active' } = req.body;

    console.log(`📁 Creating new project "${name}" for user ${userId}`);

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Project name must be 100 characters or less'
      });
    }

    // Validate status
    const validStatuses = ['active', 'completed', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: active, completed, archived'
      });
    }

    const newProject = await dbService.executeOperation(async (prismaClient) => {
      // Check if name already exists for this user
      const existingProject = await prismaClient.project.findFirst({
        where: { userId, name: trimmedName }
      });

      if (existingProject) {
        throw new Error('A project with this name already exists');
      }

      // Create the project
      return await prismaClient.project.create({
        data: {
          userId,
          name: trimmedName,
          status
        }
      });
    });

    // Transform response
    const transformedProject = {
      id: newProject.id,
      name: newProject.name,
      status: newProject.status,
      entryCount: newProject.entryCount,
      createdAt: newProject.createdAt,
      updatedAt: newProject.updatedAt
    };

    // Invalidate dashboard cache to ensure changes are reflected
    try {
      await cache.invalidateUserCache(userId, ['projects', 'entries']); // Also clear dashboard cache
      console.log(`✅ Cache invalidated for user ${userId} after project creation`);
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed:', cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    res.status(201).json({
      success: true,
      data: transformedProject
    });

  } catch (error) {
    console.error('❌ Project creation failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id
    });
    
    res.status(400).json({
      success: false,
      error: error.message.includes('already exists') ? error.message : 'Failed to create project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const projectId = req.params.id;

    console.log(`📁 Deleting project ${projectId} for user ${userId}`);

    await dbService.executeOperation(async (prismaClient) => {
      // First verify the project belongs to the user
      const project = await prismaClient.project.findFirst({
        where: { id: projectId, userId }
      });

      if (!project) {
        throw new Error('Project not found or access denied');
      }

      // Check if project has entries
      if (project.entryCount > 0) {
        throw new Error('Cannot delete project with associated entries. Archive it instead.');
      }

      // Delete the project
      await prismaClient.project.delete({
        where: { id: projectId }
      });
    });

    // Invalidate dashboard cache to ensure changes are reflected
    try {
      await cache.invalidateUserCache(userId, ['projects', 'entries']); // Also clear dashboard cache
      console.log(`✅ Cache invalidated for user ${userId} after project deletion`);
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed:', cacheError.message);
      // Don't fail the request if cache invalidation fails
    }

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('❌ Project deletion failed:', {
      message: error.message,
      stack: error.stack,
      userId: req.user.id,
      projectId: req.params.id
    });
    
    res.status(400).json({
      success: false,
      error: error.message.includes('not found') || error.message.includes('Cannot delete') ? error.message : 'Failed to delete project',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;