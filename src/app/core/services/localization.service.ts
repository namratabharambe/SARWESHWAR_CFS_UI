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
    RESET: 'Reset',
    LOADING: 'Loading...',
    REFRESH: 'Refresh',
    CONFIRM: 'Confirm',
    CLOSE: 'Close',
    TOTAL: 'Total',
    NAME: 'Name',
    CODE: 'Code',
    CREATED_AT: 'Created At',
    UPDATED_AT: 'Updated At',
    NO_DATA: 'No records found',
    NO_RECORDS: 'No records found',
    ERROR: 'An error occurred',
    SUCCESS: 'Operation successful',
    EXPORT: 'Export',
    COLUMNS: 'Columns',
    VISIBLE_COLUMNS: 'Visible Columns',
    ROWS_PER_PAGE: 'Rows per page',
    VIEW_DETAILS: 'View Details',
    VIEW_REPORT: 'View Report',
    VIEW_ALL: 'View All',
    QUICK_ACTIONS: 'Quick Actions',
    BULK_UPDATE: 'Bulk Update',
    PRINT_REPORT: 'Print Report',
    EXPORT_DATA: 'Export Data',
    ENABLE: 'Enable',
    YES: 'Yes',
    NO: 'No',
    NEXT: 'Next',
    PREVIOUS: 'Previous',
    SORT_BY: 'Sort By',
    EXPORT_EXCEL: 'Export to Excel',
    UPLOAD_FILE: 'Upload File',
    ENTER_REMARKS: 'Enter remarks...',
    EXPORT_CSV: 'Export to CSV',
    SELECT_ALL: 'Select All',
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
    TOTAL_USERS: 'Total Users',
    RECENT_GATE_ACTIVITY: 'Recent Gate Activity',
    EXCEPTION_ALERTS: 'Exceptions / Alerts',
    YARD_SNAPSHOT: 'Yard Snapshot (Live)',
    GATE_STATUS: 'Gate Status Breakdown',
    INVENTORY_SUMMARY: 'Inventory Summary',
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
    FIELD_NAME_PLACEHOLDER: 'Enter client company name',
    MODAL_EDIT_SUBTITLE: 'Update client organization details',
    MODAL_NEW_SUBTITLE: 'Enter client name to register a new account',
    CHANGE_STATUS: 'Change Status',
    ACTIVATE: 'Activate Client',
    DEACTIVATE: 'Deactivate Client',
    CONFIRM_ACTIVATE: 'Confirm Activate',
    CONFIRM_DEACTIVATE: 'Confirm Deactivate',
    STATUS_MODAL_SUBTITLE: 'Update active status for',
    CHOOSE_STATUS: 'Choose Target Status:',
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
    FIELD_CLIENT: 'Client',
    FIELD_STATUS: 'Status',
    FIELD_NAME_PLACEHOLDER: 'Enter site name',
    FIELD_CODE_PLACEHOLDER: 'Enter site code (e.g. PCT-01)',
    SELECT_CLIENT: 'Select client',
    MODAL_EDIT_SUBTITLE: 'Update operational terminal details',
    MODAL_NEW_SUBTITLE: 'Configure a new CFS terminal location',
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
    FIELD_CLIENT: 'Client Organization',
    FIELD_SITE: 'Assigned Site',
    FIELD_STATUS: 'Account Status',
    FIELD_FIRST_NAME: 'First Name',
    FIELD_LAST_NAME: 'Last Name',
    FIELD_MOBILE: 'Mobile Number',
    SELECT_CLIENT: 'Select client',
    MODAL_EDIT_SUBTITLE: 'Update user credentials, terminal site access, and designated roles',
    MODAL_NEW_SUBTITLE: 'Create a new user account with dedicated roles per terminal site',
    PANEL_PROFILE: 'User Profile & Access',
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters.',
    TERMINAL_SITES_ROLES: 'Terminal Sites & Roles',
    SITE_ROLES_HINT: 'Select terminal sites below to assign specific permissions per location.',
    NO_SITES_FOR_CLIENT: 'No specific sites found for this client.',
    DESIGNATED_ROLES: 'Designated Roles',
    SET_ALL: 'Set all:',
    REMOVE_SITE_ACCESS: 'Remove site access',
    GLOBAL_ACCESS_ROLE: 'Global Access Role',
    GLOBAL_ACCESS_DESC: 'No terminal site selected. Access applies across all client sites.',
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
    FIELD_NAME_PLACEHOLDER: 'e.g. Supervisor',
    FIELD_SCOPE: 'Scope',
    FIELD_DESC_PLACEHOLDER: 'Describe role responsibilities...',
    MODAL_EDIT_SUBTITLE: 'Update role permissions and scope',
    MODAL_NEW_SUBTITLE: 'Define a new role and its access level',
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
    MANUAL_GATE_ENTRY: 'Manual Gate Entry',
    IMPORT_GATE_IN: 'Import Gate In',
  },
  MENU: {
    DASHBOARD: 'Dashboard',
    GATE_EVENTS: 'Gate Events',
    TASKS: 'Tasks',
    INVENTORY: 'Inventory',
    REPORTS: 'Reports',
    ALERTS: 'Alerts',
    ADMIN: 'Admin',
    CLIENTS: 'Clients',
    SITES: 'Sites',
    USERS: 'Users',
    ROLES: 'Roles',
    SETTINGS: 'Settings',
  },
  TASKS: {
    TITLE: 'My Tasks',
    SUBTITLE: 'View and manage your assigned tasks. Stay on top of your daily operations.',
    CREATE_TASK: 'Create Task',
    VIEW_QUEUE: 'View Queue',
    VIEW_TABLE: 'View Table',
    ALL_TASKS: 'All Tasks',
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
    CONTAINER_INFO: 'Container & Cargo Information',
    EQUIPMENT_DISPATCH: 'Equipment, Operator & SLA Priority',
    ROUTING_LOCATION: 'Routing & Location Assignment',
    TASK_DETAILS: 'Task Details',
    TASK_NO: 'Task No.',
    BOOKING_NO: 'Booking No.',
    DUE_TIME: 'Due Time',
    OVERDUE: '(Overdue)',
    ROUTE_SUMMARY: 'Route Summary',
    FROM: 'From',
    TO: 'To',
    START_TASK: 'Start Task',
    READY_CHECK: 'Ready Check',
    CONFIRM_COMPLETE: 'Confirm Complete',
    FLAG_EXCEPTION: 'Flag Exception',
    FREIGHT_MANIFEST: 'Freight & Manifest Info',
    ROW_SELECTED: 'row selected',
    CLEAR_SELECTION: 'Clear selection',
  },
  INVENTORY: {
    TITLE: 'Container Inventory & Yard Tracking',
    SUBTITLE: 'Real-time inventory levels, stack coordinates, dwell times, and hold statuses',
    ADD_CONTAINER: 'Add Container',
    SEARCH_PLACEHOLDER: 'Search by container no, booking, client, seal...',
    EMPTY_TITLE: 'No containers found',
    EMPTY_DESC: 'No containers match the active filters or search criteria.',
    TOTAL_CONTAINERS: 'Total Containers',
    IMPORT: 'Import',
    EXPORT: 'Export',
    EMPTY: 'Empty',
    HAZARDOUS: 'Hazardous',
    IN_YARD: 'In Yard',
    OVERSTAY: 'Overstay (>7 Days)',
    ON_HOLD: 'On Hold / Customs',
    READY_OUT: 'Ready Gate Out',
    RELOCATE: 'Relocate Container',
    ENTER_CONTAINER_NO: 'Enter container no.',
    BY_TYPE: 'Inventory by Type',
    UTILIZATION: 'Location Utilization',
    OVERALL_UTILIZATION: 'Overall Utilization',
    VIEW_MAP: 'View Yard Map',
    YARD_MAP: 'Yard Map',
    ADD_INVENTORY: 'Add Inventory',
  },
  REPORTS: {
    TITLE: 'Operational Reports & Analytics',
    SUBTITLE: 'Audit logs, throughput analytics, turn-around times, and equipment metrics',
    EXPORT_REPORT: 'Export Report',
    GATE_OPERATIONS: 'Gate Operations & Turnaround',
    CONTAINER_MISMATCH: 'Container Mismatch & OCR Audit',
    YARD_OCCUPANCY: 'Yard Occupancy & Dwell Time',
    EQUIPMENT_PRODUCTIVITY: 'Equipment & Operator Productivity',
    CUSTOMS_BILLING: 'Customs & Billing Dossier',
  },
  ALERTS: {
    TITLE: 'Security & Anomaly Alerts',
    SUBTITLE: 'Automated optical discrepancies, seal tamper alarms, and container weight mismatches',
    CRITICAL_ALERTS: 'Critical Alarms',
    UNRESOLVED: 'Unresolved Discrepancies',
    RESOLVED: 'Resolved Issues',
    DISCREPANCIES: 'Discrepancies',
  },
  STATUS: {
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    NEW: 'New',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    EXCEPTION: 'Exception',
    AWAITING_CONFIRMATION: 'Awaiting Confirmation',
    CRITICAL: 'Critical',
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
    HOLD: 'Hold',
    IN_YARD: 'In Yard',
    READY_OUT: 'Ready Out',
    OVERSTAY: 'Overstay',
    UNDER_REVIEW: 'Under Review',
    RESOLVED: 'Resolved',
    SOUND: 'Sound',
    DAMAGED: 'Damaged',
  },
  FILTER: {
    STATUS: 'Status',
    ALL: 'All',
    DATE_RANGE: 'Date Range',
    DIRECTION: 'Direction',
    GATE: 'Gate',
    LINE: 'Shipping Line',
    BLOCK: 'Block',
    ROW: 'Row',
    BAY: 'Bay',
    TIER: 'Tier',
    SIZE: 'Size',
    TYPE: 'Type',
    PRIORITY: 'Priority',
    SEVERITY: 'Severity',
    EQUIPMENT: 'Equipment',
    CLEAR: 'Clear Filters',
    MORE: 'More Filters',
    ADVANCED: 'Advanced Filters',
    CUSTOMER: 'Customer',
    FULL_EMPTY: 'Full / Empty',
  },
  TABS: {
    GENERAL: 'General',
    ALL: 'All',
    ARRIVALS: 'Arrivals',
    DEPARTURES: 'Departures',
    ACTIVE: 'Active',
    HISTORY: 'History',
    DETAILS: 'Details',
    OVERVIEW: 'Overview',
  },
  DIALOG: {
    DELETE_CONFIRM: 'Are you sure you want to delete this record?',
    CONFIRM_DELETE: 'Confirm Deletion',
    ADD_USER: 'Create User',
    CREATE_TASK: 'Create Task',
    RELOCATE_CONTAINER: 'Relocate Container',
    ADD_INVENTORY: 'Add Container',
  },
  VALIDATION: {
    REQUIRED: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    CONTAINER_REQUIRED: 'Container number is required',
    MIN_LENGTH: 'Input is too short',
  },
  SUCCESS: {
    SAVED: 'Changes saved successfully',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    RESOLVED: 'Resolved successfully',
  },
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes',
  },
  ERROR: {
    LOAD_FAILED: 'Failed to load data',
    GENERIC_ERROR: 'An error occurred',
  },
  INFO: {
    NO_DATA: 'No data available to display',
    NO_RECORDS: 'No records found',
  },
  TABLE: {
    NAME: 'Name',
    CODE: 'Code',
    STATUS: 'Status',
    ACTIONS: 'Actions',
    TIME: 'Time',
    TYPE: 'Type',
    TRUCK_NO: 'Truck No.',
    CONTAINER_NO: 'Container No.',
    SIZE_TYPE: 'Size/Type',
    DIRECTION: 'Direction',
    OCR_CONFIDENCE: 'OCR Confidence',
    OPERATOR: 'Operator',
    LOCATION: 'Location',
    EQUIPMENT: 'Equipment',
    PRIORITY: 'Priority',
    SLA: 'Target SLA',
    CURRENT_LOCATION: 'Current Location',
    YARD_STATUS: 'Yard Status',
    LAST_ACTION: 'Last Action',
    LAST_UPDATED: 'Last Updated',
    DAYS_IN_YARD: 'Days in Yard',
    HOLDS: 'Holds',
    FULL_EMPTY: 'Full/Empty',
    LINE: 'Line',
  },
  ROLE: {
    ADMIN: 'Administrator',
    SYSTEM_ADMIN: 'System Admin',
    ADMINISTRATOR: 'Administrator',
    SUPERVISOR: 'Supervisor',
    OPERATOR: 'Operator',
    GATE_OPERATOR: 'Gate Operator',
  },
  PERMISSION: {
    VIEW: 'View',
    CREATE: 'Create',
    EDIT: 'Edit',
    DELETE: 'Delete',
    MANAGE: 'Manage',
  },
  HELP: {
    PASSWORD_RULES: 'Must be at least 8 characters with numbers and symbols',
    SEARCH_HINT: 'Press ⌘ K to search anytime',
  },
  BREADCRUMB: {
    HOME: 'Home',
    DASHBOARD: 'Dashboard',
    TASKS: 'My Tasks',
    INVENTORY: 'Inventory',
    GATE_EVENTS: 'Gate Events',
    REPORTS: 'Reports',
    ALERTS: 'Alerts',
    CLIENTS: 'Clients',
    SITES: 'Sites',
    USERS: 'Users',
    ROLES: 'Roles',
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

    if (typeof value !== 'string') {
      return key;
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
