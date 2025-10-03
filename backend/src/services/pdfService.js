const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  constructor() {
    this.defaultOptions = {
      margin: 72, // 1 inch margins
      fontSize: {
        title: 18,
        heading: 14,
        body: 11,
        small: 9
      },
      colors: {
        primary: '#2563EB',
        text: '#1F2937',
        subtitle: '#6B7280',
        border: '#E5E7EB'
      }
    };
  }

  /**
   * Generate a PDF buffer from journal export data
   */
  async generateJournalExportPDF(exportData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: this.defaultOptions.margin,
          info: {
            Title: 'WorkLog AI - Journal Export',
            Author: exportData.user?.displayName || 'WorkLog AI User',
            Subject: `Journal Export - ${exportData.period?.startDate} to ${exportData.period?.endDate}`,
            Creator: 'WorkLog AI'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Header
        this._addHeader(doc, 'WorkLog AI - Journal Export');
        
        // Export metadata
        this._addExportMetadata(doc, exportData);
        
        // Summary section
        this._addSummarySection(doc, exportData.summary);
        
        // Journal entries
        if (exportData.entries && exportData.entries.length > 0) {
          this._addJournalEntries(doc, exportData.entries);
        }
        
        // Projects section
        if (exportData.projects && exportData.projects.length > 0) {
          this._addProjectsSection(doc, exportData.projects);
        }
        
        // Skills section
        if (exportData.skills && exportData.skills.length > 0) {
          this._addSkillsSection(doc, exportData.skills);
        }
        
        // Competencies section
        if (exportData.competencies && exportData.competencies.length > 0) {
          this._addCompetenciesSection(doc, exportData.competencies);
        }
        
        // Footer
        this._addFooter(doc);
        
        doc.end();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF buffer from performance review text
   */
  async generatePerformanceReviewPDF(reviewData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: this.defaultOptions.margin,
          info: {
            Title: 'Personal Performance Review',
            Author: reviewData.metadata?.sourceData ? 'WorkLog AI Generated' : 'WorkLog AI User',
            Subject: `Performance Review - ${reviewData.metadata?.period?.timeframe || 'Period'}`,
            Creator: 'WorkLog AI'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Header
        this._addHeader(doc, 'Personal Performance Review');
        
        // Metadata
        if (reviewData.metadata) {
          this._addPerformanceReviewMetadata(doc, reviewData.metadata);
        }
        
        // Review content (markdown-formatted text)
        this._addFormattedText(doc, reviewData.review);
        
        // Footer
        this._addFooter(doc);
        
        doc.end();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a PDF buffer from resume bullets
   */
  async generateResumeBulletsPDF(bulletsData) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: this.defaultOptions.margin,
          info: {
            Title: 'Resume Bullet Points',
            Author: bulletsData.metadata?.targetRole ? `${bulletsData.metadata.targetRole} Candidate` : 'WorkLog AI User',
            Subject: `Resume Bullets - ${bulletsData.metadata?.period?.timeframe || 'Period'}`,
            Creator: 'WorkLog AI'
          }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Header
        this._addHeader(doc, 'Resume Bullet Points');
        
        // Metadata
        if (bulletsData.metadata) {
          this._addResumeBulletsMetadata(doc, bulletsData.metadata);
        }
        
        // Bullets content
        this._addFormattedText(doc, bulletsData.bullets);
        
        // Footer
        this._addFooter(doc);
        
        doc.end();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Private helper methods
  _addHeader(doc, title) {
    doc.fontSize(this.defaultOptions.fontSize.title)
       .fillColor(this.defaultOptions.colors.primary)
       .text(title, { align: 'center' });
    
    doc.moveDown(0.5);
    
    // Add line under header
    doc.strokeColor(this.defaultOptions.colors.border)
       .lineWidth(1)
       .moveTo(this.defaultOptions.margin, doc.y)
       .lineTo(doc.page.width - this.defaultOptions.margin, doc.y)
       .stroke();
    
    doc.moveDown(1);
  }

  _addExportMetadata(doc, exportData) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Export Information', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(this.defaultOptions.fontSize.body)
       .fillColor(this.defaultOptions.colors.text);
    
    if (exportData.user) {
      doc.text(`User: ${exportData.user.displayName} (${exportData.user.email})`);
    }
    
    if (exportData.period) {
      doc.text(`Period: ${exportData.period.startDate} to ${exportData.period.endDate}`);
    }
    
    if (exportData.summary?.exportedAt) {
      doc.text(`Generated: ${new Date(exportData.summary.exportedAt).toLocaleString()}`);
    }
    
    doc.moveDown(1);
  }

  _addSummarySection(doc, summary) {
    if (!summary) return;
    
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Summary', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(this.defaultOptions.fontSize.body)
       .fillColor(this.defaultOptions.colors.text);
    
    doc.text(`Total Entries: ${summary.totalEntries || 0}`);
    doc.text(`Total Words: ${summary.totalWords?.toLocaleString() || 0}`);
    
    if (summary.isLimited) {
      doc.text(`Note: Showing latest ${summary.limitApplied} entries`, {
        fillColor: this.defaultOptions.colors.subtitle
      });
    }
    
    doc.moveDown(1);
  }

  _addJournalEntries(doc, entries) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Journal Entries', { underline: true });
    
    doc.moveDown(0.5);
    
    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (doc.y > doc.page.height - 200) {
        doc.addPage();
      }
      
      // Entry header
      doc.fontSize(this.defaultOptions.fontSize.body)
         .fillColor(this.defaultOptions.colors.primary)
         .text(`Entry ${index + 1} - ${entry.date}${entry.isHighlight ? ' ⭐' : ''}`, {
           underline: true
         });
      
      doc.moveDown(0.3);
      
      // Entry content
      if (entry.rawText) {
        doc.fontSize(this.defaultOptions.fontSize.body)
           .fillColor(this.defaultOptions.colors.text)
           .text(entry.rawText, {
             width: doc.page.width - (this.defaultOptions.margin * 2),
             align: 'left'
           });
      }
      
      doc.moveDown(0.3);
      
      // AI Analysis
      if (entry.extractedData) {
        this._addEntryAnalysis(doc, entry.extractedData);
      }
      
      doc.moveDown(0.8);
    });
  }

  _addEntryAnalysis(doc, extractedData) {
    try {
      const analysis = typeof extractedData === 'string' 
        ? JSON.parse(extractedData) 
        : extractedData;
      
      doc.fontSize(this.defaultOptions.fontSize.small)
         .fillColor(this.defaultOptions.colors.subtitle);
      
      if (analysis.projects && analysis.projects.length > 0) {
        const projectNames = analysis.projects.map(p => 
          typeof p === 'object' ? (p.name || p.title || JSON.stringify(p)) : p
        );
        doc.text(`Projects: ${projectNames.join(', ')}`);
      }
      
      if (analysis.skills && analysis.skills.length > 0) {
        const skillNames = analysis.skills.map(s => 
          typeof s === 'object' ? (s.name || s.skill || JSON.stringify(s)) : s
        );
        doc.text(`Skills: ${skillNames.join(', ')}`);
      }
      
      if (analysis.competencies && analysis.competencies.length > 0) {
        const competencyNames = analysis.competencies.map(c => 
          typeof c === 'object' ? (c.name || c.competency || JSON.stringify(c)) : c
        );
        doc.text(`Competencies: ${competencyNames.join(', ')}`);
      }
      
    } catch (error) {
      console.warn('Error parsing extracted data for PDF:', error);
    }
  }

  _addProjectsSection(doc, projects) {
    doc.addPage();
    
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Projects Summary', { underline: true });
    
    doc.moveDown(0.5);
    
    projects.forEach(project => {
      doc.fontSize(this.defaultOptions.fontSize.body)
         .fillColor(this.defaultOptions.colors.text)
         .text(`• ${project.name} (${project.status}) - ${project.entryCount} entries`);
    });
    
    doc.moveDown(1);
  }

  _addSkillsSection(doc, skills) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Skills Summary', { underline: true });
    
    doc.moveDown(0.5);
    
    skills.forEach(skill => {
      doc.fontSize(this.defaultOptions.fontSize.body)
         .fillColor(this.defaultOptions.colors.text)
         .text(`• ${skill.name} (${skill.category || 'general'}) - used ${skill.usageCount} times`);
    });
    
    doc.moveDown(1);
  }

  _addCompetenciesSection(doc, competencies) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Competencies Summary', { underline: true });
    
    doc.moveDown(0.5);
    
    competencies.forEach(comp => {
      doc.fontSize(this.defaultOptions.fontSize.body)
         .fillColor(this.defaultOptions.colors.text)
         .text(`• ${comp.name} - demonstrated ${comp.demonstrationCount} times`);
    });
    
    doc.moveDown(1);
  }

  _addPerformanceReviewMetadata(doc, metadata) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Review Information', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(this.defaultOptions.fontSize.body)
       .fillColor(this.defaultOptions.colors.text);
    
    if (metadata.period) {
      doc.text(`Period: ${metadata.period.startDate || 'Start'} to ${metadata.period.endDate || 'Present'} (${metadata.period.timeframe})`);
    }
    
    if (metadata.sourceData) {
      doc.text(`Based on: ${metadata.sourceData.entries} entries, ${metadata.sourceData.projects} projects, ${metadata.sourceData.skills} skills`);
    }
    
    doc.text(`Generated: ${new Date(metadata.generatedAt).toLocaleString()}`);
    
    doc.moveDown(1);
  }

  _addResumeBulletsMetadata(doc, metadata) {
    doc.fontSize(this.defaultOptions.fontSize.heading)
       .fillColor(this.defaultOptions.colors.text)
       .text('Resume Information', { underline: true });
    
    doc.moveDown(0.5);
    
    doc.fontSize(this.defaultOptions.fontSize.body)
       .fillColor(this.defaultOptions.colors.text);
    
    if (metadata.targetRole) {
      doc.text(`Target Role: ${metadata.targetRole}`);
    }
    
    if (metadata.industry) {
      doc.text(`Industry: ${metadata.industry}`);
    }
    
    if (metadata.period) {
      doc.text(`Period: ${metadata.period.startDate || 'Start'} to ${metadata.period.endDate || 'Present'} (${metadata.period.timeframe})`);
    }
    
    if (metadata.sourceData) {
      doc.text(`Based on: ${metadata.sourceData.entries} achievements, ${metadata.sourceData.projects} projects, ${metadata.sourceData.skills} skills`);
    }
    
    doc.text(`Generated: ${new Date(metadata.generatedAt).toLocaleString()}`);
    
    doc.moveDown(1);
  }

  _addFormattedText(doc, text) {
    if (!text) return;
    
    // Simple markdown parsing for basic formatting
    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.trim() === '') {
        doc.moveDown(0.5);
        return;
      }
      
      // Handle headers
      if (line.startsWith('# ')) {
        doc.fontSize(this.defaultOptions.fontSize.heading)
           .fillColor(this.defaultOptions.colors.primary)
           .text(line.substring(2), { underline: true });
        doc.moveDown(0.5);
      } else if (line.startsWith('## ')) {
        doc.fontSize(this.defaultOptions.fontSize.body + 1)
           .fillColor(this.defaultOptions.colors.text)
           .text(line.substring(3), { underline: true });
        doc.moveDown(0.3);
      } else if (line.startsWith('### ')) {
        doc.fontSize(this.defaultOptions.fontSize.body)
           .fillColor(this.defaultOptions.colors.text)
           .text(line.substring(4), { underline: true });
        doc.moveDown(0.3);
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        // Bullet points
        doc.fontSize(this.defaultOptions.fontSize.body)
           .fillColor(this.defaultOptions.colors.text)
           .text(line, { indent: 20 });
      } else {
        // Regular text
        doc.fontSize(this.defaultOptions.fontSize.body)
           .fillColor(this.defaultOptions.colors.text)
           .text(line);
      }
    });
  }

  _addFooter(doc) {
    // Add footer on last page
    doc.fontSize(this.defaultOptions.fontSize.small)
       .fillColor(this.defaultOptions.colors.subtitle)
       .text('Generated by WorkLog AI', 
         this.defaultOptions.margin, 
         doc.page.height - this.defaultOptions.margin, 
         { align: 'center' });
  }
}

module.exports = PDFService;