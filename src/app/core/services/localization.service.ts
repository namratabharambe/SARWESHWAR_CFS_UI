import { inject, Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type SupportedLanguage = 'en' | 'es' | 'fr';

const DEFAULT_TRANSLATIONS: Record<string, any> = {
  NAV: {
    DASHBOARD: 'Dashboard',
    ADMIN: 'Admin',
    CLIENTS: 'Clients',
    SITES: 'Sites',
    USERS: 'Users',
    ROLES: 'Roles',
    GATE_EVENTS: 'Gate Events',
    GATE_IN: 'Gate In',
    GATE_OUT: 'Gate Out',
    TASKS: 'Tasks',
    INVENTORY: 'Inventory',
    REPORTS: 'Reports',
    ALERTS: 'Alerts',
    ALL_CLIENTS: 'All Clients',
    ALL_SITES: 'All Sites',
    LOGOUT: 'Sign Out',
    SYSTEM_ADMIN: 'System Admin',
    CLIENT: 'Client',
    SITE: 'Site',
    LIGHT_MODE: 'Light Mode',
    DARK_MODE: 'Dark Mode',
    LANGUAGE: 'Language',
  },
  COMMON: {
    SEARCH: 'Search...',
    FILTER: 'Filter',
    STATUS: 'Status',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ALL: 'All',
    ACTIONS: 'Actions',
    ADD: 'Add',
    EDIT: 'Edit',
    DELETE: 'Delete',
    SAVE: 'Save',
    CANCEL: 'Cancel',
    SUBMIT: 'Submit',
    LOADING: 'Loading...',
    REFRESH: 'Refresh',
    CONFIRM: 'Confirm',
    CLOSE: 'Close',
    COLLAPSE: 'Collapse',
    TOTAL: 'Total',
    NAME: 'Name',
    CODE: 'Code',
    CREATED_AT: 'Created At',
    UPDATED_AT: 'Updated At',
    NO_DATA: 'No records found',
    ERROR: 'An error occurred',
    SUCCESS: 'Operation successful',
    CLEAR: 'Clear',
  },
  AUTH: {
    SIGN_IN: 'Sign In',
    LOGIN_TITLE: 'CFS Admin Portal',
    LOGIN_SUBTITLE: 'Container Freight Station enterprise management console',
    EMAIL: 'Email address',
    PASSWORD: 'Password',
    SUBMIT_BUTTON: 'Sign In to Admin',
    INVALID_CREDENTIALS: 'Invalid email or password',
    SIGNOUT_CONFIRM: 'Are you sure you want to sign out?',
    REMEMBER_DEVICE: 'Remember this device',
    FORGOT_PASSWORD: 'Forgot password?',
    SHOW_PASSWORD: 'Show password',
    HIDE_PASSWORD: 'Hide password',
    MFA_NOTE: 'Multi-factor authentication is enforced for supervisors and administrators.',
  },
  DASHBOARD: {
    TITLE: 'System Overview',
    SUBTITLE: 'Enterprise metrics, facility network, and administration summary',
    TOTAL_CLIENTS: 'Total Clients',
    TOTAL_SITES: 'Total Sites',
    ACTIVE_USERS: 'Active Users',
    SYSTEM_ROLES: 'System Roles',
    LIVE_CONTEXT: 'Live Context',
    ACTIVE_CLIENT: 'Active Client',
    ACTIVE_SITE: 'Active Site',
    NO_CLIENT_SELECTED: 'No Client Selected',
    NO_SITE_SELECTED: 'No Site Selected',
  },
  CLIENTS: {
    TITLE: 'Client Management',
    SUBTITLE: 'Manage enterprise tenant clients, codes, and operational status',
    NEW_CLIENT: 'New Client',
    SEARCH_PLACEHOLDER: 'Search clients by name or code...',
    EMPTY_TITLE: 'No clients found',
    EMPTY_DESC: 'Create a new client or adjust your filter query',
    MODAL_NEW_TITLE: 'Create Client',
    MODAL_EDIT_TITLE: 'Edit Client',
    FIELD_NAME: 'Client Name',
    FIELD_CODE: 'Client Code',
    FIELD_STATUS: 'Status',
  },
  SITES: {
    TITLE: 'Site Management',
    SUBTITLE: 'Oversee container freight station sites, regional hubs, and client assignments',
    NEW_SITE: 'New Site',
    SEARCH_PLACEHOLDER: 'Search sites by name or code...',
    EMPTY_TITLE: 'No sites found',
    EMPTY_DESC: 'Create a site or verify your search filter',
    MODAL_NEW_TITLE: 'Create Site',
    MODAL_EDIT_TITLE: 'Edit Site',
    FIELD_NAME: 'Site Name',
    FIELD_CODE: 'Site Code',
    FIELD_CLIENT: 'Assigned Client',
    FIELD_STATUS: 'Status',
  },
  USERS: {
    TITLE: 'User Management',
    SUBTITLE: 'Provision administrators, field operators, site personnel, and access credentials',
    NEW_USER: 'New User',
    SEARCH_PLACEHOLDER: 'Search users by name, email, or role...',
    EMPTY_TITLE: 'No users found',
    EMPTY_DESC: 'Add a user or modify search parameters',
    MODAL_NEW_TITLE: 'Create User',
    MODAL_EDIT_TITLE: 'Edit User',
    FIELD_NAME: 'Full Name',
    FIELD_EMAIL: 'Email Address',
    FIELD_PASSWORD: 'Password',
    FIELD_ROLE: 'System Role',
    FIELD_CLIENT: 'Assigned Client',
    FIELD_SITE: 'Assigned Site',
    FIELD_STATUS: 'Status',
  },
  ROLES: {
    TITLE: 'Role & Permission Management',
    SUBTITLE: 'Configure role-based access control, scopes, and administrative privileges',
    NEW_ROLE: 'New Role',
    SEARCH_PLACEHOLDER: 'Search roles...',
    EMPTY_TITLE: 'No roles found',
    EMPTY_DESC: 'Create a role to define access boundaries',
    MODAL_NEW_TITLE: 'Create Role',
    MODAL_EDIT_TITLE: 'Edit Role',
    FIELD_NAME: 'Role Name',
    FIELD_DESCRIPTION: 'Description',
    FIELD_PERMISSIONS: 'Permissions',
  },
  GATE_EVENTS: {
    TITLE: 'Gate Events',
    SUBTITLE: 'Live optical gate transactions, container captures, and verification log',
    TODAYS_ARRIVALS: "Today's Arrivals",
    TODAYS_DEPARTURES: "Today's Departures",
    OCR_VERIFIED: 'OCR Verified',
    PENDING_REVIEW: 'Pending Review',
    DAMAGED_CAPTURES: 'Damaged Captures',
    TAB_ALL: 'All',
    TAB_ARRIVALS: 'Arrivals',
    TAB_DEPARTURES: 'Departures',
    FILTER_DIRECTION: 'Direction',
    FILTER_GATE: 'Gate',
    FILTER_DATE: 'Date',
    FILTER_CONFIDENCE: 'Min Confidence',
    SEARCH_PLACEHOLDER: 'Search events by container, truck plate, driver...',
    VIEW_DETAILS: 'View Details',
    APPROVE: 'Approve',
    REPROCESS_OCR: 'Reprocess OCR',
    EXPORT: 'Export',
    COL_TIME: 'Time',
    COL_GATE: 'Gate',
    COL_DIR: 'Dir',
    COL_TRUCK: 'Truck Plate',
    COL_CONTAINER: 'Container No',
    COL_OCR_RESULT: 'OCR Result',
    COL_CONFIDENCE: 'Confidence',
    COL_DRIVER: 'Driver',
    COL_STATUS: 'Status',
    COL_DAMAGE: 'Damage',
    COL_PHOTOS: 'Photos (4-Angle)',
    DAMAGE_DETECTED: 'Damage Detected',
    DAMAGE_ANOMALY_FLAGGED: '⚠️ Damage Anomaly Flagged',
    NO_STRUCTURAL_DAMAGE: '✓ No Structural Damage',
    INSPECTION_TITLE: 'Multi-Angle OCR & Damage Evidence Cameras',
    MATCH_RATING: 'Confidence Rating',
    RAW_OPTICAL_STENCIL: 'Raw Optical Stencil',
    AI_DAMAGE_DETECTION: 'AI Damage Detection',
    FLAG_INSPECTION: 'Flag Damage Inspection',
    MARK_VERIFIED: '✓ Mark Verified & Release',
    CLOSE: 'Close',
    NON_ERP_CONTAINER: 'Non ERP Container',
    NON_ERP_IN_TITLE: 'Non ERP Container - Gate In',
    NON_ERP_OUT_TITLE: 'Non ERP Container - Gate Out',
    NON_ERP_IN_SUBTITLE: 'Real-time Non-ERP container monitoring & inbound entry verification',
    NON_ERP_OUT_SUBTITLE: 'Real-time Non-ERP container monitoring & outbound departure verification',
    BACK_TO_GATE_IN: 'Back to Gate In',
    BACK_TO_GATE_OUT: 'Back to Gate Out',
    ADD_NON_ERP_CONTAINER: 'Add Non-ERP Container',
    NON_ERP_ARRIVALS: 'Non-ERP Arrivals',
    NON_ERP_DEPARTURES: 'Non-ERP Departures',
    EXCEPTIONS_HOLD: 'Exceptions / Hold',
    SEARCH_NON_ERP_PLACEHOLDER: 'Search Non-ERP Container, Truck, Driver...',
    ALL_GATES: 'All Gates',
    ALL_STATUS: 'All Status',
    EXPORT_CSV: 'Export CSV',
    CATEGORY_REASON: 'Category / Reason',
    RECORD_NON_ERP_ENTRY: 'Save & Record Non-ERP Entry',
    NO_NON_ERP_FOUND: 'No Non-ERP containers found matching your search.',
    NON_ERP_BADGE: 'NON-ERP',
    COL_SIZE_TYPE: 'Size / Type',
    NON_ERP_MODAL_SUBTITLE: 'Record an ad-hoc container movement not linked to ERP orders.',
    DETAILS_TITLE: 'Non-ERP Container Details',
    CAMERA_CAPTURES: 'Camera Inspection Captures',
    TRANSPORTER: 'Transporter',
  },
  TASKS: {
    TITLE: 'My Tasks',
    SUBTITLE: 'View and manage your assigned tasks. Stay on top of your daily operations.',
    CREATE_TASK: 'Create Task',
    VIEW_QUEUE: 'View Queue',
    VIEW_TABLE: 'View Table',
    ALL_TASKS: 'All Tasks',
    DISPATCHED: 'Dispatched',
    NEW_TASKS: 'New',
    ASSIGNED_TASKS: 'Assigned',
    IN_PROGRESS: 'In Progress',
    AWAITING_CONFIRMATION: 'Awaiting Conf.',
    COMPLETED: 'Completed',
    EXCEPTIONS: 'Exceptions',
    SEARCH_PLACEHOLDER: 'Search by container, task ID, equipment, operator...',
    EMPTY_TITLE: 'No tasks found',
    EMPTY_DESC: 'No tasks match the active filters or search criteria.',
    MODAL_TITLE: 'Create Operational Task',
    MODAL_SUBTITLE: 'Dispatch equipment, assign operators, and track yard moves',
  },
  INVENTORY: {
    TITLE: 'Yard Container Inventory',
    SUBTITLE: 'Real-time yard inventory, container stacks, dwell times, and status tracking',
    TOTAL_CONTAINERS: 'Total Containers',
    TEU_UTILIZATION: 'TEU Capacity',
    LADEN: 'Laden Containers',
    EMPTY: 'Empty Containers',
    CUSTOMS_HOLD: 'Customs Hold',
    DWELL_WARNING: 'Long Dwell (>7d)',
    SEARCH_PLACEHOLDER: 'Search by container number, booking, shipping line...',
    EMPTY_TITLE: 'No inventory found',
    EMPTY_DESC: 'No containers match your active filter criteria',
    IMPORT: 'Import',
    EXPORT: 'Export',
  },
  REPORTS: {
    TITLE: 'Operational Reports & Analytics',
    SUBTITLE: 'Audit logs, throughput analytics, turn-around times, and equipment metrics',
    EXPORT_REPORT: 'Export Report',
  },
  ALERTS: {
    TITLE: 'Security & Anomaly Alerts',
    SUBTITLE: 'Automated optical discrepancies, seal tamper alarms, and container weight mismatches',
    CRITICAL_ALERTS: 'Critical Alarms',
    UNRESOLVED: 'Unresolved Discrepancies',
    RESOLVED: 'Resolved Issues',
  },
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    EXCEPTION: 'Exception',
  },
  FILTER: {
    STATUS: 'Status',
    ALL: 'All',
    DATE_RANGE: 'Date Range',
  },
  BREADCRUMB: {
    HOME: 'Home',
    DASHBOARD: 'Dashboard',
    GATE_EVENTS: 'Gate Events',
    TASKS: 'Tasks',
    INVENTORY: 'Inventory',
    REPORTS: 'Reports',
    ALERTS: 'Alerts',
  },
};

