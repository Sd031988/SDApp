// AI-Powered Content Suggestions for CV Improvement
// Uses pattern matching and best practices to suggest improvements

class CVSuggestionEngine {
    constructor() {
        this.suggestions = [];
        this.scoreBreakdown = {};
    }

    // Main function to analyze CV and generate suggestions
    analyzeCVContent(cvData) {
        this.suggestions = [];
        this.scoreBreakdown = {
            personal: 0,
            experience: 0,
            education: 0,
            skills: 0,
            overall: 0
        };

        // Analyze each section
        this.analyzePersonalInfo(cvData);
        this.analyzeExperience(cvData.experiences);
        this.analyzeEducation(cvData.educations);
        this.analyzeSkills(cvData);
        
        // Calculate overall score
        this.calculateOverallScore();

        return {
            suggestions: this.suggestions,
            scores: this.scoreBreakdown,
            totalScore: this.scoreBreakdown.overall
        };
    }

    analyzePersonalInfo(data) {
        const score = { total: 100, deductions: 0 };

        // Check name length
        if (!data.name || data.name.length < 2) {
            this.addSuggestion('high', 'Persönliche Informationen',
                'Geben Sie Ihren vollständigen Namen ein',
                'Ein klarer Name ist wichtig für die Identifikation');
            score.deductions += 20;
        }

        // Check title
        if (!data.title) {
            this.addSuggestion('medium', 'Persönliche Informationen',
                'Fügen Sie eine berufliche Titel/Position hinzu',
                'Dies hilft Arbeitgebern, Ihren Bereich sofort zu verstehen');
            score.deductions += 15;
        }

        // Check contact information
        if (!data.email || !data.email.includes('@')) {
            this.addSuggestion('high', 'Kontaktinformationen',
                'Bitte geben Sie eine gültige Email-Adresse an',
                'Arbeitgeber müssen Sie kontaktieren können');
            score.deductions += 15;
        }

        if (!data.phone) {
            this.addSuggestion('medium', 'Kontaktinformationen',
                'Fügen Sie eine Telefonnummer hinzu',
                'Telefonnummern ermöglichen schnellere Kontaktaufnahme');
            score.deductions += 10;
        }

        // Check summary
        if (!data.summary) {
            this.addSuggestion('medium', 'Berufliche Zusammenfassung',
                'Schreiben Sie eine kurze berufliche Zusammenfassung (2-3 Sätze)',
                'Eine gute Zusammenfassung macht Ihren Lebenslauf interessant');
            score.deductions += 15;
        } else if (data.summary.length < 30) {
            this.addSuggestion('low', 'Berufliche Zusammenfassung',
                'Erweitern Sie Ihre Zusammenfassung um mehr Details',
                'Mehr Kontext hilft Arbeitgebern Sie besser zu verstehen');
            score.deductions += 10;
        } else if (data.summary.length > 500) {
            this.addSuggestion('low', 'Berufliche Zusammenfassung',
                'Kürzen Sie Ihre Zusammenfassung (max. 250 Wörter empfohlen)',
                'Kürzer ist besser - Arbeitgeber haben wenig Zeit');
            score.deductions += 5;
        }

        this.scoreBreakdown.personal = Math.max(0, score.total - score.deductions);
    }

