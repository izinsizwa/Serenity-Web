// ─── Enums ────────────────────────────────────────────────────
export enum UserRole {
  SuperAdmin      = 0,
  Admin           = 1,
  Client          = 2,
  Therapist       = 3,
  ClinicAdmin     = 4,
  ClinicTherapist = 5,
}

export enum AppointmentStatus {
  Pending    = 'Pending',
  Confirmed  = 'Confirmed',
  InProgress = 'InProgress',
  Completed  = 'Completed',
  Cancelled  = 'Cancelled',
  NoShow     = 'NoShow',
}

export enum SessionFormat {
  InPerson = 'InPerson',
  Online   = 'Online',
  Phone    = 'Phone',
}

export enum PaymentStatus {
  Pending  = 'Pending',
  Paid     = 'Paid',
  Failed   = 'Failed',
  Refunded = 'Refunded',
}

export enum MoodLevel {
  VeryLow  = 1,
  Low      = 2,
  Neutral  = 3,
  Good     = 4,
  VeryGood = 5,
}

export enum HomeworkStatus {
  Assigned   = 0,
  InProgress = 1,
  Completed  = 2,
  Reviewed   = 3,
  Overdue    = 4,
}

export enum GoalCategory {
  Anxiety      = 0,
  Depression   = 1,
  Stress       = 2,
  Relationships= 3,
  SelfEsteem   = 4,
  Trauma       = 5,
  Addiction    = 6,
  General      = 7,
}

export enum GoalPriority {
  Low    = 0,
  Medium = 1,
  High   = 2,
}

export enum NotificationPriority {
  Low    = 0,
  Medium = 1,
  High   = 2,
  Urgent = 3,
}

// ─── User ─────────────────────────────────────────────────────
export interface AccountUser {
  userId:                  string
  firstName:               string
  lastName:                string
  email:                   string
  phoneNumber:             string
  profilePictureUrl:       string | null
  role:                    UserRole
  dateOfBirth:             string
  gender:                  string
  address:                 string
  city:                    string
  province:                string
  postalCode:              string
  idNumber:                string
  isEmailVerified:         boolean
  isPhoneVerified:         boolean
  isActive:                boolean
  isOnline:                boolean
  lastSeen:                string | null
  preferredLanguage:       string
  twoFactorEnabled:        boolean
  createdAt:               string
  updatedAt:               string | null
  lastLoginAt:             string | null
}

// ─── Therapist ────────────────────────────────────────────────
export interface Therapist {
  therapistId:        string
  accountUserId:      string
  bio:                string
  qualification:      string
  hpcsaNumber:        string
  consultationFee:    number
  discountedFee:      number | null
  acceptsMedicalAid:  boolean
  yearsOfExperience:  number
  province:           string
  city:               string
  address:            string
  isHpcsaVerified:    boolean
  averageRating:      number
  isVerified:         boolean
  isAvailable:        boolean
  indemnityProvider:  string | null
  specialties:        TherapistSpecialty[]
  languages:          TherapistLanguage[]
  profile:            TherapistProfile | null
}

export interface TherapistProfile {
  therapistProfileId: string
  therapistId:        string
  firstName:          string
  lastName:           string
  email:              string
  phoneNumber:        string
  profilePictureUrl:  string | null
  hpcsaNumber:        string
  qualification:      string
  institution:        string
  bio:                string
  treatmentApproach:  string
  areasOfExpertise:   string
  yearsOfExperience:  number
  consultationFee:    number
  isVerified:         boolean
  isAvailable:        boolean
  averageRating:      number
}

export interface TherapistSpecialty {
  specialtyId:     string
  therapistId:     string
  name:            string
  description:     string | null
  yearsExperience: number
}

export interface TherapistLanguage {
  languageId:   string
  therapistId:  string
  languageName: string
  proficiency:  string | null
}

export interface Availability {
  availabilityId: string
  therapistId:    string
  dayOfWeek:      number
  startTime:      string
  endTime:        string
  isAvailable:    boolean
  notes:          string | null
}

