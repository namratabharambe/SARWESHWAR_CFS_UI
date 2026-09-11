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
    ALL_CLIENTS: 'All Clients',
    ALL_SITES: 'All Sites',
    LOGOUT: 'Sign Out',
    SYSTEM_ADMIN: 'System Admin',
    CLIENT: 'Client',
    SITE: 'Site',
    LIGHT_MODE: 'Light Mode',
    DARK_MODE: 'Dark Mode',
    LANGUAGE: 'Language',
    SWITCHING_CONTEXT: 'Switching Context & Token...',
    NOTIFICATIONS: 'Notifications',
    OPEN_MENU: 'Open menu',
  },
  COMMON: {
    SEARCH: 'Search...',
    CLEAR: 'Clear',
    FILTER: 'Filter',
    FILTERS: 'Filters',
    CLEAR_FILTERS: 'Clear Filters',
    STATUS: 'Status',
    ACTIVE: 'Active',
    INACTIVE: 'Inactive',
    ACTIVATE: 'Activate',
    DEACTIVATE: 'Deactivate',
    CONFIRM_ACTIVATE: 'Confirm Activate',
    CONFIRM_DEACTIVATE: 'Confirm Deactivate',
    CHANGE: 'Change',
    ALL: 'All',
    ACTIONS: 'Actions',
    ADD: 'Add',
    EDIT: 'Edit',
    DELETE: 'Delete',
    SAVE: 'Save',
    SAVING: 'Saving...',
    UPDATE: 'Update',
    UPDATING: 'Updating...',
    CANCEL: 'Cancel',
    SUBMIT: 'Submit',
    RESET: 'Reset',
    BACK: 'Back',
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
    ERROR: 'An error occurred',
    SUCCESS: 'Operation successful',
    SELECT_OPTION: 'Select an option',
    SELECT_CLIENT: 'Select client',
    YES: 'Yes',
    NO: 'No',
    SHOWING: 'Showing',
    TO: 'to',
    OF: 'of',
    EVENTS: 'events',
    PER_PAGE: 'per page',
    CHOOSE_TARGET_STATUS: 'Choose Target Status:',
    ACTIVE_TRUE: 'Active (true)',
    INACTIVE_FALSE: 'Inactive (false)',
    RESET_PASSWORD: 'Reset Password',
    HELP: 'Help',
    SUPPORT: 'Support',
    PRIVACY: 'Privacy',
    TERMS: 'Terms',
    ALL_RIGHTS_RESERVED: 'All rights reserved.',
  },
  MAINTENANCE: {
    TITLE: 'Scheduled Maintenance',
    SUBTITLE:
      'CFS Control Tower is currently undergoing scheduled platform upgrades. Operational systems remain resilient and services will resume shortly.',
  },
  AUTH: {
    SIGN_IN: 'Sign In',
    LOGIN_TITLE: 'CFS Admin Portal',
    LOGIN_SUBTITLE: 'Container Freight Station enterprise management console',
    EMAIL: 'Email address',
    EMAIL_PLACEHOLDER: 'vijay.mahale@sarweshwar.com',
    PASSWORD: 'Password',
    PASSWORD_PLACEHOLDER: '••••••••••••',
    SHOW_PASSWORD: 'Show password',
    HIDE_PASSWORD: 'Hide password',
    SUBMIT_BUTTON: 'Sign In to Admin',
    SIGNING_IN: 'Signing In...',
    BYPASS_LOGIN: '⚡ Bypass Login (Instant Dev Access)',
    INVALID_CREDENTIALS: 'Invalid email or password',
    SIGNOUT_CONFIRM: 'Are you sure you want to sign out?',
    HERO_EYEBROW: 'CONTAINER TERMINAL AUTOMATION',
    HERO_HEADLINE: 'One control tower for every container movement.',
    HERO_DESCRIPTION:
      'Gate OCR, yard inventory, reach-stacker tasks, RTK location intelligence, damage evidence, ERP synchronization and complete audit visibility.',
    FEATURE_OCR: 'GateVision OCR',
    FEATURE_YARD: 'Live Yard Map',
    FEATURE_SENSOR: 'Sensor Fusion',
    BRAND_NAME: 'SARWESHWAR CFS',
    BRAND_SUB: 'Container Terminal Control Tower',
    OR_DIVIDER: 'Or continue with enterprise SSO',
    SSO_BUTTON: 'Sign in with Microsoft Entra ID',
    REMEMBER_DEVICE: 'Remember this device',
    FORGOT_PASSWORD: 'Forgot password?',
    MFA_SECURITY_NOTE: 'Multi-factor authentication is enforced for supervisors and administrators.',
  },
  DASHBOARD: {
    TITLE: 'System Overview',
    SUBTITLE: 'Enterprise metrics, facility network, and administration summary',
    TOTAL_CLIENTS: 'Total Clients',
    TOTAL_SITES: 'Total Sites',
    ACTIVE_USERS: 'Active Users',
    SYSTEM_ROLES: 'System Roles',
    SYSTEM_HEALTH: 'System Health',
    API_ONLINE: 'API Port 7190 Online',
    LIVE_CONTEXT: 'Live Context',
    ACTIVE_CLIENT: 'Active Client',
    ACTIVE_SITE: 'Active Site',
    NO_CLIENT_SELECTED: 'No Client Selected',
    NO_SITE_SELECTED: 'No Site Selected',
    SECTION_ADMIN: 'ADMINISTRATION',
    MODULES_TITLE: 'Management Modules',
    MODULES_DESC: 'Quick configuration for organizations, terminals, and operators.',
    CLIENT_ORGS: 'Client Organizations',
    CLIENT_ORGS_DESC: 'Manage operating client accounts and active contracts.',
    VIEW_CLIENTS: 'View Clients →',
    TERMINAL_SITES: 'Terminal Sites',
    TERMINAL_SITES_DESC: 'Manage physical CFS yards, railheads, and gate lanes.',
    VIEW_SITES: 'View Sites →',
    USER_DIR: 'User Directory',
    USER_DIR_DESC: 'Manage operators, surveyors, supervisors, and role assignments.',
    VIEW_USERS: 'View Users →',
    RBAC_ROLES: 'RBAC Roles',
    RBAC_ROLES_DESC: 'Manage granular permissions, scopes, and administration boundaries.',
    VIEW_ROLES: 'View Roles →',
    SECTION_AUTOMATION: 'TERMINAL AUTOMATION',
    GATEVISION_STATUS: 'GateVision Optical OCR',
    GATEVISION_DESC: '4-camera optical stencils, real-time container recognition, anomaly flags.',
    VIEW_GATE_EVENTS: 'Live Gate Feed →',
    YARD_SYNC_STATUS: 'RTK Yard Synchronization',
    YARD_SYNC_DESC: 'Live sensor fusion, reach-stacker telematics, container stack telemetry.',
    SYNC_ACTIVE: 'Sync Active',
  },
  CLIENTS: {
    TITLE: 'Client Management',
    SUBTITLE: 'Manage enterprise tenant clients, codes, and operational status',
    NEW_CLIENT: 'New Client',
    SEARCH_PLACEHOLDER: 'Search clients by name or code...',
    EMPTY_TITLE: 'No clients found',
    EMPTY_DESC: 'No client records match your current search or status filter.',
    ADD_NEW_CLIENT: '+ Add New Client',
    MODAL_NEW_TITLE: 'Add Client',
    MODAL_NEW_SUBTITLE: 'Enter client name to register a new account',
    MODAL_EDIT_TITLE: 'Edit Client',
    MODAL_EDIT_SUBTITLE: 'Update client organization details',
    FIELD_NAME: 'Client Name',
    FIELD_NAME_PLACEHOLDER: 'Enter client company name',
    FIELD_CODE: 'Client Code',
    FIELD_STATUS: 'Status',
    SAVE_CLIENT: 'Save Client',
    UPDATE_CLIENT: 'Update Client',
    ACTIVATE_TITLE: 'Activate Client',
    DEACTIVATE_TITLE: 'Deactivate Client',
    STATUS_SUBTITLE: 'Update active status for {{name}}',
    ACTIVATE_EXPLANATION:
      'Calling PATCH /api/clients/{ClientId}/active/true will activate this client and restore full operational access across sites.',
    DEACTIVATE_EXPLANATION:
      'Calling PATCH /api/clients/{ClientId}/active/false will mark this client inactive and disable terminal site processing.',
    UPDATING_STATUS: 'Updating Status...',
  },
  SITES: {
    TITLE: 'Site Management',
    SUBTITLE: 'Oversee container freight station sites, regional hubs, and client assignments',
    NEW_SITE: 'New Site',
    SEARCH_PLACEHOLDER: 'Search sites by name or code...',
    EMPTY_TITLE: 'No sites found',
    EMPTY_DESC: 'No site records match your current search or status filter.',
    ADD_NEW_SITE: '+ Add New Site',
    MODAL_NEW_TITLE: 'Add Site',
    MODAL_NEW_SUBTITLE: 'Enter terminal site details and assign to a client organization',
    MODAL_EDIT_TITLE: 'Edit Site',
    MODAL_EDIT_SUBTITLE: 'Update terminal site configuration and details',
    FIELD_NAME: 'Site Name',
    FIELD_NAME_PLACEHOLDER: 'Enter site name',
    FIELD_CODE: 'Site Code',
    FIELD_CODE_PLACEHOLDER: 'Enter site code (e.g. PCT-01)',
    FIELD_CLIENT: 'Assigned Client',
    FIELD_STATUS: 'Status',
    SAVE_SITE: 'Save Site',
    UPDATE_SITE: 'Update Site',
    ACTIVATE_TITLE: 'Activate Site',
    DEACTIVATE_TITLE: 'Deactivate Site',
    STATUS_SUBTITLE: 'Update active status for {{name}}',
    ACTIVATE_EXPLANATION: 'Activating this site enables gate automation, RTK yard tracking, and active operations.',
    DEACTIVATE_EXPLANATION:
      'Deactivating this site suspends automated gate entries and flags the yard facility inactive.',
    UPDATING_STATUS: 'Updating Status...',
  },
  USERS: {
    TITLE: 'User Management',
    SUBTITLE: 'Provision administrators, field operators, site personnel, and access credentials',
    NEW_USER: 'New User',
    SEARCH_PLACEHOLDER: 'Search users by name, email, or role...',
    EMPTY_TITLE: 'No users found',
    EMPTY_DESC: 'No user records match your current search or status filter.',
    ADD_NEW_USER: '+ Add New User',
    MODAL_NEW_TITLE: 'Add User',
    MODAL_NEW_SUBTITLE: 'Enter credentials, assign organization and assign operational roles',
    MODAL_EDIT_TITLE: 'Edit User',
    MODAL_EDIT_SUBTITLE: 'Update user details and site role assignments',
    FIELD_FIRST_NAME: 'First Name',
    FIELD_FIRST_NAME_PLACEHOLDER: 'First name',
    FIELD_LAST_NAME: 'Last Name',
    FIELD_LAST_NAME_PLACEHOLDER: 'Last name',
    FIELD_NAME: 'Full Name',
    FIELD_EMAIL: 'Email Address',
    FIELD_EMAIL_PLACEHOLDER: 'Email address',
    FIELD_PHONE: 'Mobile Number',
    FIELD_PHONE_PLACEHOLDER: 'Mobile number',
    FIELD_PASSWORD: 'Password',
    FIELD_PASSWORD_PLACEHOLDER: 'Min 6 chars (e.g. Prosper@123)',
    FIELD_ROLE: 'System Role',
    FIELD_CLIENT: 'Assigned Client',
    FIELD_SITE: 'Assigned Site',
    FIELD_STATUS: 'Status',
    SAVE_USER: 'Save User',
    UPDATE_USER: 'Update User',
    PASSWORD_RESET_TITLE: 'Reset User Password',
    PASSWORD_RESET_SUBTITLE: 'Set a new temporary or permanent password for {{name}}',
    CONFIRM_PASSWORD: 'Confirm Password',
    NEW_PASSWORD: 'New Password',
    NEW_PASSWORD_PLACEHOLDER: 'Enter new password',
    CONFIRM_PASSWORD_PLACEHOLDER: 'Confirm new password',
    SUBMIT_RESET: 'Confirm Password Reset',
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters.',
    SITE_SELECT_HINT: 'Select terminal sites below to assign specific permissions per location.',
    NO_SITES_FOUND: 'No specific sites found for this client.',
    GLOBAL_ROLE_HINT: 'No terminal site selected. Access applies across all client sites.',
  },
  ROLES: {
    TITLE: 'Role & Permission Management',
    SUBTITLE: 'Configure role-based access control, scopes, and administrative privileges',
    NEW_ROLE: 'New Role',
    SEARCH_PLACEHOLDER: 'Search roles...',
    EMPTY_TITLE: 'No roles found',
    EMPTY_DESC: 'Create a role to define access boundaries',
    MODAL_NEW_TITLE: 'Add Role',
    MODAL_NEW_SUBTITLE: 'Define a new role and its access level',
    MODAL_EDIT_TITLE: 'Edit Role',
    MODAL_EDIT_SUBTITLE: 'Update role permissions and scope',
    FIELD_NAME: 'Role Name',
    FIELD_NAME_PLACEHOLDER: 'e.g. Supervisor',
    FIELD_SCOPE: 'Scope',
    FIELD_DESCRIPTION: 'Description',
    FIELD_DESCRIPTION_PLACEHOLDER: 'Describe role responsibilities...',
    FIELD_PERMISSIONS: 'Permissions',
    SAVE_ROLE: 'Save Role',
  },
  GATE_EVENTS: {
    TITLE: 'Gate Events',
    SUBTITLE: 'Real-time gate activity for arrivals and departures',
    MANUAL_GATE_ENTRY: 'Manual Gate Entry',
    IMPORT_GATE_IN: 'Import Gate In',
    TODAYS_ARRIVALS: "Today's Arrivals",
    TODAYS_DEPARTURES: "Today's Departures",
    OCR_VERIFIED: 'OCR Verified',
    PENDING_REVIEW: 'Pending Review',
    DAMAGED_CAPTURES: 'Damaged Captures',
    TAB_ALL: 'All',
    TAB_ARRIVALS: 'Arrivals',
    TAB_DEPARTURES: 'Departures',
    FILTER_DIRECTION: 'Direction',
    DIRECTION_ALL: 'All',
    DIRECTION_IN: 'IN',
    DIRECTION_OUT: 'OUT',
    FILTER_GATE: 'Gate',
    ALL_GATES: 'All Gates',
    FILTER_DATE: 'Date',
    FILTER_CONFIDENCE: 'OCR Confidence',
    CONF_ALL: 'All',
    CONF_HIGH: 'High (≥ 95%)',
    CONF_MED: 'Medium (90% - 94%)',
    CONF_LOW: 'Low (< 90%)',
    SEARCH_PLACEHOLDER: 'Search by container, truck plate, driver...',
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
    COL_PHOTOS: 'Photos',
    EMPTY_TITLE: 'No gate events match your search or filter criteria.',
    DETAIL: 'Detail',
    DETAIL_TITLE: 'Gate Event Detail',
    EVENT_ID: 'Event ID:',
    STATUS: 'Status:',
    EVENT_TIME: 'Event Time:',
    ARRIVAL: 'Arrival',
    DEPARTURE: 'Departure',
    VERIFIED: 'Verified',
    REVIEW: 'Review',
    PRINT_EXPORT: 'Print / Export',
    PRINT_SUMMARY: 'Print Summary',
    EXPORT_JSON: 'Export JSON',
    EXPORT_CSV: 'Export CSV',
    CAPTURED_IMAGES: 'Captured Images',
    FRONT_GATE: 'Front Gate Photo',
    SIDE_CONTAINER: 'Side / Container Number',
    TRUCK_IMAGE: 'Truck Image',
    OVERVIEW_IMAGE: 'Overview Image',
    OCR_DETAILS_TITLE: 'OCR Extracted Details',
    FIELD: 'FIELD',
    VALUE: 'VALUE',
    CONFIDENCE: 'CONFIDENCE',
    CONTAINER_NUMBER: 'Container Number',
    ISO_TYPE_CODE: 'ISO Type Code',
    TRUCK_LICENSE_PLATE: 'Truck License Plate',
    CHASSIS_NUMBER: 'Chassis Number',
    GROSS_WEIGHT_RATING: 'Gross Weight Rating',
    OVERALL_OCR_MATCH: 'Overall OCR Match:',
    EVENT_INFO_TITLE: 'Event Information',
    GATE_LANE: 'Gate Lane',
    TERMINAL_FACILITY: 'Terminal / Facility',
    DRIVER_NAME: 'Driver Name',
    TRANSPORTER: 'Transporter',
    APPOINTMENT_ID: 'Appointment ID',
    OPERATOR_REVIEW: 'Operator Review',
    SYSTEM_REMARKS: 'System Remarks',
    ADDITIONAL_CHECKS_TITLE: 'Additional Checks',
    STRUCTURAL_DAMAGE: 'Structural Damage',
    CONTAINER_CLEAN: 'Container Clean',
    BOLT_SEAL_INTACT: 'Bolt Seal Intact',
    DOOR_CONDITION: 'Door Hardware Condition',
    REEFER_TEMP: 'Reefer Temperature',
    HAZARDOUS_GOODS: 'Hazardous Goods Placard',
    TIMELINE_TITLE: 'Event Timeline',
    STEP_CAPTURED: 'Gate Sensor Triggered',
    STEP_OCR: 'Camera Capture Completed',
    STEP_VERIFIED: 'AI OCR & Damage Analysis',
    STEP_RELEASE: 'Supervisor Release Approved',
    SYSTEM_NOTES_TITLE: 'System Notes',
    RERUN_OCR: 'Re-run OCR',
    MARK_EXCEPTION: 'Mark Exception',
    CREATE_TASK: 'Create Task',
    CLOSE_FULLSCREEN: 'Close Fullscreen View',
    CONTAINER_NO: 'Container No',
    CONTAINER_NO_PLACEHOLDER: 'CONTAINER NO',
    ISO_CODE: 'ISO Code',
    SIZE: 'Size',
    TARE_WEIGHT: 'Tare Weight',
    TARE_WEIGHT_PLACEHOLDER: 'Tare Weight',
    TYPE: 'Type',
    CARGO_TYPE: 'Cargo Type',
    JO_TYPE: 'JO Type',
    FCL_LCL: 'FCL/LCL',
    SCAN_TYPE: 'Scan Type',
    GATE_IN_TYPE: 'Gate In Type',
    OFFLOAD_LOC: 'OffLoad Location',
    VESSEL_NAME: 'Vessel Name / Via No',
    VESSEL_PLACEHOLDER: 'Vessel Name',
    PORT_NAME: 'Port Name',
    SHIPPING_LINE: 'Shipping Line',
    SHIPPING_LINE_PLACEHOLDER: 'Shipping Line',
    IGM_SEAL: 'IGM Seal',
    IGM_SEAL_PLACEHOLDER: 'IGM Seal',
    SEAL_1: 'Seal No 1',
    SEAL_1_PLACEHOLDER: 'Seal No 1',
    SEAL_2: 'Seal No 2',
    SEAL_2_PLACEHOLDER: 'Seal No 2',
    CUSTOM_SEAL: 'Custom Seal No',
    CUSTOM_SEAL_PLACEHOLDER: 'Custom Seal No.',
    CUSTOMER_NAME: 'Customer Name',
    CUSTOMER_NAME_PLACEHOLDER: 'Customer Name',
    EIR_NO: 'EIR No',
    EIR_NO_PLACEHOLDER: 'EIR No.',
    EIR_WEIGHT: 'EIR Weight',
    EIR_WEIGHT_PLACEHOLDER: 'EIR Weight',
    EIR_DATETIME: 'EIR Date & Time',
    DATETIME_PLACEHOLDER: 'dd-mm-yyyy --:--',
    LOCATION: 'Location',
    CONDITION: 'Condition',
    REMARKS: 'Remarks',
    REMARKS_PLACEHOLDER: 'Remarks',
    DOOR_TO_DOOR: 'Door To Door',
    ACTION: 'ACTION',
    SCAN_STATUS: 'SCAN STATUS',
    WEIGHT: 'WEIGHT',
    SCAN_DATE_TIME: 'SCAN DATE TIME',
    UN_NO: 'UN NO.',
    CLASS: 'CLASS',
    EMPTY_MODAL_TABLE: "No container records added yet. Fill the form above and click '+' to append entries.",
    SELECT_ALL: 'Select all',
    NEXT_PAGE: 'Next page',
    EXPAND_IMAGE: 'Expand image',
    IMPORT: 'Import',
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
