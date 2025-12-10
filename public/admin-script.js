 class AdminDashboard {
    constructor() {
        this.candidates = [];
        this.filteredCandidates = [];
        this.charts = {};
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.loadData();
    }
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.applyFilters();
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
            console.log('Starting to load data from Backend...');
            const url = '/api/admin/candidates';
            console.log('Fetching from URL:', url);
            const response = await fetch(url);
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
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const interviewsData = [12, 19, 15, 25, 22, this.candidates.length];
        const recommendedData = [8, 12, 10, 18, 16, this.candidates.filter(c =>
            c.status && c.status.toLowerCase().includes('select')
        ).length];
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
                    tension: 0.4
                }, {
                    label: 'Recommended',
                    data: recommendedData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
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
            'Excellent (9-10)': 0,
            'Good (7-8.9)': 0,
            'Fair (5-6.9)': 0,
            'Poor (0-4.9)': 0
        };
        this.candidates.forEach(candidate => {
            const score = parseFloat(candidate.overallScore) || 0;
            if (score >= 9) scoreRanges['Excellent (9-10)']++;
            else if (score >= 7) scoreRanges['Good (7-8.9)']++;
            else if (score >= 5) scoreRanges['Fair (5-6.9)']++;
            else scoreRanges['Poor (0-4.9)']++;
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
                     <a href="candidate_result.html?candidate=${candidate.id}" class="action-btn view">View</a>
                    
                 </td>
            `;
            tbody.appendChild(row);
        });
    }
    formatScore(score) {
        if (!score) return '<span class="score-badge score-poor">N/A</span>';
        const numScore = parseFloat(score);
        let className = 'score-poor';
        if (numScore >= 9) className = 'score-excellent';
        else if (numScore >= 7) className = 'score-good';
        else if (numScore >= 5) className = 'score-fair';
        return `<span class="score-badge ${className}">${numScore.toFixed(1)}</span>`;
    }
    formatStatus(status) {
        if (!status) return '<span class="status-badge status-pending">Pending</span>';
        const statusLower = status.toLowerCase();
        let className = 'status-pending';
        let displayText = status;
        if (statusLower.includes('select') || statusLower.includes('recommend')) {
            className = 'status-recommended';
            displayText = 'Recommended';
        } else if (statusLower.includes('reject')) {
            className = 'status-not-recommended';
            displayText = 'Not Recommended';
        }
        return `<span class="status-badge ${className}">${displayText}</span>`;
    }
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (e) {
            return dateString;
        }
    }
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter').value;
        const positionFilter = document.getElementById('positionFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value : '';
        this.filteredCandidates = this.candidates.filter(candidate => {
            let matches = true;
            if (statusFilter && candidate.status) {
                const status = candidate.status.toLowerCase();
                if (statusFilter === 'recommended' && !status.includes('select') && !status.includes('recommend')) matches = false;
                if (statusFilter === 'not-recommended' && !status.includes('reject')) matches = false;
                if (statusFilter === 'pending' && (status.includes('select') || status.includes('reject'))) matches = false;
            }
            if (matches && positionFilter && candidate.positionApplied) {
                const position = candidate.positionApplied.toLowerCase();
                if (!position.includes(positionFilter.toLowerCase())) matches = false;
            }
            if (matches && dateFilter !== 'all') {
                const candidateDate = new Date(candidate.interviewDate || new Date());
                const now = new Date();
                const daysDiff = Math.floor((now - candidateDate) / (1000 * 60 * 60 * 24));
                switch (dateFilter) {
                    case 'today':
                        if (daysDiff > 0) matches = false;
                        break;
                    case 'week':
                        if (daysDiff > 7) matches = false;
                        break;
                    case 'month':
                        if (daysDiff > 30) matches = false;
                        break;
                    case 'quarter':
                        if (daysDiff > 90) matches = false;
                        break;
                }
            }
            if (matches && searchTerm) {
                const term = searchTerm.toLowerCase();
                matches = (
                    (candidate.candidateName || '').toLowerCase().includes(term) ||
                    (candidate.candidateEmail || '').toLowerCase().includes(term) ||
                    (candidate.positionApplied || '').toLowerCase().includes(term)
                );
            }
            return matches;
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