// ─── Appointment ──────────────────────────────────────────────
export interface Appointment {
  appointmentId:         string
  userId:                string
  clientId:              string
  therapistId:           string
  scheduledDateTime:     string
  durationMinutes:       number
  appointmentType:       string
  sessionFormat:         SessionFormat
  status:                AppointmentStatus
  appointmentNotes:      string | null
  sessionNotes:          string | null
  cancellationReason:    string | null
  cancelledAt:           string | null
  videoCallLink:         string | null
  videoCallId:           string | null
  locationName:          string | null
  locationAddress:       string | null
  sendReminder:          boolean
  requiresFollowUp:      boolean
  suggestedFollowUpDate: string | null
  consultationFee:       number
  discountAmount:        number | null
  paymentStatus:         PaymentStatus
  paidAt:                string | null
  isCoveredByMedicalAid: boolean
  medicalAidProviderId:  string | null
  medicalAidCoverage:    number | null
  clientCopay:           number | null
  userRating:            number | null
  userFeedback:          string | null
  outlookEventId:        string | null
  syncedToOutlook:       boolean
  createdAt:             string
  updatedAt:             string | null
  // Populated joins
  therapistProfile?:     TherapistProfile
}

export interface BookAppointmentRequest {
  therapistId:       string
  scheduledDateTime: string
  durationMinutes:   number
  appointmentType:   string
  sessionFormat:     SessionFormat
  appointmentNotes:  string | null
  paymentMethodId:   string
  isCoveredByMedicalAid: boolean
  medicalAidProviderId?: string
}

// ─── Mood ─────────────────────────────────────────────────────
export interface MoodEntry {
  moodId:                  string
  userId:                  string
  recordedAt:              string
  entryDate:               string
  moodScore:               number
  moodRating:              number
  anxietyLevel:            number
  stressLevel:             number
  energyLevel:             number
  sleepQuality:            number
  focusLevel:              number
  moodType:                string | null
  notes:                   string | null
  tags:                    string | null
  location:                string | null
  activity:                string | null
  isPublic:                boolean
  heartRateAtTime:         number | null
  sleepHoursPreviousNight: number | null
  stepsToday:              number | null
  createdAt:               string
}

export interface CreateMoodEntryRequest {
  moodScore:               number
  anxietyLevel:            number
  stressLevel:             number
  energyLevel:             number
  sleepQuality:            number
  focusLevel:              number
  moodType:                string | null
  notes:                   string | null
  tags:                    string | null
  activity:                string | null
  heartRateAtTime:         number | null
  sleepHoursPreviousNight: number | null
  stepsToday:              number | null
}

// ─── Journal ──────────────────────────────────────────────────
export interface JournalEntry {
  entryId:              string
  clientId:             string
  moodId:               string
  title:                string | null
  content:              string
  type:                 number
  moodRating:           number | null
  mood:                 string | null
  tags:                 string | null
  isSharedWithTherapist:boolean
  isSharedInSession:    boolean
  entryDate:            string
  createdAt:            string
  updatedAt:            string | null
}

export interface CreateJournalEntryRequest {
  title:                 string | null
  content:               string
  moodRating:            number | null
  mood:                  string | null
  tags:                  string | null
  isSharedWithTherapist: boolean
  entryDate:             string
}

// ─── Goals ────────────────────────────────────────────────────
export interface Goal {
  goalId:             string
  clientId:           string
  therapistId:        string | null
  title:              string
  description:        string | null
  category:           GoalCategory
  priority:           GoalPriority
  targetDate:         string
  completedAt:        string | null
  isCompleted:        boolean
  progressPercentage: number
  notes:              string | null
  isMeasurable:       boolean
  measurementUnit:    string | null
  targetValue:        number | null
  currentValue:       number | null
  isActive:           boolean
  createdAt:          string
  updatedAt:          string | null
  progresses:         GoalProgress[]
}

export interface GoalProgress {
  progressId:         string
  goalId:             string
  progressPercentage: number
  currentValue:       number | null
  notes:              string | null
  recordedAt:         string
}