@Injectable({
  providedIn: 'root',
})
export class LocalizationService {
  private readonly http = inject(HttpClient);
  private readonly STORAGE_KEY = 'cfs_ui_lang';

  private readonly _currentLang = signal<SupportedLanguage>('en');
  private readonly _translations = signal<Record<string, any>>(DEFAULT_TRANSLATIONS);
  private readonly _availableLangs = signal<{ code: SupportedLanguage; label: string; flag: string }[]>([
    { code: 'en', label: 'English', flag: 'EN' },
    { code: 'es', label: 'Español', flag: 'ES' },
    { code: 'fr', label: 'Français', flag: 'FR' },
  ]);

  public readonly currentLang = this._currentLang.asReadonly();
  public readonly translations = this._translations.asReadonly();
  public readonly availableLangs = this._availableLangs.asReadonly();

  constructor() {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedLang = window.localStorage.getItem(this.STORAGE_KEY) as SupportedLanguage | null;
      if (savedLang && (savedLang === 'en' || savedLang === 'es' || savedLang === 'fr')) {
        this.setLanguage(savedLang);
        return;
      }
    }
    // Load default language
    this.loadTranslations('en');
  }

  public setLanguage(lang: SupportedLanguage): void {
    this._currentLang.set(lang);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(this.STORAGE_KEY, lang);
    }
    this.loadTranslations(lang);
  }

  public loadTranslations(lang: SupportedLanguage): void {
    this.http.get<Record<string, any>>(`assets/i18n/${lang}.json`).subscribe({
      next: (data) => {
        this._translations.set(data);
      },
      error: () => {
        // Fallback to default if load fails
        if (lang === 'en') {
          this._translations.set(DEFAULT_TRANSLATIONS);
        }
      },
    });
  }

  public translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';

    const keys = key.split('.');
    let value: any = this._translations();

    for (const segment of keys) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        // Fallback to default English translation dictionary if not found in current dictionary
        let fallbackVal: any = DEFAULT_TRANSLATIONS;
        for (const fbSegment of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fbSegment in fallbackVal) {
            fallbackVal = fallbackVal[fbSegment];
          } else {
            fallbackVal = null;
            break;
          }
        }
        value = fallbackVal ?? key;
        break;
      }
    }

    if (typeof value !== 'string' || value === key) {
      if (key.startsWith('NAV.')) {
        const raw = key.replace('NAV.', '');
        return raw
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
      return typeof value === 'string' ? value : key;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramVal));
      }, value);
    }

    return value;
  }

  public instant(key: string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }
}
