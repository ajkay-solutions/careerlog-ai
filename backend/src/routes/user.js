const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get current user profile with all provider information
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserProvider: {
          orderBy: { lastUsed: 'desc' }
        },
        _count: {
          select: {
            Entry: true,
            Project: true,
            Skill: true,
            Competency: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Select best profile photo from providers
    const bestPhoto = user.UserProvider.find(p => p.profilePhoto)?.profilePhoto || user.profilePhoto || '';
    
    // Get connected providers info
    const connectedProviders = user.UserProvider.map(p => ({
      provider: p.provider,
      displayName: p.displayName,
      email: p.email,
      hasProfilePhoto: !!p.profilePhoto,
      lastUsed: p.lastUsed,
      connected: true
    }));

    // Add unconnected providers
    const allProviders = ['google', 'linkedin'];
    const connectedProviderNames = connectedProviders.map(p => p.provider);
    const unconnectedProviders = allProviders
      .filter(p => !connectedProviderNames.includes(p))
      .map(p => ({
        provider: p,
        connected: false
      }));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          profilePhoto: bestPhoto,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt
        },
        providers: [...connectedProviders, ...unconnectedProviders],
        stats: {
          entries: user._count.Entry,
          projects: user._count.Project,
          skills: user._count.Skill,
          competencies: user._count.Competency
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
});

// Get user's connected providers
router.get('/providers', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const providers = await prisma.userProvider.findMany({
      where: { userId },
      orderBy: { lastUsed: 'desc' },
      select: {
        id: true,
        provider: true,
        displayName: true,
        email: true,
        profilePhoto: true,
        lastUsed: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('❌ Error fetching providers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch providers' 
    });
  }
});

// Disconnect a provider (remove UserProvider record)
router.delete('/providers/:provider', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    
    // Check if user has more than one provider
    const providerCount = await prisma.userProvider.count({
      where: { userId }
    });

    if (providerCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot disconnect the only authentication method'
      });
    }

    // Delete the provider
    await prisma.userProvider.deleteMany({
      where: {
        userId,
        provider
      }
    });

    res.json({
      success: true,
      message: `${provider} disconnected successfully`
    });
  } catch (error) {
    console.error('❌ Error disconnecting provider:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to disconnect provider' 
    });
  }
});

module.exports = router;