export interface CreateGoalRequest {
  title:           string
  description:     string | null
  category:        GoalCategory
  priority:        GoalPriority
  targetDate:      string
  isMeasurable:    boolean
  measurementUnit: string | null
  targetValue:     number | null
  notes:           string | null
}

// ─── Homework ─────────────────────────────────────────────────
export interface HomeworkAssignment {
  assignmentId:      string
  appointmentId:     string
  clientId:          string
  therapistId:       string
  title:             string
  description:       string
  type:              number
  dueDate:           string
  status:            HomeworkStatus
  clientResponse:    string | null
  therapistFeedback: string | null
  rating:            number | null
  completedAt:       string | null
  reviewedAt:        string | null
  isReminderSent:    boolean
  createdAt:         string
  updatedAt:         string | null
}

// ─── Messages ─────────────────────────────────────────────────
export interface Message {
  messageId:          string
  senderId:           string
  receiverId:         string
  content:            string
  type:               number
  isRead:             boolean
  readAt:             string | null
  isDelivered:        boolean
  deliveredAt:        string | null
  isEncrypted:        boolean
  replyToMessageId:   string | null
  attachmentUrl:      string | null
  attachmentName:     string | null
  attachmentType:     string | null
  appointmentId:      string | null
  isDeletedBySender:  boolean
  isDeletedByReceiver:boolean
  sentAt:             string
  subject:            string | null
}

export interface Conversation {
  otherUserId:        string
  otherUserName:      string
  otherUserAvatar:    string | null
  otherUserRole:      UserRole
  lastMessage:        string
  lastMessageAt:      string
  unreadCount:        number
  isOtherUserOnline:  boolean
}

export interface SendMessageRequest {
  receiverId:       string
  content:          string
  replyToMessageId: string | null
  appointmentId:    string | null
}

// ─── Notifications ────────────────────────────────────────────
export interface Notification {
  notificationId:    string
  userId:            string
  title:             string
  message:           string
  type:              number
  priority:          NotificationPriority
  isRead:            boolean
  readAt:            string | null
  actionText:        string | null
  actionUrl:         string | null
  relatedEntityId:   string | null
  relatedEntityType: string | null
  createdAt:         string
  scheduledFor:      string | null
}

// ─── Payments ─────────────────────────────────────────────────
export interface PaymentMethod {
  paymentMethodId:    string
  userId:             string
  name:               string
  type:               number
  cardLastFour:       string | null
  cardBrand:          string | null
  cardExpiryMonth:    string | null
  cardExpiryYear:     string | null
  bankName:           string | null
  accountHolderName:  string | null
  medicalAidProviderId: string | null
  medicalAidNumber:   string | null
  medicalAidPlan:     string | null
  isDefault:          boolean
  isActive:           boolean
  isVerified:         boolean
  createdAt:          string
}

export interface Payment {
  paymentId:            string
  clientId:             string
  therapistId:          string
  appointmentId:        string | null
  amount:               number
  currency:             string
  status:               number
  type:                 number
  description:          string | null
  paymentGateway:       string | null
  isMedicalAidClaim:    boolean
  medicalAidCoveredAmount: number | null
  clientCopayment:      number | null
  paymentDate:          string
  completedAt:          string | null
  isRefunded:           boolean
  refundAmount:         number | null
}

export interface MedicalAidProvider {
  providerId:  string
  name:        string
  code:        string | null
  description: string | null
  isActive:    boolean
}

// ─── Client Profile ───────────────────────────────────────────
export interface Client {
  clientId:                    string
  accountUserId:               string
  dateOfBirth:                 string
  presentingConcerns:          string | null
  mentalHealthHistory:         string | null
  currentMedications:          string | null
  allergies:                   string | null
  hasMedicalAid:               boolean
  medicalAidProviderId:        string | null
  medicalAidNumber:            string | null
  medicalAidPlan:              string | null
  isMedicalAidActive:          boolean
  emergencyContactName:        string | null
  emergencyContactPhone:       string | null
  emergencyContactRelationship:string | null
  consentToShareData:          boolean
  consentToRecordSessions:     boolean
  enableSMSReminders:          boolean
  enableEmailReminders:        boolean
  enablePushNotifications:     boolean
  preferredTherapistGender:    string | null
  culturalPreferences:         string | null
  languagePreferences:         string | null
}

