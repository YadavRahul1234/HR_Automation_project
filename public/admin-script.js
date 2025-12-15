
class AdminDashboard {
    constructor() {
        this.candidates = [];
        this.filteredCandidates = [];
        this.charts = {};
        this.apiBaseUrl = window.location.origin; // Use current domain
        this.securityInitialized = false;
        this.init();
    }


    init() {
        this.setupEventListeners();
        this.loadData();
        this.initializeSecurityIntegration();
    }
    
    initializeSecurityIntegration() {
        // Add security violation counter to prevent dashboard access
        this.securityViolationCount = 0;
        this.maxSecurityViolations = 2;
        
        // Override console methods for security logging
        this.secureConsole = {
            log: (message, data = null) => {
                this.securityViolationCount++;
                this.logSecurityEvent('DASHBOARD_CONSOLE_ACCESS', {
                    message: message,
                    data: data,
                    violations: this.securityViolationCount
                });
                
                if (this.securityViolationCount >= this.maxSecurityViolations) {
                    this.showSecurityLockdown();
                }
            },
            warn: (message, data = null) => {
                this.securityViolationCount++;
                this.logSecurityEvent('DASHBOARD_CONSOLE_WARN', {
                    message: message,
                    data: data,
                    violations: this.securityViolationCount
                });
            },
            error: (message, data = null) => {
                this.securityViolationCount++;
                this.logSecurityEvent('DASHBOARD_CONSOLE_ERROR', {
                    message: message,
                    data: data,
                    violations: this.securityViolationCount
                });
            }
        };
        
        // Initialize security monitoring
        this.startSecurityMonitoring();
    }
    
    startSecurityMonitoring() {
        // Monitor for suspicious activities
        this.securityMonitor = setInterval(() => {
            this.checkSecurityState();
        }, 2000);
    }
    
    checkSecurityState() {
        // Check if page visibility changed (dev tools opening)
        if (document.visibilityState === 'hidden') {
            this.securityViolationCount++;
            this.logSecurityEvent('PAGE_HIDDEN_SUSPICIOUS');
        }
        
        // Check for suspicious timing patterns
        const now = Date.now();
        if (now - this.lastSecurityCheck < 100) {
            this.securityViolationCount++;
            this.logSecurityEvent('RAPID_FIRE_EVENTS');
        }
        this.lastSecurityCheck = now;
    }
    
    logSecurityEvent(event, data = {}) {
        // Create secure log entry
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            dashboard: 'AdminDashboard',
            violations: this.securityViolationCount,
            data: data,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Use secure logging method
        if (typeof window.logSecurityEvent === 'function') {
            window.logSecurityEvent(event, logEntry);
        }
        
        // Store in localStorage for security audit
        this.storeSecurityLog(logEntry);
    }
    