    analyzeExperience(experiences) {
        const score = { total: 100, deductions: 0 };

        if (!experiences || experiences.length === 0) {
            this.addSuggestion('high', 'Berufserfahrung',
                'Fügen Sie mindestens eine Berufserfahrung hinzu',
                'Die Berufserfahrung ist der wichtigste Bestandteil Ihres Lebenslaufs');
            score.deductions += 50;
        } else {
            experiences.forEach((exp, index) => {
                const expNum = index + 1;

                if (!exp.position) {
                    this.addSuggestion('high', `Berufserfahrung #${expNum}`,
                        'Geben Sie die Position/Jobtitel an',
                        'Die Position ist essentiell für Ihre Karrieregeschichte');
                    score.deductions += 15;
                }

                if (!exp.company) {
                    this.addSuggestion('high', `Berufserfahrung #${expNum}`,
                        'Geben Sie den Unternehmensnamen an',
                        'Der Name des Unternehmens ist wichtig für Kontext');
                    score.deductions += 10;
                }

                if (!exp.description || exp.description.length < 20) {
                    this.addSuggestion('high', `Berufserfahrung #${expNum}`,
                        'Beschreiben Sie Ihre Tätigkeiten und Erfolge',
                        'Detaillierte Beschreibungen zeigen Ihre Fähigkeiten. Nutzen Sie Action Verbs!');
                    score.deductions += 15;
                } else if (!this.hasActionVerbs(exp.description)) {
                    this.addSuggestion('medium', `Berufserfahrung #${expNum}`,
                        'Nutzen Sie mehr Action Verben in der Beschreibung',
                        'Verben wie "entwickelt", "geleitet", "verbessert" wirken aktiver');
                    score.deductions += 10;
                }

                if (!exp.startDate) {
                    this.addSuggestion('medium', `Berufserfahrung #${expNum}`,
                        'Geben Sie ein Startdatum an',
                        'Zeitangaben sind wichtig für die Karrierentwicklung');
                    score.deductions += 10;
                }

                // Check for numbers and metrics
                if (exp.description && !this.hasMetrics(exp.description)) {
                    this.addSuggestion('medium', `Berufserfahrung #${expNum}`,
                        'Nutzen Sie Zahlen und Metriken (z.B. "50% Steigerung")',
                        'Konkrete Zahlen zeigen messbare Erfolge');
                    score.deductions += 8;
                }
            });
        }

        this.scoreBreakdown.experience = Math.max(0, score.total - score.deductions);
    }

    analyzeEducation(educations) {
        const score = { total: 100, deductions: 0 };

        if (!educations || educations.length === 0) {
            this.addSuggestion('medium', 'Ausbildung',
                'Fügen Sie mindestens einen Bildungsabschluss hinzu',
                'Bildungsinformationen sind wichtig für viele Positionen');
            score.deductions += 30;
        } else {
            educations.forEach((edu, index) => {
                const eduNum = index + 1;

                if (!edu.school) {
                    this.addSuggestion('medium', `Ausbildung #${eduNum}`,
                        'Geben Sie den Namen der Schule/Universität an',
                        'Der Schulname ist für Kontext wichtig');
                    score.deductions += 10;
                }

                if (!edu.degree) {
                    this.addSuggestion('medium', `Ausbildung #${eduNum}`,
                        'Geben Sie den Abschlusstyp an (z.B. Bachelor, Master)',
                        'Der Abschlusstyp ist wichtig für Qualifikationen');
                    score.deductions += 10;
                }

                if (!edu.field) {
                    this.addSuggestion('low', `Ausbildung #${eduNum}`,
                        'Geben Sie Ihr Fachgebiet/Spezialisierung an',
                        'Dies hilft zu verdeutlichen, was Sie studiert haben');
                    score.deductions += 5;
                }

                if (!edu.graduationDate) {
                    this.addSuggestion('low', `Ausbildung #${eduNum}`,
                        'Geben Sie das Abschlussdatum an',
                        'Zeitangaben helfen bei der Chronologie Ihrer Karriere');
                    score.deductions += 5;
                }
            });
        }

        this.scoreBreakdown.education = Math.max(0, score.total - score.deductions);
    }

    analyzeSkills(data) {
        const score = { total: 100, deductions: 0 };

        const technicalSkills = data.technicalSkills || '';
        const languages = data.languages || '';
        const otherSkills = data.otherSkills || '';

        // Check technical skills
        if (!technicalSkills || technicalSkills.length < 5) {
            this.addSuggestion('high', 'Fachkompetenzen',
                'Fügen Sie Ihre technischen Fähigkeiten hinzu',
                'Technische Skills sind für viele Jobs entscheidend');
            score.deductions += 25;
        } else if (technicalSkills.split(',').length < 3) {
            this.addSuggestion('medium', 'Fachkompetenzen',
                'Fügen Sie mehr technische Fähigkeiten hinzu (mindestens 3-5)',
                'Eine breitere Palette zeigt Vielseitigkeit');
            score.deductions += 10;
        }

        // Check languages
        if (!languages || languages.length < 3) {
            this.addSuggestion('medium', 'Sprachen',
                'Geben Sie Ihre Sprachkenntnisse an',
                'Mehrsprachigkeit ist ein großes Plus');
            score.deductions += 15;
        }

        // Check soft skills
        if (!otherSkills || otherSkills.length < 5) {
            this.addSuggestion('medium', 'Soft Skills',
                'Fügen Sie Soft Skills hinzu (z.B. Kommunikation, Teamfähigkeit)',
                'Soft Skills sind für jeden Job wichtig');
            score.deductions += 15;
        }

        this.scoreBreakdown.skills = Math.max(0, score.total - score.deductions);
    }