// ─── Wearable ─────────────────────────────────────────────────
export interface WearableDevice {
  deviceId:         string
  userId:           string
  deviceType:       string
  deviceName:       string
  deviceModel:      string | null
  isActive:         boolean
  isConnected:      boolean
  isSyncing:        boolean
  connectedAt:      string
  lastSyncedAt:     string
  syncHeartRate:    boolean
  syncSleepData:    boolean
  syncActivityData: boolean
  syncStressData:   boolean
  syncSteps:        boolean
}

export interface WearableDataPoint {
  dataId:     string
  deviceId:   string
  recordedAt: string
  dataType:   number
  value:      number
  unit:       string | null
}

// ─── Health Correlations ──────────────────────────────────────
export interface HealthCorrelation {
  correlationId:        string
  userId:               string
  startDate:            string
  endDate:              string
  analysisDate:         string
  correlationType:      string
  correlationCoefficient: number
  insights:             string | null
  recommendations:      string | null
  dataPointsAnalyzed:   number
  isSignificant:        boolean
}

// ─── Reviews ─────────────────────────────────────────────────
export interface Review {
  reviewId:    string
  clientId:    string
  therapistId: string
  appointmentId: string
  rating:      number
  comment:     string | null
  isAnonymous: boolean
  isPublic:    boolean
  isApproved:  boolean
  createdAt:   string
}

export interface CreateReviewRequest {
  appointmentId: string
  therapistId:   string
  rating:        number
  comment:       string | null
  isAnonymous:   boolean
}

// ─── Crisis ───────────────────────────────────────────────────
export interface CrisisAlert {
  crisisId:     string
  clientId:     string
  therapistId:  string | null
  type:         number
  severity:     number
  description:  string | null
  clientMessage:string | null
  latitude:     string | null
  longitude:    string | null
  status:       number
  resolvedAt:   string | null
  isEscalated:  boolean
  createdAt:    string
}

// ─── Auth ────────────────────────────────────────────────────
export interface LoginRequest {
  email:    string
  password: string
}

export interface RegisterRequest {
  firstName:                    string
  lastName:                     string
  email:                        string
  password:                     string
  phoneNumber:                  string
  dateOfBirth:                  string
  gender:                       string
  role:                         UserRole
  address?:                     string
  city?:                        string
  province?:                    string
  postalCode?:                  string
  idNumber?:                    string
  preferredLanguage?:           string
  presentingConcerns?:          string
  mentalHealthHistory?:         string
  currentMedications?:          string
  allergies?:                   string
  hasMedicalAid?:               boolean
  medicalAidNumber?:            string
  emergencyContactName?:        string
  emergencyContactPhone?:       string
  emergencyContactRelationship?: string
}

export interface AuthResponse {
  token:  string
  refreshToken?: string
  success?: boolean
  errorMessage?: string
  user?:         AccountUser
  accountUser?: AccountUser
}

// ─── API Wrappers ────────────────────────────────────────────
export interface ApiResponse<T> {
  data:    T
  message: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items:      T[]
  totalCount: number
  page:       number
  pageSize:   number
  totalPages: number
}

// ─── Filter/Query types ───────────────────────────────────────
export interface TherapistSearchParams {
  search?:         string
  specialty?:      string
  province?:       string
  city?:           string
  sessionFormat?:  SessionFormat
  minFee?:         number
  maxFee?:         number
  acceptsMedicalAid?: boolean
  isAvailable?:    boolean
  language?:       string
  page?:           number
  pageSize?:       number
}

export interface AppointmentQueryParams {
  status?:    AppointmentStatus
  from?:      string
  to?:        string
  page?:      number
  pageSize?:  number
}