    storeSecurityLog(logEntry) {
        try {
            const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
            logs.push(logEntry);
            
            // Keep only last 50 logs
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }
            
            localStorage.setItem('security_logs', JSON.stringify(logs));
        } catch (error) {
            // Storage not available, continue silently
        }
    }
    
    showSecurityLockdown() {
        // Create lockdown overlay
        const lockdownDiv = document.createElement('div');
        lockdownDiv.id = 'security-lockdown';
        lockdownDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1a1a1a 0%, #000 100%);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
            font-family: 'Courier New', monospace;
            text-align: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        
        lockdownDiv.innerHTML = `
            <div style="max-width: 600px;">
                <h1 style="color: #ef4444; font-size: 2.5rem; margin-bottom: 1rem;">
                    🚫 SECURITY LOCKDOWN
                </h1>
                <div style="background: #dc2626; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 1.1rem;">
                        <strong>UNAUTHORIZED ACCESS DETECTED</strong>
                    </p>
                </div>
                <p style="font-size: 1.1rem; line-height: 1.6;">
                    Dashboard access has been restricted due to suspicious activities.
                    Multiple security violations were detected.
                </p>
                <div style="background: #374151; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <h3 style="color: #fbbf24; margin-bottom: 10px;">Security Violations Logged:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li>🔍 Console inspection attempts</li>
                        <li>🛠️ Developer tools access</li>
                        <li>⌨️ Blocked key combinations</li>
                        <li>📊 Code analysis attempts</li>
                    </ul>
                </div>
                <p style="font-size: 0.9rem; color: #9ca3af;">
                    <strong>Action Required:</strong> Contact system administrator for access restoration.
                </p>
                <button onclick="location.reload()" style="
                    background: #059669;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 1rem;
                    cursor: pointer;
                    margin-top: 20px;
                ">
                    Request Reload (Will Log Another Violation)
                </button>
            </div>
        `;
        
        document.body.appendChild(lockdownDiv);
        
        // Log the lockdown event
        this.logSecurityEvent('DASHBOARD_LOCKDOWN_ACTIVATED', {
            violations: this.securityViolationCount,
            timestamp: new Date().toISOString()
        });
    }
    
    secureDataAccess(data, operation = 'access') {
        // Override data access with security logging
        this.securityViolationCount++;
        this.logSecurityEvent(`SECURE_DATA_${operation.toUpperCase()}`, {
            dataType: typeof data,
            dataLength: Array.isArray(data) ? data.length : null,
            operation: operation
        });
        
        return data;
    }
    
    // Secure method for viewing candidate data
    secureViewCandidate(candidateId) {
        this.logSecurityEvent('SECURE_CANDIDATE_VIEW', {
            candidateId: candidateId,
            timestamp: new Date().toISOString()
        });
        
        // Proceed with normal view if under security threshold
        if (this.securityViolationCount < this.maxSecurityViolations) {
            window.location.href = `candidate_result.html?candidate=${candidateId}`;
        } else {
            this.showSecurityLockdown();
        }
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCandidates(e.target.value);
            });
        }

        ['statusFilter', 'positionFilter', 'dateFilter'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    async loadData() {
        try {
            console.log('Loading candidates from backend API...');

            const response = await fetch(`${this.apiBaseUrl}/api/admin/candidates`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Raw data received:', data);
            console.log('Number of records:', data.records?.length || 0);

            if (!data.records || data.records.length === 0) {
                console.warn('No records found');
                this.handleNoData();
                return;
            }

            this.candidates = data.records.map(record => ({
                id: record.id,
                ...record.fields,
                interviewDate: record.fields.reportGeneratedAt || new Date().toISOString().split('T')[0]
            }));

            console.log('Processed candidates:', this.candidates);

            this.filteredCandidates = [...this.candidates];

            // Sort by date descending (latest first)
            this.filteredCandidates.sort((a, b) => new Date(b.interviewDate) - new Date(a.interviewDate));

            this.updateAnalytics();
            this.initializeCharts();
            this.renderTable();

        } catch (error) {
            console.error('Error loading data:', error);
            this.handleError(error);
        }
    }

    updateAnalytics() {
        const total = this.candidates.length;
        const recommended = this.candidates.filter(c =>
            c.status && c.status.toLowerCase().includes('select')
        ).length;

        const averageScore = this.candidates.reduce((sum, c) =>
            sum + (parseFloat(c.overallScore) || 0), 0) / (total || 1);

        const averageDuration = this.calculateAverageDuration();

        this.animateCounter('totalCandidates', total);
        this.animateCounter('recommendedCandidates', recommended);
        this.animateValue('averageScore', averageScore.toFixed(1));
        this.animateValue('averageDuration', `${averageDuration}m`);
    }

    animateCounter(elementId, target) {
        const element = document.getElementById(elementId);
        if (!element) return;
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 30);
    }

    animateValue(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        setTimeout(() => {
            element.textContent = targetValue;
        }, 500);
    }

    calculateAverageDuration() {
        const durations = this.candidates
            .map(c => c.interviewDuration)
            .filter(d => d)
            .map(d => {
                const match = d.match(/(\d+):(\d+)/);
                return match ? parseInt(match[1]) : 25;
            });

        return durations.length > 0
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 25;
    }

    initializeCharts() {
        this.createTrendsChart();
        this.createScoresChart();
    }

    createTrendsChart() {
        const canvas = document.getElementById('trendsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        // Group interviews by date
        const dateGroups = {};

        this.candidates.forEach(candidate => {
            const dateStr = candidate.reportGeneratedAt;
            if (!dateStr) return;

            // Extract just the date part (YYYY-MM-DD)
            const date = dateStr.split('T')[0];

            if (!dateGroups[date]) {
                dateGroups[date] = {
                    total: 0,
                    recommended: 0
                };
            }

            dateGroups[date].total++;

            // Check if recommended
            if (candidate.status && candidate.status.toLowerCase().includes('select')) {
                dateGroups[date].recommended++;
            }
        });

        // Get last 30 days
        const today = new Date();
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last30Days.push(dateStr);
        }

        // Prepare data arrays
        const labels = last30Days.map(dateStr => {
            const date = new Date(dateStr);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const interviewsData = last30Days.map(dateStr => {
            return dateGroups[dateStr] ? dateGroups[dateStr].total : 0;
        });

        const recommendedData = last30Days.map(dateStr => {
            return dateGroups[dateStr] ? dateGroups[dateStr].recommended : 0;
        });

        if (this.charts.trends) this.charts.trends.destroy();

        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Interviews',
                    data: interviewsData,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Recommended',
                    data: recommendedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            title: function (context) {
                                const index = context[0].dataIndex;
                                const dateStr = last30Days[index];
                                const date = new Date(dateStr);
                                return date.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    createScoresChart() {
        const canvas = document.getElementById('scoresChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const scoreRanges = {
            'Excellent (45-50)': 0,
            'Good (35-44.9)': 0,
            'Fair (25-34.9)': 0,
            'Poor (0-24.9)': 0
        };

        this.candidates.forEach(candidate => {
            const score = parseFloat(candidate.overallScore) || 0;
            if (score >= 45) scoreRanges['Excellent (45-50)']++;
            else if (score >= 35) scoreRanges['Good (35-44.9)']++;
            else if (score >= 25) scoreRanges['Fair (25-34.9)']++;
            else scoreRanges['Poor (0-24.9)']++;
        });

        if (this.charts.scores) this.charts.scores.destroy();

        this.charts.scores = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(scoreRanges),
                datasets: [{
                    data: Object.values(scoreRanges),
                    backgroundColor: [
                        '#10b981',
                        '#3b82f6',
                        '#f59e0b',
                        '#ef4444'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderTable() {
        const tbody = document.getElementById('candidatesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Ensure sorting is maintained (latest first)
        this.filteredCandidates.sort((a, b) => new Date(b.interviewDate) - new Date(a.interviewDate));

        this.filteredCandidates.forEach((candidate, index) => {
            const row = document.createElement('tr');
            row.style.animationDelay = `${index * 0.05}s`;

            row.innerHTML = `
                <td>
                    <strong>${candidate.candidateName || 'N/A'}</strong><br/>
                    <small>${candidate.candidateEmail || ''}</small><br/>
                    <small>${candidate.positionApplied || ''}</small>
                </td>
                <td>${this.formatScore(candidate.overallScore)}</td>
                <td>${this.formatStatus(candidate.status)}</td>
                <td>${this.formatDate(candidate.interviewDate)}</td>
                <td>
                    <button class="action-btn view" onclick="dashboard.viewCandidate('${candidate.id}')">View</button>
                </td>
            `;

            tbody.appendChild(row);
        });
    }



    viewCandidate(candidateId) {
        // Use secure candidate viewing with security logging
        this.secureViewCandidate(candidateId);
    }
    
    // Enhanced security method for data operations
    secureOperation(operation, data = null) {
        this.securityViolationCount++;
        this.logSecurityEvent(`SECURE_OPERATION_${operation.toUpperCase()}`, {
            operation: operation,
            dataType: data ? typeof data : null,
            timestamp: new Date().toISOString()
        });
        
        if (this.securityViolationCount >= this.maxSecurityViolations) {
            this.showSecurityLockdown();
            return null;
        }
        
        return true;
    }
    
    // Override critical methods with security checks
    loadData() {
        this.secureOperation('LOAD_DATA');
        
        // Original loadData logic with security monitoring
        try {
            console.log('Loading candidates from backend API...');

            const response = fetch(`${this.apiBaseUrl}/api/admin/candidates`, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                },
            });

            response.then(response => {
                console.log('Response status:', response.status);

                if (!response.ok) {
                    const errorText = response.text();
                    console.error('Response error:', errorText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                return response.json();
            }).then(data => {
                console.log('Raw data received:', data);
                console.log('Number of records:', data.records?.length || 0);

                if (!data.records || data.records.length === 0) {
                    console.warn('No records found');
                    this.handleNoData();
                    return;
                }

                this.candidates = data.records.map(record => ({
                    id: record.id,
                    ...record.fields,
                    interviewDate: record.fields.reportGeneratedAt || new Date().toISOString().split('T')[0]
                }));

                console.log('Processed candidates:', this.candidates);

                this.filteredCandidates = [...this.candidates];

                // Sort by date descending (latest first)
                this.filteredCandidates.sort((a, b) => new Date(b.interviewDate) - new Date(a.interviewDate));

                this.updateAnalytics();
                this.initializeCharts();
                this.renderTable();

            }).catch(error => {
                console.error('Error loading data:', error);
                this.handleError(error);
            });

        } catch (error) {
            console.error('Error loading data:', error);
            this.handleError(error);
        }
    }

    formatScore(score) {
        if (!score) return '<span class="score-badge score-poor">N/A</span>';

        const numScore = parseFloat(score);
        let className = 'score-poor';

        if (numScore >= 45) className = 'score-excellent';
        else if (numScore >= 35) className = 'score-good';
        else if (numScore >= 25) className = 'score-fair';

        return `<span class="score-badge ${className}">${numScore.toFixed(1)}</span>`;
    }

    formatStatus(status) {
        if (!status) return '<span class="status-badge status-pending">Pending</span>';

        const statusLower = status.toLowerCase().trim();
        let className = 'status-pending';

        // Determine color class based on status
        if ((statusLower.includes('select') || statusLower.includes('recommend')) && 
            !statusLower.includes('not') && 
            !statusLower.includes('reject')) {
            className = 'status-recommended';
        } 
        else if (statusLower.includes('reject') || 
                 statusLower.includes('not recommend') || 
                 statusLower.includes('not select')) {
            className = 'status-not-recommended';
        }

        // Display original status text from database
        return `<span class="status-badge ${className}">${status}</span>`;
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }

    filterCandidates(searchTerm) {
        const term = searchTerm.toLowerCase().trim();

        this.filteredCandidates = this.candidates.filter(candidate => {
            return (
                (candidate.candidateName || '').toLowerCase().includes(term) ||
                (candidate.candidateEmail || '').toLowerCase().includes(term) ||
                (candidate.positionApplied || '').toLowerCase().includes(term)
            );
        });

        this.renderTable();
    }

    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const positionFilter = document.getElementById('positionFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value : '';

        this.filteredCandidates = this.candidates.filter(candidate => {
            if (statusFilter && candidate.status) {
                const status = candidate.status.toLowerCase();
                if (statusFilter === 'recommended' && !status.includes('select') && !status.includes('recommend')) return false;
                if (statusFilter === 'not-recommended' && !status.includes('reject')) return false;
                if (statusFilter === 'pending' && (status.includes('select') || status.includes('reject'))) return false;
            }

            if (positionFilter && candidate.positionApplied) {
                const position = candidate.positionApplied.toLowerCase();
                if (!position.includes(positionFilter.toLowerCase())) return false;
            }

            if (dateFilter !== 'all') {
                const candidateDate = new Date(candidate.interviewDate || new Date());
                const now = new Date();
                const daysDiff = Math.floor((now - candidateDate) / (1000 * 60 * 60 * 24));

                switch (dateFilter) {
                    case 'today':
                        if (daysDiff > 0) return false;
                        break;
                    case 'week':
                        if (daysDiff > 7) return false;
                        break;
                    case 'month':
                        if (daysDiff > 30) return false;
                        break;
                    case 'quarter':
                        if (daysDiff > 90) return false;
                        break;
                }
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    (candidate.candidateName || '').toLowerCase().includes(term) ||
                    (candidate.candidateEmail || '').toLowerCase().includes(term) ||
                    (candidate.positionApplied || '').toLowerCase().includes(term)
                );
            }

            return true;
        });

        this.renderTable();
    }

    handleNoData() {
        const tbody = document.getElementById('candidatesTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #64748b; padding: 2rem;">
                    📝 No candidate data found in Airtable.<br>
                    <small style="margin-top: 10px; display: block;">Please check your Airtable configuration.</small>
                </td>
            </tr>
        `;
    }

    handleError(error) {
        const tbody = document.getElementById('candidatesTableBody');
        if (!tbody) return;
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: #ef4444; padding: 2rem;">
                    ❌ Error loading data: ${error.message}<br>
                    <small style="margin-top: 10px; display: block;">Please check your Airtable API configuration.</small>
                </td>
            </tr>
        `;
    }
}

let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
});
