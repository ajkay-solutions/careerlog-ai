const express = require('express');
const axios = require('axios');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/avatar/proxy - Proxy user's profile picture to avoid CORS issues
router.get('/proxy', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's profile photo URL from database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true, displayName: true }
    });
    
    if (!user || !user.profilePhoto) {
      return res.status(404).json({
        success: false,
        error: 'No profile photo found'
      });
    }
    
    // If it's already a data URL or internal URL, redirect
    if (user.profilePhoto.startsWith('data:') || user.profilePhoto.startsWith('/')) {
      return res.redirect(user.profilePhoto);
    }
    
    // If it's an external URL (LinkedIn, Google), proxy it
    if (user.profilePhoto.startsWith('http')) {
      try {
        const imageResponse = await axios.get(user.profilePhoto, {
          responseType: 'stream',
          timeout: 10000,
          headers: {
            'User-Agent': 'WorkLog-AI/1.0 (+https://worklog.ajkaysolutions.com)',
            'Accept': 'image/*'
          }
        });
        
        // Set appropriate headers
        res.set({
          'Content-Type': imageResponse.headers['content-type'] || 'image/jpeg',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*'
        });
        
        // Pipe the image data
        imageResponse.data.pipe(res);
        
      } catch (proxyError) {
        console.error('Error proxying profile image:', proxyError.message);
        return res.status(404).json({
          success: false,
          error: 'Failed to load profile image'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid profile photo URL'
      });
    }
    
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to proxy avatar'
    });
  }
});

module.exports = router;