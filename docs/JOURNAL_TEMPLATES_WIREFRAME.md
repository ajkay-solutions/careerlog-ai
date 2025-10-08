# Journal Entry Templates - UI Wireframe Design

## 📋 Issue #4: Simple, flexible templates that guide users to journal without constraining them

### 🎯 Design Goals
- **Minimal friction** - Templates should help, not hinder
- **Flexible switching** - Easy to change templates mid-writing
- **Progressive disclosure** - Show complexity only when needed
- **AI-friendly** - Any format works since AI extracts the data
- **Daily habit building** - Encourage consistent journaling

---

## 🎨 Proposed UI Design

### **Main Journal Editor Layout**

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 October 5, 2025                    🔄 [Auto-save: Saved] ✓   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Template: [Free-form ▼]  📝 [Change Template]  💡 [Tips]       │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Today's work journal...                                     │ │
│ │                                                             │ │
│ │ Tips: Mention projects, achievements, skills used,          │ │
│ │ people you worked with, challenges solved, or anything      │ │
│ │ noteworthy from your day.                                   │ │
│ │                                                             │ │
│ │ ┌─────────────────────────────────────────────────────────┐ │ │
│ │ │ [Large text area - user typing here]                   │ │ │
│ │ │                                                         │ │ │
│ │ │ Worked on the worklog-ai JWT authentication fixes...   │ │ │
│ │ │                                                         │ │ │
│ │ └─────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ 📊 Word count: 127 words    ⚡ AI Analysis: Ready              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Template Selector Dropdown**

```
┌─────────────────────────────────────────┐
│ 📝 Choose Journal Template              │
├─────────────────────────────────────────┤
│ ✓ Free-form (Default)                   │ ← Currently selected
│   Bullet Points                         │
│   Daily Reflection                      │
│   Achievement Focus                     │
│   Minimal Log                          │
│   Guided Entry                         │
├─────────────────────────────────────────┤
│ 💡 Templates help structure your        │
│    thoughts. AI extracts insights       │
│    from any format!                     │
└─────────────────────────────────────────┘
```

### **Template Examples in Editor**

#### **1. Free-form Template (Default)**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Free-form ▼                               💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 💭 Today's work journal...                                  │ │
│ │                                                             │ │
│ │ Tips: Mention projects, achievements, skills used,          │ │
│ │ people you worked with, challenges solved, or anything      │ │
│ │ noteworthy from your day.                                   │ │
│ │                                                             │ │
│ │ [User typing area]                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **2. Bullet Points Template**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Bullet Points ▼                           💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📋 Today's highlights:                                      │ │
│ │ •                                                           │ │
│ │ •                                                           │ │
│ │ •                                                           │ │
│ │                                                             │ │
│ │ 🛠️ Skills I used:                                           │ │
│ │ •                                                           │ │
│ │ •                                                           │ │
│ │                                                             │ │
│ │ 👥 People I worked with:                                    │ │
│ │ •                                                           │ │
│ │ •                                                           │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **3. Daily Reflection Template**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Daily Reflection ▼                        💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 Today I worked on:                                       │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 🏆 Something I'm proud of:                                  │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 📚 What I learned:                                          │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 🤝 Who I collaborated with:                                 │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **4. Achievement Focus Template**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Achievement Focus ▼                       💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ✅ What I accomplished:                                     │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 🔧 How I did it:                                            │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 📈 Impact or results:                                       │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **5. Minimal Log Template**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Minimal Log ▼                             💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 What I worked on today:                                  │ │
│ │                                                             │ │
│ │                                                             │ │
│ │                                                             │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

#### **6. Guided Entry Template**
```
┌─────────────────────────────────────────────────────────────────┐
│ Template: Guided Entry ▼                            💡 Tips     │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🎯 What I worked on today:                                  │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 🎉 Any wins or accomplishments?                             │ │
│ │                                                             │ │
│ │                                                             │ │
│ │ 🚧 Challenges I faced:                                      │ │
│ │                                                             │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 💡 Tips Modal/Popover

```
┌─────────────────────────────────────────────────────────────────┐
│ 💡 Journal Writing Tips                                     ✕   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🎯 **What to include in your entries:**                        │
│                                                                 │
│ • Projects you worked on                                        │
│ • Achievements and wins (big or small)                          │
│ • Skills and technologies you used                              │
│ • People you collaborated with                                  │
│ • Problems you solved                                           │
│ • Challenges you faced                                          │
│ • What you learned                                              │
│ • Meetings and key decisions                                    │
│ • Any metrics or results                                        │
│                                                                 │
│ 🤖 **Remember:** Our AI extracts insights from any format!     │
│ Write naturally - don't worry about perfect structure.         │
│                                                                 │
│ ⚡ **Pro tip:** Even 2-3 sentences are valuable for your       │
│ career growth tracking!                                         │
│                                                                 │
│     [Got it!]                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Flow & Interactions

