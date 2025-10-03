const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } = require('docx');

class DOCXService {
  constructor() {
    this.defaultStyles = {
      title: {
        size: 32,
        bold: true,
        color: '2563EB'
      },
      heading: {
        size: 24,
        bold: true,
        color: '1F2937'
      },
      subheading: {
        size: 20,
        bold: true,
        color: '374151'
      },
      body: {
        size: 20,
        color: '1F2937'
      },
      small: {
        size: 18,
        color: '6B7280'
      }
    };
  }

  /**
   * Generate a DOCX buffer from journal export data
   */
  async generateJournalExportDOCX(exportData) {
    try {
      const children = [];

      // Title
      children.push(
        new Paragraph({
          text: 'WorkLog AI - Journal Export',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Export metadata
      this._addExportMetadata(children, exportData);

      // Summary section
      if (exportData.summary) {
        this._addSummarySection(children, exportData.summary);
      }

      // Journal entries
      if (exportData.entries && exportData.entries.length > 0) {
        this._addJournalEntries(children, exportData.entries);
      }

      // Projects section
      if (exportData.projects && exportData.projects.length > 0) {
        this._addProjectsSection(children, exportData.projects);
      }

      // Skills section
      if (exportData.skills && exportData.skills.length > 0) {
        this._addSkillsSection(children, exportData.skills);
      }

      // Competencies section
      if (exportData.competencies && exportData.competencies.length > 0) {
        this._addCompetenciesSection(children, exportData.competencies);
      }

      // Footer
      this._addFooter(children);

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      return await Packer.toBuffer(doc);

    } catch (error) {
      throw new Error(`DOCX generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a DOCX buffer from performance review text
   */
  async generatePerformanceReviewDOCX(reviewData) {
    try {
      const children = [];

      // Title
      children.push(
        new Paragraph({
          text: 'Performance Review',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Metadata
      if (reviewData.metadata) {
        this._addPerformanceReviewMetadata(children, reviewData.metadata);
      }

      // Review content
      this._addFormattedText(children, reviewData.review);

      // Footer
      this._addFooter(children);

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      return await Packer.toBuffer(doc);

    } catch (error) {
      throw new Error(`Performance review DOCX generation failed: ${error.message}`);
    }
  }

  /**
   * Generate a DOCX buffer from resume bullets
   */
  async generateResumeBulletsDOCX(bulletsData) {
    try {
      const children = [];

      // Title
      children.push(
        new Paragraph({
          text: 'Resume Bullet Points',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      );

      // Metadata
      if (bulletsData.metadata) {
        this._addResumeBulletsMetadata(children, bulletsData.metadata);
      }

      // Bullets content
      this._addFormattedText(children, bulletsData.bullets);

      // Footer
      this._addFooter(children);

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      return await Packer.toBuffer(doc);

    } catch (error) {
      throw new Error(`Resume bullets DOCX generation failed: ${error.message}`);
    }
  }

  // Private helper methods
  _addExportMetadata(children, exportData) {
    children.push(
      new Paragraph({
        text: 'Export Information',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (exportData.user) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `User: ${exportData.user.displayName} (${exportData.user.email})`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (exportData.period) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Period: ${exportData.period.startDate} to ${exportData.period.endDate}`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (exportData.summary?.exportedAt) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Generated: ${new Date(exportData.summary.exportedAt).toLocaleString()}`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 300 }
        })
      );
    }
  }

  _addSummarySection(children, summary) {
    children.push(
      new Paragraph({
        text: 'Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Entries: ${summary.totalEntries || 0}`,
            size: this.defaultStyles.body.size
          })
        ],
        spacing: { after: 100 }
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Words: ${summary.totalWords?.toLocaleString() || 0}`,
            size: this.defaultStyles.body.size
          })
        ],
        spacing: { after: 100 }
      })
    );

    if (summary.isLimited) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Note: Showing latest ${summary.limitApplied} entries`,
              size: this.defaultStyles.small.size,
              color: this.defaultStyles.small.color,
              italics: true
            })
          ],
          spacing: { after: 300 }
        })
      );
    }
  }

  _addJournalEntries(children, entries) {
    children.push(
      new Paragraph({
        text: 'Journal Entries',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    entries.forEach((entry, index) => {
      // Entry header
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Entry ${index + 1} - ${entry.date}${entry.isHighlight ? ' ⭐' : ''}`,
              size: this.defaultStyles.subheading.size,
              bold: true,
              color: this.defaultStyles.title.color
            })
          ],
          spacing: { before: 300, after: 150 }
        })
      );

      // Entry content
      if (entry.rawText) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: entry.rawText,
                size: this.defaultStyles.body.size
              })
            ],
            spacing: { after: 150 }
          })
        );
      }

      // AI Analysis
      if (entry.extractedData) {
        this._addEntryAnalysis(children, entry.extractedData);
      }

      children.push(
        new Paragraph({
          text: '',
          spacing: { after: 300 }
        })
      );
    });
  }

  _addEntryAnalysis(children, extractedData) {
    try {
      const analysis = typeof extractedData === 'string' 
        ? JSON.parse(extractedData) 
        : extractedData;

      if (analysis.projects && analysis.projects.length > 0) {
        const projectNames = analysis.projects.map(p => 
          typeof p === 'object' ? (p.name || p.title || JSON.stringify(p)) : p
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Projects: ${projectNames.join(', ')}`,
                size: this.defaultStyles.small.size,
                color: this.defaultStyles.small.color
              })
            ],
            spacing: { after: 100 }
          })
        );
      }

      if (analysis.skills && analysis.skills.length > 0) {
        const skillNames = analysis.skills.map(s => 
          typeof s === 'object' ? (s.name || s.skill || JSON.stringify(s)) : s
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Skills: ${skillNames.join(', ')}`,
                size: this.defaultStyles.small.size,
                color: this.defaultStyles.small.color
              })
            ],
            spacing: { after: 100 }
          })
        );
      }

      if (analysis.competencies && analysis.competencies.length > 0) {
        const competencyNames = analysis.competencies.map(c => 
          typeof c === 'object' ? (c.name || c.competency || JSON.stringify(c)) : c
        );
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Competencies: ${competencyNames.join(', ')}`,
                size: this.defaultStyles.small.size,
                color: this.defaultStyles.small.color
              })
            ],
            spacing: { after: 100 }
          })
        );
      }

    } catch (error) {
      console.warn('Error parsing extracted data for DOCX:', error);
    }
  }

  _addProjectsSection(children, projects) {
    children.push(
      new Paragraph({
        text: 'Projects Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    projects.forEach(project => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${project.name} (${project.status}) - ${project.entryCount} entries`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    });

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 300 }
      })
    );
  }

  _addSkillsSection(children, skills) {
    children.push(
      new Paragraph({
        text: 'Skills Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    skills.forEach(skill => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${skill.name} (${skill.category || 'general'}) - used ${skill.usageCount} times`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    });

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 300 }
      })
    );
  }

  _addCompetenciesSection(children, competencies) {
    children.push(
      new Paragraph({
        text: 'Competencies Summary',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    competencies.forEach(comp => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `• ${comp.name} - demonstrated ${comp.demonstrationCount} times`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    });

    children.push(
      new Paragraph({
        text: '',
        spacing: { after: 300 }
      })
    );
  }

  _addPerformanceReviewMetadata(children, metadata) {
    children.push(
      new Paragraph({
        text: 'Review Information',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (metadata.period) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Period: ${metadata.period.startDate || 'Start'} to ${metadata.period.endDate || 'Present'} (${metadata.period.timeframe})`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (metadata.sourceData) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Based on: ${metadata.sourceData.entries} entries, ${metadata.sourceData.projects} projects, ${metadata.sourceData.skills} skills`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date(metadata.generatedAt).toLocaleString()}`,
            size: this.defaultStyles.body.size
          })
        ],
        spacing: { after: 300 }
      })
    );
  }

  _addResumeBulletsMetadata(children, metadata) {
    children.push(
      new Paragraph({
        text: 'Resume Information',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    );

    if (metadata.targetRole) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Target Role: ${metadata.targetRole}`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (metadata.industry) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Industry: ${metadata.industry}`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (metadata.period) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Period: ${metadata.period.startDate || 'Start'} to ${metadata.period.endDate || 'Present'} (${metadata.period.timeframe})`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    if (metadata.sourceData) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Based on: ${metadata.sourceData.entries} achievements, ${metadata.sourceData.projects} projects, ${metadata.sourceData.skills} skills`,
              size: this.defaultStyles.body.size
            })
          ],
          spacing: { after: 100 }
        })
      );
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated: ${new Date(metadata.generatedAt).toLocaleString()}`,
            size: this.defaultStyles.body.size
          })
        ],
        spacing: { after: 300 }
      })
    );
  }

  _addFormattedText(children, text) {
    if (!text) return;

    const lines = text.split('\n');
    
    lines.forEach(line => {
      if (line.trim() === '') {
        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 150 }
          })
        );
        return;
      }

      // Handle headers
      if (line.startsWith('# ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(2),
                size: this.defaultStyles.heading.size,
                bold: true,
                color: this.defaultStyles.title.color
              })
            ],
            spacing: { before: 300, after: 200 }
          })
        );
      } else if (line.startsWith('## ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(3),
                size: this.defaultStyles.subheading.size,
                bold: true,
                color: this.defaultStyles.heading.color
              })
            ],
            spacing: { before: 250, after: 150 }
          })
        );
      } else if (line.startsWith('### ')) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(4),
                size: this.defaultStyles.body.size,
                bold: true,
                color: this.defaultStyles.heading.color
              })
            ],
            spacing: { before: 200, after: 100 }
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('• ')) {
        // Bullet points
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: this.defaultStyles.body.size
              })
            ],
            spacing: { after: 100 },
            indent: { left: 360 } // 0.25 inch indent
          })
        );
      } else if (line.startsWith('**') && line.endsWith('**')) {
        // Bold text
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.substring(2, line.length - 2),
                size: this.defaultStyles.body.size,
                bold: true
              })
            ],
            spacing: { after: 100 }
          })
        );
      } else {
        // Regular text
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line,
                size: this.defaultStyles.body.size
              })
            ],
            spacing: { after: 100 }
          })
        );
      }
    });
  }

  _addFooter(children) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by WorkLog AI',
            size: this.defaultStyles.small.size,
            color: this.defaultStyles.small.color,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 }
      })
    );
  }
}

module.exports = DOCXService;