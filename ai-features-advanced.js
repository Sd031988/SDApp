/**
 * Bewerbungsstudio - Phase 6 Week 2: Advanced AI Features
 * ai-features-advanced.js
 *
 * Implements:
 * 1. Industry Classifier - Auto-detect industry from job title/keywords
 * 2. Skill Auto-Completion - Real-time skill suggestions with industry context
 * 3. Action Verb Optimizer - Context-aware verb replacement
 * 4. Keyword Density Analyzer - Analyze keyword distribution in CV
 * 5. LanguageTool API Integration - Real spell-check and grammar validation
 *
 * Version: 1.0
 * Last Updated: 2026-09-30
 */

// ============================================================================
// 1. INDUSTRY CLASSIFIER
// ============================================================================

class IndustryClassifier {
  constructor() {
    this.industryKeywords = {
      IT: ['developer', 'software', 'engineer', 'python', 'javascript', 'react', 'devops', 'cloud', 'aws', 'database', 'programmer', 'technologie', 'informatiker', 'developer', 'systemadministrator'],
      Finance: ['analyst', 'accountant', 'banker', 'auditor', 'controller', 'trader', 'financial', 'accounting', 'investment', 'finanzen', 'buchhalter', 'rechnungswesen'],
      Healthcare: ['doctor', 'nurse', 'physician', 'medical', 'therapist', 'surgeon', 'healthcare', 'patient', 'arzt', 'krankenschwester', 'pflegefachkraft', 'medizin'],
      Sales: ['sales', 'representative', 'account', 'business', 'client', 'customer', 'territory', 'quota', 'vertrieb', 'verkauf', 'akquisition'],
      Marketing: ['marketing', 'brand', 'campaign', 'digital', 'seo', 'content', 'social', 'analytics', 'marketing', 'werbung', 'kampagne'],
      Engineering: ['engineer', 'mechanical', 'electrical', 'civil', 'automotive', 'structural', 'manufacturing', 'ingenieur', 'konstruktion'],
      HR: ['human resources', 'recruiter', 'talent', 'training', 'development', 'personnel', 'hr', 'personalwesen', 'rekrutierung'],
      Legal: ['lawyer', 'attorney', 'counsel', 'legal', 'compliance', 'contract', 'anwalt', 'jurist', 'recht'],
      Education: ['teacher', 'professor', 'instructor', 'tutor', 'educator', 'academic', 'lehrer', 'professor', 'bildung'],
      Creative: ['designer', 'artist', 'creative', 'director', 'ui', 'ux', 'graphic', 'designer', 'künstler', 'kreativ']
    };

    this.confidenceThreshold = 0.4;
  }

  /**
   * Classify industry from job title and/or skills
   * @param {string} jobTitle - Job title/position
   * @param {string} skills - Skills string or array
   * @returns {Object} {industry: string, confidence: number, alternatives: array}
   */
  classify(jobTitle = '', skills = '') {
    const text = (jobTitle + ' ' + (typeof skills === 'string' ? skills : skills.join(' '))).toLowerCase();
    const scores = {};

    // Initialize scores for all industries
    Object.keys(this.industryKeywords).forEach(industry => {
      scores[industry] = 0;
    });

    // Calculate keyword matches
    Object.entries(this.industryKeywords).forEach(([industry, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          scores[industry]++;
        }
      });
    });

    // Find top matches
    const sorted = Object.entries(scores)
      .map(([industry, score]) => ({
        industry,
        score,
        confidence: score / Math.max(...Object.values(scores), 1)
      }))
      .sort((a, b) => b.score - a.score);

    return {
      industry: sorted[0]?.industry || 'IT',
      confidence: sorted[0]?.confidence || 0,
      alternatives: sorted.slice(1, 4),
      allScores: scores
    };
  }

  /**
   * Check if user is likely working in a specific industry
   * @param {Object} cvData - CV data object
   * @returns {string} Detected industry
   */
  autoDetectFromCV(cvData) {
    const jobTitle = cvData.currentCV?.experience?.[0]?.position || '';
    const skills = cvData.currentCV?.skills || [];
    const summary = cvData.currentCV?.summary || '';

    const result = this.classify(jobTitle + ' ' + summary, skills);
    return result.industry;
  }
}

// ============================================================================
// 2. SKILL AUTO-COMPLETION ENGINE
// ============================================================================

class SkillAutoCompleter {
  constructor(skillsDatabase) {
    this.skillsDb = skillsDatabase;
    this.cache = {};
  }