### **Template Switching Flow**
1. User clicks template dropdown
2. Preview of selected template appears
3. **Smart switching**: If user has already typed content, show confirmation:
   ```
   ┌─────────────────────────────────────────┐
   │ ⚠️  Switch Template?                     │
   ├─────────────────────────────────────────┤
   │ You have content in your current        │
   │ template. Switching will reformat       │
   │ your entry.                             │
   │                                         │
   │ [Keep Current] [Switch Anyway]          │
   └─────────────────────────────────────────┘
   ```

### **Smart Template Suggestions**
- **New users**: Default to "Guided Entry" for first 3 entries
- **Experienced users**: Remember last template used
- **Based on content**: If user starts with bullets, suggest "Bullet Points" template

### **Progressive Disclosure**
- Templates start simple and expand as needed
- Optional prompts don't require answers
- Users can delete template prompts if they want pure free-form

---

## 🛠️ Technical Implementation Notes

### **Data Storage**
- Store user's preferred template in user preferences
- Template choice doesn't affect database schema - everything is still stored as `rawText`
- Templates are purely UI helpers

### **Template Switching Logic**
```javascript
// Pseudo-code for template switching
const switchTemplate = (newTemplate) => {
  if (hasContent && currentTemplate !== newTemplate) {
    showConfirmation(() => {
      applyTemplate(newTemplate);
      preserveUserContent();
    });
  } else {
    applyTemplate(newTemplate);
  }
};
```

### **Auto-save Considerations**
- Templates don't interfere with auto-save
- Save template preference separately from content
- Template structure is regenerated on page load

---

## 📱 Mobile Considerations

### **Responsive Template Selector**
```
Mobile (< 768px):
┌─────────────────────────────────┐
│ 📅 Oct 5, 2025     🔄 Saved ✓  │
│                                 │
│ Template: [Free-form ▼]         │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Tips: Mention projects,     │ │
│ │ achievements, skills...     │ │
│ │                             │ │
│ │ [Text area]                 │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│ 📊 127 words    ⚡ Ready        │
└─────────────────────────────────┘
```

---

## 🎨 Visual Design Details

### **Colors & Typography**
- Template labels use subtle blue accent (`text-blue-600`)
- Prompts are in lighter gray (`text-gray-600`) 
- User content in primary text color (`text-gray-900`)
- Template areas have subtle background (`bg-gray-50`)

### **Icons & Emojis**
- Each template has a distinctive emoji/icon
- Visual cues help users quickly identify templates
- Icons remain consistent across all views

### **Micro-interactions**
- Smooth transitions when switching templates
- Gentle highlight when hovering over template options
- Confirmation animations for successful saves

---

## 🧪 A/B Testing Opportunities

1. **Default template**: Free-form vs. Guided Entry for new users
2. **Template picker placement**: Top vs. sidebar vs. floating button
3. **Prompt styling**: Placeholder text vs. structured sections
4. **Tips visibility**: Always shown vs. collapsible vs. modal

---

## 🚀 Implementation Priority

### **Phase 1 (MVP)**
- Free-form (current) + 2-3 simple templates
- Basic template switcher
- Template preference storage

### **Phase 2 (Enhancement)**
- All 6 templates
- Smart suggestions
- Tips modal
- Mobile optimization

### **Phase 3 (Advanced)**
- Custom template builder
- AI-suggested templates based on writing patterns
- Team/organization template sharing

---

## 💭 Discussion Questions

1. **Should templates be more prescriptive or flexible?**
2. **How prominent should the template selector be?**
3. **Should we guide new users more heavily toward structured templates?**
4. **Do we need a "blank slate" option alongside free-form?**
5. **Should templates adapt based on user's AI analysis patterns?**

The key principle: **Templates should feel helpful, not mandatory!** 🎯