    // Helper functions
    hasActionVerbs(text) {
        const actionVerbs = [
            'entwickelt', 'geleitet', 'verbessert', 'implementiert',
            'verwaltet', 'koordiniert', 'analysiert', 'optimiert',
            'erstellt', 'designet', 'aufgebaut', 'erreicht', 'erreichte',
            'increased', 'led', 'managed', 'developed', 'improved'
        ];
        return actionVerbs.some(verb => text.toLowerCase().includes(verb));
    }

    hasMetrics(text) {
        const metricsPattern = /\d+\s*%|\d+\s*(K|M|B)?[€$£]|doubled|tripled|increased/i;
        return metricsPattern.test(text);
    }

    addSuggestion(priority, category, suggestion, explanation) {
        this.suggestions.push({
            priority,
            category,
            suggestion,
            explanation,
            timestamp: new Date().toISOString()
        });
    }

    calculateOverallScore() {
        const weights = {
            personal: 0.2,
            experience: 0.35,
            education: 0.2,
            skills: 0.25
        };

        const weighted = (
            (this.scoreBreakdown.personal * weights.personal) +
            (this.scoreBreakdown.experience * weights.experience) +
            (this.scoreBreakdown.education * weights.education) +
            (this.scoreBreakdown.skills * weights.skills)
        );

        this.scoreBreakdown.overall = Math.round(weighted);
    }

    // Get suggestions by priority
    getSuggestionsByPriority(priority) {
        return this.suggestions.filter(s => s.priority === priority);
    }

    // Get suggestions by category
    getSuggestionsByCategory(category) {
        return this.suggestions.filter(s => s.category === category);
    }

    // Get improvement tips
    getImprovementTips() {
        return [
            '✓ Verwenden Sie klare, prägnante Sätze',
            '✓ Nutzen Sie Action Verben (entwickelt, geleitet, verbessert)',
            '✓ Quantifizieren Sie Ihre Erfolge mit Zahlen und Prozentsätzen',
            '✓ Halten Sie Ihren Lebenslauf auf eine oder zwei Seiten begrenzt',
            '✓ Verwenden Sie Branchenschlüsselwörter für ATS-Optimierung',
            '✓ Geben Sie konkrete, messbare Ergebnisse an',
            '✓ Fokussieren Sie sich auf Ergebnisse, nicht nur auf Aufgaben',
            '✓ Halten Sie die Formatierung konsistent und professionell'
        ];
    }

    // ATS (Applicant Tracking System) Score
    calculateATSScore(cvData) {
        let atsScore = 100;
        const warnings = [];

        // Check for complex formatting (PDFs with graphics)
        if (cvData.usesComplexFormatting) {
            atsScore -= 20;
            warnings.push('⚠️ Komplexe Formatierung kann ATS-Systeme verwirren');
        }

        // Check for keywords
        const content = JSON.stringify(cvData).toLowerCase();
        const commonKeywords = ['entwickelt', 'geleitet', 'verbessert', 'implementiert', 'erreicht'];
        const keywordCount = commonKeywords.filter(k => content.includes(k)).length;
        if (keywordCount < 3) {
            atsScore -= 15;
            warnings.push('ℹ️ Fügen Sie mehr Branchenschlüsselwörter hinzu');
        }

        // Check for standard format
        if (!cvData.experiences || cvData.experiences.length === 0) {
            atsScore -= 30;
            warnings.push('⚠️ Fehlende Berufserfahrung wird von ATS bevorzugt');
        }

        return {
            score: Math.max(0, atsScore),
            warnings: warnings
        };
    }
}

// Initialize global suggestion engine
const suggestionEngine = new CVSuggestionEngine();