  /**
   * Get skill suggestions based on partial input
   * @param {string} partial - Partial skill name (e.g., "pyt")
   * @param {string} industry - Industry context
   * @param {number} limit - Max suggestions
   * @returns {array} Array of suggestion objects
   */
  suggest(partial, industry = 'IT', limit = 5) {
    if (partial.length < 2) return [];

    const lowerPartial = partial.toLowerCase();
    const industrySkills = this.skillsDb?.industries?.[industry]?.skills || [];

    const matches = industrySkills
      .filter(skill => skill.name.toLowerCase().startsWith(lowerPartial))
      .slice(0, limit)
      .map(skill => ({
        name: skill.name,
        category: skill.category,
        priority: skill.priority,
        atsWeight: skill.atsWeight,
        relatedSkills: skill.relatedSkills,
        relevanceScore: this._calculateRelevance(skill, partial)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return matches;
  }

  /**
   * Get related skills (skills that complement the selected skill)
   * @param {string} skillName - Name of the skill
   * @returns {array} Array of related skills
   */
  getRelatedSkills(skillName) {
    let relatedSkills = [];

    Object.values(this.skillsDb?.industries || {}).forEach(industry => {
      const skill = industry.skills?.find(s => s.name.toLowerCase() === skillName.toLowerCase());
      if (skill && skill.relatedSkills) {
        relatedSkills = skill.relatedSkills;
      }
    });

    return relatedSkills.slice(0, 5);
  }

  /**
   * Recommend top skills for an industry/role
   * @param {string} industry - Industry name
   * @param {number} limit - Number of skills to return
   * @returns {array} Top skills for industry
   */
  getTopSkillsForIndustry(industry = 'IT', limit = 10) {
    const skills = this.skillsDb?.industries?.[industry]?.skills || [];
    return skills
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit)
      .map(skill => ({
        name: skill.name,
        priority: skill.priority,
        atsWeight: skill.atsWeight,
        category: skill.category
      }));
  }

  _calculateRelevance(skill, partial) {
    let score = 100 - (skill.name.length - partial.length);
    score += skill.priority;
    return score;
  }
}

// ============================================================================
// 3. ACTION VERB OPTIMIZER
// ============================================================================

class ActionVerbOptimizer {
  constructor(verbDatabase) {
    this.verbDb = verbDatabase;
    this.weakVerbMap = verbDatabase?.weakVerbMap || {};
  }

  /**
   * Optimize text by replacing weak verbs with power verbs
   * @param {string} text - Text to optimize
   * @param {string} context - Context (e.g., 'management', 'innovation', 'quality')
   * @param {string} industry - Industry for context-aware replacement
   * @returns {Object} {optimized: string, replacements: array, score: number}
   */
  optimize(text, context = 'general', industry = 'IT') {
    if (!text) return { optimized: text, replacements: [], score: 0 };

    let optimized = text;
    const replacements = [];
    let replacementCount = 0;

    // Replace weak verbs with context-aware power verbs
    Object.entries(this.weakVerbMap).forEach(([weakVerb, data]) => {
      const regex = new RegExp(`\\b${weakVerb}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        // Select appropriate power verb based on context and industry
        const powerVerbs = data.powerVerbs;
        const industryVerbs = this.verbDb?.industryContext?.[industry] || [];

        // Prioritize verbs that match industry context
        const bestVerb = powerVerbs.find(v => industryVerbs.includes(v)) || powerVerbs[0];

        optimized = optimized.replace(regex, bestVerb);

        replacements.push({
          weak: weakVerb,
          power: bestVerb,
          count: matches.length,
          impact: this._getVerbImpact(bestVerb)
        });

        replacementCount += matches.length;
      }
    });

    return {
      optimized,
      replacements,
      replacementCount,
      score: Math.min(100, 50 + (replacementCount * 5)) // Impact score
    };
  }

  /**
   * Get suggested power verb replacements for a weak verb
   * @param {string} weakVerb - The weak verb to replace
   * @param {string} context - Context for selection
   * @returns {array} Suggested power verbs
   */
  getSuggestions(weakVerb, context = 'general') {
    const data = this.weakVerbMap[weakVerb.toLowerCase()];
    if (!data) return [];

    let suggestions = data.powerVerbs;

    // Filter by context if context verbs available
    const contextVerbs = this.verbDb?.contextSwitches?.[context] || [];
    if (contextVerbs.length > 0) {
      suggestions = suggestions.filter(v => contextVerbs.includes(v));
      if (suggestions.length === 0) {
        suggestions = data.powerVerbs;
      }
    }

    return suggestions;
  }

  _getVerbImpact(verb) {
    // Find verb in database and return impact level
    for (const category of Object.values(this.verbDb?.actionVerbs || {})) {
      for (const verbEntry of category.verbs || []) {
        if (verbEntry.powerVerbs?.includes(verb)) {
          return category.impact;
        }
      }
    }
    return 'Medium';
  }
}

// ============================================================================
// 4. KEYWORD DENSITY ANALYZER
// ============================================================================

class KeywordDensityAnalyzer {
  /**
   * Analyze keyword distribution in CV text
   * @param {string} text - CV text to analyze
   * @returns {Object} Keyword analysis results
   */
  analyze(text) {
    if (!text || text.length === 0) {
      return { keywords: [], totalWords: 0, density: {}, warnings: [] };
    }

    // Extract words and filter
    const words = text
      .toLowerCase()
      .match(/\b[a-zäöüß]+\b/g) || [];

    // Common stop words to exclude
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'mit', 'von', 'zu'
    ]);

    // Count keyword frequencies
    const keywords = {};
    words.forEach(word => {
      if (word.length > 3 && !stopWords.has(word)) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    });

    // Calculate density percentages
    const totalWords = words.length;
    const density = Object.entries(keywords)
      .map(([word, count]) => ({
        word,
        count,
        density: ((count / totalWords) * 100).toFixed(2) + '%',
        frequency: this._getFrequencyLabel(count / totalWords)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 keywords

    const warnings = this._generateWarnings(density, totalWords);

    return {
      keywords: density,
      totalWords,
      uniqueKeywords: Object.keys(keywords).length,
      averageWordFrequency: (totalWords / Object.keys(keywords).length).toFixed(2),
      warnings
    };
  }

  /**
   * Check if CV contains important keywords from job description
   * @param {string} cvText - CV text
   * @param {string} jobDescription - Job description text
   * @returns {Object} Keyword matching analysis
   */
  matchJobKeywords(cvText, jobDescription) {
    const cvKeywords = this._extractKeywords(cvText);
    const jobKeywords = this._extractKeywords(jobDescription);

    const matches = jobKeywords.filter(keyword =>
      cvKeywords.some(cvKeyword => cvKeyword.toLowerCase() === keyword.toLowerCase())
    );

    const matchPercentage = (matches.length / jobKeywords.length * 100).toFixed(1);

    return {
      matchedKeywords: matches,
      matchPercentage: parseFloat(matchPercentage),
      missingKeywords: jobKeywords.filter(k => !matches.includes(k)),
      recommendations: this._getKeywordRecommendations(
        jobKeywords.filter(k => !matches.includes(k))
      )
    };
  }

  _extractKeywords(text) {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'mit', 'von', 'zu'
    ]);

    return (text.toLowerCase().match(/\b[a-zäöüß]+\b/g) || [])
      .filter(word => word.length > 3 && !stopWords.has(word));
  }

  _getFrequencyLabel(density) {
    if (density > 0.03) return 'Very High';
    if (density > 0.02) return 'High';
    if (density > 0.01) return 'Medium';
    return 'Low';
  }

  _generateWarnings(density, totalWords) {
    const warnings = [];

    if (totalWords < 100) {
      warnings.push('CV text is too short for meaningful keyword analysis');
    }

    const topKeyword = density[0];
    if (topKeyword && topKeyword.count / totalWords > 0.05) {
      warnings.push(`The word "${topKeyword.word}" appears too frequently (${topKeyword.density}). Consider varying your language.`);
    }

    return warnings;
  }

  _getKeywordRecommendations(missingKeywords) {
    return missingKeywords.slice(0, 5).map(keyword => ({
      keyword,
      suggestion: `Add skills/experience related to "${keyword}" to improve job match`,
      placement: 'Skills or Experience section'
    }));
  }
}

// ============================================================================
// 5. LANGUAGETOOL API INTEGRATION
// ============================================================================

class LanguageToolChecker {
  constructor() {
    this.apiUrl = 'https://api.languagetool.org/v2/check';
    this.language = 'de'; // Default to German
    this.cache = new Map();
  }

  /**
   * Check text with LanguageTool API
   * @param {string} text - Text to check
   * @param {string} language - Language code (de, en, fr, etc.)
   * @returns {Promise} Spell/grammar check results
   */
  async check(text, language = 'de') {
    if (!text || text.length === 0) {
      return { matches: [], warnings: [], errors: [] };
    }

    // Check cache
    const cacheKey = `${text.substring(0, 50)}_${language}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('language', language);
      formData.append('enabledOnly', 'false');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.warn('LanguageTool API error:', response.status);
        return { matches: [], warnings: [], errors: [], offline: true };
      }

      const data = await response.json();
      const result = this._parseResults(data.matches, text);

      // Cache result
      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      console.warn('LanguageTool offline, using fallback checks:', error.message);
      return this._fallbackSpellCheck(text);
    }
  }

  /**
   * Fallback spell-check when API is unavailable
   * @param {string} text - Text to check
   * @returns {Object} Basic spell check results
   */
  _fallbackSpellCheck(text) {
    const issues = [];

    // Check for double spaces
    const doubleSpaces = text.match(/  +/g);
    if (doubleSpaces) {
      issues.push({
        type: 'whitespace',
        message: 'Double spaces detected',
        count: doubleSpaces.length,
        suggestions: ['Remove extra spaces'],
        severity: 'warning'
      });
    }

    // Check for common typos
    const commonTypos = {
      'teh': 'the',
      'recieve': 'receive',
      'occured': 'occurred',
      'a lot': 'a lot',
      'definately': 'definitely'
    };

    Object.entries(commonTypos).forEach(([typo, correction]) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      if (regex.test(text)) {
        issues.push({
          type: 'typo',
          message: `Possible typo: "${typo}"`,
          suggestions: [correction],
          severity: 'error'
        });
      }
    });

    return {
      matches: [],
      warnings: issues.filter(i => i.severity === 'warning'),
      errors: issues.filter(i => i.severity === 'error'),
      offline: true
    };
  }

  _parseResults(matches, text) {
    const errors = [];
    const warnings = [];

    matches.forEach(match => {
      const issue = {
        offset: match.offset,
        length: match.length,
        message: match.message,
        type: match.rule?.issueType || 'grammar',
        suggestions: match.replacements?.map(r => r.value) || [],
        context: text.substring(
          Math.max(0, match.offset - 30),
          Math.min(text.length, match.offset + match.length + 30)
        ),
        ruleId: match.rule?.id
      };

      if (match.rule?.issueType === 'whitespace' || match.rule?.issueType === 'typo') {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    });

    return { matches, errors, warnings, offline: false };
  }
}

// ============================================================================
// INTEGRATED AI ANALYSIS ENGINE
// ============================================================================

class AdvancedAIAnalysis {
  constructor(skillsDb, verbDb) {
    this.skillsDb = skillsDb;
    this.verbDb = verbDb;

    this.industryClassifier = new IndustryClassifier();
    this.skillAutoCompleter = new SkillAutoCompleter(skillsDb);
    this.actionVerbOptimizer = new ActionVerbOptimizer(verbDb);
    this.keywordAnalyzer = new KeywordDensityAnalyzer();
    this.spellChecker = new LanguageToolChecker();
  }

  /**
   * Run comprehensive AI analysis on CV
   * @param {Object} cvData - CV data object
   * @param {string} language - Language code
   * @returns {Promise} Complete analysis results
   */
  async analyzeCV(cvData, language = 'de') {
    const cv = cvData.currentCV || {};

    // Detect industry
    const industry = this.industryClassifier.autoDetectFromCV(cvData);

    // Combine all text
    const fullText = [
      cv.summary || '',
      cv.experience?.map(e => `${e.position} ${e.description}`).join(' ') || '',
      cv.skills?.join(' ') || '',
      cv.education?.map(e => `${e.degree} ${e.field}`).join(' ') || ''
    ].join(' ');

    // Run all analyses in parallel
    const [spellCheckResults, keywordAnalysis, verbOptimization] = await Promise.all([
      this.spellChecker.check(fullText, language),
      Promise.resolve(this.keywordAnalyzer.analyze(fullText)),
      Promise.resolve(this.actionVerbOptimizer.optimize(fullText, 'general', industry))
    ]);

    return {
      detectedIndustry: industry,
      spellCheck: spellCheckResults,
      keywords: keywordAnalysis,
      verbOptimization,
      topSkills: this.skillAutoCompleter.getTopSkillsForIndustry(industry, 10),
      recommendations: this._generateRecommendations(
        spellCheckResults,
        keywordAnalysis,
        verbOptimization,
        industry
      )
    };
  }

  _generateRecommendations(spellCheck, keywords, verbs, industry) {
    const recommendations = [];

    if (spellCheck.errors?.length > 0) {
      recommendations.push({
        type: 'error',
        priority: 'high',
        title: 'Fix spelling and grammar errors',
        description: `${spellCheck.errors.length} error(s) found in CV`,
        action: 'Review spell-check suggestions'
      });
    }

    if (verbs.replacementCount > 0) {
      recommendations.push({
        type: 'improvement',
        priority: 'high',
        title: 'Strengthen action verbs',
        description: `${verbs.replacementCount} weak verb(s) can be replaced with power verb(s)`,
        action: 'Apply verb optimization'
      });
    }

    if (keywords.keywords?.length > 0) {
      const topKeyword = keywords.keywords[0];
      if (topKeyword.density > 0.05) {
        recommendations.push({
          type: 'optimization',
          priority: 'medium',
          title: 'Improve keyword variety',
          description: `"${topKeyword.word}" appears frequently. Vary your language.`,
          action: 'Review keyword distribution'
        });
      }
    }

    return recommendations;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IndustryClassifier,
    SkillAutoCompleter,
    ActionVerbOptimizer,
    KeywordDensityAnalyzer,
    LanguageToolChecker,
    AdvancedAIAnalysis
  };
}
