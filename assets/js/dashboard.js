// Dashboard JavaScript - GlassBlack Theme
class Dashboard {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuth();
        
        // Initialize UI
        this.initializeUI();
        
        // Load initial data
        await this.loadDashboardData();
        
        // Hide loading screen
        this.hideLoadingScreen();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                this.currentUser = await response.json();
                this.updateUserInfo();
            } else {
                // Redirect to login if not authenticated
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = '/';
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            document.getElementById('username-display').textContent = this.currentUser.username;
            document.getElementById('profile-username').textContent = this.currentUser.username;
            document.getElementById('profile-email').textContent = this.currentUser.email || 'ایمیل تنظیم نشده';
            
            // Update join date
            const joinDate = new Date(this.currentUser.createdAt || Date.now());
            document.getElementById('profile-join-date').textContent = 
                `عضو از: ${joinDate.toLocaleDateString('fa-IR')}`;
            
            // Update UUID and plan in profile
            const profileUuid = document.getElementById('profile-user-uuid');
            const profilePlan = document.getElementById('profile-user-plan');
            if (profileUuid) profileUuid.textContent = this.currentUser.userUUID || '--------';
            if (profilePlan) profilePlan.textContent = this.getPlanDisplayName(this.currentUser.plan || 'free');
        }
    }

    initializeUI() {
        // Navigation menu
        this.initNavigation();
        
        // Mobile menu
        this.initMobileMenu();
        
        // Logout functionality
        this.initLogout();
        
        // Form handlers
        this.initForms();
        
        // Button handlers
        this.initButtons();
    }

    initNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.switchSection(section);
            });
        });
    }

    switchSection(sectionName) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).parentElement.classList.add('active');

        // Update active content section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');

        // Update page title
        const titles = {
            dashboard: 'داشبورد',
            profile: 'پروفایل',
            activation: 'فعالسازی حساب',
            services: 'سرویس‌ها',
            dns: 'مدیریت DNS',
            wireguard: 'WireGuard VPN',
            billing: 'صورتحساب',
            support: 'پشتیبانی',
            settings: 'تنظیمات'
        };
        document.getElementById('page-title').textContent = titles[sectionName];

        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    initMobileMenu() {
        const mobileToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.getElementById('sidebar');
        
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                    sidebar.classList.remove('active');
                }
            }
        });
    }

    initLogout() {
        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST'
                });
                
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    this.showNotification('خطا در خروج از حساب', 'error');
                }
            } catch (error) {
                console.error('Logout error:', error);
                this.showNotification('خطا در خروج از حساب', 'error');
            }
        });
    }

    initForms() {
        // Profile update form
        const profileForm = document.getElementById('profile-update-form');
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateProfile(new FormData(profileForm));
        });
    }

    initButtons() {
        // Add service button
        document.getElementById('add-service-btn')?.addEventListener('click', () => {
            this.showAddServiceModal();
        });

        // Add DNS record button
        document.getElementById('add-dns-btn')?.addEventListener('click', () => {
            this.showAddDNSModal();
        });

        // Add WireGuard config button
        document.getElementById('add-wireguard-btn')?.addEventListener('click', () => {
            this.showAddWireGuardModal();
        });

        // Change password button
        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.showChangePasswordModal();
        });

        // Add credit button
        document.getElementById('add-credit-btn')?.addEventListener('click', () => {
            this.showAddCreditModal();
        });

        // Support buttons
        document.getElementById('new-ticket-btn')?.addEventListener('click', () => {
            this.showNewTicketModal();
        });

        document.getElementById('live-chat-btn')?.addEventListener('click', () => {
            this.startLiveChat();
        });

        // Activation form
        const activationForm = document.getElementById('activation-form');
        if(activationForm) {
            activationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleActivation();
            });
        }

        // Copy UUID button
        document.getElementById('copy-uuid-btn')?.addEventListener('click', () => {
            this.copyUUID();
        });
    }

    async loadDashboardData() {
        try {
            // Load stats
            await this.loadStats();
            
            // Load recent activities
            await this.loadRecentActivities();
            
            // Load user services
            await this.loadUserServices();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch('/api/user/stats');
            if (response.ok) {
                const stats = await response.json();
                
                document.getElementById('active-services').textContent = stats.activeServices || 0;
                document.getElementById('dns-records').textContent = stats.dnsRecords || 0;
                document.getElementById('wg-configs').textContent = stats.wireGuardConfigs || 0;
                document.getElementById('remaining-credit').textContent = 
                    `${(stats.remainingCredit || 0).toLocaleString('fa-IR')} تومان`;
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async loadRecentActivities() {
        try {
            const response = await fetch('/api/user/activities');
            if (response.ok) {
                const activities = await response.json();
                const container = document.getElementById('recent-activities');
                
                if (activities.length === 0) {
                    container.innerHTML = '<p class="no-data">فعالیتی یافت نشد</p>';
                    return;
                }
                
                container.innerHTML = activities.map(activity => `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <i class="${this.getActivityIcon(activity.type)}"></i>
                        </div>
                        <div class="activity-content">
                            <p>${activity.description}</p>
                            <span class="activity-time">${this.formatTime(activity.timestamp)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading activities:', error);
        }
    }

    async loadUserServices() {
        try {
            const response = await fetch('/api/user/services');
            if (response.ok) {
                const services = await response.json();
                const container = document.getElementById('user-services');
                
                if (services.length === 0) {
                    container.innerHTML = '<p class="no-data">سرویسی یافت نشد</p>';
                    return;
                }
                
                container.innerHTML = services.map(service => `
                    <div class="service-item">
                        <div class="service-icon">
                            <i class="${this.getServiceIcon(service.type)}"></i>
                        </div>
                        <div class="service-content">
                            <h4>${service.name}</h4>
                            <p class="service-status ${service.status}">${this.getStatusText(service.status)}</p>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading services:', error);
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'activation':
                await this.loadActivationSection();
                break;
            case 'services':
                await this.loadServicesSection();
                break;
            case 'dns':
                await this.loadDNSSection();
                break;
            case 'wireguard':
                await this.loadWireGuardSection();
                break;
            case 'billing':
                await this.loadBillingSection();
                break;
            case 'support':
                await this.loadSupportSection();
                break;
        }
    }

    async loadServicesSection() {
        try {
            const response = await fetch('/api/user/services/detailed');
            if (response.ok) {
                const services = await response.json();
                const container = document.getElementById('services-grid');
                
                container.innerHTML = services.map(service => `
                    <div class="service-card">
                        <div class="service-header">
                            <h3>${service.name}</h3>
                            <span class="service-status ${service.status}">${this.getStatusText(service.status)}</span>
                        </div>
                        <div class="service-details">
                            <p><strong>نوع:</strong> ${service.type}</p>
                            <p><strong>ایجاد:</strong> ${this.formatDate(service.createdAt)}</p>
                            <p><strong>انقضا:</strong> ${this.formatDate(service.expiresAt)}</p>
                        </div>
                        <div class="service-actions">
                            <button class="btn btn-secondary" onclick="dashboard.manageService('${service.id}')">
                                مدیریت
                            </button>
                            <button class="btn btn-primary" onclick="dashboard.renewService('${service.id}')">
                                تمدید
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading services section:', error);
        }
    }

    async loadDNSSection() {
        try {
            const response = await fetch('/api/user/dns');
            if (response.ok) {
                const records = await response.json();
                const tbody = document.getElementById('dns-records-table');
                
                tbody.innerHTML = records.map(record => `
                    <tr>
                        <td>${record.name}</td>
                        <td>${record.type}</td>
                        <td>${record.value}</td>
                        <td>${record.ttl}</td>
                        <td><span class="status ${record.status}">${this.getStatusText(record.status)}</span></td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="dashboard.editDNSRecord('${record.id}')">
                                ویرایش
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="dashboard.deleteDNSRecord('${record.id}')">
                                حذف
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading DNS section:', error);
        }
    }

    async loadWireGuardSection() {
        try {
            const response = await fetch('/api/user/wireguard');
            if (response.ok) {
                const configs = await response.json();
                const container = document.getElementById('wireguard-configs');
                
                container.innerHTML = configs.map(config => `
                    <div class="wireguard-card">
                        <div class="wg-header">
                            <h3>${config.name}</h3>
                            <span class="wg-status ${config.status}">${this.getStatusText(config.status)}</span>
                        </div>
                        <div class="wg-details">
                            <p><strong>IP:</strong> ${config.clientIP}</p>
                            <p><strong>سرور:</strong> ${config.serverEndpoint}</p>
                            <p><strong>ایجاد:</strong> ${this.formatDate(config.createdAt)}</p>
                        </div>
                        <div class="wg-actions">
                            <button class="btn btn-primary" onclick="dashboard.downloadWGConfig('${config.id}')">
                                <i class="fas fa-download"></i>
                                دانلود کانفیگ
                            </button>
                            <button class="btn btn-secondary" onclick="dashboard.showWGQR('${config.id}')">
                                <i class="fas fa-qrcode"></i>
                                QR Code
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading WireGuard section:', error);
        }
    }

    async loadBillingSection() {
        try {
            const [balanceResponse, transactionsResponse] = await Promise.all([
                fetch('/api/user/balance'),
                fetch('/api/user/transactions')
            ]);
            
            if (balanceResponse.ok) {
                const balance = await balanceResponse.json();
                document.getElementById('current-balance').textContent = 
                    `${balance.amount.toLocaleString('fa-IR')} تومان`;
                document.getElementById('monthly-cost').textContent = 
                    `${balance.monthlyCost.toLocaleString('fa-IR')} تومان`;
            }
            
            if (transactionsResponse.ok) {
                const transactions = await transactionsResponse.json();
                const container = document.getElementById('transactions-table');
                
                container.innerHTML = `
                    <table class="transactions-table">
                        <thead>
                            <tr>
                                <th>تاریخ</th>
                                <th>شرح</th>
                                <th>مبلغ</th>
                                <th>وضعیت</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${transactions.map(tx => `
                                <tr>
                                    <td>${this.formatDate(tx.date)}</td>
                                    <td>${tx.description}</td>
                                    <td class="${tx.amount > 0 ? 'positive' : 'negative'}">
                                        ${tx.amount.toLocaleString('fa-IR')} تومان
                                    </td>
                                    <td><span class="status ${tx.status}">${this.getStatusText(tx.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            }
        } catch (error) {
            console.error('Error loading billing section:', error);
        }
    }

    async loadSupportSection() {
        try {
            const response = await fetch('/api/user/tickets');
            if (response.ok) {
                const tickets = await response.json();
                const container = document.getElementById('user-tickets');
                
                if (tickets.length === 0) {
                    container.innerHTML = '<p class="no-data">تیکتی یافت نشد</p>';
                    return;
                }
                
                container.innerHTML = tickets.map(ticket => `
                    <div class="ticket-item">
                        <div class="ticket-header">
                            <h4>${ticket.subject}</h4>
                            <span class="ticket-status ${ticket.status}">${this.getStatusText(ticket.status)}</span>
                        </div>
                        <p class="ticket-preview">${ticket.lastMessage}</p>
                        <div class="ticket-meta">
                            <span>تیکت #${ticket.id}</span>
                            <span>${this.formatDate(ticket.updatedAt)}</span>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading support section:', error);
        }
    }

    // Utility functions
    getActivityIcon(type) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            service_created: 'fas fa-plus-circle',
            dns_added: 'fas fa-globe',
            payment: 'fas fa-credit-card',
            default: 'fas fa-info-circle'
        };
        return icons[type] || icons.default;
    }

    getServiceIcon(type) {
        const icons = {
            dns: 'fas fa-globe',
            wireguard: 'fas fa-shield-virus',
            proxy: 'fas fa-server',
            default: 'fas fa-cog'
        };
        return icons[type] || icons.default;
    }

    getStatusText(status) {
        const statuses = {
            active: 'فعال',
            inactive: 'غیرفعال',
            pending: 'در انتظار',
            expired: 'منقضی شده',
            suspended: 'تعلیق شده',
            completed: 'تکمیل شده',
            failed: 'ناموفق',
            open: 'باز',
            closed: 'بسته شده'
        };
        return statuses[status] || status;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fa-IR');
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'همین الان';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
        return this.formatDate(dateString);
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const mainContainer = document.getElementById('main-container');
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            mainContainer.style.display = 'flex';
        }, 1000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    // Modal functions (to be implemented)
    showAddServiceModal() {
        console.log('Show add service modal');
    }

    showAddDNSModal() {
        console.log('Show add DNS modal');
    }

    showAddWireGuardModal() {
        console.log('Show add WireGuard modal');
    }

    showChangePasswordModal() {
        console.log('Show change password modal');
    }

    showAddCreditModal() {
        console.log('Show add credit modal');
    }

    showNewTicketModal() {
        console.log('Show new ticket modal');
    }

    startLiveChat() {
        console.log('Start live chat');
    }

    async updateProfile(formData) {
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                body: formData
            });
            
            if (response.ok) {
                this.showNotification('پروفایل با موفقیت بروزرسانی شد', 'success');
                await this.checkAuth(); // Refresh user data
            } else {
                this.showNotification('خطا در بروزرسانی پروفایل', 'error');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            this.showNotification('خطا در بروزرسانی پروفایل', 'error');
        }
    }

    // Activation Section Methods
    async loadActivationSection() {
        if (this.currentUser) {
            // Update current plan display
            this.updatePlanDisplay();
            
            // Update user UUID display
            const uuidDisplay = document.getElementById('user-uuid-display');
            if (uuidDisplay) {
                uuidDisplay.textContent = this.currentUser.userUUID || '--------';
            }
        }
    }

    updatePlanDisplay() {
        const planBadge = document.getElementById('current-plan-badge');
        const planFeatures = document.getElementById('current-plan-features');
        
        if (!this.currentUser || !planBadge || !planFeatures) return;

        const plan = this.currentUser.plan || 'free';
        const features = this.currentUser.planFeatures || {
            dnsRecords: 1,
            wireguardConfigs: 0,
            support: 'ticket',
            priority: 'low'
        };

        // Update plan badge
        planBadge.textContent = this.getPlanDisplayName(plan);
        planBadge.className = `plan-badge ${plan}`;

        // Update features display
        const dnsText = features.dnsRecords === -1 ? 'نامحدود' : features.dnsRecords;
        planFeatures.innerHTML = `
            <div class="feature-item">
                <i class="fas fa-globe"></i>
                <span>${dnsText} رکورد DNS</span>
            </div>
            <div class="feature-item">
                <i class="fas fa-shield-virus"></i>
                <span>${features.wireguardConfigs} کانفیگ WireGuard</span>
            </div>
            <div class="feature-item">
                <i class="fas fa-headset"></i>
                <span>پشتیبانی ${this.getSupportDisplayName(features.support)}</span>
            </div>
        `;
    }

    getPlanDisplayName(plan) {
        const names = {
            'free': 'رایگان',
            'normal': 'پایه',
            'pro': 'حرفه‌ای',
            'promax': 'سازمانی'
        };
        return names[plan] || 'نامشخص';
    }

    getSupportDisplayName(support) {
        const names = {
            'ticket': 'تیکتی',
            'priority': 'اولویت‌دار',
            '24/7': '24/7'
        };
        return names[support] || 'تیکتی';
    }

    async handleActivation() {
        const activationCodeInput = document.getElementById('activation-code');
        const activationMsg = document.getElementById('activation-msg');
        
        if (!activationCodeInput || !activationMsg) return;

        const activationCode = activationCodeInput.value.trim().toUpperCase();
        
        if (!activationCode || activationCode.length !== 4) {
            this.showActivationMessage('کد فعالسازی باید 4 کاراکتر باشد', 'error');
            return;
        }

        this.showActivationMessage('در حال پردازش...', 'info');

        try {
            const response = await fetch('/api/user/activate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ activationCode })
            });

            const result = await response.json();

            if (response.ok) {
                this.showActivationMessage(result.message || 'حساب شما با موفقیت فعال شد!', 'success');
                
                // Update current user data
                await this.checkAuth();
                
                // Refresh activation section
                await this.loadActivationSection();
                
                // Clear the input
                activationCodeInput.value = '';
                
                // Show notification
                this.showNotification(`پلن شما به ${this.getPlanDisplayName(result.plan)} ارتقا یافت!`, 'success');
            } else {
                this.showActivationMessage(result.error || 'کد فعالسازی نامعتبر است', 'error');
            }
        } catch (error) {
            console.error('Activation error:', error);
            this.showActivationMessage('خطا در فعالسازی حساب', 'error');
        }
    }

    showActivationMessage(message, type) {
        const msgElement = document.getElementById('activation-msg');
        if (!msgElement) return;

        msgElement.textContent = message;
        msgElement.className = `msg ${type}`;
        
        const colors = {
            'success': '#10b981',
            'error': '#ef4444',
            'info': '#3b82f6'
        };
        
        msgElement.style.color = colors[type] || '#6b7280';
    }

    copyUUID() {
        const uuidDisplay = document.getElementById('user-uuid-display');
        if (!uuidDisplay) return;

        const uuid = uuidDisplay.textContent;
        if (uuid && uuid !== '--------') {
            navigator.clipboard.writeText(uuid).then(() => {
                this.showNotification('شناسه کاربری کپی شد', 'success');
            }).catch(() => {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = uuid;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this.showNotification('شناسه کاربری کپی شد', 'success');
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
});

// Export for global access
window.Dashboard = Dashboard;
